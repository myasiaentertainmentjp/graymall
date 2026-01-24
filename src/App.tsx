// src/App.tsx
import { BrowserRouter as Router, Routes, Route, Navigate, useSearchParams, useLocation } from 'react-router-dom';
import { useEffect, Suspense, lazy } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import { Loader2 } from 'lucide-react';

// React Query クライアント設定
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5分間はキャッシュを新鮮とみなす
      gcTime: 1000 * 60 * 30,   // 30分間キャッシュを保持
      refetchOnWindowFocus: false, // ウィンドウフォーカス時の再取得を無効化
      retry: 1, // 失敗時は1回だけリトライ
    },
  },
});

// ページ遷移時にスクロール位置をトップに戻すコンポーネント
function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

// ローディング表示
function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
    </div>
  );
}

// 優先度高：即座に読み込み（初回アクセスが多いページ）
import Home from './pages/Home';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import ArticleList from './pages/ArticleList';
import ArticleDetail from './pages/ArticleDetail';

// 遅延読み込み：必要時にロード
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const MyArticles = lazy(() => import('./pages/MyArticles'));
const Editor = lazy(() => import('./pages/Editor'));
const SalesManagement = lazy(() => import('./pages/SalesManagement'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const AdminReviewArticle = lazy(() => import('./pages/AdminReviewArticle'));
const AdminHomepageManager = lazy(() => import('./pages/AdminHomepageManager'));
const AdminArticleEdit = lazy(() => import('./pages/AdminArticleEdit'));
const Profile = lazy(() => import('./pages/Profile'));
const UserProfile = lazy(() => import('./pages/UserProfile'));
const PreviewArticle = lazy(() => import('./pages/PreviewArticle'));
const PublishConfirm = lazy(() => import('./pages/PublishConfirm'));
const PaymentSettingsPage = lazy(() => import('./pages/PaymentSettingsPage'));
const CardRegistrationPage = lazy(() => import('./pages/CardRegistrationPage'));
const Settings = lazy(() => import('./pages/Settings'));
const SubscriptionPage = lazy(() => import('./pages/SubscriptionPage'));
const ArticleSettings = lazy(() => import('./pages/ArticleSettings'));
const WithdrawalPage = lazy(() => import('./pages/WithdrawalPage'));
const LikedArticles = lazy(() => import('./pages/LikedArticles'));
const PurchasedArticles = lazy(() => import('./pages/PurchasedArticles'));
const FavoriteArticles = lazy(() => import('./pages/FavoriteArticles'));
const RecentArticles = lazy(() => import('./pages/RecentArticles'));
const FollowingUsers = lazy(() => import('./pages/FollowingUsers'));

// 法務・補助ページ（遅延読み込み）
const TermsPage = lazy(() => import('./pages/terms'));
const PrivacyPage = lazy(() => import('./pages/privacy'));
const LawPage = lazy(() => import('./pages/law'));
const GuidelinesPage = lazy(() => import('./pages/guidelines'));
const PaymentsInfoPage = lazy(() => import('./pages/payments'));
const FAQPage = lazy(() => import('./pages/faq'));
const ContactPage = lazy(() => import('./pages/contact'));
const CompanyPage = lazy(() => import('./pages/company'));

// /write からのリダイレクト用コンポーネント
function WriteRedirect() {
  const [searchParams] = useSearchParams();
  const id = searchParams.get('id');

  if (id) {
    return <Navigate to={`/editor/${id}`} replace />;
  }
  return <Navigate to="/editor/new" replace />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <ScrollToTop />
          <Suspense fallback={<PageLoader />}>
            <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/signin" element={<SignIn />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />

            <Route path="/articles" element={<ArticleList />} />
            <Route path="/articles/:slug" element={<ArticleDetail />} />

            <Route
              path="/me/articles"
              element={
                <ProtectedRoute>
                  <MyArticles />
                </ProtectedRoute>
              }
            />

            <Route
              path="/me/liked"
              element={
                <ProtectedRoute>
                  <LikedArticles />
                </ProtectedRoute>
              }
            />

            <Route
              path="/me/purchased"
              element={
                <ProtectedRoute>
                  <PurchasedArticles />
                </ProtectedRoute>
              }
            />

            <Route
              path="/me/favorites"
              element={
                <ProtectedRoute>
                  <FavoriteArticles />
                </ProtectedRoute>
              }
            />

            <Route
              path="/me/recent"
              element={
                <ProtectedRoute>
                  <RecentArticles />
                </ProtectedRoute>
              }
            />

            <Route
              path="/me/following"
              element={
                <ProtectedRoute>
                  <FollowingUsers />
                </ProtectedRoute>
              }
            />

            <Route
              path="/editor/new"
              element={
                <ProtectedRoute>
                  <Editor />
                </ProtectedRoute>
              }
            />
            <Route
              path="/editor/:id"
              element={
                <ProtectedRoute>
                  <Editor />
                </ProtectedRoute>
              }
            />

            {/* 後方互換: /write → /editor へリダイレクト */}
            <Route path="/write" element={<WriteRedirect />} />

            <Route
              path="/preview/:id"
              element={
                <ProtectedRoute>
                  <PreviewArticle />
                </ProtectedRoute>
              }
            />

            <Route
              path="/publish/:id"
              element={
                <ProtectedRoute>
                  <PublishConfirm />
                </ProtectedRoute>
              }
            />

            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <SalesManagement />
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin"
              element={
                <ProtectedRoute requireAdmin>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin/review/:id"
              element={
                <ProtectedRoute requireAdmin>
                  <AdminReviewArticle />
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin/homepage"
              element={
                <ProtectedRoute requireAdmin>
                  <AdminHomepageManager />
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin/article/:id"
              element={
                <ProtectedRoute requireAdmin>
                  <AdminArticleEdit />
                </ProtectedRoute>
              }
            />

            <Route path="/users/:id" element={<UserProfile />} />

            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />

            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              }
            />

            <Route
              path="/settings/payments"
              element={
                <ProtectedRoute>
                  <PaymentSettingsPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/settings/card"
              element={
                <ProtectedRoute>
                  <CardRegistrationPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/settings/subscription"
              element={
                <ProtectedRoute>
                  <SubscriptionPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/article/:id/settings"
              element={
                <ProtectedRoute>
                  <ArticleSettings />
                </ProtectedRoute>
              }
            />

            <Route
              path="/withdrawal"
              element={
                <ProtectedRoute>
                  <WithdrawalPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/my-articles"
              element={
                <ProtectedRoute>
                  <MyArticles />
                </ProtectedRoute>
              }
            />

            {/* 法務・補助ページ */}
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/law" element={<LawPage />} />
            <Route path="/guidelines" element={<GuidelinesPage />} />
            <Route path="/payments" element={<PaymentsInfoPage />} />
            <Route path="/faq" element={<FAQPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/company" element={<CompanyPage />} />
            </Routes>
          </Suspense>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
