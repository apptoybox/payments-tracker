import { Transaction, AccountConfig, ChartDataPoint, CalendarDay } from './types';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

class ApiError extends Error {
    constructor(public status: number, message: string) {
        super(message);
        this.name = 'ApiError';
    }
}

async function apiCall<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${API_BASE}${endpoint}`, {
        headers: {
            'Content-Type': 'application/json',
            ...options?.headers,
        },
        ...options,
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new ApiError(response.status, errorData.error || `HTTP ${response.status}`);
    }

    if (response.status === 204) {
        return {} as T;
    }

    return response.json();
}

// Transaction APIs
export const getTransactions = (): Promise<Transaction[]> => {
    return apiCall<Transaction[]>('/transactions');
};

export const addTransaction = (transaction: Omit<Transaction, 'id'>): Promise<Transaction> => {
    return apiCall<Transaction>('/transactions', {
        method: 'POST',
        body: JSON.stringify(transaction),
    });
};

export const updateTransaction = (id: string, updates: Partial<Transaction>): Promise<Transaction> => {
    return apiCall<Transaction>(`/transactions/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
    });
};

export const deleteTransaction = (id: string): Promise<void> => {
    return apiCall<void>(`/transactions/${id}`, {
        method: 'DELETE',
    });
};

// Configuration APIs
export const getAccountConfig = (): Promise<AccountConfig> => {
    return apiCall<AccountConfig>('/config');
};

export const updateAccountConfig = (config: Partial<AccountConfig>): Promise<AccountConfig> => {
    return apiCall<AccountConfig>('/config', {
        method: 'PUT',
        body: JSON.stringify(config),
    });
};

// Chart APIs
export const getBalanceHistory = (startDate: string, endDate: string): Promise<ChartDataPoint[]> => {
    return apiCall<ChartDataPoint[]>(`/balance-history?startDate=${startDate}&endDate=${endDate}`);
};

// Calendar APIs
export const getCalendarData = (year: number, month: number): Promise<CalendarDay[]> => {
    return apiCall<CalendarDay[]>(`/calendar?year=${year}&month=${month}`);
};

// Projected transactions
export const getProjectedTransactions = (startDate: string, endDate: string): Promise<Transaction[]> => {
    return apiCall<Transaction[]>(`/projected-transactions?startDate=${startDate}&endDate=${endDate}`);
};
