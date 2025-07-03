import React, { useState, useEffect } from 'react';
import { CalendarDay, AccountConfig } from '../types';
import { getCalendarData, getAccountConfig } from '../api';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, getDay, getDate } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar, DollarSign, FileText } from 'lucide-react';

interface CalendarViewProps {
    onTransactionChange: () => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({ onTransactionChange }) => {
    const [calendarData, setCalendarData] = useState<CalendarDay[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [userConfig, setUserConfig] = useState<AccountConfig | null>(null);

    useEffect(() => {
        loadUserConfig();
    }, []);

    useEffect(() => {
        if (userConfig) {
            loadCalendarData();
        }
    }, [currentDate, userConfig]);

    const loadUserConfig = async () => {
        try {
            const config = await getAccountConfig();
            setUserConfig(config);
        } catch (error) {
            console.error('Failed to load user config:', error);
            // Fallback to default timezone
            setUserConfig({
                startingBalance: 5000,
                startingDate: new Date().toISOString().split('T')[0],
                timezone: 'America/Los_Angeles'
            });
        }
    };

    const loadCalendarData = async () => {
        if (!userConfig) return;

        try {
            setLoading(true);
            const year = currentDate.getFullYear();
            const month = currentDate.getMonth() + 1;
            const data = await getCalendarData(year, month);
            setCalendarData(data);
        } catch (error) {
            console.error('Failed to load calendar data:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const getMonthName = () => {
        return format(currentDate, 'MMMM yyyy');
    };

    const goToPreviousMonth = () => {
        setCurrentDate(subMonths(currentDate, 1));
    };

    const goToNextMonth = () => {
        setCurrentDate(addMonths(currentDate, 1));
    };

    const goToToday = () => {
        setCurrentDate(new Date());
    };

    // Get current date in user's timezone
    const getCurrentDateInUserTimezone = (): string => {
        if (!userConfig) return format(new Date(), 'yyyy-MM-dd');

        const now = new Date();
        const userTime = new Date(now.toLocaleString("en-US", { timeZone: userConfig.timezone }));
        return format(userTime, 'yyyy-MM-dd');
    };

    const isToday = (dateStr: string) => {
        return dateStr === getCurrentDateInUserTimezone();
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
            {/* Calendar Header */}
            <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        Calendar View
                    </h3>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={goToToday}
                            className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                        >
                            Today
                        </button>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={goToPreviousMonth}
                                className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
                            >
                                <ChevronLeft className="h-5 w-5" />
                            </button>
                            <h2 className="text-xl font-semibold text-gray-900 min-w-[120px] text-center">
                                {getMonthName()}
                            </h2>
                            <button
                                onClick={goToNextMonth}
                                className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
                            >
                                <ChevronRight className="h-5 w-5" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-lg overflow-hidden">
                    {/* Day Headers */}
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                        <div
                            key={day}
                            className="bg-gray-50 p-3 text-center text-sm font-medium text-gray-700"
                        >
                            {day}
                        </div>
                    ))}

                    {/* Calendar Days */}
                    {calendarData.map((day, index) => (
                        <div
                            key={index}
                            className={`min-h-[120px] p-2 ${!day.isCurrentMonth ? 'bg-gray-50' : 'bg-white'
                                } ${isToday(day.date)
                                    ? 'bg-blue-50 border-2 border-blue-500'
                                    : ''
                                }`}
                        >
                            <div className="flex items-center justify-between mb-1">
                                <span
                                    className={`text-sm font-medium ${day.isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
                                        } ${isToday(day.date) ? 'text-blue-700 font-bold' : ''
                                        }`}
                                >
                                    {getDate(new Date(day.date))}
                                </span>
                                {day.transactions.length > 0 && (
                                    <span className="text-xs bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded-full">
                                        {day.transactions.length}
                                    </span>
                                )}
                            </div>

                            {/* Balance */}
                            <div className="mb-2">
                                <div className="flex items-center gap-1">
                                    <DollarSign className="h-3 w-3 text-gray-500" />
                                    <span className={`text-xs font-medium ${isToday(day.date) ? 'text-blue-700' : 'text-gray-700'
                                        }`}>
                                        {formatCurrency(day.balance)}
                                    </span>
                                </div>
                            </div>

                            {/* Transactions */}
                            <div className="space-y-1 max-h-16 overflow-y-auto">
                                {day.transactions.slice(0, 3).map((transaction, tIndex) => (
                                    <div
                                        key={tIndex}
                                        className="text-xs p-1 rounded bg-gray-100 hover:bg-gray-200 transition-colors cursor-pointer"
                                        title={`${transaction.name} - ${formatCurrency(transaction.amount)}`}
                                    >
                                        <div className="flex items-center gap-1">
                                            <span
                                                className={`font-medium ${transaction.amount >= 0 ? 'text-green-600' : 'text-red-600'
                                                    }`}
                                            >
                                                {transaction.amount >= 0 ? '+' : ''}{formatCurrency(transaction.amount)}
                                            </span>
                                        </div>
                                        <div className="text-gray-600 truncate">
                                            {transaction.name}
                                        </div>
                                    </div>
                                ))}
                                {day.transactions.length > 3 && (
                                    <div className="text-xs text-gray-500 text-center">
                                        +{day.transactions.length - 3} more
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Legend */}
                <div className="mt-6 flex items-center justify-center gap-6 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-green-100 border border-green-300 rounded"></div>
                        <span>Income</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-red-100 border border-red-300 rounded"></div>
                        <span>Expense</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-blue-100 border border-blue-300 rounded"></div>
                        <span>Transactions</span>
                    </div>
                </div>
            </div>

            {/* Monthly Summary */}
            <div className="bg-white rounded-lg shadow p-6">
                <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Monthly Summary - {getMonthName()}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                        <div className="text-sm font-medium text-gray-600">Total Transactions</div>
                        <div className="text-2xl font-bold text-gray-900">
                            {calendarData.reduce((sum, day) => sum + day.transactions.length, 0)}
                        </div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                        <div className="text-sm font-medium text-gray-600">Days with Transactions</div>
                        <div className="text-2xl font-bold text-gray-900">
                            {calendarData.filter(day => day.transactions.length > 0).length}
                        </div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                        <div className="text-sm font-medium text-gray-600">Starting Balance</div>
                        <div className="text-2xl font-bold text-gray-900">
                            {calendarData.length > 0 ? formatCurrency(calendarData[0].balance) : '$0'}
                        </div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                        <div className="text-sm font-medium text-gray-600">Ending Balance</div>
                        <div className="text-2xl font-bold text-gray-900">
                            {calendarData.length > 0 ? formatCurrency(calendarData[calendarData.length - 1].balance) : '$0'}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
