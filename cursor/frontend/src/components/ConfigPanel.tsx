import React, { useState, useEffect } from 'react';
import { AccountConfig } from '../types';
import { getAccountConfig, updateAccountConfig } from '../api';
import { Settings, Save, DollarSign, Calendar, Clock } from 'lucide-react';

interface ConfigPanelProps {
    onConfigChange: () => void;
}

// Common timezones for the dropdown
const TIMEZONES = [
    { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
    { value: 'America/Denver', label: 'Mountain Time (MT)' },
    { value: 'America/Chicago', label: 'Central Time (CT)' },
    { value: 'America/New_York', label: 'Eastern Time (ET)' },
    { value: 'America/Anchorage', label: 'Alaska Time (AKT)' },
    { value: 'Pacific/Honolulu', label: 'Hawaii Time (HT)' },
    { value: 'Europe/London', label: 'Greenwich Mean Time (GMT)' },
    { value: 'Europe/Paris', label: 'Central European Time (CET)' },
    { value: 'Europe/Berlin', label: 'Central European Time (CET)' },
    { value: 'Asia/Tokyo', label: 'Japan Standard Time (JST)' },
    { value: 'Asia/Shanghai', label: 'China Standard Time (CST)' },
    { value: 'Australia/Sydney', label: 'Australian Eastern Time (AET)' },
    { value: 'UTC', label: 'Coordinated Universal Time (UTC)' },
];

export const ConfigPanel: React.FC<ConfigPanelProps> = ({ onConfigChange }) => {
    const [config, setConfig] = useState<AccountConfig>({
        startingBalance: 0,
        startingDate: new Date().toISOString().split('T')[0],
        timezone: 'America/Los_Angeles',
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadConfig();
    }, []);

    const loadConfig = async () => {
        try {
            setLoading(true);
            const data = await getAccountConfig();
            setConfig(data);
        } catch (error) {
            console.error('Failed to load configuration:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            await updateAccountConfig(config);
            onConfigChange();
            window.alert('Configuration saved successfully!');
        } catch (error) {
            console.error('Failed to save configuration:', error);
            window.alert('Failed to save configuration');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-2 mb-6">
                <Settings className="h-5 w-5" />
                <h3 className="text-lg font-semibold">Account Configuration</h3>
            </div>

            <div className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4" />
                            Starting Balance
                        </div>
                    </label>
                    <input
                        type="number"
                        step="0.01"
                        value={config.startingBalance}
                        onChange={(e) => setConfig({ ...config, startingBalance: parseFloat(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="Enter starting balance"
                    />
                    <p className="mt-1 text-sm text-gray-500">
                        This is the balance your account starts with before any transactions.
                    </p>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            Starting Date
                        </div>
                    </label>
                    <input
                        type="date"
                        value={config.startingDate}
                        onChange={(e) => setConfig({ ...config, startingDate: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                    <p className="mt-1 text-sm text-gray-500">
                        This is the date from which your account balance calculations begin.
                    </p>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            Timezone
                        </div>
                    </label>
                    <select
                        value={config.timezone}
                        onChange={(e) => setConfig({ ...config, timezone: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                        {TIMEZONES.map((tz) => (
                            <option key={tz.value} value={tz.value}>
                                {tz.label}
                            </option>
                        ))}
                    </select>
                    <p className="mt-1 text-sm text-gray-500">
                        This timezone will be used for all date calculations and displays.
                    </p>
                </div>

                <div className="pt-4 border-t border-gray-200">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {saving ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        ) : (
                            <Save className="h-4 w-4" />
                        )}
                        {saving ? 'Saving...' : 'Save Configuration'}
                    </button>
                </div>
            </div>
        </div>
    );
};
