import { NextResponse } from 'next/server'
import { getAllTradingAssets } from '@/lib/trading'

export const dynamic = 'force-dynamic'

export async function GET() {
  const assets = getAllTradingAssets().slice(0, 6)
  return NextResponse.json({ assets, total: assets.length })
}
