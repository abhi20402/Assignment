import { NextRequest, NextResponse } from 'next/server'
import { getAuthUserId } from '@/lib/auth'
import { findUserById } from '@/lib/userStore'
import { getPayments } from '@/lib/paymentStore'

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

    const { searchParams } = new URL(request.url)
    const direction = searchParams.get('direction') || undefined
    const transfers = getPayments(userId, { direction: direction as 'DEPOSIT' | 'WITHDRAWAL' | undefined })

    return NextResponse.json({ transfers })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to fetch transfer history' }, { status: 500 })
  }
}
