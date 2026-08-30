<?php

namespace App\Services;

use App\Enums\CategoryKind;
use App\Enums\TransactionType;
use App\Models\Account;
use App\Models\Category;
use App\Models\Transaction;
use App\Models\User;
use App\Support\Money;
use Illuminate\Support\Carbon;
use InvalidArgumentException;

/**
 * The single write path for the ledger. Every transaction — manual entry,
 * opening balance, a posted scheduled transaction — goes through
 * {@see self::post()} so the account-side invariants hold everywhere.
 *
 * Sign convention: an account's "movement" is (money in) - (money out), where
 * "in" means the account is the destination and "out" means it is the source.
 * For an asset that movement is the cash balance; for a liability the amount
 * owed is its negation, so a repayment (transfer into the liability) reduces
 * the debt.
 */
class LedgerService
{
    /**
     * @param  array{
     *     type: TransactionType,
     *     amount: Money|int,
     *     date: \DateTimeInterface|string,
     *     description?: ?string,
     *     category_id?: ?int,
     *     from_account_id?: ?int,
     *     to_account_id?: ?int,
     *     scheduled_transaction_id?: ?int,
     * }  $data
     */
    public function post(User $user, array $data): Transaction
    {
        $type = $data['type'];
        $amount = $data['amount'] instanceof Money ? $data['amount'] : Money::ofCents($data['amount']);

        if (! $amount->isPositive()) {
            throw new InvalidArgumentException('Transaction amount must be greater than zero.');
        }

        $from = $this->resolveAccount($user, $data['from_account_id'] ?? null);
        $to = $this->resolveAccount($user, $data['to_account_id'] ?? null);
        $category = $this->resolveCategory($user, $data['category_id'] ?? null);

        $this->assertShape($type, $from, $to, $category);

        return $user->transactions()->create([
            'type' => $type,
            'amount' => $amount,
            'date' => Carbon::parse($data['date'])->toDateString(),
            'description' => $data['description'] ?? null,
            'category_id' => $category?->id,
            'from_account_id' => $from?->id,
            'to_account_id' => $to?->id,
            'scheduled_transaction_id' => $data['scheduled_transaction_id'] ?? null,
        ]);
    }

    /**
     * Record an account's starting balance as a single-sided adjustment.
     * Assets get a credit (money in); liabilities get a debit (raises the
     * amount owed to the opening principal).
     */
    public function recordOpeningBalance(Account $account, Money $amount, \DateTimeInterface|string|null $date = null): ?Transaction
    {
        if ($amount->isZero()) {
            return null;
        }

        return $this->post($account->user, [
            'type' => TransactionType::Adjustment,
            'amount' => $amount->abs(),
            'date' => $date ?? now(),
            'description' => 'Opening balance',
            'from_account_id' => $account->isLiability() ? $account->id : null,
            'to_account_id' => $account->isAsset() ? $account->id : null,
        ]);
    }

    /**
     * Cash on hand for an asset; amount still owed for a liability.
     */
    public function balance(Account $account): Money
    {
        $in = (int) Transaction::query()->where('to_account_id', $account->id)->sum('amount');
        $out = (int) Transaction::query()->where('from_account_id', $account->id)->sum('amount');
        $movement = $in - $out;

        return Money::ofCents($account->isLiability() ? -$movement : $movement);
    }

    private function resolveAccount(User $user, ?int $id): ?Account
    {
        if ($id === null) {
            return null;
        }

        $account = $user->accounts()->find($id);

        if ($account === null) {
            throw new InvalidArgumentException("Account [{$id}] does not belong to this user.");
        }

        return $account;
    }

    private function resolveCategory(User $user, ?int $id): ?Category
    {
        if ($id === null) {
            return null;
        }

        $category = $user->categories()->find($id);

        if ($category === null) {
            throw new InvalidArgumentException("Category [{$id}] does not belong to this user.");
        }

        return $category;
    }

    private function assertShape(TransactionType $type, ?Account $from, ?Account $to, ?Category $category): void
    {
        match ($type) {
            TransactionType::Income => $this->assert(
                $from === null && $to !== null,
                'An income transaction needs a destination account and no source account.'
            ),
            TransactionType::Expense => $this->assert(
                $from !== null && $to === null,
                'An expense transaction needs a source account and no destination account.'
            ),
            TransactionType::Transfer => $this->assert(
                $from !== null && $to !== null && $from->id !== $to->id,
                'A transfer needs distinct source and destination accounts.'
            ),
            TransactionType::Adjustment => $this->assert(
                ($from !== null) xor ($to !== null),
                'An adjustment needs exactly one of a source or destination account.'
            ),
        };

        if ($category !== null) {
            if (! $type->isCategorised()) {
                throw new InvalidArgumentException("A {$type->value} transaction cannot have a category.");
            }

            $expected = $type === TransactionType::Income ? CategoryKind::Income : CategoryKind::Expense;

            $this->assert(
                $category->kind === $expected,
                "A {$type->value} transaction needs a {$expected->value} category."
            );
        }
    }

    private function assert(bool $condition, string $message): void
    {
        if (! $condition) {
            throw new InvalidArgumentException($message);
        }
    }
}
