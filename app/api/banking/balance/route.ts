import { NextRequest, NextResponse } from 'next/server'
import { findUserById } from '@/lib/userStore'
import { getAuthUserId } from '@/lib/auth'
import { getAvailableTradingCash, getTradingCashBalance } from '@/lib/trading'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const userId = await getAuthUserId(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized. Please log in to continue.' }, { status: 401 })
    }

    const user = findUserById(userId)
    if (!user) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 })
    }

    const balance = getTradingCashBalance(userId)
    const availableBalance = getAvailableTradingCash(userId)
    return NextResponse.json({ balance, availableBalance })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to fetch cash balance' }, { status: 500 })
  }
}
