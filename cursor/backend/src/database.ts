import sqlite3 from 'sqlite3';
import { Transaction, AccountConfig } from './types';
import path from 'path';

class DatabaseService {
    private db: sqlite3.Database;
    private initialized: boolean = false;

    constructor() {
        // Create database file in the backend directory
        const dbPath = path.join(__dirname, '..', 'data', 'account-tracker.db');

        // Ensure the data directory exists
        const fs = require('fs');
        const dataDir = path.dirname(dbPath);
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }

        this.db = new sqlite3.Database(dbPath);
        this.initializeTables();
    }

    private initializeTables(): void {
        // Create transactions table
        this.db.run(`
      CREATE TABLE IF NOT EXISTS transactions (
        id TEXT PRIMARY KEY,
        date TEXT NOT NULL,
        name TEXT NOT NULL,
        amount REAL NOT NULL,
        note TEXT,
        isRecurring INTEGER NOT NULL DEFAULT 0,
        recurringPattern TEXT
      )
    `);

        // Create configuration table
        this.db.run(`
      CREATE TABLE IF NOT EXISTS config (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      )
    `, (err) => {
            if (err) {
                console.error('Error creating config table:', err);
                return;
            }

            // Check if config exists and insert default if not
            this.db.get('SELECT COUNT(*) as count FROM config WHERE key = ?', ['account'], (err, row: any) => {
                if (err) {
                    console.error('Error checking config:', err);
                    return;
                }

                if (!row.count) {
                    const defaultConfig: AccountConfig = {
                        startingBalance: 5000,
                        startingDate: new Date().toISOString().split('T')[0],
                        timezone: 'America/Los_Angeles'
                    };

                    this.db.run('INSERT INTO config (key, value) VALUES (?, ?)', [
                        'account',
                        JSON.stringify(defaultConfig)
                    ], (err) => {
                        if (err) {
                            console.error('Error inserting default config:', err);
                            return;
                        }
                        console.log('Default configuration inserted');

                        // Insert sample transactions
                        this.insertSampleTransactions();
                    });
                } else {
                    console.log('Configuration already exists');
                    this.initialized = true;
                }
            });
        });
    }

    private insertSampleTransactions(): void {
        const sampleTransactions: Transaction[] = [
            {
                id: '1',
                date: '2024-01-15',
                name: 'Rent Payment',
                amount: -1200,
                note: 'Monthly rent',
                isRecurring: true,
                recurringPattern: {
                    frequency: 'monthly',
                    interval: 1
                }
            },
            {
                id: '2',
                date: '2024-01-20',
                name: 'Salary',
                amount: 3000,
                note: 'Monthly salary',
                isRecurring: true,
                recurringPattern: {
                    frequency: 'monthly',
                    interval: 1
                }
            },
            {
                id: '3',
                date: '2024-01-25',
                name: 'Netflix Subscription',
                amount: -15.99,
                note: 'Monthly streaming service',
                isRecurring: true,
                recurringPattern: {
                    frequency: 'monthly',
                    interval: 1
                }
            }
        ];

        const insertTransaction = this.db.prepare(`
      INSERT INTO transactions (id, date, name, amount, note, isRecurring, recurringPattern)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

        sampleTransactions.forEach(transaction => {
            insertTransaction.run([
                transaction.id,
                transaction.date,
                transaction.name,
                transaction.amount,
                transaction.note,
                transaction.isRecurring ? 1 : 0,
                transaction.recurringPattern ? JSON.stringify(transaction.recurringPattern) : null
            ]);
        });

        insertTransaction.finalize((err) => {
            if (err) {
                console.error('Error inserting sample transactions:', err);
            } else {
                console.log('Sample transactions inserted');
                this.initialized = true;
            }
        });
    }

    // Transaction methods
    getAllTransactions(): Promise<Transaction[]> {
        return new Promise((resolve, reject) => {
            this.db.all('SELECT * FROM transactions ORDER BY date DESC', (err, rows: any[]) => {
                if (err) {
                    reject(err);
                    return;
                }

                const transactions = rows.map(row => ({
                    id: row.id,
                    date: row.date,
                    name: row.name,
                    amount: row.amount,
                    note: row.note,
                    isRecurring: Boolean(row.isRecurring),
                    recurringPattern: row.recurringPattern ? JSON.parse(row.recurringPattern) : undefined
                }));

                resolve(transactions);
            });
        });
    }

    addTransaction(transaction: Omit<Transaction, 'id'>): Promise<Transaction> {
        return new Promise((resolve, reject) => {
            const id = Date.now().toString();
            const newTransaction: Transaction = { ...transaction, id };

            this.db.run(`
        INSERT INTO transactions (id, date, name, amount, note, isRecurring, recurringPattern)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [
                id,
                newTransaction.date,
                newTransaction.name,
                newTransaction.amount,
                newTransaction.note,
                newTransaction.isRecurring ? 1 : 0,
                newTransaction.recurringPattern ? JSON.stringify(newTransaction.recurringPattern) : null
            ], function (err) {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(newTransaction);
            });
        });
    }

    updateTransaction(id: string, updates: Partial<Transaction>): Promise<Transaction | null> {
        return new Promise((resolve, reject) => {
            this.db.get('SELECT * FROM transactions WHERE id = ?', [id], (err, existing: any) => {
                if (err) {
                    reject(err);
                    return;
                }

                if (!existing) {
                    resolve(null);
                    return;
                }

                const updatedTransaction = { ...existing, ...updates };

                this.db.run(`
          UPDATE transactions
          SET date = ?, name = ?, amount = ?, note = ?, isRecurring = ?, recurringPattern = ?
          WHERE id = ?
        `, [
                    updatedTransaction.date,
                    updatedTransaction.name,
                    updatedTransaction.amount,
                    updatedTransaction.note,
                    updatedTransaction.isRecurring ? 1 : 0,
                    updatedTransaction.recurringPattern ? JSON.stringify(updatedTransaction.recurringPattern) : null,
                    id
                ], function (err) {
                    if (err) {
                        reject(err);
                        return;
                    }

                    resolve({
                        id: updatedTransaction.id,
                        date: updatedTransaction.date,
                        name: updatedTransaction.name,
                        amount: updatedTransaction.amount,
                        note: updatedTransaction.note,
                        isRecurring: Boolean(updatedTransaction.isRecurring),
                        recurringPattern: updatedTransaction.recurringPattern ? JSON.parse(updatedTransaction.recurringPattern) : undefined
                    });
                });
            });
        });
    }

    deleteTransaction(id: string): Promise<boolean> {
        return new Promise((resolve, reject) => {
            this.db.run('DELETE FROM transactions WHERE id = ?', [id], function (err) {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(this.changes > 0);
            });
        });
    }

    // Configuration methods
    getAccountConfig(): Promise<AccountConfig> {
        return new Promise((resolve, reject) => {
            this.db.get('SELECT value FROM config WHERE key = ?', ['account'], (err, row: any) => {
                if (err) {
                    reject(err);
                    return;
                }

                if (!row) {
                    reject(new Error('Configuration not found'));
                    return;
                }

                resolve(JSON.parse(row.value));
            });
        });
    }

    updateAccountConfig(config: Partial<AccountConfig>): Promise<AccountConfig> {
        return new Promise((resolve, reject) => {
            this.getAccountConfig().then(currentConfig => {
                const updatedConfig = { ...currentConfig, ...config };

                this.db.run('UPDATE config SET value = ? WHERE key = ?', [
                    JSON.stringify(updatedConfig),
                    'account'
                ], function (err) {
                    if (err) {
                        reject(err);
                        return;
                    }
                    resolve(updatedConfig);
                });
            }).catch(reject);
        });
    }

    // Cleanup method
    close(): void {
        this.db.close();
    }
}

// Export singleton instance
export const db = new DatabaseService();
