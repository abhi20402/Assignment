import { NextRequest, NextResponse } from 'next/server'
import { getAuthUserId } from '@/lib/auth'
import { getPortfolioSummary } from '@/lib/trading'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const userId = await getAuthUserId(request)
  const portfolio = userId ? getPortfolioSummary(userId) : null

  return NextResponse.json({
    features: [
      {
        key: 'trade',
        title: 'Trade Assets',
        description: 'Buy and sell digital securities on the secondary market',
      },
      {
        key: 'track',
        title: 'Track Performance',
        description: portfolio
          ? `Portfolio value $${portfolio.totalValue.toFixed(2)} • Cash $${portfolio.cashBalance.toFixed(2)}`
          : 'Monitor price trends, volume, and portfolio performance',
      },
      {
        key: 'portfolio',
        title: 'Manage Portfolio',
        description: portfolio
          ? `${portfolio.positions.length} positions • ${portfolio.openOrders.length} open orders`
          : 'View holdings, order history, and cash balance',
      },
    ],
    portfolio,
  })
}
