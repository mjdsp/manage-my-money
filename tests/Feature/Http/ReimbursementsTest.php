<?php

use App\Exceptions\ReceiptScanUnavailable;
use App\Models\Reimbursement;
use App\Models\ReimbursementItem;
use App\Models\ReimbursementPhoto;
use App\Models\User;
use App\Services\ReceiptScanner;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

beforeEach(function () {
    $this->user = User::factory()->create();
});

it('requires authentication', function () {
    $this->get(route('reimbursements.index'))->assertRedirect(route('login'));
});

it('saves a reimbursement, ignoring the blank starter rows', function () {
    $items = array_fill(0, 15, ['quantity' => '1', 'item_name' => '', 'unit_price' => '']);
    $items[0] = ['quantity' => '3', 'item_name' => 'Notebook', 'unit_price' => '85.50'];
    $items[1] = ['quantity' => '2', 'item_name' => 'Pen', 'unit_price' => '20'];

    $this->actingAs($this->user)
        ->post(route('reimbursements.store'), [
            'title' => 'Office supplies',
            'items' => $items,
        ])
        ->assertRedirect();

    $report = $this->user->reimbursements()->sole();

    expect($report->title)->toBe('Office supplies')
        ->and($report->items)->toHaveCount(2)
        ->and($report->items[0]->line_total->cents)->toBe(256_50) // 3 * 85.50
        ->and($report->items[1]->line_total->cents)->toBe(40_00)  // 2 * 20
        ->and($report->total_amount->cents)->toBe(296_50);
});

it('attaches receipt photos submitted with the create form', function () {
    Storage::fake('local');

    $this->actingAs($this->user)
        ->post(route('reimbursements.store'), [
            'title' => 'Trip',
            'items' => [['quantity' => '1', 'item_name' => 'Taxi', 'unit_price' => '250']],
            'photos' => [
                UploadedFile::fake()->create('a.jpg', 200),
                UploadedFile::fake()->create('b.png', 200),
            ],
        ])
        ->assertRedirect();

    $report = $this->user->reimbursements()->sole();
    expect($report->photos)->toHaveCount(2);
    Storage::disk('local')->assertExists($report->photos->first()->path);
});

it('accepts a fractional quantity like 10.2 litres of fuel', function () {
    $this->actingAs($this->user)
        ->post(route('reimbursements.store'), [
            'title' => 'Fuel run',
            'items' => [
                ['quantity' => '10.2', 'item_name' => 'Unleaded', 'unit_price' => '65'],
                ['quantity' => '0.5', 'item_name' => 'Oil top-up', 'unit_price' => '300'],
            ],
        ])
        ->assertRedirect();

    $report = $this->user->reimbursements()->sole();

    expect((float) $report->items[0]->quantity)->toBe(10.2)
        ->and($report->items[0]->line_total->cents)->toBe(663_00) // 10.2 * 65.00
        ->and($report->items[1]->line_total->cents)->toBe(150_00) // 0.5 * 300.00
        ->and($report->total_amount->cents)->toBe(813_00);
});

it('rejects a zero or negative quantity', function () {
    $this->actingAs($this->user)
        ->post(route('reimbursements.store'), [
            'title' => 'Bad',
            'items' => [['quantity' => '0', 'item_name' => 'Nope', 'unit_price' => '10']],
        ])
        ->assertSessionHasErrors('items.0.quantity');
});

it('rejects a report with no filled-in items', function () {
    $this->actingAs($this->user)
        ->post(route('reimbursements.store'), [
            'title' => 'Empty',
            'items' => array_fill(0, 3, ['quantity' => '1', 'item_name' => '', 'unit_price' => '']),
        ])
        ->assertSessionHasErrors('items');
});

it('shows only the owner their report', function () {
    $theirs = Reimbursement::factory()->for(User::factory())->create();

    $this->actingAs($this->user)
        ->get(route('reimbursements.show', $theirs))
        ->assertForbidden();
});

it('renders the edit form with the existing items', function () {
    $report = Reimbursement::factory()->for($this->user)->create(['title' => 'Old title']);
    ReimbursementItem::factory()->for($report)->create([
        'quantity' => 2, 'item_name' => 'Coke', 'unit_price' => 8550, 'line_total' => 17100,
    ]);

    $this->actingAs($this->user)
        ->get(route('reimbursements.edit', $report))
        ->assertInertia(fn ($page) => $page
            ->component('Reimbursements/Edit')
            ->where('reimbursement.title', 'Old title')
            ->where('reimbursement.items.0.item_name', 'Coke')
            ->where('reimbursement.items.0.quantity', '2')
            ->where('reimbursement.items.0.unit_price', '85.50'));
});

