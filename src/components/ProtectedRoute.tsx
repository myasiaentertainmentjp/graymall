import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: ReactNode;
  requireAdmin?: boolean;
  requirePublisher?: boolean;
}

export default function ProtectedRoute({
  children,
  requireAdmin = false,
  requirePublisher = false,
}: ProtectedRouteProps) {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">読み込み中...</div>
      </div>
    );
  }

  if (!user) {
    // ログイン後に元のページに戻れるようにリダイレクトURLを渡す
    const returnUrl = location.pathname + location.search;
    return <Navigate to={`/signin?redirect=${encodeURIComponent(returnUrl)}`} replace />;
  }

  if (requireAdmin && !profile?.is_admin) {
    return <Navigate to="/" replace />;
  }

  if (requirePublisher && !profile?.can_publish) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
