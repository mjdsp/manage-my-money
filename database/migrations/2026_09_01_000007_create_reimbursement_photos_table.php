<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Receipt photos attached to a reimbursement report. Files live on the private
 * "local" disk and are streamed through an authenticated route.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('reimbursement_photos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('reimbursement_id')->constrained()->cascadeOnDelete();
            $table->string('path');
            $table->string('original_name');
            $table->string('mime', 100);
            $table->unsignedInteger('size'); // bytes
            $table->timestamps();

            $table->index('reimbursement_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reimbursement_photos');
    }
};
