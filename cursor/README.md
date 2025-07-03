# Account Tracker - Recurring Payments Management

A comprehensive web application for planning and monitoring recurring payments from a checking account. Built with React, TypeScript, and Node.js.

## Features

### 1. Spreadsheet Interface

- Add, edit, and delete transactions
- Support for recurring payments with configurable patterns (daily, weekly, monthly, yearly)
- Real-time editing with inline form controls
- Transaction details: Date, Name, Amount, Notes, Recurring status

### 2. Chart View

- Interactive balance history chart with multiple time ranges (1 month, 3 months, 6 months, 1 year)
- Balance trend visualization with hover tooltips
- Optional transaction activity bars
- Summary cards showing starting balance, current balance, and net change

### 3. Calendar View

- Traditional calendar grid showing daily account balances
- Transaction indicators on each day
- Monthly navigation with previous/next month controls
- Monthly summary statistics
- Color-coded transaction types (income/expense)

### 4. Configuration Panel

- Set starting account balance
- Configure starting date for calculations
- Real-time updates across all views

## Technology Stack

### Backend

- **Node.js** with Express
- **TypeScript** for type safety
- **In-memory data store** (can be easily replaced with a database)

### Frontend

- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **Recharts** for data visualization
- **Lucide React** for icons
- **date-fns** for date manipulation

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd account-tracker
   ```

2. **Install all dependencies**

   ```bash
   npm run install-all
   ```

3. **Start the development servers**

   ```bash
   npm run dev
   ```

This will start both the backend server (port 3001) and frontend development server (port 3000).

### Manual Installation

If you prefer to install dependencies separately:

**Backend:**

```bash
cd backend
npm install
npm run dev
```

**Frontend:**

```bash
cd frontend
npm install
npm start
```

## Usage

1. **Configure your account** - Click the "Configuration" button in the header to set your starting balance and date.

2. **Add transactions** - Use the Spreadsheet view to add your recurring and one-time transactions.

3. **Monitor your balance** - Switch to the Chart view to see your account balance over time.

4. **Calendar planning** - Use the Calendar view to see your daily balances and upcoming transactions.

## API Endpoints

### Transactions

- `GET /api/transactions` - Get all transactions
- `POST /api/transactions` - Add new transaction
- `PUT /api/transactions/:id` - Update transaction
- `DELETE /api/transactions/:id` - Delete transaction

### Configuration

- `GET /api/config` - Get account configuration
- `PUT /api/config` - Update account configuration

### Data Views

- `GET /api/balance-history?startDate=&endDate=` - Get balance history for charts
- `GET /api/calendar?year=&month=` - Get calendar data
- `GET /api/projected-transactions?startDate=&endDate=` - Get projected recurring transactions

## Project Structure

```
account-tracker/
├── backend/
│   ├── src/
│   │   ├── index.ts          # Express server
│   │   ├── types.ts          # TypeScript interfaces
│   │   ├── data.ts           # Data store
│   │   └── utils.ts          # Utility functions
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── SpreadsheetView.tsx
│   │   │   ├── ChartView.tsx
│   │   │   ├── CalendarView.tsx
│   │   │   └── ConfigPanel.tsx
│   │   ├── App.tsx
│   │   ├── index.tsx
│   │   ├── api.ts
│   │   ├── types.ts
│   │   └── index.css
│   ├── public/
│   ├── package.json
│   └── tsconfig.json
├── package.json
└── README.md
```

## Sample Data

The application comes with sample data including:

- Monthly rent payment ($1,200)
- Monthly salary ($3,000)
- Netflix subscription ($15.99)

## Customization

### Adding a Database

Replace the in-memory data store in `backend/src/data.ts` with your preferred database:

- PostgreSQL with Prisma
- MongoDB with Mongoose
- SQLite with better-sqlite3

### Styling

The application uses Tailwind CSS. Customize the design by modifying:

- `frontend/tailwind.config.js` for theme configuration
- `frontend/src/index.css` for custom styles

### Adding New Features

- New transaction types
- Export functionality
- Budget categories
- Multiple accounts
- Transaction search and filtering

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

For issues and questions, please open an issue on the GitHub repository.
