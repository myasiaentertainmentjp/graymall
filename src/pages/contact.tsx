// src/pages/contact.tsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { supabase } from '../lib/supabase';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    category: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('send-contact-email', {
        body: formData,
      });

      if (fnError) {
        throw fnError;
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      setSubmitted(true);
    } catch (err) {
      console.error('送信エラー:', err);
      setError('送信に失敗しました。時間をおいて再度お試しください。');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  if (submitted) {
    return (
      <Layout>
        <div className="max-w-3xl mx-auto px-4 py-12">
          <h1 className="text-2xl font-bold text-gray-900 mb-6 pb-4 border-b-2 border-gray-200">お問い合わせ</h1>
          <div className="text-center py-12 bg-green-50 rounded-lg border border-green-200">
            <p className="text-green-800 mb-2">お問い合わせを受け付けました。</p>
            <p className="text-green-800 mb-2">内容を確認の上、必要に応じてご連絡いたします。</p>
            <p className="text-green-800">通常、3〜5営業日以内にご返信いたします。</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-2xl font-bold text-gray-900 mb-6 pb-4 border-b-2 border-gray-200">お問い合わせ</h1>

        <p className="text-gray-600 leading-relaxed mb-6">
          グレーモールに関するお問い合わせは、以下のフォームよりお願いいたします。
        </p>

        {/* 運営者連絡先ブロック */}
        <div className="bg-gray-50 p-5 rounded-lg mb-6">
          <h2 className="font-semibold text-gray-800 mb-3">運営者連絡先</h2>
          <dl className="space-y-2 text-sm">
            <div className="flex">
              <dt className="text-gray-600 w-24 flex-shrink-0">運営者</dt>
              <dd className="text-gray-800">合同会社マイアジアエンターテインメント</dd>
            </div>
            <div className="flex">
              <dt className="text-gray-600 w-24 flex-shrink-0">メール</dt>
              <dd><a href="mailto:info@graymall.jp" className="text-blue-600 hover:underline">info@graymall.jp</a></dd>
            </div>
            <div className="flex">
              <dt className="text-gray-600 w-24 flex-shrink-0">電話</dt>
              <dd className="text-gray-800">090-5835-6898</dd>
            </div>
            <div className="flex">
              <dt className="text-gray-600 w-24 flex-shrink-0">受付時間</dt>
              <dd className="text-gray-800">平日10:00〜18:00（年末年始を除く）</dd>
            </div>
          </dl>
          <p className="text-sm text-gray-500 mt-3">受付時間外はメールにてお願いいたします。</p>
        </div>

        {/* プライバシーポリシーへのリンク */}
        <p className="text-sm text-gray-600 mb-6">
          送信いただいた内容は、<Link to="/privacy" className="text-blue-600 hover:underline">プライバシーポリシー</Link>に従って取り扱います。
        </p>

        {/* 注意書き */}
        <p className="text-sm text-gray-500 mb-8">
          ※内容によっては、ご返信までお時間をいただく場合や、ご回答いたしかねる場合がございます。
        </p>

        <section className="mb-8">

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex flex-col gap-2">
              <label htmlFor="name" className="font-medium text-gray-700">
                お名前 <span className="text-red-600 text-xs">必須</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="山田 太郎"
                className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="email" className="font-medium text-gray-700">
                メールアドレス <span className="text-red-600 text-xs">必須</span>
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="example@email.com"
                className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-sm text-gray-500">登録済みの方は、登録メールアドレスをご入力ください</p>
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="category" className="font-medium text-gray-700">
                お問い合わせ種別 <span className="text-red-600 text-xs">必須</span>
              </label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
                className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              >
                <option value="">選択してください</option>
                <option value="account">アカウント・ログインについて</option>
                <option value="purchase">購入について</option>
                <option value="sales">出品・販売について</option>
                <option value="payment">売上・出金について</option>
                <option value="report">コンテンツの通報</option>
                <option value="other">その他</option>
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="message" className="font-medium text-gray-700">
                お問い合わせ内容 <span className="text-red-600 text-xs">必須</span>
              </label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                required
                rows={8}
                placeholder="お問い合わせ内容をご記入ください"
                className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y"
              />
              <p className="text-sm text-gray-500">
                ※トラブル報告の場合は、該当のコンテンツURL・取引ID・発生日時などをご記載いただくとスムーズです。
              </p>
            </div>

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            <div className="pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 bg-gray-900 text-white rounded-lg font-semibold hover:bg-gray-800 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isSubmitting ? '送信中...' : '送信する'}
              </button>
            </div>
          </form>
        </section>
      </div>
    </Layout>
  );
}
