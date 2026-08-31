<?php

namespace App\Http\Controllers;

use App\Exceptions\ReceiptScanUnavailable;
use App\Http\Requests\StoreReimbursementRequest;
use App\Models\Reimbursement;
use App\Models\ReimbursementItem;
use App\Models\ReimbursementPhoto;
use App\Services\ReceiptScanner;
use App\Support\Money;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\Response as SymfonyResponse;

class ReimbursementController extends Controller
{
    /** Blank rows the create form starts with. */
    private const DEFAULT_ROWS = 15;

    public function index(Request $request): Response
    {
        $reimbursements = $request->user()->reimbursements()
            ->withCount('items', 'photos')
            ->orderByDesc('created_at')
            ->get()
            ->map(fn (Reimbursement $reimbursement) => [
                'id' => $reimbursement->id,
                'title' => $reimbursement->title,
                'items_count' => $reimbursement->items_count,
                'photos_count' => $reimbursement->photos_count,
                'total_amount' => $reimbursement->total_amount,
                'created_at' => $reimbursement->created_at->toDateString(),
            ]);

        return Inertia::render('Reimbursements/Index', [
            'reimbursements' => $reimbursements,
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Reimbursements/Create', [
            'defaultRows' => self::DEFAULT_ROWS,
        ]);
    }

    public function store(StoreReimbursementRequest $request): RedirectResponse
    {
        $data = $request->validated();

        $reimbursement = $request->user()->reimbursements()->create([
            'title' => $data['title'],
            'notes' => $data['notes'] ?? null,
            'total_amount' => Money::zero(),
        ]);

        $this->syncItems($reimbursement, $data['items']);
        $this->storeUploadedPhotos($reimbursement, $request->file('photos', []));

        return to_route('reimbursements.show', $reimbursement)
            ->with('status', 'Reimbursement report saved.');
    }

    public function edit(Request $request, Reimbursement $reimbursement): Response
    {
        abort_unless($reimbursement->user_id === $request->user()->id, 403);

        $reimbursement->load('items');

        return Inertia::render('Reimbursements/Edit', [
            'reimbursement' => [
                'id' => $reimbursement->id,
                'title' => $reimbursement->title,
                'notes' => $reimbursement->notes,
                'items' => $reimbursement->items->map(fn (ReimbursementItem $item) => [
                    'quantity' => $this->trimNumber($item->quantity),
                    'item_name' => $item->item_name,
                    'unit_price' => number_format($item->unit_price->pesos(), 2, '.', ''),
                ]),
            ],
        ]);
    }

    public function update(StoreReimbursementRequest $request, Reimbursement $reimbursement): RedirectResponse
    {
        abort_unless($reimbursement->user_id === $request->user()->id, 403);

        $data = $request->validated();

        $reimbursement->update([
            'title' => $data['title'],
            'notes' => $data['notes'] ?? null,
        ]);

        $this->syncItems($reimbursement, $data['items']);

        return to_route('reimbursements.show', $reimbursement)
            ->with('status', 'Reimbursement report updated.');
    }

    /**
     * Replace a report's line items with the given set and recompute its total.
     *
     * @param  array<int, array{quantity:mixed, item_name:string, unit_price:mixed}>  $items
     */
    private function syncItems(Reimbursement $reimbursement, array $items): void
    {
        DB::transaction(function () use ($reimbursement, $items) {
            $reimbursement->items()->delete();

            $total = 0;

            foreach (array_values($items) as $position => $row) {
                $quantity = (float) $row['quantity'];
                $unitPrice = Money::ofPesos($row['unit_price']);
                $lineTotal = (int) round($unitPrice->cents * $quantity);
                $total += $lineTotal;

                $reimbursement->items()->create([
                    'quantity' => $quantity,
                    'item_name' => $row['item_name'],
                    'unit_price' => $unitPrice,
                    'line_total' => Money::ofCents($lineTotal),
                    'position' => $position,
                ]);
            }

            $reimbursement->update(['total_amount' => Money::ofCents($total)]);
        });
    }

    /** "10.200" -> "10.2", "3.000" -> "3". */
    private function trimNumber(float $value): string
    {
        return rtrim(rtrim(number_format($value, 3, '.', ''), '0'), '.');
    }

    /**
     * Persist uploaded receipt images to the private disk and record them.
     *
     * @param  array<int, UploadedFile>  $files
     */
    private function storeUploadedPhotos(Reimbursement $reimbursement, array $files): int
    {
        foreach ($files as $file) {
            $reimbursement->photos()->create([
                'path' => $file->store("receipts/{$reimbursement->id}", 'local'),
                'original_name' => $file->getClientOriginalName(),
                'mime' => $file->getClientMimeType(),
                'size' => $file->getSize(),
            ]);
        }

        return count($files);
    }

