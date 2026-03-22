import type { Metadata } from 'next'
import './globals.css'
import { ThemeProvider } from '@/components/theme/ThemeProvider'
import { AuthProvider } from '@/contexts/AuthContext'

export const metadata: Metadata = {
  title: 'tZERO - Invest in Startups',
  description: 'Invest in startups and collectibles on tZERO',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
