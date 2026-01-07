// src/pages/CardRegistrationPage.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import Layout from '../components/Layout';
import { CreditCard, ChevronLeft, CheckCircle, AlertCircle, Loader2, Trash2 } from 'lucide-react';

type SavedCard = {
  id: string;
  brand: string;
  last4: string;
  exp_month: number;
  exp_year: number;
  is_default: boolean;
};

export default function CardRegistrationPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [cards, setCards] = useState<SavedCard[]>([]);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (user) {
      loadCards();
    }
  }, [user]);

  const loadCards = async () => {
    setLoading(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session?.access_token) return;

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-payment-methods`,
        {
          headers: {
            Authorization: `Bearer ${sessionData.session.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setCards(data.cards || []);
      }
    } catch (error) {
      console.error('Failed to load cards:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCard = async () => {
    setActionLoading(true);
    setMessage(null);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session?.access_token) {
        navigate('/signin');
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-setup-intent`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${sessionData.session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            returnUrl: `${window.location.origin}/settings/card?success=true`,
          }),
        }
      );

      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else if (data.error) {
        setMessage({ type: 'error', text: data.error });
      }
    } catch (error) {
      console.error('Failed to add card:', error);
      setMessage({ type: 'error', text: 'カード登録画面の表示に失敗しました' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteCard = async (cardId: string) => {
    if (!confirm('このカードを削除しますか？')) return;

    setActionLoading(true);
    setMessage(null);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session?.access_token) return;

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-payment-method`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${sessionData.session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ paymentMethodId: cardId }),
        }
      );

      if (response.ok) {
        setMessage({ type: 'success', text: 'カードを削除しました' });
        await loadCards();
      } else {
        const data = await response.json();
        setMessage({ type: 'error', text: data.error || 'カードの削除に失敗しました' });
      }
    } catch (error) {
      console.error('Failed to delete card:', error);
      setMessage({ type: 'error', text: 'カードの削除に失敗しました' });
    } finally {
      setActionLoading(false);
    }
  };

  const getCardBrandIcon = (brand: string) => {
    const brandLower = brand.toLowerCase();
    switch (brandLower) {
      case 'visa':
        return 'Visa';
      case 'mastercard':
        return 'Mastercard';
      case 'amex':
        return 'Amex';
      case 'jcb':
        return 'JCB';
      default:
        return brand;
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Back button */}
        <button
          onClick={() => navigate('/settings')}
          className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 mb-6"
        >
          <ChevronLeft className="w-4 h-4" />
          設定に戻る
        </button>

        <div className="flex items-center gap-3 mb-6">
          <CreditCard className="w-6 h-6 text-gray-700" />
          <h1 className="text-2xl font-bold text-gray-900">クレジットカード登録</h1>
        </div>

        {/* Message */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
            message.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {message.type === 'success' ? (
              <CheckCircle className="w-5 h-5 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        {/* Description */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-blue-800">
            記事を購入する際に使用するクレジットカードを登録できます。
            カード情報は安全に暗号化されて保存されます。
          </p>
        </div>

        {/* Card List */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden mb-6">
          <div className="p-4 border-b border-gray-200">
            <h2 className="font-semibold text-gray-900">登録済みカード</h2>
          </div>

          {cards.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <CreditCard className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>登録されているカードはありません</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {cards.map(card => (
                <div key={card.id} className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-8 bg-gray-100 rounded flex items-center justify-center text-xs font-medium text-gray-600">
                      {getCardBrandIcon(card.brand)}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        •••• {card.last4}
                      </p>
                      <p className="text-sm text-gray-500">
                        有効期限: {card.exp_month.toString().padStart(2, '0')}/{card.exp_year}
                      </p>
                    </div>
                    {card.is_default && (
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                        デフォルト
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => handleDeleteCard(card.id)}
                    disabled={actionLoading}
                    className="p-2 text-gray-400 hover:text-red-600 transition disabled:opacity-50"
                    title="カードを削除"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add Card Button */}
        <button
          onClick={handleAddCard}
          disabled={actionLoading}
          className="w-full flex items-center justify-center gap-2 bg-gray-900 text-white py-3 rounded-lg font-medium hover:bg-gray-800 transition disabled:opacity-50"
        >
          {actionLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <CreditCard className="w-5 h-5" />
          )}
          <span>{actionLoading ? '処理中...' : 'カードを追加'}</span>
        </button>

        {/* Notes */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg text-sm text-gray-600">
          <h3 className="font-medium text-gray-700 mb-2">ご利用可能なカード</h3>
          <ul className="list-disc list-inside space-y-1">
            <li>Visa</li>
            <li>Mastercard</li>
            <li>American Express</li>
            <li>JCB</li>
          </ul>
        </div>
      </div>
    </Layout>
  );
}
