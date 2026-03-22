import db from '@/lib/db'
import secondaryTradingAssets from '@/data/secondaryTradingAssets.json'
import {
  buildSecondaryTradingDailyHistory,
  getSecondaryTradingSymbol,
  slugify,
} from '@/lib/investmentUtils'

export type TradingAsset = {
  id: string
  title: string
  category: string
  basePrice: number
  previousValue: number
  currentValue: number
  performancePercent: number
  isPositive: boolean
  volume?: string
  companyDescription?: string
  symbol?: string
  dailyHistory?: Array<Record<string, any>>
}

export function getAllTradingAssets(): TradingAsset[] {
  const dailyTemplate = (secondaryTradingAssets as any).templates?.dailyHistory || []

  return ((secondaryTradingAssets as any).investments || []).map((asset: TradingAsset) => ({
    ...asset,
    symbol: getSecondaryTradingSymbol(asset.title, asset.symbol),
    dailyHistory:
      asset.dailyHistory && asset.dailyHistory.length > 0
        ? asset.dailyHistory
        : buildSecondaryTradingDailyHistory(
            asset.basePrice || asset.currentValue || 1,
            asset.id || asset.title,
            dailyTemplate
          ),
  }))
}

export function getTradingAssetByIdOrSlug(idOrSlug: string): TradingAsset | null {
  const lookup = decodeURIComponent(idOrSlug || '').toLowerCase()
  if (!lookup) return null

  return (
    getAllTradingAssets().find((asset) => {
      const symbol = getSecondaryTradingSymbol(asset.title, asset.symbol).toLowerCase()
      return asset.id.toLowerCase() === lookup || slugify(asset.title) === lookup || symbol === lookup
    }) ?? null
  )
}

export function getAssetBySymbol(symbol: string): TradingAsset | null {
  const normalized = (symbol || '').toUpperCase()
  return (
    getAllTradingAssets().find(
      (asset) => getSecondaryTradingSymbol(asset.title, asset.symbol) === normalized
    ) ?? null
  )
}

export function ensureTradingBalance(userId: string) {
  const existing = db.prepare('SELECT * FROM trading_balances WHERE user_id = ?').get(userId) as any
  if (existing) return existing

  db.prepare(`
    INSERT INTO trading_balances (id, user_id, cash_balance, created_at, updated_at)
    VALUES (?, ?, ?, datetime('now'), datetime('now'))
  `).run(`bal_${userId}`, userId, 1000)

  return db.prepare('SELECT * FROM trading_balances WHERE user_id = ?').get(userId) as any
}

export function getTradingCashBalance(userId: string): number {
  const row = ensureTradingBalance(userId)
  return Number(row?.cash_balance || 0)
}

export function adjustTradingCashBalance(userId: string, delta: number) {
  ensureTradingBalance(userId)
  db.prepare(`
    UPDATE trading_balances
    SET cash_balance = cash_balance + ?, updated_at = datetime('now')
    WHERE user_id = ?
  `).run(delta, userId)
}

export function getHolding(userId: string, symbol: string) {
  return db.prepare('SELECT * FROM trading_holdings WHERE user_id = ? AND symbol = ?').get(userId, symbol) as any
}

export function getUserHoldings(userId: string) {
  return db.prepare(`
    SELECT * FROM trading_holdings
    WHERE user_id = ?
    ORDER BY updated_at DESC, symbol ASC
  `).all(userId) as any[]
}

export function getUserOrders(
  userId: string,
  filters?: { symbol?: string; status?: string; limit?: number }
) {
  let query = 'SELECT * FROM trading_orders WHERE user_id = ?'
  const params: any[] = [userId]

  if (filters?.symbol) {
    query += ' AND symbol = ?'
    params.push(filters.symbol)
  }

  if (filters?.status) {
    query += ' AND status = ?'
    params.push(filters.status)
  }

  query += ' ORDER BY datetime(created_at) DESC'

  if (filters?.limit) {
    query += ' LIMIT ?'
    params.push(filters.limit)
  }

  return db.prepare(query).all(...params) as any[]
}

export function getUserTrades(userId: string, filters?: { symbol?: string; limit?: number }) {
  let query = `
    SELECT t.*,
           CASE WHEN b.user_id = ? THEN 'buy' ELSE 'sell' END AS user_side
    FROM trading_trades t
    JOIN trading_orders b ON b.id = t.buy_order_id
    JOIN trading_orders s ON s.id = t.sell_order_id
    WHERE (b.user_id = ? OR s.user_id = ?)
  `
  const params: any[] = [userId, userId, userId]

  if (filters?.symbol) {
    query += ' AND t.symbol = ?'
    params.push(filters.symbol)
  }

  query += ' ORDER BY datetime(t.created_at) DESC'

  if (filters?.limit) {
    query += ' LIMIT ?'
    params.push(filters.limit)
  }

  return db.prepare(query).all(...params) as any[]
}

