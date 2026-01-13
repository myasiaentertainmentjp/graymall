import { ReactNode, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

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
    <div className="min-h-screen bg-white">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            {/* Left: Logo */}
            <div className="flex items-center gap-4">
              <Link to="/" className="flex items-center">
                <span className="text-xl font-bold text-gray-900">GrayMall</span>
              </Link>
            </div>

            {/* Center: Search (desktop) */}
            <div className="hidden md:flex flex-1 max-w-md mx-8">
              <form onSubmit={handleSearch} className="w-full">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="記事を検索..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-gray-100 border-0 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-gray-200"
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
                      className="flex items-center gap-1.5 px-4 py-2 bg-gray-900 text-white rounded-full text-sm font-medium hover:bg-gray-800 transition"
                    >
                      <PenSquare className="w-4 h-4" />
                      <span>投稿</span>
                    </Link>

                    {/* ユーザーメニュー */}
                    <div className="relative group">
                      <button className="flex items-center gap-1 ml-2 p-1.5 text-gray-600 hover:text-gray-900 rounded-full hover:bg-gray-100" type="button">
                        {profile?.avatar_url ? (
                          <img src={profile.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                            <User className="w-4 h-4 text-gray-500" />
                          </div>
                        )}
                        <ChevronDown className="w-4 h-4" />
                      </button>
                      <div className="absolute right-0 pt-2 w-52 hidden group-hover:block">
                        <div className="bg-white rounded-lg shadow-lg border border-gray-200 py-2">
                          <Link to={`/users/${user.id}`} className="block px-4 py-3 hover:bg-gray-50">
                            <div className="flex items-center gap-3">
                              {profile?.avatar_url ? (
                                <img src={profile.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover" />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                                  <User className="w-5 h-5 text-gray-500" />
                                </div>
                              )}
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {profile?.display_name || user.email?.split('@')[0]}
                                </div>
                                <div className="text-xs text-gray-500">マイページを見る</div>
                              </div>
                            </div>
                          </Link>
                          <div className="border-t border-gray-100 my-1"></div>
                          <Link to="/me/articles" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                            自分の記事
                          </Link>
                          <Link to="/dashboard" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                            売上管理
                          </Link>
                          <Link to="/settings" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                            設定
                          </Link>
                          {profile?.is_admin && (
                            <>
                              <div className="border-t border-gray-100 my-1"></div>
                              <Link to="/admin" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                                管理画面
                              </Link>
                            </>
                          )}
                          <div className="border-t border-gray-100 my-1"></div>
                          <button
                            onClick={handleSignOut}
                            className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50"
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
                    className="md:hidden p-2 text-gray-600"
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    type="button"
                  >
                    {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                  </button>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <Link to="/signin" className="px-4 py-2 text-gray-700 hover:text-gray-900 text-sm font-medium">
                    ログイン
                  </Link>
                  <Link to="/signup" className="px-4 py-2 bg-gray-900 text-white rounded-full hover:bg-gray-800 transition text-sm font-medium">
                    新規登録
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && user && (
          <div className="md:hidden border-t border-gray-200 bg-white">
            {/* Mobile Search */}
            <div className="px-4 py-3 border-b border-gray-100">
              <form onSubmit={handleSearch}>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="記事を検索..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-gray-100 border-0 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-gray-200"
                  />
                </div>
              </form>
            </div>

            {/* User Profile Section */}
            <Link
              to={`/users/${user?.id}`}
              className="flex items-center gap-3 px-4 py-4 border-b border-gray-100 hover:bg-gray-50"
              onClick={() => setMobileMenuOpen(false)}
            >
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="" className="w-12 h-12 rounded-full object-cover" />
              ) : (
                <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                  <User className="w-6 h-6 text-gray-500" />
                </div>
              )}
              <div>
                <div className="font-medium text-gray-900">
                  {profile?.display_name || user.email?.split('@')[0]}
                </div>
                <div className="text-xs text-gray-500">マイページを見る</div>
              </div>
            </Link>

            <div className="py-2">
              {/* Main Actions */}
              <div className="px-4 py-2">
                <div className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">メニュー</div>
                <Link to="/" className="flex items-center gap-3 py-2.5 text-gray-700" onClick={() => setMobileMenuOpen(false)}>
                  ホーム
                </Link>
                <Link to="/articles" className="flex items-center gap-3 py-2.5 text-gray-700" onClick={() => setMobileMenuOpen(false)}>
                  記事を探す
                </Link>
                <Link to="/editor/new" className="flex items-center gap-3 py-2.5 text-gray-700" onClick={() => setMobileMenuOpen(false)}>
                  記事を投稿
                </Link>
              </div>

              <div className="border-t border-gray-100 my-2"></div>

              {/* My Content */}
              <div className="px-4 py-2">
                <div className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">マイコンテンツ</div>
                <Link to="/me/articles" className="flex items-center gap-3 py-2.5 text-gray-700" onClick={() => setMobileMenuOpen(false)}>
                  自分の記事
                </Link>
                <Link to="/me/favorites" className="flex items-center gap-3 py-2.5 text-gray-700" onClick={() => setMobileMenuOpen(false)}>
                  お気に入り
                </Link>
                <Link to="/me/following" className="flex items-center gap-3 py-2.5 text-gray-700" onClick={() => setMobileMenuOpen(false)}>
                  フォロー中
                </Link>
                <Link to="/dashboard" className="flex items-center gap-3 py-2.5 text-gray-700" onClick={() => setMobileMenuOpen(false)}>
                  売上管理
                </Link>
              </div>

              <div className="border-t border-gray-100 my-2"></div>

              {/* Settings */}
              <div className="px-4 py-2">
                <Link to="/settings" className="flex items-center gap-3 py-2.5 text-gray-700" onClick={() => setMobileMenuOpen(false)}>
                  設定
                </Link>
                {profile?.is_admin && (
                  <Link to="/admin" className="flex items-center gap-3 py-2.5 text-gray-700" onClick={() => setMobileMenuOpen(false)}>
                    管理画面
                  </Link>
                )}
                <button
                  onClick={() => {
                    handleSignOut();
                    setMobileMenuOpen(false);
                  }}
                  className="flex items-center gap-3 py-2.5 text-red-600 w-full text-left"
                  type="button"
                >
                  ログアウト
                </button>
              </div>
            </div>
          </div>
        )}
      </header>

      <main className="bg-white">{children}</main>

      <Footer />
    </div>
  );
}
