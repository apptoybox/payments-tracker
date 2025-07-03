import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import {
    getTransactions,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    getAccountConfig,
    updateAccountConfig
} from './data';
import {
    generateRecurringTransactions,
    generateBalanceHistory,
    generateCalendarData
} from './utils';
import { db } from './database';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());

// API Routes

// Get all transactions
app.get('/api/transactions', async (req, res) => {
    try {
        const transactions = await getTransactions();
        res.json(transactions);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch transactions' });
    }
});

// Add new transaction
app.post('/api/transactions', async (req, res) => {
    try {
        const transaction = await addTransaction(req.body);
        res.status(201).json(transaction);
    } catch (error) {
        res.status(400).json({ error: 'Failed to add transaction' });
    }
});

// Update transaction
app.put('/api/transactions/:id', async (req, res) => {
    try {
        const transaction = await updateTransaction(req.params.id, req.body);
        if (!transaction) {
            return res.status(404).json({ error: 'Transaction not found' });
        }
        res.json(transaction);
    } catch (error) {
        res.status(400).json({ error: 'Failed to update transaction' });
    }
});

// Delete transaction
app.delete('/api/transactions/:id', async (req, res) => {
    try {
        const success = await deleteTransaction(req.params.id);
        if (!success) {
            return res.status(404).json({ error: 'Transaction not found' });
        }
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete transaction' });
    }
});

// Get account configuration
app.get('/api/config', async (req, res) => {
    try {
        const config = await getAccountConfig();
        res.json(config);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch configuration' });
    }
});

// Update account configuration
app.put('/api/config', async (req, res) => {
    try {
        const config = await updateAccountConfig(req.body);
        res.json(config);
    } catch (error) {
        res.status(400).json({ error: 'Failed to update configuration' });
    }
});

// Get balance history for chart
app.get('/api/balance-history', async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        if (!startDate || !endDate) {
            return res.status(400).json({ error: 'startDate and endDate are required' });
        }

        const transactions = await getTransactions();
        const config = await getAccountConfig();
        const balanceHistory = generateBalanceHistory(
            transactions,
            config,
            startDate as string,
            endDate as string
        );

        res.json(balanceHistory);
    } catch (error) {
        res.status(500).json({ error: 'Failed to generate balance history' });
    }
});

// Get calendar data
app.get('/api/calendar', async (req, res) => {
    try {
        const { year, month } = req.query;
        if (!year || !month) {
            return res.status(400).json({ error: 'year and month are required' });
        }

        const transactions = await getTransactions();
        const config = await getAccountConfig();
        const calendarData = generateCalendarData(
            transactions,
            config,
            parseInt(year as string),
            parseInt(month as string)
        );

        res.json(calendarData);
    } catch (error) {
        res.status(500).json({ error: 'Failed to generate calendar data' });
    }
});

// Get projected transactions for a date range
app.get('/api/projected-transactions', async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        if (!startDate || !endDate) {
            return res.status(400).json({ error: 'startDate and endDate are required' });
        }

        const baseTransactions = await getTransactions();
        const projectedTransactions = generateRecurringTransactions(
            baseTransactions,
            startDate as string,
            endDate as string
        );

        res.json(projectedTransactions);
    } catch (error) {
        res.status(500).json({ error: 'Failed to generate projected transactions' });
    }
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/api/health`);
    console.log(`Database: SQLite file created at backend/data/account-tracker.db`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\nReceived SIGINT. Closing server and database...');
    server.close(() => {
        db.close();
        console.log('Server and database closed.');
        process.exit(0);
    });
});

process.on('SIGTERM', () => {
    console.log('\nReceived SIGTERM. Closing server and database...');
    server.close(() => {
        db.close();
        console.log('Server and database closed.');
        process.exit(0);
    });
});
