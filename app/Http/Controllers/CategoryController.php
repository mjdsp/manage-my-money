<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreCategoryRequest;
use App\Http\Requests\UpdateCategoryRequest;
use App\Models\Category;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CategoryController extends Controller
{
    public function index(Request $request): Response
    {
        $categories = $request->user()->categories()
            ->withCount('transactions')
            ->orderBy('kind')
            ->orderBy('name')
            ->get(['id', 'name', 'kind', 'is_system']);

        return Inertia::render('Categories/Index', [
            'categories' => $categories,
        ]);
    }

    public function store(StoreCategoryRequest $request): RedirectResponse
    {
        $request->user()->categories()->create($request->validated() + ['is_system' => false]);

        return to_route('categories.index')->with('status', 'Category added.');
    }

    public function update(UpdateCategoryRequest $request, Category $category): RedirectResponse
    {
        abort_unless($category->user_id === $request->user()->id, 403);

        $category->update($request->validated());

        return to_route('categories.index')->with('status', 'Category renamed.');
    }

    public function destroy(Request $request, Category $category): RedirectResponse
    {
        abort_unless($category->user_id === $request->user()->id, 403);

        // Transactions keep their history; their category_id is nulled by the FK.
        $category->delete();

        return to_route('categories.index')->with('status', 'Category deleted.');
    }
}
