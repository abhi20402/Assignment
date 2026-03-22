import { NextRequest, NextResponse } from 'next/server'
import { getAuthUserId } from '@/lib/auth'
import { findUserById } from '@/lib/userStore'
import { createPayment, getPaymentMethod } from '@/lib/paymentStore'
import { getTradingCashBalance, adjustTradingCashBalance } from '@/lib/trading'

export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthUserId(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized. Please log in to continue.' }, { status: 401 })
    }

    const user = findUserById(userId)
    if (!user) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 })
    }

    const body = await request.json()
    const amount = Number(body.amount)
    const paymentMethodId = String(body.paymentMethodId || '')

    if (!paymentMethodId || !Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ error: 'Invalid withdrawal request.' }, { status: 400 })
    }

    const paymentMethod = getPaymentMethod(paymentMethodId)
    if (!paymentMethod || paymentMethod.user_id !== userId || paymentMethod.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'Payment method not available.' }, { status: 400 })
    }

    const availableCash = getTradingCashBalance(userId)
    if (availableCash + 0.0001 < amount) {
      return NextResponse.json({ error: `Insufficient available cash. Available ${availableCash.toFixed(2)}` }, { status: 400 })
    }

    const payment = createPayment({
      user_id: userId,
      payment_method_id: paymentMethod.id,
      type: paymentMethod.type,
      status: 'COMPLETED',
      direction: 'WITHDRAWAL',
      amount,
      currency: 'USD',
      description: 'Account withdrawal',
      completed_at: new Date().toISOString(),
    })

    adjustTradingCashBalance(userId, -amount)

    return NextResponse.json({ payment, cashBalance: getTradingCashBalance(userId) })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to create withdrawal' }, { status: 500 })
  }
}
