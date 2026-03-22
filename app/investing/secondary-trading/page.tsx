'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/Header'
import {
  Box,
  Container,
  Typography,
  Grid,
  Paper,
  TextField,
  MenuItem,
  InputAdornment,
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import { useTheme } from '@mui/material/styles'
import { formatCurrency, getSecondaryTradingSymbol, getSeededColor } from '@/lib/investmentUtils'

type Asset = {
  id: string
  title: string
  category: string
  basePrice: number
  previousValue: number
  currentValue: number
  performancePercent: number
  isPositive: boolean
  volume?: string
  companyDescription?: string
  symbol?: string
}

export default function SecondaryTradingPage() {
  const router = useRouter()
  const theme = useTheme()
  const [assets, setAssets] = useState<Asset[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [sortBy, setSortBy] = useState('title')
  const [sortOrder, setSortOrder] = useState('asc')

  useEffect(() => {
    const controller = new AbortController()
    const fetchAssets = async () => {
      try {
        setLoading(true)
        const params = new URLSearchParams({ search, category, sortBy, sortOrder })
        const response = await fetch(`/api/trading/assets?${params.toString()}`, { signal: controller.signal })
        if (!response.ok) {
          throw new Error('Failed to fetch assets')
        }
        const data = await response.json()
        setAssets(data.assets || [])
      } catch (error: any) {
        if (error?.name !== 'AbortError') {
          console.error('Error fetching assets:', error)
        }
      } finally {
        setLoading(false)
      }
    }

    fetchAssets()
    return () => controller.abort()
  }, [search, category, sortBy, sortOrder])

  const categories = useMemo(() => ['all', 'tech', 'healthcare', 'energy', 'consumer', 'finance'], [])

  return (
    <Box sx={{ minHeight: '100vh' }}>
      <Header />
      <Container maxWidth="lg" sx={{ pt: { xs: '100px', sm: '120px' }, pb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, color: '#ffffff', mb: 1 }}>
          Secondary Marketplace
        </Typography>
        <Typography sx={{ color: '#888888', mb: 4 }}>
          Browse and trade digital securities on the secondary market.
        </Typography>

        <Paper sx={{ p: 2, mb: 3, border: '1px solid rgba(255,255,255,0.1)', borderRadius: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={5}>
              <TextField
                fullWidth
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search assets, symbols, categories"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: '#888888' }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': { color: '#fff' },
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.12)' },
                }}
              />
            </Grid>
            <Grid item xs={12} sm={4} md={3}>
              <TextField
                select
                fullWidth
                label="Category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                sx={{
                  '& .MuiInputLabel-root': { color: '#888888' },
                  '& .MuiOutlinedInput-root': { color: '#fff' },
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.12)' },
                }}
              >
                {categories.map((item) => (
                  <MenuItem key={item} value={item}>
                    {item === 'all' ? 'All Categories' : item.charAt(0).toUpperCase() + item.slice(1)}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={6} sm={4} md={2}>
              <TextField
                select
                fullWidth
                label="Sort By"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                sx={{
                  '& .MuiInputLabel-root': { color: '#888888' },
                  '& .MuiOutlinedInput-root': { color: '#fff' },
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.12)' },
                }}
              >
                <MenuItem value="title">Name</MenuItem>
                <MenuItem value="symbol">Symbol</MenuItem>
                <MenuItem value="price">Price</MenuItem>
                <MenuItem value="performance">Performance</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={6} sm={4} md={2}>
              <TextField
                select
                fullWidth
                label="Order"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                sx={{
                  '& .MuiInputLabel-root': { color: '#888888' },
                  '& .MuiOutlinedInput-root': { color: '#fff' },
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.12)' },
                }}
              >
                <MenuItem value="asc">Ascending</MenuItem>
                <MenuItem value="desc">Descending</MenuItem>
              </TextField>
            </Grid>
          </Grid>
        </Paper>

        <Grid container spacing={2}>
          {assets.map((asset) => {
            const symbol = getSecondaryTradingSymbol(asset.title, asset.symbol)
            return (
              <Grid item xs={12} sm={6} md={4} key={asset.id}>
                <Paper
                  onClick={() => router.push(`/investing/secondary-trading/${encodeURIComponent(asset.id)}`)}
                  sx={{
                    p: 2.5,
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 2,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    '&:hover': { borderColor: 'rgba(0,255,136,0.4)', transform: 'translateY(-2px)' },
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                    <Box
                      sx={{
                        width: 36,
                        height: 36,
                        borderRadius: '8px',
                        backgroundColor: getSeededColor(symbol),
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Typography sx={{ color: '#fff', fontWeight: 700, fontSize: '13px' }}>{symbol.slice(0, 2)}</Typography>
                    </Box>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography sx={{ color: '#ffffff', fontWeight: 600, fontSize: '14px' }}>{asset.title}</Typography>
                      <Typography sx={{ color: '#888', fontSize: '12px' }}>{symbol} • {asset.category}</Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', mb: 1 }}>
                    <Typography sx={{ color: '#ffffff', fontWeight: 700, fontSize: '18px' }}>
                      {formatCurrency(asset.currentValue)}
                    </Typography>
                    <Typography sx={{ color: asset.isPositive ? theme.palette.primary.main : '#ff4d4d', fontWeight: 600, fontSize: '13px' }}>
                      {asset.isPositive ? '+' : ''}{asset.performancePercent.toFixed(2)}%
                    </Typography>
                  </Box>
                  <Typography sx={{ color: '#888888', fontSize: '13px' }} noWrap>
                    {asset.companyDescription}
                  </Typography>
                </Paper>
              </Grid>
            )
          })}
        </Grid>

        {!loading && !assets.length && (
          <Paper sx={{ mt: 3, p: 3, border: '1px solid rgba(255,255,255,0.1)', textAlign: 'center' }}>
            <Typography sx={{ color: '#888888' }}>No assets matched your filters.</Typography>
          </Paper>
        )}
      </Container>
    </Box>
  )
}
