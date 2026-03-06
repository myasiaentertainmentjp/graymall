'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Menu, X, Search, PenSquare, ChevronDown } from 'lucide-react'
import NotificationDropdown from './NotificationDropdown'

export default function Header() {
  const { user, profile, signOut } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const currentPath = pathname + (searchParams.toString() ? `?${searchParams.toString()}` : '')
  const loginUrl = currentPath !== '/' ? `/signin?redirect=${encodeURIComponent(currentPath)}` : '/signin'
  const signupUrl = currentPath !== '/' ? `/signup?redirect=${encodeURIComponent(currentPath)}` : '/signup'

  const handleSignOut = async () => {
    await signOut()
    router.push('/signin')
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/articles?q=${encodeURIComponent(searchQuery.trim())}`)
      setSearchQuery('')
    }
  }

  return (
    <header className="marble-dark border-b border-gray-800 sticky top-0 z-50" role="banner">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Left: Logo */}
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center">
              <Image src="/logo-white.png" alt="グレーモール" width={120} height={28} className="h-6 sm:h-7 w-auto" priority />
            </Link>
          </div>

          {/* Center: Search (desktop) */}
          <div className="hidden md:flex flex-1 max-w-md mx-8">
            <form onSubmit={handleSearch} className="w-full" role="search" aria-label="サイト内検索">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" aria-hidden="true" />
                <input
                  type="search"
                  placeholder="キーワードで探す"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  aria-label="検索キーワード"
                  className="w-full pl-10 pr-4 py-2 bg-gray-900 border border-gray-700 rounded-full text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
            </form>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            {user ? (
              <>
                {/* Desktop Navigation */}
                <div className="hidden md:flex items-center gap-1">
                  <NotificationDropdown />

                  {/* 投稿ボタン */}
                  <Link
                    href="/editor/new"
                    className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500 text-white rounded-full text-sm font-medium hover:bg-emerald-600 transition"
                  >
                    <PenSquare className="w-4 h-4" />
                    <span>投稿</span>
                  </Link>

                  {/* ユーザーメニュー */}
                  <div className="relative group">
                    <button className="flex items-center gap-1 ml-2 p-1.5 text-gray-400 hover:text-white rounded-full hover:bg-gray-800" type="button" aria-label="ユーザーメニュー" aria-haspopup="true">
                      <Image src={profile?.avatar_url || '/noicon.png'} alt="" width={32} height={32} className="w-8 h-8 rounded-full object-cover" unoptimized={!!profile?.avatar_url} />
                      <ChevronDown className="w-4 h-4" aria-hidden="true" />
                    </button>
                    <div className="absolute right-0 pt-2 w-52 hidden group-hover:block">
                      <div className="bg-gray-900 rounded-lg shadow-lg border border-gray-700 py-2">
                        <Link href={`/users/${user.id}`} className="block px-4 py-3 hover:bg-gray-800">
                          <div className="flex items-center gap-3">
                            <Image src={profile?.avatar_url || '/noicon.png'} alt="" width={40} height={40} className="w-10 h-10 rounded-full object-cover" unoptimized={!!profile?.avatar_url} />
                            <div>
                              <div className="text-sm font-medium text-white">
                                {profile?.display_name || user.email?.split('@')[0]}
                              </div>
                              <div className="text-xs text-gray-400">マイページを見る</div>
                            </div>
                          </div>
                        </Link>
                        <div className="border-t border-gray-700 my-1"></div>
                        <Link href="/me/articles" className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white">
                          自分の記事
                        </Link>
                        <Link href="/me/purchased" className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white">
                          購入した記事
                        </Link>
                        <Link href="/me/favorites" className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white">
                          お気に入り
                        </Link>
                        <Link href="/me/following" className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white">
                          フォロー中
                        </Link>
                        <div className="border-t border-gray-700 my-1"></div>
                        <Link href="/dashboard" className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white">
                          売上管理
                        </Link>
                        <Link href="/settings" className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white">
                          設定
                        </Link>
                        {profile?.is_admin && (
                          <>
                            <div className="border-t border-gray-700 my-1"></div>
                            <Link href="/admin" className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white">
                              管理画面
                            </Link>
                          </>
                        )}
                        <div className="border-t border-gray-700 my-1"></div>
                        <button
                          onClick={handleSignOut}
                          className="block w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-gray-800"
                          type="button"
                        >
                          ログアウト
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Mobile menu button */}
                <button
                  className="md:hidden p-2 text-gray-400"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  type="button"
                  aria-label={mobileMenuOpen ? 'メニューを閉じる' : 'メニューを開く'}
                  aria-expanded={mobileMenuOpen}
                >
                  {mobileMenuOpen ? <X className="w-6 h-6" aria-hidden="true" /> : <Menu className="w-6 h-6" aria-hidden="true" />}
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link href={loginUrl} className="px-4 py-2 text-gray-300 hover:text-white text-sm font-medium">
                  ログイン
                </Link>
                <Link href={signupUrl} className="px-4 py-2 bg-emerald-500 text-white rounded-full hover:bg-emerald-600 transition text-sm font-medium">
                  新規登録
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && user && (
        <nav className="md:hidden border-t border-gray-800 bg-gray-900" aria-label="モバイルナビゲーション">
          {/* Mobile Search */}
          <div className="px-4 py-3 border-b border-gray-800">
            <form onSubmit={handleSearch} role="search" aria-label="サイト内検索">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" aria-hidden="true" />
                <input
                  type="search"
                  placeholder="キーワードで探す"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  aria-label="検索キーワード"
                  className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-full text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </form>
          </div>

          {/* User Profile Section */}
          <Link
            href={`/users/${user?.id}`}
            className="flex items-center gap-3 px-4 py-4 border-b border-gray-800 hover:bg-gray-800"
            onClick={() => setMobileMenuOpen(false)}
          >
            <Image src={profile?.avatar_url || '/noicon.png'} alt="" width={48} height={48} className="w-12 h-12 rounded-full object-cover" unoptimized={!!profile?.avatar_url} />
            <div>
              <div className="font-medium text-white">
                {profile?.display_name || user.email?.split('@')[0]}
              </div>
              <div className="text-xs text-gray-400">マイページを見る</div>
            </div>
          </Link>

          <div className="py-2">
            {/* Main Actions */}
            <div className="px-4 py-2">
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">メニュー</div>
              <Link href="/" className="flex items-center gap-3 py-2.5 text-gray-300 hover:text-white" onClick={() => setMobileMenuOpen(false)}>
                ホーム
              </Link>
              <Link href="/articles" className="flex items-center gap-3 py-2.5 text-gray-300 hover:text-white" onClick={() => setMobileMenuOpen(false)}>
                記事を探す
              </Link>
              <Link href="/editor/new" className="flex items-center gap-3 py-2.5 text-gray-300 hover:text-white" onClick={() => setMobileMenuOpen(false)}>
                記事を投稿
              </Link>
            </div>

            <div className="border-t border-gray-800 my-2"></div>

            {/* My Content */}
            <div className="px-4 py-2">
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">マイコンテンツ</div>
              <Link href="/me/articles" className="flex items-center gap-3 py-2.5 text-gray-300 hover:text-white" onClick={() => setMobileMenuOpen(false)}>
                自分の記事
              </Link>
              <Link href="/me/favorites" className="flex items-center gap-3 py-2.5 text-gray-300 hover:text-white" onClick={() => setMobileMenuOpen(false)}>
                お気に入り
              </Link>
              <Link href="/me/following" className="flex items-center gap-3 py-2.5 text-gray-300 hover:text-white" onClick={() => setMobileMenuOpen(false)}>
                フォロー中
              </Link>
              <Link href="/dashboard" className="flex items-center gap-3 py-2.5 text-gray-300 hover:text-white" onClick={() => setMobileMenuOpen(false)}>
                売上管理
              </Link>
            </div>

            <div className="border-t border-gray-800 my-2"></div>

            {/* Settings */}
            <div className="px-4 py-2">
              <Link href="/settings" className="flex items-center gap-3 py-2.5 text-gray-300 hover:text-white" onClick={() => setMobileMenuOpen(false)}>
                設定
              </Link>
              {profile?.is_admin && (
                <Link href="/admin" className="flex items-center gap-3 py-2.5 text-gray-300 hover:text-white" onClick={() => setMobileMenuOpen(false)}>
                  管理画面
                </Link>
              )}
              <button
                onClick={() => {
                  handleSignOut()
                  setMobileMenuOpen(false)
                }}
                className="flex items-center gap-3 py-2.5 text-red-400 w-full text-left"
                type="button"
              >
                ログアウト
              </button>
            </div>
          </div>
        </nav>
      )}
    </header>
  )
}
