<?php

namespace App\Http\Requests;

use App\Enums\CategoryKind;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Enum;

class StoreCategoryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'name' => [
                'required', 'string', 'max:60',
                Rule::unique('categories')
                    ->where('user_id', $this->user()->id)
                    ->where('kind', $this->input('kind')),
            ],
            'kind' => ['required', new Enum(CategoryKind::class)],
        ];
    }
}
