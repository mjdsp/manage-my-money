export interface Money {
    cents: number;
    pesos: number;
    formatted: string;
}

export type AccountKind = 'asset' | 'liability' | 'receivable';
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
    borrowed_on: string | null;
    monthly_interest_rate: string | null;
    due_day_of_month: number | null;
    term_months: number | null;
    scheduled_payment_amount: Money | null;
    total_repayment: Money | null;
    starting_principal: Money | null;
    balance?: Money;
    in_use?: boolean;
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
    auto_post: boolean;
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

export interface ReimbursementItem {
    id: number;
    quantity: number;
    item_name: string;
    unit_price: Money;
    line_total: Money;
}

export interface ReimbursementPhoto {
    id: number;
    name: string;
    url: string;
}

export interface Reimbursement {
    id: number;
    title: string;
    notes: string | null;
    total_amount: Money;
    created_at: string;
    items_count?: number;
    photos_count?: number;
    items?: ReimbursementItem[];
    photos?: ReimbursementPhoto[];
}

export interface Paginated<T> {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: { url: string | null; label: string; active: boolean }[];
}
