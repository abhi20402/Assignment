import { NextRequest, NextResponse } from 'next/server'
import { getAuthUserId } from '@/lib/auth'
import { getPortfolioSummary } from '@/lib/trading'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const userId = await getAuthUserId(request)
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const historyLimit = Number(searchParams.get('historyLimit') || 10)

  return NextResponse.json(getPortfolioSummary(userId, { historyLimit }))
}
