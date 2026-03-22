'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Alert,
  Box,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'
import { ArrowBack } from '@mui/icons-material'

type TradingOrder = {
  id: string
  created_at: string
  symbol: string
  side: 'buy' | 'sell'
  quantity: number
  remaining_quantity: number
  price: number
  status: string
}

type TradingTrade = {
  id: string
  created_at: string
  symbol: string
  quantity: number
  price: number
  user_side: 'buy' | 'sell'
}

type Transfer = {
  id: string
  created_at: string
  direction: 'DEPOSIT' | 'WITHDRAWAL'
  type: string
  amount: number
  status: string
}

type PortfolioResponse = {
  recentOrders: TradingOrder[]
  recentTrades: TradingTrade[]
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(Number(value || 0))

const formatTimestamp = (value: string) =>
  new Date(value).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })

export default function TransferHistory() {
  const router = useRouter()
  const [orders, setOrders] = useState<TradingOrder[]>([])
  const [trades, setTrades] = useState<TradingTrade[]>([])
  const [transfers, setTransfers] = useState<Transfer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true)
        setError('')

        const [portfolioResponse, transferResponse] = await Promise.all([
          fetch('/api/trading/portfolio?historyLimit=50'),
          fetch('/api/banking/transfer-history'),
        ])

        if (portfolioResponse.status === 401 || transferResponse.status === 401) {
          router.push('/auth')
          return
        }

        if (!portfolioResponse.ok || !transferResponse.ok) {
          throw new Error('Failed to load account activity')
        }

        const portfolio = (await portfolioResponse.json()) as PortfolioResponse
        const transferPayload = (await transferResponse.json()) as { transfers?: Transfer[] }

        setOrders(portfolio.recentOrders || [])
        setTrades(portfolio.recentTrades || [])
        setTransfers(transferPayload.transfers || [])
      } catch (fetchError: any) {
        setError(fetchError?.message || 'Failed to load account activity')
      } finally {
        setLoading(false)
      }
    }

    void fetchHistory()
  }, [router])

  return (
    <Box>
      <Button startIcon={<ArrowBack />} onClick={() => router.back()} sx={{ color: '#ffffff', mb: 2, textTransform: 'none' }}>
        Back
      </Button>

      <Typography variant="h4" sx={{ color: '#ffffff', fontWeight: 700, mb: 1 }}>
        ACCOUNT ACTIVITY
      </Typography>
      <Typography sx={{ color: '#888888', mb: 3 }}>
        Review your marketplace orders, trade executions, and cash transfers in one place.
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Paper sx={{ p: 2, mb: 3, border: '1px solid rgba(255,255,255,0.1)' }}>
        <Typography sx={{ color: '#ffffff', fontWeight: 600, mb: 2 }}>Order History</Typography>
        <Table size="small">
          <TableHead>
            <TableRow>
              {['Date', 'Symbol', 'Side', 'Qty', 'Remaining', 'Limit Price', 'Status'].map((label) => (
                <TableCell key={label} sx={{ color: '#888888' }}>{label}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {orders.map((order) => (
              <TableRow key={order.id}>
                <TableCell sx={{ color: '#ffffff', borderColor: 'rgba(255,255,255,0.08)' }}>{formatTimestamp(order.created_at)}</TableCell>
                <TableCell sx={{ color: '#ffffff', borderColor: 'rgba(255,255,255,0.08)' }}>{order.symbol}</TableCell>
                <TableCell sx={{ color: order.side === 'buy' ? '#00ff88' : '#ff8080', borderColor: 'rgba(255,255,255,0.08)', textTransform: 'capitalize' }}>{order.side}</TableCell>
                <TableCell sx={{ color: '#ffffff', borderColor: 'rgba(255,255,255,0.08)' }}>{order.quantity}</TableCell>
                <TableCell sx={{ color: '#ffffff', borderColor: 'rgba(255,255,255,0.08)' }}>{order.remaining_quantity}</TableCell>
                <TableCell sx={{ color: '#ffffff', borderColor: 'rgba(255,255,255,0.08)' }}>{formatCurrency(order.price)}</TableCell>
                <TableCell sx={{ color: '#ffffff', borderColor: 'rgba(255,255,255,0.08)' }}>{order.status}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {!loading && !orders.length && (
          <Typography sx={{ color: '#888888', textAlign: 'center', py: 3 }}>
            No trading orders yet.
          </Typography>
        )}
      </Paper>

      <Paper sx={{ p: 2, mb: 3, border: '1px solid rgba(255,255,255,0.1)' }}>
        <Typography sx={{ color: '#ffffff', fontWeight: 600, mb: 2 }}>Trade History</Typography>
        <Table size="small">
          <TableHead>
            <TableRow>
              {['Date', 'Symbol', 'Side', 'Qty', 'Price', 'Gross'].map((label) => (
                <TableCell key={label} sx={{ color: '#888888' }}>{label}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {trades.map((trade) => {
              const gross = Number(trade.quantity) * Number(trade.price)

              return (
                <TableRow key={trade.id}>
                  <TableCell sx={{ color: '#ffffff', borderColor: 'rgba(255,255,255,0.08)' }}>{formatTimestamp(trade.created_at)}</TableCell>
                  <TableCell sx={{ color: '#ffffff', borderColor: 'rgba(255,255,255,0.08)' }}>{trade.symbol}</TableCell>
                  <TableCell sx={{ color: trade.user_side === 'buy' ? '#00ff88' : '#ff8080', borderColor: 'rgba(255,255,255,0.08)', textTransform: 'capitalize' }}>{trade.user_side}</TableCell>
                  <TableCell sx={{ color: '#ffffff', borderColor: 'rgba(255,255,255,0.08)' }}>{trade.quantity}</TableCell>
                  <TableCell sx={{ color: '#ffffff', borderColor: 'rgba(255,255,255,0.08)' }}>{formatCurrency(trade.price)}</TableCell>
                  <TableCell sx={{ color: '#ffffff', borderColor: 'rgba(255,255,255,0.08)' }}>{formatCurrency(gross)}</TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
        {!loading && !trades.length && (
          <Typography sx={{ color: '#888888', textAlign: 'center', py: 3 }}>
            No trade executions yet.
          </Typography>
        )}
      </Paper>

      <Paper sx={{ p: 2, border: '1px solid rgba(255,255,255,0.1)' }}>
        <Typography sx={{ color: '#ffffff', fontWeight: 600, mb: 2 }}>Transfer History</Typography>
        <Table size="small">
          <TableHead>
            <TableRow>
              {['Date', 'Direction', 'Method', 'Amount', 'Status'].map((label) => (
                <TableCell key={label} sx={{ color: '#888888' }}>{label}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {transfers.map((transfer) => (
              <TableRow key={transfer.id}>
                <TableCell sx={{ color: '#ffffff', borderColor: 'rgba(255,255,255,0.08)' }}>{formatTimestamp(transfer.created_at)}</TableCell>
                <TableCell sx={{ color: '#ffffff', borderColor: 'rgba(255,255,255,0.08)' }}>{transfer.direction}</TableCell>
                <TableCell sx={{ color: '#ffffff', borderColor: 'rgba(255,255,255,0.08)' }}>{transfer.type}</TableCell>
                <TableCell sx={{ color: '#ffffff', borderColor: 'rgba(255,255,255,0.08)' }}>{formatCurrency(transfer.amount)}</TableCell>
                <TableCell sx={{ color: '#ffffff', borderColor: 'rgba(255,255,255,0.08)' }}>{transfer.status}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {!loading && !transfers.length && (
          <Typography sx={{ color: '#888888', textAlign: 'center', py: 3 }}>
            No transfer history yet.
          </Typography>
        )}
      </Paper>
    </Box>
  )
}
