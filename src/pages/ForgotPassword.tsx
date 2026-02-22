import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const { resetPassword } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setLoading(true);

    console.log('[ForgotPassword] Form submitted');
    console.log('[ForgotPassword] Email:', email);

    const { error } = await resetPassword(email);

    if (error) {
      console.error('[ForgotPassword] ✗ Password reset failed:', error.message);
      setError(error.message);
    } else {
      console.log('[ForgotPassword] ✓ Password reset email sent');
      setSuccess(true);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">グレーモール</h1>
          <p className="text-gray-600 mt-2">パスワードリセット</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded">
            パスワードリセット用のメールを送信しました。メールをご確認ください。
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              メールアドレス
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gray-900 text-white py-3 rounded-lg font-medium hover:bg-gray-800 transition disabled:opacity-50"
          >
            {loading ? '送信中...' : 'リセットメールを送信'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-600">
          <Link to="/signin" className="text-blue-600 hover:underline">
            サインインに戻る
          </Link>
        </div>
      </div>
    </div>
  );
}
