<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Arr;

class StoreReimbursementRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /**
     * Drop the blank rows the create form always renders before validating, so
     * "15 empty rows plus one real one" is a valid submission.
     */
    protected function prepareForValidation(): void
    {
        $items = collect($this->input('items', []))
            ->filter(fn ($row) => is_array($row) && (
                filled(Arr::get($row, 'item_name')) || filled(Arr::get($row, 'unit_price'))
            ))
            ->values()
            ->all();

        $this->merge(['items' => $items]);
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:150'],
            'notes' => ['nullable', 'string', 'max:2000'],
            'items' => ['array', 'min:1'],
            'items.*.quantity' => ['required', 'numeric', 'gt:0', 'max:1000000'],
            'items.*.item_name' => ['required', 'string', 'max:150'],
            'items.*.unit_price' => ['required', 'numeric', 'min:0', 'max:999999999'],

            'photos' => ['nullable', 'array', 'max:20'],
            'photos.*' => ['file', 'mimes:jpg,jpeg,png,webp,gif,heic,heif', 'max:10240'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'items.min' => 'Add at least one item with a name and a price.',
            'items.*.item_name.required' => 'Item name is required.',
            'items.*.quantity.required' => 'Quantity is required.',
            'items.*.quantity.gt' => 'Quantity must be greater than zero.',
            'items.*.unit_price.required' => 'Price per quantity is required.',
        ];
    }
}
