export interface Transaction {
    id: string;
    date: string; // ISO date string
    name: string;
    amount: number;
    note?: string;
    isRecurring: boolean;
    recurringPattern?: {
        frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
        interval: number; // every X days/weeks/months/years
        endDate?: string; // ISO date string, optional
    };
}

export interface AccountConfig {
    startingBalance: number;
    startingDate: string; // ISO date string
    timezone: string; // IANA timezone identifier
}

export interface AccountBalance {
    date: string; // ISO date string
    balance: number;
    transactions: Transaction[];
}

export interface ChartDataPoint {
    date: string;
    balance: number;
    transactions: Transaction[];
}

export interface CalendarDay {
    date: string;
    balance: number;
    transactions: Transaction[];
    isCurrentMonth: boolean;
}

export type ViewType = 'spreadsheet' | 'chart' | 'calendar';
