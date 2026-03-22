'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Box, Container, Typography, Button, Grid, Card, CardContent, Chip } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { ArrowForward, SwapHoriz, TrendingUp, AccountBalance } from '@mui/icons-material'
import { useAuth } from '@/contexts/AuthContext'
import RotatingPyramid from './RotatingPyramid'
import Footer from './Footer'
import SectionHeader from './investments/SectionHeader'
import SecondaryTradingCard from './investments/SecondaryTradingCard'
import { buildSecondaryTradingMonthlySeries, getSecondaryTradingSymbol } from '@/lib/investmentUtils'

type Asset = any

type HeroPayload = {
  title: string
  subtitle: string
  ctaLabel: string
  secondaryLabel: string
  portfolio?: { totalValue: number; cashBalance: number }
}

export default function LandingPage() {
  const router = useRouter()
  const theme = useTheme()
  const { isAuthenticated } = useAuth()
  const [hero, setHero] = useState<HeroPayload | null>(null)
  const [features, setFeatures] = useState<any[]>([])
  const [assets, setAssets] = useState<Asset[]>([])

  useEffect(() => {
    const load = async () => {
      try {
        const [heroRes, featuresRes, assetsRes] = await Promise.all([
          fetch('/api/home/hero'),
          fetch('/api/home/features'),
          fetch('/api/home/featured-assets'),
        ])
        if (heroRes.ok) setHero(await heroRes.json())
        if (featuresRes.ok) setFeatures((await featuresRes.json()).features || [])
        if (assetsRes.ok) setAssets((await assetsRes.json()).assets || [])
      } catch (error) {
        console.error('Error loading landing page data:', error)
      }
    }
    load()
  }, [])

  const secondaryInvestments = useMemo(() => {
    return assets.map((asset: any) => ({
      id: asset.id,
      title: asset.title,
      symbol: getSecondaryTradingSymbol(asset.title, asset.symbol),
      logoUrl: asset.logoUrl,
      previousValue: asset.previousValue,
      currentValue: asset.currentValue,
      performancePercent: asset.performancePercent,
      isPositive: asset.isPositive,
      category: asset.category,
      volume: asset.volume ?? '--',
      trendData: asset.dailyHistory?.slice(-30).map((entry: any) => entry.close) || buildSecondaryTradingMonthlySeries(asset.basePrice ?? asset.currentValue, asset.id ?? asset.title, [] as any, 30),
    }))
  }, [assets])

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 0, opacity: 0.08, pointerEvents: 'none', overflow: 'hidden' }}>
        <RotatingPyramid />
      </Box>

      <Box sx={{ pt: { xs: 12, sm: 16 }, pb: { xs: 8, sm: 12 }, textAlign: 'center', position: 'relative', zIndex: 1 }}>
        <Container maxWidth="md">
          <Chip label="Secondary Marketplace" sx={{ mb: 3, backgroundColor: 'rgba(0, 255, 136, 0.15)', color: theme.palette.primary.main, fontWeight: 600 }} />
          <Typography variant="h2" sx={{ fontWeight: 800, color: '#ffffff', mb: 2, fontSize: { xs: '2rem', sm: '3rem', md: '3.5rem' }, lineHeight: 1.2 }}>
            {hero?.title || 'Trade Digital Securities'}
          </Typography>
          <Typography sx={{ color: '#888888', fontSize: { xs: '16px', sm: '18px' }, maxWidth: 600, mx: 'auto', mb: 4, lineHeight: 1.6 }}>
            {hero?.subtitle || 'Browse assets, place buy and sell orders, and manage your portfolio on our secondary marketplace.'}
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button variant="contained" size="large" endIcon={<ArrowForward />} onClick={() => router.push('/investing/secondary-trading')} sx={{ backgroundColor: theme.palette.primary.main, color: '#000000', fontWeight: 700, px: 4, py: 1.5, fontSize: '16px', '&:hover': { backgroundColor: '#00E677' } }}>
              {hero?.ctaLabel || 'Explore Marketplace'}
            </Button>
            <Button variant="outlined" size="large" onClick={() => router.push(isAuthenticated ? '/account/portfolio' : '/auth')} sx={{ borderColor: 'rgba(255,255,255,0.3)', color: '#ffffff', fontWeight: 600, px: 4, py: 1.5, '&:hover': { borderColor: '#ffffff', backgroundColor: 'rgba(255,255,255,0.05)' } }}>
              {isAuthenticated ? 'Manage Portfolio' : hero?.secondaryLabel || 'Sign Up'}
            </Button>
          </Box>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ pb: 8, position: 'relative', zIndex: 1 }}>
        <Grid container spacing={3}>
          {(features.length ? features : [
            { key: 'trade', title: 'Trade Assets', description: 'Buy and sell digital securities on the secondary market' },
            { key: 'track', title: 'Track Performance', description: 'Monitor price trends, volume, and portfolio performance' },
            { key: 'portfolio', title: 'Manage Portfolio', description: 'View holdings, order history, and cash balance' },
          ]).map((feature) => (
            <Grid item xs={12} md={4} key={feature.key}>
              <Card sx={{ border: '1px solid rgba(255,255,255,0.1)', borderRadius: 2, height: '100%', cursor: 'pointer' }} onClick={() => router.push(feature.key === 'trade' ? '/investing/secondary-trading' : isAuthenticated ? '/account/portfolio' : '/auth')}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ color: theme.palette.primary.main, mb: 2 }}>
                    {feature.key === 'trade' ? <SwapHoriz sx={{ fontSize: 32 }} /> : feature.key === 'track' ? <TrendingUp sx={{ fontSize: 32 }} /> : <AccountBalance sx={{ fontSize: 32 }} />}
                  </Box>
                  <Typography variant="h6" sx={{ color: '#ffffff', fontWeight: 600, mb: 1 }}>{feature.title}</Typography>
                  <Typography sx={{ color: '#888888', fontSize: '14px' }}>{feature.description}</Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      <Box sx={{ pb: 8, position: 'relative', zIndex: 1 }}>
        <Container maxWidth="lg">
          <SectionHeader title="Featured Assets" subtitle="Popular securities available for trading" />
          <Grid container spacing={2} sx={{ mt: 2 }}>
            {secondaryInvestments.map((card) => (
              <Grid item xs={12} sm={6} md={4} key={card.id}>
                <SecondaryTradingCard
                  card={card}
                  basePath="/investing/secondary-trading"
                  isAuthenticated={isAuthenticated}
                />
              </Grid>
            ))}
          </Grid>
          <Box sx={{ textAlign: 'center', mt: 4 }}>
            <Button variant="outlined" endIcon={<ArrowForward />} onClick={() => router.push('/investing/secondary-trading')} sx={{ borderColor: theme.palette.primary.main, color: theme.palette.primary.main, fontWeight: 600, px: 4, '&:hover': { backgroundColor: 'rgba(0,255,136,0.1)' } }}>
              View All Assets
            </Button>
          </Box>
        </Container>
      </Box>

      <Footer />
    </Box>
  )
}
