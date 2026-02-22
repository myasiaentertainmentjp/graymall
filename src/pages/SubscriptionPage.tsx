// src/pages/SubscriptionPage.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';
import { Crown, Check, Clock, Link as LinkIcon, Zap, ChevronLeft, ChevronDown } from 'lucide-react';
import { supabase } from '../lib/supabase';

const PREMIUM_PRICE = 1480; // 月額料金

export default function SubscriptionPage() {
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const isPremium = profile?.is_premium === true;

  const faqs = [
    {
      question: 'いつでも解約できますか？',
      answer: 'はい、いつでも解約できます。解約後も請求期間の終了まで引き続きプレミアム機能をご利用いただけます。',
    },
    {
      question: '支払い方法は何が使えますか？',
      answer: 'クレジットカード（Visa, Mastercard, American Express, JCB）でお支払いいただけます。',
    },
    {
      question: '領収書は発行できますか？',
      answer: 'はい、サブスクリプション管理ページから領収書をダウンロードいただけます。',
    },
  ];

  const handleSubscribe = async () => {
    if (!user) {
      navigate('/signin');
      return;
    }

    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        navigate('/signin');
        return;
      }

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout-session`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'subscription',
          priceId: 'price_1SkElqPsY7LQxSBLh4zxd8Zj',
        }),
      });

      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else if (data.error) {
        alert(`エラー: ${data.error}`);
      }
    } catch (error) {
      console.error('Subscription error:', error);
      alert('サブスクリプション処理中にエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        navigate('/signin');
        return;
      }

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-portal-session`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else if (data.error) {
        alert(`エラー: ${data.error}`);
      }
    } catch (error) {
      console.error('Portal error:', error);
      alert('管理ページへのアクセス中にエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  const features = [
    {
      icon: Clock,
      title: 'アフィリエイト率変更',
      free: '7日に1回',
      premium: '24時間に1回',
    },
    {
      icon: LinkIcon,
      title: 'カスタムリンク',
      free: '利用不可',
      premium: '2つまで設定可能',
    },
    {
      icon: Zap,
      title: '今後追加される新機能',
      free: '一部制限あり',
      premium: '優先アクセス',
    },
  ];

  return (
    <Layout>
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 mb-6"
        >
          <ChevronLeft className="w-4 h-4" />
          戻る
        </button>

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full mb-4">
            <Crown className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">グレーモール プレミアム</h1>
          <p className="text-gray-600">
            より柔軟な設定と特別な機能でコンテンツ販売を強化
          </p>
        </div>

        {/* Current Status */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">現在のプラン</p>
              <p className="text-lg font-semibold text-gray-900">
                {isPremium ? 'プレミアム' : '無料プラン'}
              </p>
            </div>
            {isPremium && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-100 text-amber-800 text-sm font-medium rounded-full">
                <Crown className="w-4 h-4" />
                アクティブ
              </span>
            )}
          </div>
        </div>

        {/* Comparison Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-6">
          <div className="grid grid-cols-3 bg-gray-50 border-b border-gray-200">
            <div className="p-4 text-sm font-medium text-gray-700">機能</div>
            <div className="p-4 text-sm font-medium text-gray-700 text-center">無料</div>
            <div className="p-4 text-sm font-medium text-gray-700 text-center">
              <span className="inline-flex items-center gap-1">
                <Crown className="w-4 h-4 text-amber-500" />
                プレミアム
              </span>
            </div>
          </div>

          {features.map((feature, index) => (
            <div
              key={index}
              className={`grid grid-cols-3 ${index !== features.length - 1 ? 'border-b border-gray-100' : ''}`}
            >
              <div className="p-4 flex items-center gap-3">
                <feature.icon className="w-5 h-5 text-gray-400" />
                <span className="text-sm text-gray-900">{feature.title}</span>
              </div>
              <div className="p-4 text-sm text-gray-600 text-center flex items-center justify-center">
                {feature.free}
              </div>
              <div className="p-4 text-sm text-gray-900 font-medium text-center flex items-center justify-center gap-1">
                <Check className="w-4 h-4 text-green-500" />
                {feature.premium}
              </div>
            </div>
          ))}
        </div>

        {/* Pricing */}
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-6 text-white mb-6">
          <div className="flex items-baseline gap-1 mb-2">
            <span className="text-4xl font-bold">¥{PREMIUM_PRICE.toLocaleString()}</span>
            <span className="text-gray-400">/月</span>
          </div>
          <p className="text-gray-300 text-sm mb-6">
            いつでもキャンセル可能 ・ 次回請求日まで利用可能
          </p>

          {isPremium ? (
            <button
              onClick={handleManageSubscription}
              disabled={loading}
              className="w-full py-3 bg-white text-gray-900 rounded-lg font-medium hover:bg-gray-100 transition disabled:opacity-50"
            >
              {loading ? '処理中...' : 'サブスクリプションを管理'}
            </button>
          ) : (
            <button
              onClick={handleSubscribe}
              disabled={loading}
              className="w-full py-3 bg-amber-500 text-white rounded-lg font-medium hover:bg-amber-600 transition disabled:opacity-50"
            >
              {loading ? '処理中...' : 'プレミアムに登録する'}
            </button>
          )}
        </div>

        {/* FAQ */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">よくある質問</h2>

          <div className="divide-y divide-gray-200">
            {faqs.map((faq, index) => (
              <div key={index} className="py-4 first:pt-0 last:pb-0">
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full flex items-center justify-between text-left"
                >
                  <h3 className="text-sm font-medium text-gray-900 pr-4">
                    {faq.question}
                  </h3>
                  <ChevronDown
                    className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform ${
                      openFaq === index ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {openFaq === index && (
                  <p className="mt-3 text-sm text-gray-600 leading-relaxed">
                    {faq.answer}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}
