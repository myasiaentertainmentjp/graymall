// src/App.tsx
import { BrowserRouter as Router, Routes, Route, Navigate, useSearchParams, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// ページ遷移時にスクロール位置をトップに戻すコンポーネント
function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

  import Home from './pages/Home';
  import SignIn from './pages/SignIn';
  import SignUp from './pages/SignUp';
  import ForgotPassword from './pages/ForgotPassword';
  import ArticleList from './pages/ArticleList';
  import ArticleDetail from './pages/ArticleDetail';
  import MyArticles from './pages/MyArticles';
  import Editor from './pages/Editor';
  import SalesManagement from './pages/SalesManagement';
  import AdminDashboard from './pages/AdminDashboard';
  import AdminReviewArticle from './pages/AdminReviewArticle';
  import AdminHomepageManager from './pages/AdminHomepageManager';
  import Profile from './pages/Profile';
import UserProfile from './pages/UserProfile';
import PreviewArticle from './pages/PreviewArticle';
import PublishConfirm from './pages/PublishConfirm';
import PaymentSettingsPage from './pages/PaymentSettingsPage';
import CardRegistrationPage from './pages/CardRegistrationPage';
import Settings from './pages/Settings';
import SubscriptionPage from './pages/SubscriptionPage';
import ArticleSettings from './pages/ArticleSettings';
import WithdrawalPage from './pages/WithdrawalPage';
import LikedArticles from './pages/LikedArticles';
import PurchasedArticles from './pages/PurchasedArticles';
import FavoriteArticles from './pages/FavoriteArticles';
import RecentArticles from './pages/RecentArticles';

// 法務・補助ページ
import TermsPage from './pages/terms';
import PrivacyPage from './pages/privacy';
import LawPage from './pages/law';
import GuidelinesPage from './pages/guidelines';
import PaymentsInfoPage from './pages/payments';
import FAQPage from './pages/faq';
import ContactPage from './pages/contact';
import CompanyPage from './pages/company';

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
    <AuthProvider>
      <Router>
        <ScrollToTop />
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
        </Router>
      </AuthProvider>
    );
  }

  export default App;