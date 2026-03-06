import type { Metadata } from "next"
import { Suspense } from "react"
import { Noto_Sans_JP } from "next/font/google"
import { Toaster } from "react-hot-toast"
import "./globals.css"
import { AuthProvider } from "@/contexts/AuthContext"
import Header from "@/components/Header"
import Footer from "@/components/Footer"
import { OrganizationSchema, WebSiteSchema } from "@/components/StructuredData"

const notoSansJP = Noto_Sans_JP({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-noto-sans-jp",
  display: "swap",
})

export const metadata: Metadata = {
  metadataBase: new URL("https://graymall.jp"),
  title: {
    default: "グレーモール | 個人ノウハウのマーケットプレイス",
    template: "%s | グレーモール",
  },
  description: "個人の体験談やノウハウを売買できるデジタルコンテンツマーケットプレイス",
  alternates: {
    canonical: "/",
  },
  keywords: ["ノウハウ", "コンテンツ販売", "情報商材", "副業", "マーケットプレイス"],
  authors: [{ name: "グレーモール" }],
  openGraph: {
    type: "website",
    locale: "ja_JP",
    url: "https://graymall.jp",
    siteName: "グレーモール",
    title: "グレーモール | 個人ノウハウのマーケットプレイス",
    description: "個人の体験談やノウハウを売買できるデジタルコンテンツマーケットプレイス",
    images: [
      {
        url: "https://graymall.jp/og-image.png",
        width: 1200,
        height: 630,
        alt: "グレーモール - 個人ノウハウのマーケットプレイス",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "グレーモール | 個人ノウハウのマーケットプレイス",
    description: "個人の体験談やノウハウを売買できるデジタルコンテンツマーケットプレイス",
    images: ["https://graymall.jp/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: "/favicon.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ja">
      <head>
        <OrganizationSchema />
        <WebSiteSchema />
      </head>
      <body className={`${notoSansJP.variable} font-sans antialiased`}>
        <AuthProvider>
          <Toaster
            position="top-center"
            toastOptions={{
              duration: 3000,
              style: {
                background: '#1f2937',
                color: '#f3f4f6',
                borderRadius: '8px',
              },
              success: {
                iconTheme: {
                  primary: '#10b981',
                  secondary: '#f3f4f6',
                },
              },
              error: {
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#f3f4f6',
                },
              },
            }}
          />
          <div className="min-h-screen bg-black">
            {/* アクセシビリティ: スキップリンク */}
            <a
              href="#main-content"
              className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[100] focus:px-4 focus:py-2 focus:bg-emerald-500 focus:text-white focus:rounded-lg focus:outline-none"
            >
              本文へスキップ
            </a>
            <Suspense fallback={<div className="h-16 bg-gray-900" />}>
              <Header />
            </Suspense>
            <main id="main-content" className="bg-black" role="main">
              {children}
            </main>
            <Footer />
          </div>
        </AuthProvider>
      </body>
    </html>
  )
}
