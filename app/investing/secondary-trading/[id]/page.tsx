'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Header from '@/components/Header'
import TrendGraph from '@/components/investments/TrendGraph'
import {
  Alert,
  Box,
  Button,
  Container,
  Divider,
  Grid,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { ArrowBack } from '@mui/icons-material'
import { formatCurrency, getSecondaryTradingSymbol, getSeededColor } from '@/lib/investmentUtils'

type DetailResponse = {
  asset: any
  orderBook: { asks: Array<{ price: number; quantity: number }>; bids: Array<{ price: number; quantity: number }> }
  recentTrades: any[]
  userPosition?: any
  userOrders?: any[]
  availableCash?: number
}

export default function SecondaryTradingDetailPage() {
  const params = useParams()
  const router = useRouter()
  const theme = useTheme()
  const [data, setData] = useState<DetailResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ side: 'buy', quantity: '1', price: '', timeInForce: 'day', goodTilDate: '' })

  const id = Array.isArray(params.id) ? params.id[0] : params.id

  const fetchDetail = useCallback(async () => {
    if (!id) return

    try {
      setLoading(true)
      const response = await fetch(`/api/trading/assets/${id}`)
      if (!response.ok) {
        throw new Error('Failed to load asset')
      }
      const detail = await response.json()
      setData(detail)
      setForm((prev) => ({ ...prev, price: String(detail.asset?.currentValue ?? prev.price) }))
    } catch (err: any) {
      setError(err?.message || 'Failed to load asset')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    void fetchDetail()
  }, [fetchDetail])

  const symbol = useMemo(() => (data?.asset ? getSecondaryTradingSymbol(data.asset.title, data.asset.symbol) : ''), [data])

  const handlePlaceOrder = async () => {
    try {
      setSubmitting(true)
      setError('')
      const response = await fetch('/api/trading/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol,
          side: form.side,
          quantity: Number(form.quantity),
          price: Number(form.price),
          timeInForce: form.timeInForce,
          goodTilDate: form.timeInForce === 'gtd' ? form.goodTilDate : null,
        }),
      })

      if (response.status === 401) {
        router.push('/auth')
        return
      }

      const payload = await response.json()
      if (!response.ok) {
        throw new Error(payload.error || 'Failed to place order')
      }
      await fetchDetail()
    } catch (err: any) {
      setError(err?.message || 'Failed to place order')
    } finally {
      setSubmitting(false)
    }
  }

  const handleCancelOrder = async (orderId: string) => {
    try {
      const response = await fetch(`/api/trading/orders/${orderId}`, { method: 'DELETE' })
      if (response.status === 401) {
        router.push('/auth')
        return
      }
      const payload = await response.json()
      if (!response.ok) {
        throw new Error(payload.error || 'Failed to cancel order')
      }
      await fetchDetail()
    } catch (err: any) {
      setError(err?.message || 'Failed to cancel order')
    }
  }

  if (loading) {
    return <Box sx={{ minHeight: '100vh' }}><Header /><Container maxWidth="lg" sx={{ pt: '120px' }}><Typography sx={{ color: '#fff' }}>Loading asset...</Typography></Container></Box>
  }

  if (!data?.asset) {
    return <Box sx={{ minHeight: '100vh' }}><Header /><Container maxWidth="lg" sx={{ pt: '120px' }}><Typography sx={{ color: '#fff' }}>Asset not found.</Typography></Container></Box>
  }

  return (
    <Box sx={{ minHeight: '100vh' }}>
      <Header />
      <Container maxWidth="lg" sx={{ pt: { xs: '100px', sm: '120px' }, pb: 4 }}>
        <Button startIcon={<ArrowBack />} onClick={() => router.push('/investing/secondary-trading')} sx={{ color: '#ffffff', mb: 2, textTransform: 'none' }}>
          Back to Marketplace
        </Button>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Box sx={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', alignItems: 'flex-start', gap: 2, mb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ width: 48, height: 48, borderRadius: '12px', backgroundColor: getSeededColor(symbol), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Typography sx={{ color: '#ffffff', fontWeight: 700, fontSize: '16px' }}>{symbol.slice(0, 2)}</Typography>
            </Box>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#ffffff' }}>{data.asset.title}</Typography>
              <Typography sx={{ color: '#888888' }}>{symbol} • {data.asset.category}</Typography>
            </Box>
          </Box>
          <Typography sx={{ color: '#ffffff', fontWeight: 700, fontSize: '16px' }}>
            Cash Available: {formatCurrency(data.availableCash ?? 0)}
          </Typography>
        </Box>
        <Typography variant="h3" sx={{ fontWeight: 700, color: '#ffffff', mt: 1 }}>{formatCurrency(data.asset.currentValue)}</Typography>
        <Typography sx={{ color: data.asset.isPositive ? theme.palette.primary.main : '#ff4d4d', fontWeight: 600, mb: 1 }}>
          {data.asset.isPositive ? '+' : ''}{Number(data.asset.performancePercent).toFixed(2)}%
        </Typography>
        <Typography sx={{ color: '#888888', mb: 3 }}>Base {formatCurrency(data.asset.basePrice)} • Last {formatCurrency(data.asset.currentValue)}</Typography>

        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 3, border: '1px solid rgba(255,255,255,0.12)', borderRadius: 2, mb: 3 }}>
              <Typography sx={{ color: '#ffffff', fontWeight: 600, mb: 1 }}>Price Chart</Typography>
              <Typography sx={{ color: '#888888', mb: 2 }}>Showing latest price trend for {symbol}.</Typography>
              <Box sx={{ width: '100%', minHeight: 300 }}>
                <TrendGraph data={(data.asset.dailyHistory || []).map((entry: any) => Number(entry.close))} isPositive={data.asset.isPositive} width={1200} height={320} />
              </Box>
            </Paper>

            <Paper sx={{ p: 3, border: '1px solid rgba(255,255,255,0.1)', borderRadius: 2, mb: 3 }}>
              <Typography sx={{ color: '#ffffff', fontWeight: 600, mb: 2 }}>Order Book</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography sx={{ color: '#ff8080', mb: 1, fontWeight: 600 }}>Asks</Typography>
                  <Table size="small">
                    <TableHead><TableRow><TableCell sx={{ color: '#888888' }}>Price</TableCell><TableCell sx={{ color: '#888888' }}>Quantity</TableCell></TableRow></TableHead>
                    <TableBody>
                      {data.orderBook.asks.map((row, idx) => (
                        <TableRow key={`ask-${idx}`}><TableCell sx={{ color: '#ffffff', borderColor: 'rgba(255,255,255,0.08)' }}>{formatCurrency(row.price)}</TableCell><TableCell sx={{ color: '#ffffff', borderColor: 'rgba(255,255,255,0.08)' }}>{row.quantity}</TableCell></TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography sx={{ color: '#00ff88', mb: 1, fontWeight: 600 }}>Bids</Typography>
                  <Table size="small">
                    <TableHead><TableRow><TableCell sx={{ color: '#888888' }}>Price</TableCell><TableCell sx={{ color: '#888888' }}>Quantity</TableCell></TableRow></TableHead>
                    <TableBody>
                      {data.orderBook.bids.map((row, idx) => (
                        <TableRow key={`bid-${idx}`}><TableCell sx={{ color: '#ffffff', borderColor: 'rgba(255,255,255,0.08)' }}>{formatCurrency(row.price)}</TableCell><TableCell sx={{ color: '#ffffff', borderColor: 'rgba(255,255,255,0.08)' }}>{row.quantity}</TableCell></TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Grid>
              </Grid>
            </Paper>

            <Paper sx={{ p: 3, border: '1px solid rgba(255,255,255,0.1)', borderRadius: 2 }}>
              <Typography sx={{ color: '#ffffff', fontWeight: 600, mb: 2 }}>Your Position & Orders</Typography>
              <Typography sx={{ color: '#888888', mb: 1 }}>
                Position: {Number(data.userPosition?.shares || 0)} shares @ avg cost {formatCurrency(Number(data.userPosition?.avg_cost || 0))}
              </Typography>
              <Divider sx={{ my: 2, borderColor: 'rgba(255,255,255,0.08)' }} />
              <Table size="small">
                <TableHead>
                  <TableRow>
                    {['Side', 'Qty', 'Remaining', 'Price', 'Status', 'Action'].map((label) => (
                      <TableCell key={label} sx={{ color: '#888888' }}>{label}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(data.userOrders || []).map((order) => (
                    <TableRow key={order.id}>
                      <TableCell sx={{ color: '#ffffff', borderColor: 'rgba(255,255,255,0.08)' }}>{order.side}</TableCell>
                      <TableCell sx={{ color: '#ffffff', borderColor: 'rgba(255,255,255,0.08)' }}>{order.quantity}</TableCell>
                      <TableCell sx={{ color: '#ffffff', borderColor: 'rgba(255,255,255,0.08)' }}>{order.remaining_quantity}</TableCell>
                      <TableCell sx={{ color: '#ffffff', borderColor: 'rgba(255,255,255,0.08)' }}>{formatCurrency(order.price)}</TableCell>
                      <TableCell sx={{ color: '#ffffff', borderColor: 'rgba(255,255,255,0.08)' }}>{order.status}</TableCell>
                      <TableCell sx={{ borderColor: 'rgba(255,255,255,0.08)' }}>
                        {['New', 'Pending', 'PartiallyFilled'].includes(order.status) ? (
                          <Button size="small" onClick={() => handleCancelOrder(order.id)} sx={{ color: '#ff8080' }}>Cancel</Button>
                        ) : null}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Paper>
          </Grid>

          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, border: '1px solid rgba(255,255,255,0.1)', borderRadius: 2, position: { md: 'sticky' }, top: { md: 100 } }}>
              <Typography sx={{ color: '#ffffff', fontWeight: 700, mb: 2 }}>Place Order</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField select fullWidth label="Side" value={form.side} onChange={(e) => setForm({ ...form, side: e.target.value })}>
                    <MenuItem value="buy">Buy</MenuItem>
                    <MenuItem value="sell">Sell</MenuItem>
                  </TextField>
                </Grid>
                <Grid item xs={12}>
                  <TextField fullWidth label="Quantity" type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
                </Grid>
                <Grid item xs={12}>
                  <TextField fullWidth label="Limit Price" type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
                </Grid>
                <Grid item xs={12}>
                  <TextField select fullWidth label="Time In Force" value={form.timeInForce} onChange={(e) => setForm({ ...form, timeInForce: e.target.value })}>
                    <MenuItem value="day">Day</MenuItem>
                    <MenuItem value="gtc">GTC</MenuItem>
                    <MenuItem value="gtd">GTD</MenuItem>
                  </TextField>
                </Grid>
                {form.timeInForce === 'gtd' && (
                  <Grid item xs={12}>
                    <TextField fullWidth label="Good Till Date" type="date" InputLabelProps={{ shrink: true }} value={form.goodTilDate} onChange={(e) => setForm({ ...form, goodTilDate: e.target.value })} />
                  </Grid>
                )}
                <Grid item xs={12}>
                  <Typography sx={{ color: '#888888', mb: 1 }}>Estimated value: {formatCurrency(Number(form.quantity || 0) * Number(form.price || 0))}</Typography>
                  <Button fullWidth variant="contained" onClick={handlePlaceOrder} disabled={submitting} sx={{ backgroundColor: theme.palette.primary.main, color: '#000', fontWeight: 700 }}>
                    {submitting ? 'Submitting...' : 'Submit Order'}
                  </Button>
                </Grid>
              </Grid>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  )
}
