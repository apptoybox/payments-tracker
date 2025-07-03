/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// --- TYPE DEFINITIONS ---
interface Transaction {
    id: number;
    date: string; // YYYY-MM-DD
    name: string;
    amount: number; // positive for income, negative for expenses
    note: string;
}

interface AppState {
    startDate: string;
    startBalance: number;
    transactions: Transaction[];
    activeView: 'table' | 'chart' | 'calendar';
    chartRange: '1M' | '3M' | '1Y';
    calendarMonth: Date;
}

// --- PERSISTENCE ---
const STORAGE_KEY = 'paymentPlannerState';

function loadStateFromLocalStorage(): Partial<Pick<AppState, 'startDate' | 'startBalance' | 'transactions'>> | null {
    try {
        const savedStateJSON = localStorage.getItem(STORAGE_KEY);
        if (savedStateJSON) {
            // A simple validation to ensure the loaded data has the expected structure
            const parsed = JSON.parse(savedStateJSON);
            if (parsed.startDate && typeof parsed.startBalance === 'number' && Array.isArray(parsed.transactions)) {
                return parsed;
            }
        }
    } catch (error) {
        console.error("Could not load state from localStorage. Resetting data.", error);
        // If parsing fails, clear the corrupted data to avoid future errors.
        localStorage.removeItem(STORAGE_KEY);
    }
    return null;
}

function saveStateToLocalStorage(stateToSave: AppState) {
    try {
        const dataToPersist = {
            startDate: stateToSave.startDate,
            startBalance: stateToSave.startBalance,
            transactions: stateToSave.transactions,
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToPersist));
    } catch (error) {
        console.error("Could not save state to localStorage", error);
    }
}


// --- INITIAL STATE ---
const savedData = loadStateFromLocalStorage();

const twoWeeksFromNow = new Date();
twoWeeksFromNow.setDate(twoWeeksFromNow.getDate() + 14);
const nextMonth = new Date();
nextMonth.setMonth(nextMonth.getMonth() + 1);
nextMonth.setDate(1);

const defaultTransactions: Transaction[] = [
    { id: Date.now() + 1, date: new Date().toISOString().split('T')[0], name: 'Paycheck', amount: 2500, note: 'Bi-weekly salary' },
    { id: Date.now() + 2, date: nextMonth.toISOString().split('T')[0], name: 'Rent', amount: -1800, note: 'Monthly rent' },
    { id: Date.now() + 3, date: new Date().toISOString().split('T')[0], name: 'Groceries', amount: -150, note: 'Weekly shopping' },
    { id: Date.now() + 4, date: new Date(new Date().setDate(10)).toISOString().split('T')[0], name: 'Streaming Service', amount: -15.99, note: 'Monthly subscription' },
    { id: Date.now() + 5, date: twoWeeksFromNow.toISOString().split('T')[0], name: 'Paycheck', amount: 2500, note: 'Bi-weekly salary' },
    { id: Date.now() + 6, date: new Date(new Date().setDate(15)).toISOString().split('T')[0], name: 'Car Payment', amount: -350, note: '' },
];


const state: AppState = {
    startDate: savedData?.startDate || new Date().toISOString().split('T')[0],
    startBalance: savedData?.startBalance ?? 5000,
    transactions: savedData?.transactions || defaultTransactions,
    activeView: 'table',
    chartRange: '1M',
    calendarMonth: new Date(),
};

// --- DOM & UTILITY HELPERS ---
const app = document.getElementById('app')!;
const CURRENCY_FORMATTER = new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' });

function formatCurrency(value: number) {
    return CURRENCY_FORMATTER.format(value);
}

// --- STATE MANAGEMENT ---
function setState(newState: Partial<AppState>) {
    Object.assign(state, newState);
    // After any state change, render the app and save the new state.
    renderApp();
    saveStateToLocalStorage(state);
}

