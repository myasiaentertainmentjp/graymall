import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
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

  console.log('[ProtectedRoute] Checking access...');
  console.log('[ProtectedRoute] Loading:', loading);
  console.log('[ProtectedRoute] User:', user?.email || 'Not authenticated');
  console.log('[ProtectedRoute] Require admin:', requireAdmin);
  console.log('[ProtectedRoute] Require publisher:', requirePublisher);

  if (loading) {
    console.log('[ProtectedRoute] Still loading, showing loading screen');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">読み込み中...</div>
      </div>
    );
  }

  if (!user) {
    console.log('[ProtectedRoute] ✗ No user, redirecting to /signin');
    return <Navigate to="/signin" />;
  }

  if (requireAdmin && !profile?.is_admin) {
    console.log('[ProtectedRoute] ✗ Admin required but user is not admin, redirecting to /');
    return <Navigate to="/" />;
  }

  if (requirePublisher && !profile?.can_publish) {
    console.log('[ProtectedRoute] ✗ Publisher required but user cannot publish, redirecting to /');
    return <Navigate to="/" />;
  }

  console.log('[ProtectedRoute] ✓ Access granted');
  return <>{children}</>;
}
