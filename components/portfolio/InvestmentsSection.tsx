'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Box,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
} from '@mui/material'
import { ExpandMore, ExpandLess } from '@mui/icons-material'
import InvestmentLookupIllustration from './InvestmentLookupIllustration'
import styles from './InvestmentsSection.module.css'

type Position = {
  id: string
  symbol: string
  shares: number
  avg_cost: number
  assetTitle: string
  currentPrice: number
  marketValue: number
  unrealizedPnl: number
}

interface InvestmentsSectionProps {
  isPositionsExpanded?: boolean
  onTogglePositions?: () => void
}

export default function InvestmentsSection({ isPositionsExpanded = false, onTogglePositions }: InvestmentsSectionProps) {
  const router = useRouter()
  const [positions, setPositions] = useState<Position[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPortfolio = async () => {
      try {
        const response = await fetch('/api/trading/portfolio')
        if (response.ok) {
          const data = await response.json()
          setPositions(data.positions || [])
        }
      } catch (error) {
        console.error('Error fetching positions:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchPortfolio()
  }, [])

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount)

  const hasPositions = positions.length > 0

  if (loading) {
    return (
      <Box className={styles.investmentsSection}>
        <Typography variant="h6" className={styles.sectionTitle}>MY POSITIONS</Typography>
        <Paper className={styles.investmentsCard}>
          <Typography variant="body2" sx={{ color: '#888888', textAlign: 'center', py: 4 }}>
            Loading positions...
          </Typography>
        </Paper>
      </Box>
    )
  }

  if (!hasPositions) {
    return (
      <Box className={styles.investmentsSection}>
        <Typography variant="h6" className={styles.sectionTitle}>MY POSITIONS</Typography>
        <Paper className={styles.investmentsCard}>
          <Box className={styles.illustrationContainer}>
            <InvestmentLookupIllustration />
          </Box>
          <Typography variant="h6" className={styles.investmentsTitle}>
            Let&apos;s find your first investment!
          </Typography>
          <Button variant="contained" className={styles.exploreButton} onClick={() => router.push('/investing/secondary-trading')}>
            Explore Opportunities
          </Button>
        </Paper>
      </Box>
    )
  }

  return (
    <Box className={styles.investmentsSection}>
      <Paper className={styles.collapsibleSection}>
        <Box className={styles.sectionHeader} onClick={onTogglePositions} sx={{ cursor: onTogglePositions ? 'pointer' : 'default' }}>
          <Typography variant="h6" className={styles.categoryTitle}>My Positions</Typography>
          <IconButton size="small" sx={{ color: '#ffffff' }}>
            {isPositionsExpanded ? <ExpandLess /> : <ExpandMore />}
          </IconButton>
        </Box>

        {isPositionsExpanded && (
          <Box className={styles.tableContainer}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    {['Asset', 'Shares', 'Avg Cost', 'Current Price', 'Market Value', 'Unrealized P/L'].map((column) => (
                      <TableCell key={column} sx={{ color: '#888888', fontWeight: 600, borderColor: 'rgba(255,255,255,0.1)' }}>
                        {column}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {positions.map((position) => (
                    <TableRow key={position.id} hover sx={{ '&:hover': { backgroundColor: 'rgba(255,255,255,0.03)' } }}>
                      <TableCell sx={{ color: '#ffffff', borderColor: 'rgba(255,255,255,0.08)' }}>
                        <Box>
                          <Typography sx={{ fontWeight: 600 }}>{position.assetTitle}</Typography>
                          <Typography sx={{ color: '#888888', fontSize: '12px' }}>{position.symbol}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ color: '#ffffff', borderColor: 'rgba(255,255,255,0.08)' }}>{position.shares}</TableCell>
                      <TableCell sx={{ color: '#ffffff', borderColor: 'rgba(255,255,255,0.08)' }}>{formatCurrency(Number(position.avg_cost))}</TableCell>
                      <TableCell sx={{ color: '#ffffff', borderColor: 'rgba(255,255,255,0.08)' }}>{formatCurrency(position.currentPrice)}</TableCell>
                      <TableCell sx={{ color: '#ffffff', borderColor: 'rgba(255,255,255,0.08)' }}>{formatCurrency(position.marketValue)}</TableCell>
                      <TableCell
                        sx={{
                          color: position.unrealizedPnl >= 0 ? '#00ff88' : '#ff4d4d',
                          borderColor: 'rgba(255,255,255,0.08)',
                          fontWeight: 600,
                        }}
                      >
                        {position.unrealizedPnl >= 0 ? '+' : ''}
                        {formatCurrency(position.unrealizedPnl)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}
      </Paper>
    </Box>
  )
}
