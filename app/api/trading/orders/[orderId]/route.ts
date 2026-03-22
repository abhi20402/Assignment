import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'
import { getAuthUserId } from '@/lib/auth'
import { getPortfolioSummary } from '@/lib/trading'

export async function DELETE(request: NextRequest, { params }: { params: { orderId: string } }) {
  try {
    const userId = await getAuthUserId(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const order = db.prepare('SELECT * FROM trading_orders WHERE id = ? AND user_id = ?').get(params.orderId, userId) as any
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    if (!['New', 'Pending', 'PartiallyFilled'].includes(order.status) || Number(order.remaining_quantity) <= 0) {
      return NextResponse.json({ error: 'Only open orders can be cancelled' }, { status: 400 })
    }

    db.prepare(`
      UPDATE trading_orders
      SET status = 'Cancelled', updated_at = datetime('now')
      WHERE id = ? AND user_id = ?
    `).run(params.orderId, userId)

    return NextResponse.json({ message: 'Order cancelled successfully', portfolio: getPortfolioSummary(userId) })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to cancel order' }, { status: 500 })
  }
}
