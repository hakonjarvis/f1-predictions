import './globals.css'
import { AuthProvider } from '@/lib/contexts/AuthContext'
import Header from '@/components/Header'

export const metadata = {
  title: 'F1 Predictions',
  description: 'Gjetting og poeng for F1-sesongen',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="no">
      <body className="bg-black text-zinc-100">
        <AuthProvider>
          <Header />
          <main className="min-h-screen p-6">{children}</main>
        </AuthProvider>
      </body>
    </html>
  )
}
