'use client'

import { useEffect, useMemo, useState, type ChangeEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Box, Typography, Button, CircularProgress, InputBase, Radio, Alert } from '@mui/material'
import { ArrowBack } from '@mui/icons-material'
import { mapPaymentMethodData, PaymentMethodData } from './paymentMethodHelpers'
import styles from './DepositFunds.module.css'

export default function WithdrawFunds() {
  const router = useRouter()
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodData[]>([])
  const [selectedMethodId, setSelectedMethodId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [amount, setAmount] = useState('100')
  const [balance, setBalance] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [methodsResponse, balanceResponse] = await Promise.all([fetch('/api/payment-methods'), fetch('/api/banking/balance')])
        if (methodsResponse.status === 401 || balanceResponse.status === 401) {
          router.push('/auth')
          return
        }
        const methodsData = await methodsResponse.json()
        const methods = (methodsData.paymentMethods || []).map(mapPaymentMethodData)
        setPaymentMethods(methods)
        const defaultMethod = methods.find((method: any) => method.isDefault) || methods[0]
        setSelectedMethodId(defaultMethod?.id || null)
        if (balanceResponse.ok) {
          const balanceData = await balanceResponse.json()
          setBalance(Number(balanceData.balance) || 0)
        }
      } catch (err) {
        console.error('Error loading withdraw page:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [router])

  const selectedMethod = useMemo(() => paymentMethods.find((method) => method.id === selectedMethodId) || null, [paymentMethods, selectedMethodId])

  const handleAmountChange = (event: ChangeEvent<HTMLInputElement>) => setAmount(event.target.value)

  const handleConfirm = async () => {
    if (!selectedMethod) return
    try {
      setSubmitting(true)
      setError('')
      setMessage('')
      const response = await fetch('/api/banking/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: Number(amount), paymentMethodId: selectedMethod.id }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Failed to withdraw funds')
      setBalance(Number(data.cashBalance) || 0)
      setMessage('Withdrawal completed successfully.')
    } catch (err: any) {
      setError(err?.message || 'Failed to withdraw funds')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Box className={styles.container} sx={{ backgroundColor: 'background.default', color: 'text.primary' }}>
      <Box className={styles.header}>
        <Button startIcon={<ArrowBack />} onClick={() => router.push('/account/banking')} className={styles.backButton}>Back</Button>
      </Box>
      <Box className={styles.content}>
        <Box className={styles.summary}>
          <Typography className={styles.accountLabel} color="text.secondary">Individual Account</Typography>
          <Typography variant="h3" className={styles.title} color="text.primary">WITHDRAW FUNDS</Typography>
          <Typography className={styles.balance} color="text.secondary">Available Cash: ${balance.toFixed(2)}</Typography>
        </Box>
        <Box className={styles.panel} sx={{ backgroundColor: 'background.paper', boxShadow: 3 }}>
          {message && <Alert severity="success" sx={{ mb: 2 }}>{message}</Alert>}
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {loading ? <Box className={styles.loading}><CircularProgress size={24} /></Box> : (
            <>
              <Box className={styles.amountRow} sx={{ backgroundColor: 'action.hover', borderColor: 'divider' }}>
                <Typography className={styles.amountLabel} color="text.secondary">Withdraw Amount:</Typography>
                <Typography className={styles.amountPrefix} color="text.secondary">$</Typography>
                <InputBase className={styles.amountInput} type="number" inputProps={{ min: 0, 'aria-label': 'Withdraw amount' }} value={amount} onChange={handleAmountChange} sx={{ color: 'text.primary', '& input': { textAlign: 'center' } }} />
              </Box>
              <Box className={styles.methodList}>
                {paymentMethods.map((method) => {
                  const isSelected = method.id === selectedMethodId
                  return (
                    <Box key={method.id} className={styles.methodItem} onClick={() => setSelectedMethodId(method.id)} sx={{ borderColor: isSelected ? 'primary.main' : 'divider', backgroundColor: isSelected ? 'action.selected' : 'transparent' }}>
                      <Box className={styles.methodInfo} sx={{ color: 'text.primary' }}>
                        <Box className={styles.methodNameRow}>
                          <Box className={styles.methodLabel}>{method.name}{method.displayInfo ? ` • ${method.displayInfo}` : ''}</Box>
                        </Box>
                      </Box>
                      <Radio checked={isSelected} onChange={() => setSelectedMethodId(method.id)} color="primary" />
                    </Box>
                  )
                })}
              </Box>
              <Button variant="contained" className={styles.confirmButton} disabled={!selectedMethod || Number(amount) <= 0 || Number(amount) > balance || submitting} onClick={handleConfirm} sx={{ '&.Mui-disabled': { backgroundColor: 'action.disabledBackground', color: 'text.disabled' } }}>
                {submitting ? 'Processing...' : 'Confirm Withdrawal'}
              </Button>
            </>
          )}
        </Box>
      </Box>
    </Box>
  )
}
