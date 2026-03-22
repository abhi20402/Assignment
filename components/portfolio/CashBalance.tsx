'use client'

import { useState, useEffect } from 'react'
import { Box, List, Typography, ListItem, ListItemText, IconButton } from '@mui/material'
import { ArrowForward } from '@mui/icons-material'
import { useRouter } from 'next/navigation'
import PortfolioSummaryCard from './PortfolioSummaryCard'
import InvestmentsSection from './InvestmentsSection'
import styles from './CashBalance.module.css'

type PortfolioResponse = {
  totalValue: number
  cashBalance: number
  availableCash: number
  reservedCash: number
  holdingsValue: number
  positions: any[]
  openOrders: any[]
  recentOrders: any[]
  recentTrades: any[]
}

export default function CashBalance() {
  const router = useRouter()
  const [portfolio, setPortfolio] = useState<PortfolioResponse>({
    totalValue: 0,
    cashBalance: 0,
    availableCash: 0,
    reservedCash: 0,
    holdingsValue: 0,
    positions: [],
    openOrders: [],
    recentOrders: [],
    recentTrades: [],
  })
  const [isPositionsExpanded, setIsPositionsExpanded] = useState(false)

  useEffect(() => {
    const fetchPortfolio = async () => {
      try {
        const response = await fetch('/api/trading/portfolio')
        if (response.status === 401) {
          router.push('/auth')
          return
        }
        if (response.ok) {
          const data = await response.json()
          setPortfolio({
            totalValue: Number(data.totalValue) || 0,
            cashBalance: Number(data.cashBalance) || 0,
            availableCash: Number(data.availableCash) || 0,
            reservedCash: Number(data.reservedCash) || 0,
            holdingsValue: Number(data.holdingsValue) || 0,
            positions: data.positions || [],
            openOrders: data.openOrders || [],
            recentOrders: data.recentOrders || [],
            recentTrades: data.recentTrades || [],
          })
        }
      } catch (error) {
        console.error('Error fetching portfolio:', error)
      }
    }

    fetchPortfolio()
  }, [router])

  return (
    <Box className={styles.content}>
      <PortfolioSummaryCard
        totalValue={portfolio.totalValue}
        cashAvailable={portfolio.availableCash}
        investedAmount={portfolio.holdingsValue}
        onInvestedClick={() => setIsPositionsExpanded(!isPositionsExpanded)}
      />

      <InvestmentsSection
        isPositionsExpanded={isPositionsExpanded}
        onTogglePositions={() => setIsPositionsExpanded(!isPositionsExpanded)}
      />

      <Box className={styles.historySection}>
        <Typography variant="h6" className={styles.sectionTitle}>
          ALL HISTORY
        </Typography>
        <List className={styles.historyList}>
          <ListItem className={styles.historyItem} onClick={() => router.push('/account/banking/history')}>
            <ListItemText
              primary="All Transactions"
              secondary={`${portfolio.recentOrders.length} recent orders • ${portfolio.recentTrades.length} recent trades`}
              className={styles.historyText}
            />
            <IconButton edge="end" className={styles.historyArrow}>
              <ArrowForward />
            </IconButton>
          </ListItem>
          <ListItem className={styles.historyItem} onClick={() => router.push('/account/banking/history')}>
            <ListItemText
              primary="Transfer History"
              secondary="Deposit and withdrawal activity"
              className={styles.historyText}
            />
            <IconButton edge="end" className={styles.historyArrow}>
              <ArrowForward />
            </IconButton>
          </ListItem>
        </List>
      </Box>
    </Box>
  )
}
