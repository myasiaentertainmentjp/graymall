// src/pages/AdminAuthorProfiles.tsx
import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ArrowLeft, Plus, Pencil, Trash2, Loader2, User, X, Upload } from 'lucide-react';

type AuthorProfile = {
  id: string;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
  _count?: { articles: number };
};

export default function AdminAuthorProfiles() {
  const [profiles, setProfiles] = useState<AuthorProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formBio, setFormBio] = useState('');
  const [formAvatarUrl, setFormAvatarUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadProfiles();
  }, []);

  const loadProfiles = async () => {
    setLoading(true);
    try {
      const { data: profilesData, error } = await supabase
        .from('author_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const profilesWithCount = await Promise.all(
        (profilesData || []).map(async (profile) => {
          const { count } = await supabase
            .from('articles')
            .select('*', { count: 'exact', head: true })
            .eq('author_profile_id', profile.id);
          return { ...profile, _count: { articles: count || 0 } };
        })
      );

      setProfiles(profilesWithCount);
    } catch (err) {
      console.error('Error loading profiles:', err);
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingId(null);
    setFormName('');
    setFormBio('');
    setFormAvatarUrl('');
    setModalOpen(true);
  };

  const openEditModal = (profile: AuthorProfile) => {
    setEditingId(profile.id);
    setFormName(profile.display_name);
    setFormBio(profile.bio || '');
    setFormAvatarUrl(profile.avatar_url || '');
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingId(null);
  };

  const handleAvatarUpload = async (file: File) => {
    if (!file) return;
    setUploading(true);
    try {
      const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const path = `author-avatars/${Date.now()}-${Math.random().toString(16).slice(2)}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('article-images')
        .upload(path, file, { upsert: true, contentType: file.type });
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from('article-images').getPublicUrl(path);
      if (data?.publicUrl) setFormAvatarUrl(data.publicUrl);
    } catch (err) {
      console.error('Upload error:', err);
      alert('アップロードに失敗しました');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!formName.trim()) {
      alert('名前を入力してください');
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        const { error } = await supabase
          .from('author_profiles')
          .update({
            display_name: formName.trim(),
            bio: formBio.trim() || null,
            avatar_url: formAvatarUrl || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingId);
        if (error) throw error;
      } else {
        const { data: { user } } = await supabase.auth.getUser();
        const { error } = await supabase
          .from('author_profiles')
          .insert({
            display_name: formName.trim(),
            bio: formBio.trim() || null,
            avatar_url: formAvatarUrl || null,
            created_by: user?.id,
          });
        if (error) throw error;
      }
      closeModal();
      loadProfiles();
    } catch (err) {
      console.error('Save error:', err);
      alert('保存に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string, articleCount: number) => {
    if (articleCount > 0) {
      alert(`この著者には\${articleCount}件の記事があります。\n先に記事の著者を変更してください。`);
      return;
    }
    if (!confirm(`「\${name}」を削除しますか？`)) return;
    setDeleting(id);
    try {
      const { error } = await supabase.from('author_profiles').delete().eq('id', id);
      if (error) throw error;
      loadProfiles();
    } catch (err) {
      console.error('Delete error:', err);
      alert('削除に失敗しました');
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/admin" className="p-2 hover:bg-gray-100 rounded-lg transition">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-lg font-bold">著者プロフィール管理</h1>
          </div>
          <button onClick={openCreateModal} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
            <Plus className="w-4 h-4" />
            新規作成
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        ) : profiles.length === 0 ? (
          <div className="bg-white rounded-xl border p-8 text-center">
            <User className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">著者プロフィールがまだありません</p>
            <button onClick={openCreateModal} className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
              <Plus className="w-4 h-4" />
              最初の著者を作成
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-xl border divide-y">
            {profiles.map((profile) => (
              <div key={profile.id} className="p-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                  {profile.avatar_url ? (
                    <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <User className="w-6 h-6 text-gray-400" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-900">{profile.display_name}</h3>
                  {profile.bio && <p className="text-sm text-gray-500 truncate">{profile.bio}</p>}
                  <p className="text-xs text-gray-400 mt-1">記事数: {profile._count?.articles || 0}件</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => openEditModal(profile)} className="p-2 hover:bg-gray-100 rounded-lg transition" title="編集">
                    <Pencil className="w-4 h-4 text-gray-600" />
                  </button>
                  <button onClick={() => handleDelete(profile.id, profile.display_name, profile._count?.articles || 0)} disabled={deleting === profile.id} className="p-2 hover:bg-red-50 rounded-lg transition disabled:opacity-50" title="削除">
                    {deleting === profile.id ? <Loader2 className="w-4 h-4 animate-spin text-gray-400" /> : <Trash2 className="w-4 h-4 text-red-600" />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        <p className="text-sm text-gray-500 mt-4">※ 作成した著者プロフィールは、管理画面の記事編集で「著者」として選択できます。</p>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">{editingId ? '著者を編集' : '著者を作成'}</h3>
              <button onClick={closeModal} className="p-1 hover:bg-gray-100 rounded"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">アバター画像</label>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                    {formAvatarUrl ? <img src={formAvatarUrl} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><User className="w-8 h-8 text-gray-400" /></div>}
                  </div>
                  <div>
                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleAvatarUpload(e.target.files[0])} />
                    <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading} className="inline-flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50">
                      {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                      {uploading ? 'アップロード中...' : '画像を選択'}
                    </button>
                    {formAvatarUrl && <button type="button" onClick={() => setFormAvatarUrl('')} className="ml-2 text-sm text-red-600 hover:underline">削除</button>}
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">名前 <span className="text-red-500">*</span></label>
                <input type="text" value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="著者名" className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">自己紹介</label>
                <textarea value={formBio} onChange={(e) => setFormBio(e.target.value)} placeholder="著者の自己紹介文（任意）" rows={3} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={closeModal} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">キャンセル</button>
                <button type="button" onClick={handleSave} disabled={saving || !formName.trim()} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50">{saving ? '保存中...' : '保存'}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
