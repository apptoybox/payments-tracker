import React, { useState } from 'react';
import { SpreadsheetView } from './components/SpreadsheetView';
import { ChartView } from './components/ChartView';
import { CalendarView } from './components/CalendarView';
import { ConfigPanel } from './components/ConfigPanel';
import { ViewType } from './types';
import { Table, BarChart3, Calendar, Settings } from 'lucide-react';

function App() {
    const [currentView, setCurrentView] = useState<ViewType>('spreadsheet');
    const [showConfig, setShowConfig] = useState(false);

    const handleTransactionChange = () => {
        // This will trigger a refresh of data in other views
        console.log('Transaction changed, refreshing views...');
    };

    const handleConfigChange = () => {
        // This will trigger a refresh of data in other views
        console.log('Configuration changed, refreshing views...');
    };

    const renderView = () => {
        switch (currentView) {
            case 'spreadsheet':
                return <SpreadsheetView onTransactionChange={handleTransactionChange} />;
            case 'chart':
                return <ChartView onTransactionChange={handleTransactionChange} />;
            case 'calendar':
                return <CalendarView onTransactionChange={handleTransactionChange} />;
            default:
                return <SpreadsheetView onTransactionChange={handleTransactionChange} />;
        }
    };

    const getViewIcon = (view: ViewType) => {
        switch (view) {
            case 'spreadsheet':
                return <Table className="h-5 w-5" />;
            case 'chart':
                return <BarChart3 className="h-5 w-5" />;
            case 'calendar':
                return <Calendar className="h-5 w-5" />;
            default:
                return <Table className="h-5 w-5" />;
        }
    };

    const getViewName = (view: ViewType) => {
        switch (view) {
            case 'spreadsheet':
                return 'Spreadsheet';
            case 'chart':
                return 'Chart';
            case 'calendar':
                return 'Calendar';
            default:
                return 'Spreadsheet';
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow-sm border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center">
                            <h1 className="text-xl font-semibold text-gray-900">Account Tracker</h1>
                        </div>
                        <button
                            onClick={() => setShowConfig(!showConfig)}
                            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
                        >
                            <Settings className="h-4 w-4" />
                            Configuration
                        </button>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Main Content */}
                    <div className="flex-1">
                        {/* Navigation Tabs */}
                        <div className="mb-6">
                            <nav className="flex space-x-1 bg-white rounded-lg shadow p-1">
                                {(['spreadsheet', 'chart', 'calendar'] as ViewType[]).map((view) => (
                                    <button
                                        key={view}
                                        onClick={() => setCurrentView(view)}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${currentView === view
                                            ? 'bg-primary-600 text-white'
                                            : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                                            }`}
                                    >
                                        {getViewIcon(view)}
                                        {getViewName(view)}
                                    </button>
                                ))}
                            </nav>
                        </div>

                        {/* View Content */}
                        {renderView()}
                    </div>

                    {/* Configuration Sidebar */}
                    {showConfig && (
                        <div className="lg:w-80">
                            <ConfigPanel onConfigChange={handleConfigChange} />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default App;
