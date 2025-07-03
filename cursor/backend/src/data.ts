import { Transaction, AccountConfig } from './types';
import { db } from './database';

// Database-backed data store
export const getTransactions = async (): Promise<Transaction[]> => {
    return await db.getAllTransactions();
};

export const addTransaction = async (transaction: Omit<Transaction, 'id'>): Promise<Transaction> => {
    return await db.addTransaction(transaction);
};

export const updateTransaction = async (id: string, updates: Partial<Transaction>): Promise<Transaction | null> => {
    return await db.updateTransaction(id, updates);
};

export const deleteTransaction = async (id: string): Promise<boolean> => {
    return await db.deleteTransaction(id);
};

export const getAccountConfig = async (): Promise<AccountConfig> => {
    return await db.getAccountConfig();
};

export const updateAccountConfig = async (config: Partial<AccountConfig>): Promise<AccountConfig> => {
    return await db.updateAccountConfig(config);
};
