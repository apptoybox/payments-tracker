import React, { useState, useEffect } from 'react';
import { Transaction } from '../types';
import { getTransactions, addTransaction, updateTransaction, deleteTransaction } from '../api';
import { Plus, Edit, Trash2, Save, X, Calendar, DollarSign, FileText, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';

interface SpreadsheetViewProps {
    onTransactionChange: () => void;
}

export const SpreadsheetView: React.FC<SpreadsheetViewProps> = ({ onTransactionChange }) => {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [newTransaction, setNewTransaction] = useState<Partial<Transaction>>({
        date: format(new Date(), 'yyyy-MM-dd'),
        name: '',
        amount: 0,
        note: '',
        isRecurring: false,
    });

    useEffect(() => {
        loadTransactions();
    }, []);

    const loadTransactions = async () => {
        try {
            setLoading(true);
            const data = await getTransactions();
            setTransactions(data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
        } catch (error) {
            console.error('Failed to load transactions:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddTransaction = async () => {
        if (!newTransaction.date || !newTransaction.name || newTransaction.amount === undefined) {
            window.alert('Please fill in all required fields');
            return;
        }

        try {
            await addTransaction(newTransaction as Omit<Transaction, 'id'>);
            setNewTransaction({
                date: format(new Date(), 'yyyy-MM-dd'),
                name: '',
                amount: 0,
                note: '',
                isRecurring: false,
            });
            await loadTransactions();
            onTransactionChange();
        } catch (error) {
            console.error('Failed to add transaction:', error);
            window.alert('Failed to add transaction');
        }
    };

    const handleUpdateTransaction = async (id: string, updates: Partial<Transaction>) => {
        try {
            await updateTransaction(id, updates);
            setEditingId(null);
            await loadTransactions();
            onTransactionChange();
        } catch (error) {
            console.error('Failed to update transaction:', error);
            window.alert('Failed to update transaction');
        }
    };

    const handleDeleteTransaction = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this transaction?')) return;

        try {
            await deleteTransaction(id);
            await loadTransactions();
            onTransactionChange();
        } catch (error) {
            console.error('Failed to delete transaction:', error);
            window.alert('Failed to delete transaction');
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(amount);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Add New Transaction Form */}
            <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Plus className="h-5 w-5" />
                    Add New Transaction
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
                    <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <input
                            type="date"
                            value={newTransaction.date || ''}
                            onChange={(e) => setNewTransaction({ ...newTransaction, date: e.target.value })}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-gray-500" />
                        <input
                            type="text"
                            placeholder="Transaction name"
                            value={newTransaction.name || ''}
                            onChange={(e) => setNewTransaction({ ...newTransaction, name: e.target.value })}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-gray-500" />
                        <input
                            type="number"
                            step="0.01"
                            placeholder="Amount"
                            value={newTransaction.amount || ''}
                            onChange={(e) => setNewTransaction({ ...newTransaction, amount: parseFloat(e.target.value) || 0 })}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <input
                            type="text"
                            placeholder="Note (optional)"
                            value={newTransaction.note || ''}
                            onChange={(e) => setNewTransaction({ ...newTransaction, note: e.target.value })}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <label className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                checked={newTransaction.isRecurring || false}
                                onChange={(e) => setNewTransaction({ ...newTransaction, isRecurring: e.target.checked })}
                                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                            />
                            <span className="text-sm">Recurring</span>
                        </label>
                    </div>
                    <button
                        onClick={handleAddTransaction}
                        className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                        Add
                    </button>
                </div>
            </div>

            {/* Transactions Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Transactions</h3>
                    <button
                        onClick={loadTransactions}
                        className="flex items-center gap-2 px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
                    >
                        <RefreshCw className="h-4 w-4" />
                        Refresh
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Note</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Recurring</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {transactions.map((transaction) => (
                                <tr key={transaction.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {format(new Date(transaction.date), 'MMM dd, yyyy')}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {editingId === transaction.id ? (
                                            <input
                                                type="text"
                                                value={transaction.name}
                                                onChange={(e) => {
                                                    const updated = transactions.map(t =>
                                                        t.id === transaction.id ? { ...t, name: e.target.value } : t
                                                    );
                                                    setTransactions(updated);
                                                }}
                                                className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-500"
                                            />
                                        ) : (
                                            transaction.name
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        {editingId === transaction.id ? (
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={transaction.amount}
                                                onChange={(e) => {
                                                    const updated = transactions.map(t =>
                                                        t.id === transaction.id ? { ...t, amount: parseFloat(e.target.value) || 0 } : t
                                                    );
                                                    setTransactions(updated);
                                                }}
                                                className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-500"
                                            />
                                        ) : (
                                            <span className={transaction.amount >= 0 ? 'text-green-600' : 'text-red-600'}>
                                                {formatCurrency(transaction.amount)}
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {editingId === transaction.id ? (
                                            <input
                                                type="text"
                                                value={transaction.note || ''}
                                                onChange={(e) => {
                                                    const updated = transactions.map(t =>
                                                        t.id === transaction.id ? { ...t, note: e.target.value } : t
                                                    );
                                                    setTransactions(updated);
                                                }}
                                                className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-500"
                                            />
                                        ) : (
                                            transaction.note || '-'
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {transaction.isRecurring ? (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                Yes
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                                No
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        {editingId === transaction.id ? (
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleUpdateTransaction(transaction.id, transaction)}
                                                    className="text-green-600 hover:text-green-900"
                                                >
                                                    <Save className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => setEditingId(null)}
                                                    className="text-gray-600 hover:text-gray-900"
                                                >
                                                    <X className="h-4 w-4" />
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => setEditingId(transaction.id)}
                                                    className="text-blue-600 hover:text-blue-900"
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteTransaction(transaction.id)}
                                                    className="text-red-600 hover:text-red-900"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
