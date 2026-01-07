  // src/pages/EarningsDashboard.tsx
  import { useState, useEffect } from 'react';
  import { supabase } from '../lib/supabase';
  import { useAuth } from '../contexts/AuthContext';

  interface AuthorStats {
    total_sales_count: number;
    gross_revenue: number;
    total_platform_fee: number;
    total_affiliate_paid: number;
    net_earnings: number;
    transferred_amount: number;
    pending_transfer: number;
  }

  interface AffiliateStats {
    referral_count: number;
    referred_sales: number;
    total_earnings: number;
    transferred_amount: number;
    pending_transfer: number;
  }

  export default function EarningsDashboard() {
    const { user } = useAuth();
    const [authorStats, setAuthorStats] = useState<AuthorStats | null>(null);
    const [affiliateStats, setAffiliateStats] = useState<AffiliateStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      if (user) {
        fetchStats();
      }
    }, [user]);

    const fetchStats = async () => {
      // 作者としての売上
      const { data: authorData } = await supabase
        .from('author_dashboard')
        .select('*')
        .eq('user_id', user!.id)
        .single();

      setAuthorStats(authorData);

      // アフィリエイターとしての報酬
      const { data: affiliateData } = await supabase
        .from('affiliate_dashboard')
        .select('*')
        .eq('user_id', user!.id)
        .single();

      setAffiliateStats(affiliateData);
      setLoading(false);
    };

    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat('ja-JP', {
        style: 'currency',
        currency: 'JPY',
      }).format(amount || 0);
    };

    if (loading) {
      return <div className="p-8">読み込み中...</div>;
    }

    return (
      <div className="max-w-4xl mx-auto p-8">
        <h1 className="text-2xl font-bold mb-8">収益ダッシュボード</h1>

        {/* 作者としての売上 */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold mb-6">記事売上</h2>

          {authorStats ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-500">総売上</p>
                <p className="text-2xl font-bold">{formatCurrency(authorStats.gross_revenue)}</p>
                <p className="text-sm text-gray-500">{authorStats.total_sales_count}件</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-500">手数料（10%）</p>
                <p className="text-2xl font-bold text-red-600">-{formatCurrency(authorStats.total_platform_fee)}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-500">アフィリ支払い</p>
                <p className="text-2xl font-bold text-orange-600">-{formatCurrency(authorStats.total_affiliate_paid)}</p>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-gray-500">手取り</p>
                <p className="text-2xl font-bold text-blue-600">{formatCurrency(authorStats.net_earnings)}</p>
              </div>
            </div>
          ) : (
            <p className="text-gray-500">まだ売上がありません</p>
          )}

          {authorStats && (
            <div className="mt-6 pt-6 border-t">
              <div className="flex justify-between">
                <div>
                  <p className="text-sm text-gray-500">送金済み</p>
                  <p className="font-semibold text-green-600">{formatCurrency(authorStats.transferred_amount)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">送金待ち</p>
                  <p className="font-semibold text-yellow-600">{formatCurrency(authorStats.pending_transfer)}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* アフィリエイト報酬 */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-6">アフィリエイト報酬</h2>

          {affiliateStats ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-500">紹介件数</p>
                <p className="text-2xl font-bold">{affiliateStats.referral_count}件</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-500">紹介売上</p>
                <p className="text-2xl font-bold">{formatCurrency(affiliateStats.referred_sales)}</p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <p className="text-sm text-gray-500">報酬合計</p>
                <p className="text-2xl font-bold text-purple-600">{formatCurrency(affiliateStats.total_earnings)}</p>
              </div>
            </div>
          ) : (
            <p className="text-gray-500">まだアフィリエイト報酬がありません</p>
          )}

          {affiliateStats && (
            <div className="mt-6 pt-6 border-t">
              <div className="flex justify-between">
                <div>
                  <p className="text-sm text-gray-500">送金済み</p>
                  <p className="font-semibold text-green-600">{formatCurrency(affiliateStats.transferred_amount)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">送金待ち</p>
                  <p className="font-semibold text-yellow-600">{formatCurrency(affiliateStats.pending_transfer)}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }
