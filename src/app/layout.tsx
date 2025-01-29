import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'PEA Chatbot Assistant',
  description: 'ระบบผู้ช่วยอัจฉริยะสำหรับพนักงาน PEA',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="th">
      <body>{children}</body>
    </html>
  )
}