import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, ReferenceLine } from 'recharts';
import { ChartDataPoint, AccountConfig } from '../types';
import { getBalanceHistory, getAccountConfig } from '../api';
import { format, subMonths, subDays, startOfDay, endOfDay } from 'date-fns';
import { TrendingUp, Calendar, DollarSign } from 'lucide-react';

interface ChartViewProps {
    onTransactionChange: () => void;
}

type TimeRange = '1month' | '3months' | '6months' | '1year';

export const ChartView: React.FC<ChartViewProps> = ({ onTransactionChange }) => {
    const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
    const [loading, setLoading] = useState(true);
    const [timeRange, setTimeRange] = useState<TimeRange>('3months');
    const [showTransactions, setShowTransactions] = useState(false);
    const [userConfig, setUserConfig] = useState<AccountConfig | null>(null);

    useEffect(() => {
        loadUserConfig();
    }, []);

    useEffect(() => {
        if (userConfig) {
            loadChartData();
        }
    }, [timeRange, userConfig]);

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

    const loadChartData = async () => {
        if (!userConfig) return;

        try {
            setLoading(true);
            const endDate = format(new Date(), 'yyyy-MM-dd');
            let startDate: string;

            switch (timeRange) {
                case '1month':
                    startDate = format(subMonths(new Date(), 1), 'yyyy-MM-dd');
                    break;
                case '3months':
                    startDate = format(subMonths(new Date(), 3), 'yyyy-MM-dd');
                    break;
                case '6months':
                    startDate = format(subMonths(new Date(), 6), 'yyyy-MM-dd');
                    break;
                case '1year':
                    startDate = format(subMonths(new Date(), 12), 'yyyy-MM-dd');
                    break;
                default:
                    startDate = format(subMonths(new Date(), 3), 'yyyy-MM-dd');
            }

            const data = await getBalanceHistory(startDate, endDate);
            setChartData(data);
        } catch (error) {
            console.error('Failed to load chart data:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(value);
    };

    const formatDate = (dateStr: string) => {
        return format(new Date(dateStr), 'MMM dd');
    };

    // Get current date in user's timezone
    const getCurrentDateInUserTimezone = (): string => {
        if (!userConfig) return format(new Date(), 'yyyy-MM-dd');

        const now = new Date();
        const userTime = new Date(now.toLocaleString("en-US", { timeZone: userConfig.timezone }));
        return format(userTime, 'yyyy-MM-dd');
    };

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
                    <p className="font-semibold text-gray-900">{format(new Date(label), 'MMM dd, yyyy')}</p>
                    <p className="text-gray-600">
                        Balance: <span className="font-semibold">{formatCurrency(data.balance)}</span>
                    </p>
                    {data.transactions && data.transactions.length > 0 && (
                        <div className="mt-2">
                            <p className="text-sm font-medium text-gray-700">Transactions:</p>
                            <div className="max-h-32 overflow-y-auto">
                                {data.transactions.map((t: any, index: number) => (
                                    <div key={index} className="text-xs text-gray-600 mt-1">
                                        <span className={t.amount >= 0 ? 'text-green-600' : 'text-red-600'}>
                                            {formatCurrency(t.amount)}
                                        </span>
                                        {' - '}
                                        {t.name}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            );
        }
        return null;
    };

    const getChartTitle = () => {
        switch (timeRange) {
            case '1month':
                return 'Last Month';
            case '3months':
                return 'Last 3 Months';
            case '6months':
                return 'Last 6 Months';
            case '1year':
                return 'Last Year';
            default:
                return 'Account Balance';
        }
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
            {/* Chart Controls */}
            <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                        <TrendingUp className="h-5 w-5" />
                        {getChartTitle()}
                    </h3>
                    <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                checked={showTransactions}
                                onChange={(e) => setShowTransactions(e.target.checked)}
                                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                            />
                            <span className="text-sm">Show Transactions</span>
                        </label>
                    </div>
                </div>

                {/* Time Range Selector */}
                <div className="flex gap-2 mb-4">
                    {(['1month', '3months', '6months', '1year'] as TimeRange[]).map((range) => (
                        <button
                            key={range}
                            onClick={() => setTimeRange(range)}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${timeRange === range
                                    ? 'bg-primary-600 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            {range === '1month' && '1 Month'}
                            {range === '3months' && '3 Months'}
                            {range === '6months' && '6 Months'}
                            {range === '1year' && '1 Year'}
                        </button>
                    ))}
                </div>

                {/* Balance Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center gap-2 text-gray-600">
                            <DollarSign className="h-4 w-4" />
                            <span className="text-sm font-medium">Starting Balance</span>
                        </div>
                        <p className="text-2xl font-bold text-gray-900">
                            {chartData.length > 0 ? formatCurrency(chartData[0].balance) : '$0'}
                        </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center gap-2 text-gray-600">
                            <DollarSign className="h-4 w-4" />
                            <span className="text-sm font-medium">Current Balance</span>
                        </div>
                        <p className="text-2xl font-bold text-gray-900">
                            {chartData.length > 0 ? formatCurrency(chartData[chartData.length - 1].balance) : '$0'}
                        </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center gap-2 text-gray-600">
                            <TrendingUp className="h-4 w-4" />
                            <span className="text-sm font-medium">Net Change</span>
                        </div>
                        <p className={`text-2xl font-bold ${chartData.length > 1
                                ? chartData[chartData.length - 1].balance - chartData[0].balance >= 0
                                    ? 'text-green-600'
                                    : 'text-red-600'
                                : 'text-gray-900'
                            }`}>
                            {chartData.length > 1
                                ? formatCurrency(chartData[chartData.length - 1].balance - chartData[0].balance)
                                : '$0'
                            }
                        </p>
                    </div>
                </div>

                {/* Chart */}
                <div className="h-96">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis
                                dataKey="date"
                                tickFormatter={formatDate}
                                stroke="#6b7280"
                                fontSize={12}
                            />
                            <YAxis
                                tickFormatter={formatCurrency}
                                stroke="#6b7280"
                                fontSize={12}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Line
                                type="monotone"
                                dataKey="balance"
                                stroke="#3b82f6"
                                strokeWidth={3}
                                dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                                activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2 }}
                            />
                            <ReferenceLine
                                x={getCurrentDateInUserTimezone()}
                                stroke="#ef4444"
                                strokeDasharray="3 3"
                                strokeWidth={2}
                                label={{
                                    value: "Today",
                                    position: "top",
                                    fill: "#ef4444",
                                    fontSize: 12,
                                    fontWeight: "bold"
                                }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                {/* Transaction Bars (if enabled) */}
                {showTransactions && (
                    <div className="mt-8">
                        <h4 className="text-lg font-semibold mb-4">Daily Transaction Activity</h4>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                    <XAxis
                                        dataKey="date"
                                        tickFormatter={formatDate}
                                        stroke="#6b7280"
                                        fontSize={12}
                                    />
                                    <YAxis
                                        stroke="#6b7280"
                                        fontSize={12}
                                    />
                                    <Tooltip
                                        content={({ active, payload, label }) => {
                                            if (active && payload && payload.length) {
                                                const data = payload[0].payload;
                                                return (
                                                    <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
                                                        <p className="font-semibold text-gray-900">{format(new Date(label), 'MMM dd, yyyy')}</p>
                                                        <p className="text-gray-600">
                                                            Transactions: <span className="font-semibold">{data.transactions?.length || 0}</span>
                                                        </p>
                                                    </div>
                                                );
                                            }
                                            return null;
                                        }}
                                    />
                                    <Bar
                                        dataKey={(data) => data.transactions?.length || 0}
                                        fill="#10b981"
                                        radius={[2, 2, 0, 0]}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
