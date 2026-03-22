import crypto from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'
import { getAuthUserId } from '@/lib/auth'
import { matchOrder } from '@/lib/matchingEngine'
import {
  getAssetBySymbol,
  getHolding,
  getPortfolioSummary,
  getReservedBuyAmount,
  getReservedSellShares,
  getTradingCashBalance,
  getUserTrades,
} from '@/lib/trading'

export const dynamic = 'force-dynamic'

function validateTimeInForce(timeInForce: string, goodTilDate?: string) {
  if (!['day', 'gtd', 'gtc'].includes(timeInForce)) return 'Invalid time in force'
  if (timeInForce === 'gtd' && !goodTilDate) return 'goodTilDate is required for GTD orders'
  return null
}

export async function GET(request: NextRequest) {
  const userId = await getAuthUserId(request)
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const historyLimit = Number(searchParams.get('historyLimit') || 10)

  return NextResponse.json(getPortfolioSummary(userId, { historyLimit }))
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthUserId(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const symbol = String(body.symbol || '').toUpperCase()
    const side = String(body.side || '').toLowerCase()
    const quantity = Number(body.quantity)
    const price = Number(body.price)
    const timeInForce = String(body.timeInForce || 'day').toLowerCase()
    const goodTilDate = body.goodTilDate ? String(body.goodTilDate) : null

    const tifError = validateTimeInForce(timeInForce, goodTilDate || undefined)
    if (tifError) {
      return NextResponse.json({ error: tifError }, { status: 400 })
    }

    if (!symbol || !getAssetBySymbol(symbol)) {
      return NextResponse.json({ error: 'Invalid symbol' }, { status: 400 })
    }

    if (!['buy', 'sell'].includes(side)) {
      return NextResponse.json({ error: 'Invalid side' }, { status: 400 })
    }

    if (!Number.isInteger(quantity) || quantity <= 0) {
      return NextResponse.json({ error: 'Quantity must be a positive integer' }, { status: 400 })
    }

    if (!Number.isFinite(price) || price <= 0) {
      return NextResponse.json({ error: 'Price must be greater than 0' }, { status: 400 })
    }

    if (side === 'buy') {
      const required = quantity * price
      const available = getTradingCashBalance(userId) - getReservedBuyAmount(userId)
      if (available + 0.0001 < required) {
        return NextResponse.json(
          { error: `Insufficient cash balance. Available ${available.toFixed(2)}, required ${required.toFixed(2)}` },
          { status: 400 }
        )
      }
    }

    if (side === 'sell') {
      const holding = getHolding(userId, symbol)
      const heldShares = Number(holding?.shares || 0)
      const reservedShares = getReservedSellShares(userId, symbol)
      const availableShares = heldShares - reservedShares
      if (availableShares < quantity) {
        return NextResponse.json(
          { error: `Insufficient shares. Available ${availableShares}, required ${quantity}` },
          { status: 400 }
        )
      }
    }

    const beforeTrades = getUserTrades(userId, { limit: 200 }).map((trade) => trade.id)
    const result = matchOrder(
      crypto.randomUUID(),
      userId,
      symbol,
      side as 'buy' | 'sell',
      quantity,
      price,
      timeInForce as 'day' | 'gtd' | 'gtc',
      goodTilDate
    )

    const afterTrades = getUserTrades(userId, { limit: 200 })
    const newTrades = afterTrades.filter((trade) => !beforeTrades.includes(trade.id))

    const placedOrder = db.prepare('SELECT * FROM trading_orders WHERE id = ?').get(result.orderId)

    return NextResponse.json({
      message: 'Order placed successfully',
      order: placedOrder,
      execution: result,
      newTrades,
      portfolio: getPortfolioSummary(userId),
    })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to place order' }, { status: 500 })
  }
}