    public function show(Request $request, Reimbursement $reimbursement): Response
    {
        abort_unless($reimbursement->user_id === $request->user()->id, 403);

        $reimbursement->load('items', 'photos');

        return Inertia::render('Reimbursements/Show', [
            'reimbursement' => [
                'id' => $reimbursement->id,
                'title' => $reimbursement->title,
                'notes' => $reimbursement->notes,
                'total_amount' => $reimbursement->total_amount,
                'created_at' => $reimbursement->created_at->toDayDateTimeString(),
                'items' => $reimbursement->items->map(fn (ReimbursementItem $item) => [
                    'id' => $item->id,
                    'quantity' => $item->quantity,
                    'item_name' => $item->item_name,
                    'unit_price' => $item->unit_price,
                    'line_total' => $item->line_total,
                ]),
                'photos' => $reimbursement->photos->map(fn (ReimbursementPhoto $photo) => [
                    'id' => $photo->id,
                    'name' => $photo->original_name,
                    'url' => route('reimbursements.photos.show', [$reimbursement, $photo]),
                ]),
            ],
        ]);
    }

    public function storePhotos(Request $request, Reimbursement $reimbursement): RedirectResponse
    {
        abort_unless($reimbursement->user_id === $request->user()->id, 403);

        $request->validate([
            'photos' => ['required', 'array', 'max:20'],
            'photos.*' => ['file', 'mimes:jpg,jpeg,png,webp,gif,heic,heif', 'max:10240'],
        ]);

        $count = $this->storeUploadedPhotos($reimbursement, $request->file('photos', []));

        return back()->with('status', $count === 1 ? 'Photo added.' : "{$count} photos added.");
    }

    public function showPhoto(Request $request, Reimbursement $reimbursement, ReimbursementPhoto $photo): SymfonyResponse
    {
        abort_unless($reimbursement->user_id === $request->user()->id, 403);
        abort_unless(Storage::disk('local')->exists($photo->path), 404);

        return Storage::disk('local')->response($photo->path);
    }

    /**
     * OCR a receipt photo and return rough line-item suggestions for the user
     * to review before they are added to the report.
     */
    public function extractPhoto(
        Request $request,
        Reimbursement $reimbursement,
        ReimbursementPhoto $photo,
        ReceiptScanner $scanner,
    ): JsonResponse {
        abort_unless($reimbursement->user_id === $request->user()->id, 403);

        @set_time_limit(120);

        try {
            $rows = $scanner->scan(Storage::disk('local')->path($photo->path));
        } catch (ReceiptScanUnavailable $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return response()->json([
            'photo_id' => $photo->id,
            'rows' => $rows,
        ]);
    }

    /**
     * Append reviewed items (from a scan or typed by hand) to an existing
     * report and recompute its total.
     */
    public function storeItems(Request $request, Reimbursement $reimbursement): RedirectResponse
    {
        abort_unless($reimbursement->user_id === $request->user()->id, 403);

        $data = $request->validate([
            'items' => ['required', 'array', 'min:1'],
            'items.*.quantity' => ['required', 'numeric', 'gt:0', 'max:1000000'],
            'items.*.item_name' => ['required', 'string', 'max:150'],
            'items.*.unit_price' => ['required', 'numeric', 'min:0', 'max:999999999'],
        ]);

        DB::transaction(function () use ($reimbursement, $data) {
            $position = (int) $reimbursement->items()->max('position');

            foreach ($data['items'] as $row) {
                $unit = Money::ofPesos($row['unit_price']);
                $quantity = (float) $row['quantity'];

                $reimbursement->items()->create([
                    'quantity' => $quantity,
                    'item_name' => $row['item_name'],
                    'unit_price' => $unit,
                    'line_total' => Money::ofCents((int) round($unit->cents * $quantity)),
                    'position' => ++$position,
                ]);
            }

            $reimbursement->update([
                'total_amount' => Money::ofCents((int) $reimbursement->items()->sum('line_total')),
            ]);
        });

        $count = count($data['items']);

        return back()->with('status', $count === 1 ? 'Item added.' : "{$count} items added.");
    }

    public function destroyPhoto(Request $request, Reimbursement $reimbursement, ReimbursementPhoto $photo): RedirectResponse
    {
        abort_unless($reimbursement->user_id === $request->user()->id, 403);

        Storage::disk('local')->delete($photo->path);
        $photo->delete();

        return back()->with('status', 'Photo removed.');
    }

    public function download(Request $request, Reimbursement $reimbursement): SymfonyResponse
    {
        abort_unless($reimbursement->user_id === $request->user()->id, 403);

        $reimbursement->load('items');

        $pdf = Pdf::loadView('reimbursements.report', [
            'reimbursement' => $reimbursement,
            'user' => $request->user(),
        ])->setPaper('a4');

        $slug = Str::slug($reimbursement->title) ?: "report-{$reimbursement->id}";

        return $pdf->download("reimbursement-{$slug}.pdf");
    }

    public function destroy(Request $request, Reimbursement $reimbursement): RedirectResponse
    {
        abort_unless($reimbursement->user_id === $request->user()->id, 403);

        Storage::disk('local')->deleteDirectory("receipts/{$reimbursement->id}");
        $reimbursement->delete();

        return to_route('reimbursements.index')->with('status', 'Reimbursement report deleted.');
    }
}