// --- CORE LOGIC: BALANCE CALCULATION ---
function calculateProjectedBalances() {
    const dailyData = new Map<string, { balance: number; transactions: Transaction[] }>();
    const transactionsByDate = new Map<string, Transaction[]>();

    [...state.transactions]
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .forEach(t => {
            const dateKey = t.date;
            if (!transactionsByDate.has(dateKey)) transactionsByDate.set(dateKey, []);
            transactionsByDate.get(dateKey)!.push(t);
        });

    const oneYearFromNow = new Date();
    oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);

    let currentDate = new Date(state.startDate + 'T00:00:00');
    let currentBalance = state.startBalance;

    while (currentDate <= oneYearFromNow) {
        const dateKey = currentDate.toISOString().split('T')[0];
        const todaysTransactions = transactionsByDate.get(dateKey) || [];

        let eodBalance = currentBalance;
        if (todaysTransactions.length > 0) {
            eodBalance = todaysTransactions.reduce((bal, trans) => bal + trans.amount, currentBalance);
        }

        dailyData.set(dateKey, { balance: eodBalance, transactions: todaysTransactions });
        currentBalance = eodBalance;
        currentDate.setDate(currentDate.getDate() + 1);
    }
    return dailyData;
}


// --- EVENT HANDLERS ---
function handleAddTransaction(event: Event) {
    event.preventDefault();
    const form = event.target as HTMLFormElement;
    const formData = new FormData(form);
    const date = formData.get('date') as string;
    const name = formData.get('name') as string;
    const amount = parseFloat(formData.get('amount') as string);
    const note = formData.get('note') as string;

    if (!date || !name || isNaN(amount)) {
        alert('Please fill in Date, Name, and a valid Amount.');
        return;
    }

    const newTransaction: Transaction = { id: Date.now(), date, name, amount, note };
    setState({ transactions: [...state.transactions, newTransaction] });
    form.reset();
}

function handleDeleteTransaction(id: number) {
    if (confirm('Are you sure you want to delete this transaction?')) {
        setState({ transactions: state.transactions.filter(t => t.id !== id) });
    }
}

// --- RENDER FUNCTIONS ---

function renderConfigPanel() {
    return `
        <div class="config-panel">
            <div class="config-field">
                <label for="start-date">Start Date</label>
                <input type="date" id="start-date" value="${state.startDate}">
            </div>
            <div class="config-field">
                <label for="start-balance">Start Balance</label>
                <input type="number" id="start-balance" step="100" value="${state.startBalance}">
            </div>
        </div>
    `;
}

function renderTabs() {
    const views: AppState['activeView'][] = ['table', 'chart', 'calendar'];
    return `
        <div class="tabs">
            ${views.map(view => `
                <button class="tab ${state.activeView === view ? 'active' : ''}" data-view="${view}">
                    ${view.charAt(0).toUpperCase() + view.slice(1)}
                </button>
            `).join('')}
        </div>
    `;
}

function renderTransactionView() {
    const sortedTransactions = [...state.transactions].sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return `
        <div class="transaction-view">
            <h2>Transactions</h2>
            <div class="transaction-table-wrapper">
                <table class="transaction-table">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Name</th>
                            <th>Amount</th>
                            <th>Note</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        ${sortedTransactions.map(t => `
                            <tr>
                                <td>${t.date}</td>
                                <td>${t.name}</td>
                                <td class="${t.amount >= 0 ? 'amount-income' : 'amount-expense'}">${formatCurrency(t.amount)}</td>
                                <td>${t.note}</td>
                                <td><button class="delete-btn" data-id="${t.id}">Delete</button></td>
                            </tr>
                        `).join('')}
                         ${sortedTransactions.length === 0 ? '<tr><td colspan="5" style="text-align:center; color: var(--text-muted);">No transactions yet.</td></tr>' : ''}
                    </tbody>
                </table>
            </div>
            <h2>Add New Transaction</h2>
            <form class="add-transaction-form">
                <div class="form-group">
                    <label for="new-date">Date</label>
                    <input type="date" id="new-date" name="date" required value="${new Date().toISOString().split('T')[0]}">
                </div>
                <div class="form-group">
                    <label for="new-name">Name</label>
                    <input type="text" id="new-name" name="name" required placeholder="e.g., Rent, Salary">
                </div>
                 <div class="form-group">
                    <label for="new-amount">Amount</label>
                    <input type="number" id="new-amount" name="amount" required step="0.01" placeholder="e.g., -1200 or 2500">
                </div>
                 <div class="form-group">
                    <label for="new-note">Note</label>
                    <input type="text" id="new-note" name="note" placeholder="Optional comment">
                </div>
                <button type="submit">Add</button>
            </form>
        </div>
    `;
}

