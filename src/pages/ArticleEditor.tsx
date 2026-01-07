import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import EnhancedRichTextEditor from '../components/EnhancedRichTextEditor';

export default function ArticleEditor() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [price, setPrice] = useState<number | null>(null);
  const [articleStatus, setArticleStatus] = useState<'draft' | 'pending_review' | 'published' | 'rejected' | 'hidden'>('draft');

  const canSubmit = useMemo(() => title.trim().length > 0 && content.trim().length > 0, [title, content]);

  useEffect(() => {
    let alive = true;
    async function load() {
      if (!user || !id) {
        setLoading(false);
        return;
      }
      setLoading(true);
      const { data, error } = await supabase.from('articles').select('title,content,price,status').eq('id', id).single();
      if (!alive) return;

      if (error) {
        console.error(error);
        setLoading(false);
        return;
      }

      setTitle(data?.title || '');
      setContent(data?.content || '');
      setPrice(typeof data?.price === 'number' ? data.price : null);

      const s = data?.status;
      if (s === 'pending' || s === 'review' || s === 'pending_review') setArticleStatus('pending_review');
      else if (s === 'published') setArticleStatus('published');
      else setArticleStatus('draft');

      setLoading(false);
    }
    load();
    return () => {
      alive = false;
    };
  }, [id, user]);

  const upload = async (file: File) => {
    if (!user) throw new Error('not logged in');
    const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
    const path = `articles/${user.id}/${Date.now()}-${Math.random().toString(16).slice(2)}.${ext}`;

    const { error: upErr } = await supabase.storage.from('article-images').upload(path, file, {
      cacheControl: '3600',
      upsert: true,
      contentType: file.type || 'image/jpeg',
    });

    if (upErr) throw upErr;

    const { data } = supabase.storage.from('article-images').getPublicUrl(path);
    if (!data?.publicUrl) throw new Error('public url not found');
    return data.publicUrl;
  };

  const saveDraft = async () => {
    if (!id) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('articles')
        .update({
          title: title.trim() || '無題',
          content,
          price,
          status: 'draft' as const,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);
      if (error) throw error;
      setArticleStatus('draft');
    } catch (e) {
      console.error(e);
      window.alert('保存に失敗しました。');
    } finally {
      setSaving(false);
    }
  };

  const submitForReview = async () => {
    if (!id || !canSubmit) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('articles')
        .update({
          title: title.trim() || '無題',
          content,
          price,
          status: 'pending_review' as const,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);
      if (error) throw error;
      setArticleStatus('pending_review');
      navigate('/author');
    } catch (e) {
      console.error(e);
      window.alert('送信に失敗しました。');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-6 text-sm text-gray-500">Loading...</div>;

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-3xl px-4 py-6">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="text-sm text-gray-600">ステータス: {articleStatus === 'pending_review' ? '審査中' : articleStatus === 'published' ? '公開中' : '下書き'}</div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={saveDraft}
              disabled={saving}
              className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold hover:bg-gray-50 disabled:opacity-60"
            >
              下書き保存
            </button>
            <button
              type="button"
              onClick={submitForReview}
              disabled={saving || !canSubmit}
              className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-black disabled:opacity-60"
            >
              審査に出す
            </button>
          </div>
        </div>

        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="記事タイトル"
          className="w-full text-2xl font-bold text-gray-900 placeholder:text-gray-300 outline-none mb-4"
        />

        <EnhancedRichTextEditor
          freeHtml={content}
          paidHtml=""
          onChangeFree={setContent}
          onChangePaid={() => {}}
          upload={upload}
          showPaid={false}
        />
      </div>
    </div>
  );
}