it('updates a report, replacing its items and recomputing the total', function () {
    $report = Reimbursement::factory()->for($this->user)->create(['title' => 'Old']);
    $stale = ReimbursementItem::factory()->for($report)->create([
        'item_name' => 'Stale', 'unit_price' => 999_00, 'line_total' => 999_00,
    ]);

    $this->actingAs($this->user)
        ->put(route('reimbursements.update', $report), [
            'title' => 'New title',
            'notes' => 'Updated',
            'items' => [
                ['quantity' => 3, 'item_name' => 'Bond paper', 'unit_price' => '120'],
                ['quantity' => 1, 'item_name' => 'Ink', 'unit_price' => '450.50'],
            ],
        ])
        ->assertRedirect(route('reimbursements.show', $report));

    $report->refresh();
    expect($report->title)->toBe('New title')
        ->and($report->notes)->toBe('Updated')
        ->and(ReimbursementItem::find($stale->id))->toBeNull()
        ->and($report->items)->toHaveCount(2)
        ->and($report->total_amount->cents)->toBe(360_00 + 450_50);
});

it('will not let another user edit or update a report', function () {
    $theirs = Reimbursement::factory()->for(User::factory())->create();

    $this->actingAs($this->user)->get(route('reimbursements.edit', $theirs))->assertForbidden();
    $this->actingAs($this->user)->put(route('reimbursements.update', $theirs), [
        'title' => 'Hacked',
        'items' => [['quantity' => 1, 'item_name' => 'x', 'unit_price' => '1']],
    ])->assertForbidden();
});

it('downloads a report as a PDF', function () {
    $report = Reimbursement::factory()
        ->for($this->user)
        ->has(ReimbursementItem::factory()->count(3), 'items')
        ->create(['title' => 'Client Trip']);

    $response = $this->actingAs($this->user)
        ->get(route('reimbursements.pdf', $report));

    $response->assertOk();
    expect($response->headers->get('content-type'))->toContain('application/pdf')
        ->and($response->headers->get('content-disposition'))->toContain('reimbursement-client-trip.pdf');
});

it('downloads the PDF even for a report that has receipt photos', function () {
    Storage::fake('local');
    $report = Reimbursement::factory()
        ->for($this->user)
        ->has(ReimbursementItem::factory()->count(2), 'items')
        ->create(['title' => 'With receipts']);
    $this->actingAs($this->user)->post(route('reimbursements.photos.store', $report), [
        'photos' => [UploadedFile::fake()->create('receipt.jpg', 200)],
    ]);

    $response = $this->actingAs($this->user)->get(route('reimbursements.pdf', $report));

    $response->assertOk();
    expect($response->headers->get('content-type'))->toContain('application/pdf');
});

it('will not let another user download a report', function () {
    $theirs = Reimbursement::factory()->for(User::factory())->create();

    $this->actingAs($this->user)
        ->get(route('reimbursements.pdf', $theirs))
        ->assertForbidden();
});

it('attaches multiple receipt photos and streams them back to the owner', function () {
    Storage::fake('local');
    $report = Reimbursement::factory()->for($this->user)->create();

    $this->actingAs($this->user)
        ->post(route('reimbursements.photos.store', $report), [
            'photos' => [
                UploadedFile::fake()->create('receipt-1.jpg', 200),
                UploadedFile::fake()->create('receipt-2.png', 200),
            ],
        ])
        ->assertRedirect();

    $report->refresh();
    expect($report->photos)->toHaveCount(2);
    Storage::disk('local')->assertExists($report->photos[0]->path);

    $this->actingAs($this->user)
        ->get(route('reimbursements.photos.show', [$report, $report->photos[0]]))
        ->assertOk();
});

it('will not serve a photo to a different user', function () {
    Storage::fake('local');
    $report = Reimbursement::factory()->for($this->user)->create();
    $this->actingAs($this->user)->post(route('reimbursements.photos.store', $report), [
        'photos' => [UploadedFile::fake()->create('r.jpg', 200)],
    ]);

    $this->actingAs(User::factory()->create())
        ->get(route('reimbursements.photos.show', [$report, $report->photos()->sole()]))
        ->assertForbidden();
});

it('rejects a non-image upload', function () {
    Storage::fake('local');
    $report = Reimbursement::factory()->for($this->user)->create();

    $this->actingAs($this->user)
        ->post(route('reimbursements.photos.store', $report), [
            'photos' => [UploadedFile::fake()->create('notes.pdf', 20, 'application/pdf')],
        ])
        ->assertSessionHasErrors('photos.0');
});

