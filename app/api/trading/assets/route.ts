import { NextRequest, NextResponse } from 'next/server'
import { getAllTradingAssets } from '@/lib/trading'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = (searchParams.get('search') || '').trim().toLowerCase()
    const category = (searchParams.get('category') || '').trim().toLowerCase()
    const sortBy = (searchParams.get('sortBy') || 'title').trim()
    const sortOrder = (searchParams.get('sortOrder') || 'asc').trim().toLowerCase() === 'desc' ? 'desc' : 'asc'

    let assets = getAllTradingAssets()

    if (search) {
      assets = assets.filter(
        (asset) =>
          asset.title.toLowerCase().includes(search) ||
          asset.symbol?.toLowerCase().includes(search) ||
          asset.category.toLowerCase().includes(search)
      )
    }

    if (category && category !== 'all') {
      assets = assets.filter((asset) => asset.category.toLowerCase() === category)
    }

    assets.sort((a, b) => {
      const direction = sortOrder === 'desc' ? -1 : 1
      switch (sortBy) {
        case 'price':
          return (Number(a.currentValue) - Number(b.currentValue)) * direction
        case 'performance':
          return (Number(a.performancePercent) - Number(b.performancePercent)) * direction
        case 'symbol':
          return (a.symbol || '').localeCompare(b.symbol || '') * direction
        default:
          return a.title.localeCompare(b.title) * direction
      }
    })

    return NextResponse.json({
      assets,
      total: assets.length,
      filters: { search, category, sortBy, sortOrder },
    })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to fetch assets' }, { status: 500 })
  }
}
