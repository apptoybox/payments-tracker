# Payments Tracker

An application to track recurring payments  and account balances and with chart and calendar visualizations.

## Initial Prompt

I'd like to make an application that allows me to plan and monitor recurring payments from a checking account.

The application should provide three interfaces:

1. A spreadsheet-like interface where I can enter the transaction details including:

	- Date
	- Transaction/Item Name
	- Amount
	- Note/Comment

2. A chart that shows the account balance over time, perhaps with lenses to view by 1 month, three month, and year.

3. A calendar view that shows a traditional calendar grid for each month each day showing the account balance and any transactions taking place on that day.

The application should allow for a configuration that sets the starting day and balance used for transactions that follow.

## Second Prompt

1. On the Chart view, please display a vertical line that shows the current date
2. On the Calendar view, please use a different background color for the cell that represents the current date.

## Cursor

It seems like the calendar dates are off a little bit.  Please update the configuration to allow a time zone to be selected, defaulting to `America/Los_Angeles`.  Apply the selected timezone to the calendar so the dates for the user's location are displayed.

## Third Prompt

Please explain how user data is persisted. Can the application be updated to persist user data between restarts, perhaps using sqlite?

- **Gemini** proposed and used localStorage
- **Cursor** accepted the sqlite suggestion and updated the application

## Fourth Prompt

> Cursor "Let me know if you want to add backup, import/export, or multi-user support!"

Yes, lets continue with import/export.



