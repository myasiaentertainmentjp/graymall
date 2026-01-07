import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Layout from '../components/Layout';

export default function WriteArticle() {
  const [searchParams] = useSearchParams();
  const articleId = searchParams.get('id');
  const navigate = useNavigate();

  useEffect(() => {
    const dest = articleId ? `/articles/edit/${articleId}` : `/articles/edit/new`;
    navigate(dest, { replace: true });
  }, [articleId, navigate]);

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="text-gray-700">編集画面へ移動しています...</div>
        </div>
      </div>
    </Layout>
  );
}
