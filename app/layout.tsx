import type { Metadata } from 'next'
import { Toaster } from 'react-hot-toast'
import './globals.css'

export const metadata: Metadata = {
  title: 'Gram Nidhi — Village Loan System',
  description: 'Transparent village lending management system',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Source+Sans+3:wght@300;400;500;600&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body bg-amber-50 text-earth-900 min-h-screen">
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#563611',
              color: '#fdf8ee',
              fontFamily: 'Source Sans 3, sans-serif',
            },
          }}
        />
        {children}
      </body>
    </html>
  )
}
