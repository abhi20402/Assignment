'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Box, Typography, Button, Paper, Table, TableHead, TableRow, TableCell, TableBody } from '@mui/material'
import { ArrowBack } from '@mui/icons-material'

export default function TransferHistory() {
  const router = useRouter()
  const [transfers, setTransfers] = useState<any[]>([])

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await fetch('/api/banking/transfer-history')
        if (response.status === 401) {
          router.push('/auth')
          return
        }
        if (response.ok) {
          const data = await response.json()
          setTransfers(data.transfers || [])
        }
      } catch (error) {
        console.error('Error fetching transfer history:', error)
      }
    }
    fetchHistory()
  }, [router])

  return (
    <Box>
      <Button startIcon={<ArrowBack />} onClick={() => router.push('/account/banking')} sx={{ color: '#ffffff', mb: 2, textTransform: 'none' }}>
        Back
      </Button>
      <Typography variant="h4" sx={{ color: '#ffffff', fontWeight: 700, mb: 3 }}>TRANSFER HISTORY</Typography>
      <Paper sx={{ p: 2, border: '1px solid rgba(255,255,255,0.1)' }}>
        <Table>
          <TableHead>
            <TableRow>
              {['Date', 'Direction', 'Method', 'Amount', 'Status'].map((label) => <TableCell key={label} sx={{ color: '#888888' }}>{label}</TableCell>)}
            </TableRow>
          </TableHead>
          <TableBody>
            {transfers.map((transfer) => (
              <TableRow key={transfer.id}>
                <TableCell sx={{ color: '#ffffff', borderColor: 'rgba(255,255,255,0.08)' }}>{new Date(transfer.created_at).toLocaleString()}</TableCell>
                <TableCell sx={{ color: '#ffffff', borderColor: 'rgba(255,255,255,0.08)' }}>{transfer.direction}</TableCell>
                <TableCell sx={{ color: '#ffffff', borderColor: 'rgba(255,255,255,0.08)' }}>{transfer.type}</TableCell>
                <TableCell sx={{ color: '#ffffff', borderColor: 'rgba(255,255,255,0.08)' }}>${Number(transfer.amount).toFixed(2)}</TableCell>
                <TableCell sx={{ color: '#ffffff', borderColor: 'rgba(255,255,255,0.08)' }}>{transfer.status}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {!transfers.length && <Typography sx={{ color: '#888888', textAlign: 'center', py: 3 }}>No transfer history yet.</Typography>}
      </Paper>
    </Box>
  )
}