function renderChartView(projectedBalances: Map<string, any>) {
    const endDate = new Date(state.startDate);
    if(state.chartRange === '1M') endDate.setMonth(endDate.getMonth() + 1);
    if(state.chartRange === '3M') endDate.setMonth(endDate.getMonth() + 3);
    if(state.chartRange === '1Y') endDate.setFullYear(endDate.getFullYear() + 1);

    const dataPoints: {date: Date, balance: number}[] = [];
    let currentDate = new Date(state.startDate);
    while(currentDate <= endDate) {
        const dateKey = currentDate.toISOString().split('T')[0];
        const dayData = projectedBalances.get(dateKey);
        if (dayData) {
            dataPoints.push({date: new Date(currentDate), balance: dayData.balance});
        }
        currentDate.setDate(currentDate.getDate() + 1);
    }

    if (dataPoints.length < 2) return '<div class="chart-view"><p>Not enough data to display chart.</p></div>';

    const padding = { top: 20, right: 30, bottom: 40, left: 60 };
    const width = 800;
    const height = 350;

    const minBalance = Math.min(...dataPoints.map(d => d.balance), 0);
    const maxBalance = Math.max(...dataPoints.map(d => d.balance));
    const yDomain = [Math.floor(minBalance/1000)*1000, Math.ceil(maxBalance/1000)*1000];
    const xDomain = [dataPoints[0].date, dataPoints[dataPoints.length - 1].date];
    
    const yScale = (val: number) => height - padding.bottom - ((val - yDomain[0]) / (yDomain[1] - yDomain[0])) * (height - padding.top - padding.bottom);
    const xScale = (date: Date) => padding.left + ((date.getTime() - xDomain[0].getTime()) / (xDomain[1].getTime() - xDomain[0].getTime())) * (width - padding.left - padding.right);

    const pathData = dataPoints.map(d => `${xScale(d.date)},${yScale(d.balance)}`).join(' L ');
    
    // Y-axis gridlines and labels
    const yAxisTicks = 5;
    let yAxisHtml = '';
    for (let i = 0; i <= yAxisTicks; i++) {
        const value = yDomain[0] + (i/yAxisTicks) * (yDomain[1] - yDomain[0]);
        const y = yScale(value);
        yAxisHtml += `<line class="grid-line" x1="${padding.left}" y1="${y}" x2="${width - padding.right}" y2="${y}"></line>`;
        yAxisHtml += `<text class="axis-text" x="${padding.left - 10}" y="${y+3}" text-anchor="end">${formatCurrency(value)}</text>`;
    }
    
    // X-axis gridlines and labels
    const xAxisTicks = Math.min(dataPoints.length, 6);
    let xAxisHtml = '';
    for(let i=0; i<xAxisTicks; i++) {
        const index = Math.floor(i * (dataPoints.length -1) / (xAxisTicks-1));
        const date = dataPoints[index].date;
        const x = xScale(date);
        xAxisHtml += `<text class="axis-text" x="${x}" y="${height - padding.bottom + 20}" text-anchor="middle">${date.toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}</text>`
    }

    const zeroLineY = yScale(0);

    // Add vertical line for today's date
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let todayLineHtml = '';
    if (today >= xDomain[0] && today <= xDomain[1]) {
        const todayX = xScale(today);
        todayLineHtml = `<line class="current-date-line" x1="${todayX}" y1="${padding.top}" x2="${todayX}" y2="${height - padding.bottom}"></line>`;
    }

    return `
        <div class="chart-view">
            <div class="chart-controls">
                ${['1M', '3M', '1Y'].map(range => `
                    <button class="${state.chartRange === range ? 'active' : ''}" data-range="${range}">${range}</button>
                `).join('')}
            </div>
            <div class="chart-container">
                <svg viewBox="0 0 ${width} ${height}" preserveAspectRatio="xMidYMid meet">
                    ${yAxisHtml}
                    ${xAxisHtml}
                    <line class="axis-line" x1="${padding.left}" y1="${padding.top}" x2="${padding.left}" y2="${height - padding.bottom}"></line>
                    <line class="axis-line" x1="${padding.left}" y1="${height - padding.bottom}" x2="${width - padding.right}" y2="${height - padding.bottom}"></line>
                    ${todayLineHtml}
                    ${(yDomain[0] < 0 && yDomain[1] > 0) ? `<line class="zero-line" x1="${padding.left}" y1="${zeroLineY}" x2="${width - padding.right}" y2="${zeroLineY}"></line>` : ''}
                    <path class="balance-line" d="M ${pathData}"></path>
                </svg>
            </div>
        </div>
    `;
}

