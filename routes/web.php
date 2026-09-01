<?php

use App\Http\Controllers\AccountController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\MonthlyReportController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\ReimbursementController;
use App\Http\Controllers\ScheduledTransactionController;
use App\Http\Controllers\TransactionController;
use App\Http\Middleware\PostDueScheduledTransactions;
use Illuminate\Support\Facades\Route;

Route::get('/', fn () => redirect()->route('dashboard'));

Route::middleware(['auth', 'verified', PostDueScheduledTransactions::class])->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

    Route::resource('accounts', AccountController::class)->except(['show', 'create', 'edit']);
    Route::patch('accounts/{account}/archive', [AccountController::class, 'archive'])->name('accounts.archive');
    Route::patch('accounts/{account}/restore', [AccountController::class, 'restore'])->name('accounts.restore');

    Route::resource('categories', CategoryController::class)->only(['index', 'store', 'update', 'destroy']);

    Route::resource('reimbursements', ReimbursementController::class)
        ->only(['index', 'create', 'store', 'show', 'edit', 'update', 'destroy']);
    Route::get('reimbursements/{reimbursement}/pdf', [ReimbursementController::class, 'download'])
        ->name('reimbursements.pdf');
    Route::post('reimbursements/{reimbursement}/photos', [ReimbursementController::class, 'storePhotos'])
        ->name('reimbursements.photos.store');
    Route::get('reimbursements/{reimbursement}/photos/{photo}', [ReimbursementController::class, 'showPhoto'])
        ->scopeBindings()->name('reimbursements.photos.show');
    Route::post('reimbursements/{reimbursement}/photos/{photo}/extract', [ReimbursementController::class, 'extractPhoto'])
        ->scopeBindings()->name('reimbursements.photos.extract');
    Route::delete('reimbursements/{reimbursement}/photos/{photo}', [ReimbursementController::class, 'destroyPhoto'])
        ->scopeBindings()->name('reimbursements.photos.destroy');
    Route::post('reimbursements/{reimbursement}/items', [ReimbursementController::class, 'storeItems'])
        ->name('reimbursements.items.store');
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
