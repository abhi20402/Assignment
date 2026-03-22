# SOLUTION

## What I built
I implemented the marketplace backend and connected it to the existing UI and portfolio flows without changing the product's core behavior.

### Trading
- Enhanced `GET /api/trading/assets` with search, filtering, and sorting
- Added `GET /api/trading/assets/[id]` for asset detail, order book, recent trades, user position, and user orders
- Added `POST /api/trading/orders` to place buy and sell orders with validation
- Added `DELETE /api/trading/orders/[orderId]` to cancel open orders
- Added `GET /api/trading/portfolio` to return portfolio summary, positions, orders, and trades

### Portfolio integration
- Connected portfolio summary to `trading_balances` and `trading_holdings`
- Updated `CashBalance.tsx` to load real trading portfolio data
- Updated `InvestmentsSection.tsx` to show actual positions instead of old investment purchase records

### Transfers
- Updated deposit flow to increase trading cash balance
- Added withdrawal API and UI
- Added transfer history API and UI
- Updated banking balance endpoint to read from `trading_balances`

### Home page
- Added API-backed home data for hero, feature cards, and featured assets
- Updated CTA behavior to route authenticated users to portfolio and unauthenticated users to auth

### Trading pages
- Updated listing page to call `/api/trading/assets` with search, category, and sort params
- Updated detail page to call `/api/trading/assets/[id]`, `/api/trading/orders`, and `/api/trading/orders/[orderId]`

## Key technical decisions
- `trading_balances` is the source of truth for available cash
- `payments` remains the transfer ledger
- Buy validation checks cash balance minus reserved open buy orders
- Sell validation checks holdings minus reserved open sell orders
- Cash balance updates only when trades execute, not when orders are simply placed
- Existing matching engine and schema were reused instead of rewritten

## Trade-offs
- I kept the UI changes focused and lightweight so the backend flow is the main deliverable
- Open order reservation is computed dynamically instead of stored in a separate reservation table

## What I would improve next
- Add pagination for orders, trades, and transfer history
- Add better trade confirmations and toast notifications
- Add automated tests for order placement, cancellation, and execution edge cases
- Add live order book refresh and richer charting