function renderCalendarView(projectedBalances: Map<string, any>) {
    const month = state.calendarMonth.getMonth();
    const year = state.calendarMonth.getFullYear();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let daysHtml = '';
    
    // Pad start of month
    for (let i = 0; i < startDayOfWeek; i++) {
        daysHtml += `<div class="calendar-day other-month"></div>`;
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
        const currentDate = new Date(year, month, day);
        const dateKey = currentDate.toISOString().split('T')[0];
        const dayData = projectedBalances.get(dateKey);
        
        const isToday = currentDate.getTime() === today.getTime();
        const dayClasses = ['calendar-day'];
        if (isToday) dayClasses.push('is-today');

        const transactionsHtml = (dayData?.transactions || [])
            .map((t: Transaction) => `<li class="${t.amount >= 0 ? 'income' : 'expense'}" title="${t.name}: ${formatCurrency(t.amount)}">${t.name}</li>`)
            .join('');

        daysHtml += `
            <div class="${dayClasses.join(' ')}">
                <div class="day-number">${day}</div>
                <div class="day-balance">${dayData ? formatCurrency(dayData.balance) : ''}</div>
                <ul class="day-transactions">${transactionsHtml}</ul>
            </div>
        `;
    }
    
    const totalCells = startDayOfWeek + daysInMonth;
    const remainingCells = 7 - (totalCells % 7);
    if(remainingCells < 7) {
        for(let i=0; i<remainingCells; i++) {
            daysHtml += `<div class="calendar-day other-month"></div>`;
        }
    }


    return `
        <div class="calendar-view">
            <div class="calendar-header">
                <div class="calendar-nav">
                    <button id="prev-month">‹</button>
                </div>
                <h2>${state.calendarMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}</h2>
                <div class="calendar-nav">
                     <button id="next-month">›</button>
                </div>
            </div>
            <div class="calendar-grid">
                ${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => `<div class="calendar-day-header">${d}</div>`).join('')}
                ${daysHtml}
            </div>
        </div>
    `;
}

function renderContent(projectedBalances: Map<string, any>) {
    switch (state.activeView) {
        case 'table': return renderTransactionView();
        case 'chart': return renderChartView(projectedBalances);
        case 'calendar': return renderCalendarView(projectedBalances);
        default: return `<div>Error</div>`;
    }
}

function renderApp() {
    // We only need to calculate the balances when rendering, not on every state change.
    const projectedBalances = calculateProjectedBalances();
    const html = `
        <h1>Payment Planner</h1>
        ${renderConfigPanel()}
        ${renderTabs()}
        <main class="content">
            ${renderContent(projectedBalances)}
        </main>
    `;
    app.innerHTML = html;
    addEventListeners();
}

function addEventListeners() {
    // Config
    document.getElementById('start-date')?.addEventListener('change', e => setState({ startDate: (e.target as HTMLInputElement).value }));
    document.getElementById('start-balance')?.addEventListener('change', e => setState({ startBalance: parseFloat((e.target as HTMLInputElement).value) }));

    // Tabs
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', e => {
            const view = (e.currentTarget as HTMLElement).dataset.view as AppState['activeView'];
            // UI state changes don't need to be persisted, so we can call renderApp directly
            // However, using setState is fine as it ensures consistency. For this app, the overhead is negligible.
            state.activeView = view;
            renderApp();
        });
    });
    
    // View-specific listeners
    if(state.activeView === 'table') {
        document.querySelector('.add-transaction-form')?.addEventListener('submit', handleAddTransaction);
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', e => {
                const id = parseInt((e.currentTarget as HTMLElement).dataset.id!);
                handleDeleteTransaction(id);
            });
        });
    }

    if(state.activeView === 'chart') {
        document.querySelectorAll('.chart-controls button').forEach(btn => {
            btn.addEventListener('click', e => {
                const range = (e.currentTarget as HTMLElement).dataset.range as AppState['chartRange'];
                state.chartRange = range;
                renderApp();
            });
        });
    }
    
    if(state.activeView === 'calendar') {
        document.getElementById('prev-month')?.addEventListener('click', () => {
            const newMonth = new Date(state.calendarMonth);
            newMonth.setMonth(newMonth.getMonth() - 1);
            state.calendarMonth = newMonth;
            renderApp();
        });
        document.getElementById('next-month')?.addEventListener('click', () => {
             const newMonth = new Date(state.calendarMonth);
            newMonth.setMonth(newMonth.getMonth() + 1);
            state.calendarMonth = newMonth;
            renderApp();
        });
    }
}

// Initial Render
renderApp();
