export interface Money {
    cents: number;
    pesos: number;
    formatted: string;
}

export type AccountKind = 'asset' | 'liability';
export type CategoryKind = 'income' | 'expense';
export type TransactionType = 'income' | 'expense' | 'transfer' | 'adjustment';

export interface Account {
    id: number;
    name: string;
    kind: AccountKind;
    is_archived: boolean;
    bank_name: string | null;
    interest_rate: string | null;
    lender: string | null;
    apr: string | null;
    due_day_of_month: number | null;
    scheduled_payment_amount: Money | null;
    starting_principal: Money | null;
    balance?: Money;
}

export interface Category {
    id: number;
    name: string;
    kind: CategoryKind;
    is_system: boolean;
    transactions_count?: number;
}

export interface AccountRef {
    id: number;
    name: string;
}

export interface Transaction {
    id: number;
    date: string;
    amount: Money;
    type: TransactionType;
    description: string | null;
    category_id: number | null;
    from_account_id: number | null;
    to_account_id: number | null;
    category?: Pick<Category, 'id' | 'name' | 'kind'> | null;
    from_account?: AccountRef | null;
    to_account?: AccountRef | null;
}

export interface ScheduledTransaction {
    id: number;
    description: string;
    amount: Money;
    type: TransactionType;
    day_of_month: number;
    lead_time_days: number | null;
    is_active: boolean;
    next_due_date: string;
    last_posted_at: string | null;
    remind_on: string;
    category_id: number | null;
    from_account_id: number | null;
    to_account_id: number | null;
    category?: Pick<Category, 'id' | 'name' | 'kind'> | null;
    from_account?: AccountRef | null;
    to_account?: AccountRef | null;
}

export interface Paginated<T> {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: { url: string | null; label: string; active: boolean }[];
}
