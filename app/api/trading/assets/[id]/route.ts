import { NextRequest, NextResponse } from 'next/server'
import { getAuthUserId } from '@/lib/auth'
import {
  getHolding,
  getLatestTrades,
  getOpenOrderBook,
  getTradingAssetByIdOrSlug,
  getUserOrders,
  getTradingCashBalance,
} from '@/lib/trading'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const asset = getTradingAssetByIdOrSlug(params.id)
    if (!asset || !asset.symbol) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 })
    }

    const userId = await getAuthUserId(request)
    const payload: any = {
      asset,
      orderBook: getOpenOrderBook(asset.symbol),
      recentTrades: getLatestTrades(asset.symbol, 20),
    }

    if (userId) {
      payload.userPosition = getHolding(userId, asset.symbol)
      payload.userOrders = getUserOrders(userId, { symbol: asset.symbol, limit: 20 })
      payload.cashBalance = getTradingCashBalance(userId)
    }

    return NextResponse.json(payload)
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to fetch asset detail' }, { status: 500 })
  }
}
