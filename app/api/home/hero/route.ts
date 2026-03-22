import { NextRequest, NextResponse } from 'next/server'
import { getAuthUserId } from '@/lib/auth'
import { getPortfolioSummary } from '@/lib/trading'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const userId = await getAuthUserId(request)
  const portfolio = userId ? getPortfolioSummary(userId) : null

  return NextResponse.json({
    title: 'Trade Digital Securities',
    subtitle: 'Browse assets, place buy and sell orders, and manage your portfolio on our secondary marketplace.',
    ctaLabel: 'Explore Marketplace',
    secondaryLabel: portfolio ? 'Manage Portfolio' : 'Sign Up',
    portfolio,
  })
}
