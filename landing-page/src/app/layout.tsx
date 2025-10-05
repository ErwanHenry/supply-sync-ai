import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'SupplySync AI - Éliminez les erreurs d\'inventaire avec l\'IA',
  description: 'Synchronisation ERP en temps réel et détection d\'anomalies par IA. Économisez jusqu\'à €2M/an. SAP, Oracle, Dynamics 365, NetSuite, Odoo.',
  keywords: ['ERP', 'Inventory Management', 'AI', 'Machine Learning', 'Supply Chain', 'SAP', 'Oracle', 'Dynamics 365'],
  authors: [{ name: 'SupplySync AI' }],
  openGraph: {
    title: 'SupplySync AI - B2B Inventory Truth Engine',
    description: 'Éliminez les erreurs d\'inventaire avec l\'Intelligence Artificielle',
    type: 'website',
    locale: 'fr_FR',
    siteName: 'SupplySync AI',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SupplySync AI',
    description: 'B2B Inventory Truth Engine powered by AI',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