export function getLatestTrades(symbol: string, limit = 20) {
  return db.prepare(`
    SELECT * FROM trading_trades
    WHERE symbol = ?
    ORDER BY datetime(created_at) DESC
    LIMIT ?
  `).all(symbol, limit) as any[]
}

export function getOpenOrderBook(symbol: string) {
  const asks = db.prepare(`
    SELECT price, SUM(remaining_quantity) as quantity
    FROM trading_orders
    WHERE symbol = ?
      AND side = 'sell'
      AND status IN ('New','Pending','PartiallyFilled')
      AND remaining_quantity > 0
    GROUP BY price
    ORDER BY price ASC
    LIMIT 10
  `).all(symbol) as any[]

  const bids = db.prepare(`
    SELECT price, SUM(remaining_quantity) as quantity
    FROM trading_orders
    WHERE symbol = ?
      AND side = 'buy'
      AND status IN ('New','Pending','PartiallyFilled')
      AND remaining_quantity > 0
    GROUP BY price
    ORDER BY price DESC
    LIMIT 10
  `).all(symbol) as any[]

  // Always merge real orders with template to maintain a full book
  const asset = getAssetBySymbol(symbol)
  const template = (secondaryTradingAssets as any).templates?.orderBook
  
  let finalAsks = asks
  let finalBids = bids

  // If there are real orders, append template orders to fill the book
  if (asset && template) {
    const templateAsks = (template.asks || []).map((entry: any) => ({
      price: Number((entry.priceMultiplier * asset.basePrice).toFixed(2)),
      quantity: entry.size,
    }))
    const templateBids = (template.bids || []).map((entry: any) => ({
      price: Number((entry.priceMultiplier * asset.basePrice).toFixed(2)),
      quantity: entry.size,
    }))

    // Merge: add real orders + template orders, deduplicate by price
    if (asks.length > 0) {
      const realPrices = new Set(asks.map(a => a.price))
      finalAsks = [...asks, ...templateAsks.filter(t => !realPrices.has(t.price))].slice(0, 10)
    } else {
      finalAsks = templateAsks
    }

    if (bids.length > 0) {
      const realPrices = new Set(bids.map(b => b.price))
      finalBids = [...bids, ...templateBids.filter(t => !realPrices.has(t.price))].slice(0, 10)
    } else {
      finalBids = templateBids
    }
  }

  return { asks: finalAsks, bids: finalBids }
}

export function getReservedBuyAmount(userId: string): number {
  const row = db.prepare(`
    SELECT COALESCE(SUM(remaining_quantity * price), 0) AS reserved
    FROM trading_orders
    WHERE user_id = ?
      AND side = 'buy'
      AND status IN ('New','Pending','PartiallyFilled')
      AND remaining_quantity > 0
  `).get(userId) as any

  return Number(row?.reserved || 0)
}

export function getReservedSellShares(userId: string, symbol: string): number {
  const row = db.prepare(`
    SELECT COALESCE(SUM(remaining_quantity), 0) AS reserved
    FROM trading_orders
    WHERE user_id = ?
      AND symbol = ?
      AND side = 'sell'
      AND status IN ('New','Pending','PartiallyFilled')
      AND remaining_quantity > 0
  `).get(userId, symbol) as any

  return Number(row?.reserved || 0)
}

export function getPortfolioSummary(userId: string) {
  const cashBalance = getTradingCashBalance(userId)
  const holdings = getUserHoldings(userId)

  const positions = holdings.map((holding) => {
    const asset = getAssetBySymbol(holding.symbol)
    const currentPrice = Number(asset?.currentValue || holding.avg_cost)
    const marketValue = Number((holding.shares * currentPrice).toFixed(2))
    const costBasis = Number((holding.shares * Number(holding.avg_cost)).toFixed(2))
    const unrealizedPnl = Number((marketValue - costBasis).toFixed(2))

    return {
      ...holding,
      assetId: asset?.id ?? holding.symbol.toLowerCase(),
      assetTitle: asset?.title ?? holding.symbol,
      currentPrice,
      marketValue,
      costBasis,
      unrealizedPnl,
    }
  })

  const holdingsValue = positions.reduce((sum, item) => sum + item.marketValue, 0)
  const openOrders = getUserOrders(userId).filter((o) => ['New', 'Pending', 'PartiallyFilled'].includes(o.status))

  return {
    cashBalance: Number(cashBalance.toFixed(2)),
    holdingsValue: Number(holdingsValue.toFixed(2)),
    totalValue: Number((cashBalance + holdingsValue).toFixed(2)),
    positions,
    openOrders,
    recentOrders: getUserOrders(userId, { limit: 10 }),
    recentTrades: getUserTrades(userId, { limit: 10 }),
  }
}
