<?php

use App\Http\Controllers\AccountController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\MonthlyReportController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\ScheduledTransactionController;
use App\Http\Controllers\TransactionController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
});

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

    Route::resource('accounts', AccountController::class)->except(['show', 'create', 'edit']);
    Route::resource('categories', CategoryController::class)->only(['index', 'store', 'update', 'destroy']);
    Route::resource('transactions', TransactionController::class)->except(['show', 'create', 'edit']);

    Route::resource('scheduled-transactions', ScheduledTransactionController::class)
        ->parameters(['scheduled-transactions' => 'scheduledTransaction'])
        ->except(['show', 'create', 'edit']);
    Route::post('scheduled-transactions/{scheduledTransaction}/post', [ScheduledTransactionController::class, 'post'])
        ->name('scheduled-transactions.post');
    Route::post('scheduled-transactions/{scheduledTransaction}/skip', [ScheduledTransactionController::class, 'skip'])
        ->name('scheduled-transactions.skip');

    Route::get('/reports/monthly', [MonthlyReportController::class, 'show'])->name('reports.monthly');
    Route::get('/reports/monthly.pdf', [MonthlyReportController::class, 'download'])->name('reports.monthly.pdf');
});

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

require __DIR__.'/auth.php';
