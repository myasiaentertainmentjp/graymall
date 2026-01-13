import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function SignUp() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setLoading(true);

    console.log('[SignUp] Form submitted');
    console.log('[SignUp] Email:', email);
    console.log('[SignUp] Display name:', displayName);

    if (password.length < 6) {
      const errorMsg = 'パスワードは6文字以上である必要があります';
      console.log('[SignUp] ✗ Validation error:', errorMsg);
      setError(errorMsg);
      setLoading(false);
      return;
    }

    const { error: signUpError, user } = await signUp(email, password, displayName);

    if (signUpError) {
      console.error('[SignUp] ✗ Sign up failed:', signUpError.message);
      setError(signUpError.message);
      setLoading(false);
    } else {
      console.log('[SignUp] ✓ Sign up successful!');
      console.log('[SignUp] User ID:', user?.id);
      console.log('[SignUp] Email:', user?.email);

      // GTM: 会員登録完了イベント
      if (typeof window !== 'undefined' && window.dataLayer) {
        window.dataLayer.push({
          event: 'sign_up',
          method: 'email',
          user_id: user?.id,
        });
        console.log('[GTM] sign_up event pushed');
      }

      setSuccess(true);
      setLoading(false);

      setTimeout(() => {
        console.log('[SignUp] Redirecting to home...');
        navigate('/');
      }, 2000);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">GrayMall</h1>
          <p className="text-gray-600 mt-2">新規登録</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 text-green-700 rounded">
            <p className="font-medium">登録が完了しました！</p>
            <p className="text-sm mt-1">ホーム画面へ移動します...</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-1">
              表示名
            </label>
            <input
              id="displayName"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="任意（未入力の場合はメールアドレスの@前が使用されます）"
              disabled={loading || success}
            />
          </div>

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
              disabled={loading || success}
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              パスワード
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="6文字以上"
              required
              disabled={loading || success}
            />
          </div>

          <button
            type="submit"
            disabled={loading || success}
            className="w-full bg-gray-900 text-white py-3 rounded-lg font-medium hover:bg-gray-800 transition disabled:opacity-50"
          >
            {loading ? '登録中...' : success ? '登録完了！' : '登録'}
          </button>
        </form>

        {!success && (
          <div className="mt-6 text-center text-sm text-gray-600">
            すでにアカウントをお持ちの方は{' '}
            <Link to="/signin" className="text-blue-600 hover:underline">
              サインイン
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
