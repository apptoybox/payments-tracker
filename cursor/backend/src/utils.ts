import { Transaction, AccountConfig, AccountBalance, ChartDataPoint, CalendarDay } from './types';

// Helper function to get date in specific timezone
const getDateInTimezone = (date: Date, timezone: string): Date => {
    const utc = date.getTime() + (date.getTimezoneOffset() * 60000);
    const targetTime = new Date(utc);
    return targetTime;
};

// Helper function to format date as YYYY-MM-DD in specific timezone
const formatDateInTimezone = (date: Date, timezone: string): string => {
    const dateInTz = getDateInTimezone(date, timezone);
    return dateInTz.toISOString().split('T')[0];
};

// Helper function to get current date in specific timezone
const getCurrentDateInTimezone = (timezone: string): string => {
    return formatDateInTimezone(new Date(), timezone);
};

export const generateRecurringTransactions = (
    baseTransactions: Transaction[],
    startDate: string,
    endDate: string,
    timezone: string = 'America/Los_Angeles'
): Transaction[] => {
    const allTransactions: Transaction[] = [];

    baseTransactions.forEach(transaction => {
        if (!transaction.isRecurring || !transaction.recurringPattern) {
            // Add non-recurring transaction if it's within the date range
            if (transaction.date >= startDate && transaction.date <= endDate) {
                allTransactions.push(transaction);
            }
            return;
        }

        const { frequency, interval, endDate: recurringEndDate } = transaction.recurringPattern;
        const baseDate = new Date(transaction.date);
        const end = new Date(recurringEndDate || endDate);
        let currentDate = new Date(baseDate);

        while (currentDate <= end) {
            const dateStr = formatDateInTimezone(currentDate, timezone);

            if (dateStr >= startDate && dateStr <= endDate) {
                allTransactions.push({
                    ...transaction,
                    id: `${transaction.id}_${dateStr}`,
                    date: dateStr
                });
            }

            // Calculate next occurrence
            switch (frequency) {
                case 'daily':
                    currentDate.setDate(currentDate.getDate() + interval);
                    break;
                case 'weekly':
                    currentDate.setDate(currentDate.getDate() + (interval * 7));
                    break;
                case 'monthly':
                    currentDate.setMonth(currentDate.getMonth() + interval);
                    break;
                case 'yearly':
                    currentDate.setFullYear(currentDate.getFullYear() + interval);
                    break;
            }
        }
    });

    return allTransactions.sort((a, b) => a.date.localeCompare(b.date));
};

export const calculateAccountBalance = (
    transactions: Transaction[],
    config: AccountConfig,
    targetDate: string
): number => {
    const startDate = new Date(config.startingDate);
    const endDate = new Date(targetDate);

    if (endDate < startDate) {
        return config.startingBalance;
    }

    const relevantTransactions = transactions.filter(t => {
        const transactionDate = new Date(t.date);
        return transactionDate >= startDate && transactionDate <= endDate;
    });

    const totalAmount = relevantTransactions.reduce((sum, t) => sum + t.amount, 0);
    return config.startingBalance + totalAmount;
};

export const generateBalanceHistory = (
    transactions: Transaction[],
    config: AccountConfig,
    startDate: string,
    endDate: string
): ChartDataPoint[] => {
    const dataPoints: ChartDataPoint[] = [];
    const current = new Date(startDate);
    const end = new Date(endDate);

    while (current <= end) {
        const dateStr = formatDateInTimezone(current, config.timezone);
        const balance = calculateAccountBalance(transactions, config, dateStr);
        const dayTransactions = transactions.filter(t => t.date === dateStr);

        dataPoints.push({
            date: dateStr,
            balance,
            transactions: dayTransactions
        });

        current.setDate(current.getDate() + 1);
    }

    return dataPoints;
};

export const generateCalendarData = (
    transactions: Transaction[],
    config: AccountConfig,
    year: number,
    month: number
): CalendarDay[] => {
    const days: CalendarDay[] = [];
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);

    // Add days from previous month to fill first week
    const firstDayOfWeek = firstDay.getDay();
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
        const date = new Date(firstDay);
        date.setDate(date.getDate() - (i + 1));
        const dateStr = formatDateInTimezone(date, config.timezone);
        const balance = calculateAccountBalance(transactions, config, dateStr);
        const dayTransactions = transactions.filter(t => t.date === dateStr);

        days.push({
            date: dateStr,
            balance,
            transactions: dayTransactions,
            isCurrentMonth: false
        });
    }

    // Add days of current month
    for (let day = 1; day <= lastDay.getDate(); day++) {
        const date = new Date(year, month - 1, day);
        const dateStr = formatDateInTimezone(date, config.timezone);
        const balance = calculateAccountBalance(transactions, config, dateStr);
        const dayTransactions = transactions.filter(t => t.date === dateStr);

        days.push({
            date: dateStr,
            balance,
            transactions: dayTransactions,
            isCurrentMonth: true
        });
    }

    // Add days from next month to fill last week
    const lastDayOfWeek = lastDay.getDay();
    for (let i = 1; i <= 6 - lastDayOfWeek; i++) {
        const date = new Date(lastDay);
        date.setDate(date.getDate() + i);
        const dateStr = formatDateInTimezone(date, config.timezone);
        const balance = calculateAccountBalance(transactions, config, dateStr);
        const dayTransactions = transactions.filter(t => t.date === dateStr);

        days.push({
            date: dateStr,
            balance,
            transactions: dayTransactions,
            isCurrentMonth: false
        });
    }

    return days;
};

// Helper function to get current date in user's timezone
export const getCurrentDateInUserTimezone = (timezone: string): string => {
    return getCurrentDateInTimezone(timezone);
};
