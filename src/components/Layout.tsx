import { ReactNode, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { User, Menu, X, Search, PenSquare, ChevronDown } from 'lucide-react';
import Footer from './Footer';
import NotificationDropdown from './NotificationDropdown';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // ログイン後のリダイレクト用URL
  const currentPath = location.pathname + location.search;
  const loginUrl = currentPath !== '/' ? `/signin?redirect=${encodeURIComponent(currentPath)}` : '/signin';
  const signupUrl = currentPath !== '/' ? `/signup?redirect=${encodeURIComponent(currentPath)}` : '/signup';

  const handleSignOut = async () => {
    await signOut();
    navigate('/signin');
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/articles?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  return (
    <div className="min-h-screen bg-black">
      {/* アクセシビリティ: スキップリンク */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[100] focus:px-4 focus:py-2 focus:bg-emerald-500 focus:text-white focus:rounded-lg focus:outline-none"
      >
        本文へスキップ
      </a>

      <header className="bg-black border-b border-gray-800 sticky top-0 z-50" role="banner">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            {/* Left: Logo */}
            <div className="flex items-center gap-4">
              <Link to="/" className="flex items-center">
                <img src="/logo-white.png" alt="GrayMall" className="h-6 sm:h-7" />
              </Link>
            </div>

            {/* Center: Search (desktop) */}
            <div className="hidden md:flex flex-1 max-w-md mx-8">
              <form onSubmit={handleSearch} className="w-full">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    type="text"
                    placeholder="キーワードで探す"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
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
                      to="/editor/new"
                      className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500 text-white rounded-full text-sm font-medium hover:bg-emerald-600 transition"
                    >
                      <PenSquare className="w-4 h-4" />
                      <span>投稿</span>
                    </Link>

                    {/* ユーザーメニュー */}
                    <div className="relative group">
                      <button className="flex items-center gap-1 ml-2 p-1.5 text-gray-400 hover:text-white rounded-full hover:bg-gray-800" type="button">
                        {profile?.avatar_url ? (
                          <img src={profile.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center">
                            <User className="w-4 h-4 text-gray-400" />
                          </div>
                        )}
                        <ChevronDown className="w-4 h-4" />
                      </button>
                      <div className="absolute right-0 pt-2 w-52 hidden group-hover:block">
                        <div className="bg-gray-900 rounded-lg shadow-lg border border-gray-700 py-2">
                          <Link to={`/users/${user.id}`} className="block px-4 py-3 hover:bg-gray-800">
                            <div className="flex items-center gap-3">
                              {profile?.avatar_url ? (
                                <img src={profile.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover" />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center">
                                  <User className="w-5 h-5 text-gray-400" />
                                </div>
                              )}
                              <div>
                                <div className="text-sm font-medium text-white">
                                  {profile?.display_name || user.email?.split('@')[0]}
                                </div>
                                <div className="text-xs text-gray-400">マイページを見る</div>
                              </div>
                            </div>
                          </Link>
                          <div className="border-t border-gray-700 my-1"></div>
                          <Link to="/me/articles" className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white">
                            自分の記事
                          </Link>
                          <Link to="/me/purchased" className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white">
                            購入した記事
                          </Link>
                          <Link to="/me/favorites" className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white">
                            お気に入り
                          </Link>
                          <Link to="/me/following" className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white">
                            フォロー中
                          </Link>
                          <div className="border-t border-gray-700 my-1"></div>
                          <Link to="/dashboard" className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white">
                            売上管理
                          </Link>
                          <Link to="/settings" className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white">
                            設定
                          </Link>
                          {profile?.is_admin && (
                            <>
                              <div className="border-t border-gray-700 my-1"></div>
                              <Link to="/admin" className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white">
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
                  >
                    {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                  </button>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <Link to={loginUrl} className="px-4 py-2 text-gray-300 hover:text-white text-sm font-medium">
                    ログイン
                  </Link>
                  <Link to={signupUrl} className="px-4 py-2 bg-emerald-500 text-white rounded-full hover:bg-emerald-600 transition text-sm font-medium">
                    新規登録
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && user && (
          <div className="md:hidden border-t border-gray-800 bg-gray-900">
            {/* Mobile Search */}
            <div className="px-4 py-3 border-b border-gray-800">
              <form onSubmit={handleSearch}>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    type="text"
                    placeholder="キーワードで探す"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-full text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </form>
            </div>

            {/* User Profile Section */}
            <Link
              to={`/users/${user?.id}`}
              className="flex items-center gap-3 px-4 py-4 border-b border-gray-800 hover:bg-gray-800"
              onClick={() => setMobileMenuOpen(false)}
            >
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="" className="w-12 h-12 rounded-full object-cover" />
              ) : (
                <div className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center">
                  <User className="w-6 h-6 text-gray-400" />
                </div>
              )}
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
                <Link to="/" className="flex items-center gap-3 py-2.5 text-gray-300 hover:text-white" onClick={() => setMobileMenuOpen(false)}>
                  ホーム
                </Link>
                <Link to="/articles" className="flex items-center gap-3 py-2.5 text-gray-300 hover:text-white" onClick={() => setMobileMenuOpen(false)}>
                  記事を探す
                </Link>
                <Link to="/editor/new" className="flex items-center gap-3 py-2.5 text-gray-300 hover:text-white" onClick={() => setMobileMenuOpen(false)}>
                  記事を投稿
                </Link>
              </div>

              <div className="border-t border-gray-800 my-2"></div>

              {/* My Content */}
              <div className="px-4 py-2">
                <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">マイコンテンツ</div>
                <Link to="/me/articles" className="flex items-center gap-3 py-2.5 text-gray-300 hover:text-white" onClick={() => setMobileMenuOpen(false)}>
                  自分の記事
                </Link>
                <Link to="/me/favorites" className="flex items-center gap-3 py-2.5 text-gray-300 hover:text-white" onClick={() => setMobileMenuOpen(false)}>
                  お気に入り
                </Link>
                <Link to="/me/following" className="flex items-center gap-3 py-2.5 text-gray-300 hover:text-white" onClick={() => setMobileMenuOpen(false)}>
                  フォロー中
                </Link>
                <Link to="/dashboard" className="flex items-center gap-3 py-2.5 text-gray-300 hover:text-white" onClick={() => setMobileMenuOpen(false)}>
                  売上管理
                </Link>
              </div>

              <div className="border-t border-gray-800 my-2"></div>

              {/* Settings */}
              <div className="px-4 py-2">
                <Link to="/settings" className="flex items-center gap-3 py-2.5 text-gray-300 hover:text-white" onClick={() => setMobileMenuOpen(false)}>
                  設定
                </Link>
                {profile?.is_admin && (
                  <Link to="/admin" className="flex items-center gap-3 py-2.5 text-gray-300 hover:text-white" onClick={() => setMobileMenuOpen(false)}>
                    管理画面
                  </Link>
                )}
                <button
                  onClick={() => {
                    handleSignOut();
                    setMobileMenuOpen(false);
                  }}
                  className="flex items-center gap-3 py-2.5 text-red-400 w-full text-left"
                  type="button"
                >
                  ログアウト
                </button>
              </div>
            </div>
          </div>
        )}
      </header>

      <main id="main-content" className="bg-black" role="main">{children}</main>

      <Footer />
    </div>
  );
}