it('deletes a photo', function () {
    Storage::fake('local');
    $report = Reimbursement::factory()->for($this->user)->create();
    $this->actingAs($this->user)->post(route('reimbursements.photos.store', $report), [
        'photos' => [UploadedFile::fake()->create('r.jpg', 200)],
    ]);
    $photo = $report->photos()->sole();

    $this->actingAs($this->user)
        ->delete(route('reimbursements.photos.destroy', [$report, $photo]))
        ->assertRedirect();

    expect($report->photos()->count())->toBe(0);
    Storage::disk('local')->assertMissing($photo->path);
});

it('deletes attached photos when the report is deleted', function () {
    Storage::fake('local');
    $report = Reimbursement::factory()->for($this->user)->create();
    $this->actingAs($this->user)->post(route('reimbursements.photos.store', $report), [
        'photos' => [UploadedFile::fake()->create('r.jpg', 200)],
    ]);

    $this->actingAs($this->user)->delete(route('reimbursements.destroy', $report))->assertRedirect();

    expect(Reimbursement::find($report->id))->toBeNull()
        ->and(ReimbursementPhoto::count())->toBe(0);
});

it('deletes a report', function () {
    $report = Reimbursement::factory()->for($this->user)->create();

    $this->actingAs($this->user)
        ->delete(route('reimbursements.destroy', $report))
        ->assertRedirect();

    expect(Reimbursement::find($report->id))->toBeNull();
});

it('appends reviewed items and recomputes the total', function () {
    $report = Reimbursement::factory()->for($this->user)->create(['total_amount' => 0]);
    ReimbursementItem::factory()->for($report)->create([
        'quantity' => 1, 'unit_price' => 100_00, 'line_total' => 100_00, 'position' => 0,
    ]);
    $report->update(['total_amount' => 100_00]);

    $this->actingAs($this->user)
        ->post(route('reimbursements.items.store', $report), [
            'items' => [
                ['quantity' => 2, 'item_name' => 'Coke', 'unit_price' => '85.50'],
                ['quantity' => 1, 'item_name' => 'Bread', 'unit_price' => '55'],
            ],
        ])
        ->assertRedirect();

    $report->refresh();
    expect($report->items)->toHaveCount(3)
        ->and($report->items->last()->position)->toBe(2)
        ->and($report->total_amount->cents)->toBe(100_00 + 171_00 + 55_00);
});

it('rejects blank reviewed items', function () {
    $report = Reimbursement::factory()->for($this->user)->create();

    $this->actingAs($this->user)
        ->post(route('reimbursements.items.store', $report), [
            'items' => [['quantity' => 1, 'item_name' => '', 'unit_price' => '']],
        ])
        ->assertSessionHasErrors(['items.0.item_name', 'items.0.unit_price']);
});

it('extracts line-item suggestions from a receipt photo', function () {
    Storage::fake('local');
    $report = Reimbursement::factory()->for($this->user)->create();
    $this->actingAs($this->user)->post(route('reimbursements.photos.store', $report), [
        'photos' => [UploadedFile::fake()->create('receipt.jpg', 200)],
    ]);
    $photo = $report->photos()->sole();

    $this->mock(ReceiptScanner::class)
        ->shouldReceive('scan')
        ->once()
        ->andReturn([
            ['quantity' => 2, 'item_name' => 'Coke', 'unit_price' => '85.00', 'raw' => '2 Coke 170.00'],
        ]);

    $this->actingAs($this->user)
        ->postJson(route('reimbursements.photos.extract', [$report, $photo]))
        ->assertOk()
        ->assertJsonPath('rows.0.item_name', 'Coke')
        ->assertJsonPath('photo_id', $photo->id);
});

it('reports a friendly error when OCR is unavailable', function () {
    Storage::fake('local');
    $report = Reimbursement::factory()->for($this->user)->create();
    $this->actingAs($this->user)->post(route('reimbursements.photos.store', $report), [
        'photos' => [UploadedFile::fake()->create('receipt.jpg', 200)],
    ]);
    $photo = $report->photos()->sole();

    $this->mock(ReceiptScanner::class)
        ->shouldReceive('scan')
        ->andThrow(new ReceiptScanUnavailable('Tesseract OCR is not installed on this server.'));

    $this->actingAs($this->user)
        ->postJson(route('reimbursements.photos.extract', [$report, $photo]))
        ->assertStatus(422)
        ->assertJsonPath('message', 'Tesseract OCR is not installed on this server.');
});
