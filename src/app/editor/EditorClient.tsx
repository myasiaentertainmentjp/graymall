'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import NextImage from 'next/image'
import toast from 'react-hot-toast'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import LinkExtension from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import {
  ArrowLeft,
  Loader2,
  Bold,
  Italic,
  List,
  ListOrdered,
  Quote,
  Heading2,
  Heading3,
  Image as ImageIcon,
  Link as LinkIcon,
  Minus,
  Eye,
  Save,
  Send,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/lib/database.types'

type Article = Database['public']['Tables']['articles']['Row']
type Category = Database['public']['Tables']['categories']['Row']

interface EditorClientProps {
  article: Article | null
  categories: Category[]
  userId: string
}

// XSS対策: URLバリデーション
const isValidUrl = (urlString: string): boolean => {
  try {
    const url = new URL(urlString)
    // http, https, data:image のみ許可
    return ['http:', 'https:'].includes(url.protocol) ||
           (url.protocol === 'data:' && urlString.startsWith('data:image/'))
  } catch {
    return false
  }
}

export default function EditorClient({ article, categories, userId }: EditorClientProps) {
  const router = useRouter()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createClient() as any

  const [title, setTitle] = useState(article?.title || '')
  const [excerpt, setExcerpt] = useState(article?.excerpt || '')
  const [coverImageUrl, setCoverImageUrl] = useState(article?.cover_image_url || '')
  const [categoryId, setCategoryId] = useState(article?.primary_category_id || '')
  const [price, setPrice] = useState(article?.price || 0)
  const [affiliateEnabled, setAffiliateEnabled] = useState(article?.affiliate_enabled || false)
  const [affiliateRate, setAffiliateRate] = useState(article?.affiliate_rate || 10)
  const [saving, setSaving] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [uploading, setUploading] = useState(false)

  const editor = useEditor({
    extensions: [
      StarterKit,
      Image,
      LinkExtension.configure({
        openOnClick: false,
      }),
      Placeholder.configure({
        placeholder: '本文を入力してください...',
      }),
    ],
    content: article?.content || '',
    editorProps: {
      attributes: {
        class: 'prose prose-invert max-w-none min-h-[400px] focus:outline-none',
      },
    },
  })

  const handleImageUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)

    const fileExt = file.name.split('.').pop()
    const fileName = `${userId}-${Date.now()}.${fileExt}`
    const filePath = `articles/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('public')
      .upload(filePath, file)

    if (uploadError) {
      toast.error('画像のアップロードに失敗しました')
      setUploading(false)
      return
    }

    const { data: { publicUrl } } = supabase.storage
      .from('public')
      .getPublicUrl(filePath)

    setCoverImageUrl(publicUrl)
    setUploading(false)
  }, [supabase, userId])

  const insertImage = useCallback(async () => {
    const url = prompt('画像URLを入力してください')
    if (url && editor) {
      if (!isValidUrl(url)) {
        toast.error('有効なURLを入力してください（http://, https://, または data:image/ で始まる必要があります）')
        return
      }
      editor.chain().focus().setImage({ src: url }).run()
    }
  }, [editor])

  const insertLink = useCallback(() => {
    if (!editor) return
    const url = prompt('URLを入力してください')
    if (url) {
      if (!isValidUrl(url)) {
        toast.error('有効なURLを入力してください（http:// または https:// で始まる必要があります）')
        return
      }
      editor.chain().focus().setLink({ href: url }).run()
    }
  }, [editor])

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .slice(0, 50) + '-' + Date.now().toString(36)
  }

  const saveArticle = async (publish: boolean = false) => {
    if (!title.trim()) {
      toast.error('タイトルを入力してください')
      return
    }

    if (publish) {
      setPublishing(true)
    } else {
      setSaving(true)
    }

    const content = editor?.getHTML() || ''
    const slug = article?.slug || generateSlug(title)

    const articleData = {
      title,
      slug,
      content,
      excerpt,
      cover_image_url: coverImageUrl || null,
      primary_category_id: categoryId || null,
      price,
      affiliate_enabled: affiliateEnabled,
      affiliate_rate: affiliateRate,
      status: publish ? 'pending_review' : 'draft',
      updated_at: new Date().toISOString(),
    }

    if (article?.id) {
      // 更新
      const { error } = await supabase
        .from('articles')
        .update(articleData)
        .eq('id', article.id)

      if (error) {
        toast.error('保存に失敗しました')
      } else {
        if (publish) {
          toast.success('公開申請を送信しました。運営の審査後に公開されます。')
          router.push('/mypage')
        }
      }
    } else {
      // 新規作成
      const { error } = await supabase
        .from('articles')
        .insert({
          ...articleData,
          author_id: userId,
          created_at: new Date().toISOString(),
        })

      if (error) {
        toast.error('保存に失敗しました')
      } else if (publish) {
        toast.success('公開申請を送信しました。運営の審査後に公開されます。')
        router.push('/mypage')
      } else {
        router.push('/mypage')
      }
    }

    setSaving(false)
    setPublishing(false)
  }

  return (
    <div className="min-h-screen bg-gray-950">
      {/* ヘッダー */}
      <div className="sticky top-0 z-10 bg-gray-900 border-b border-gray-800">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/mypage" className="p-2 text-gray-400 hover:text-white transition">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-lg font-medium text-white">
              {article ? '記事を編集' : '新規記事を作成'}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => saveArticle(false)}
              disabled={saving || publishing}
              className="flex items-center gap-2 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              下書き保存
            </button>
            <button
              onClick={() => saveArticle(true)}
              disabled={saving || publishing}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition disabled:opacity-50"
            >
              {publishing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              公開申請
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* メインエディター */}
          <div className="lg:col-span-2 space-y-6">
            {/* タイトル */}
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="タイトルを入力"
              className="w-full text-3xl font-bold bg-transparent text-white placeholder-gray-500 focus:outline-none"
            />

            {/* ツールバー */}
            {editor && (
              <div className="flex flex-wrap gap-1 p-2 bg-gray-900 rounded-lg">
                <button
                  onClick={() => editor.chain().focus().toggleBold().run()}
                  className={`p-2 rounded ${editor.isActive('bold') ? 'bg-gray-700' : 'hover:bg-gray-800'}`}
                >
                  <Bold className="w-4 h-4 text-gray-300" />
                </button>
                <button
                  onClick={() => editor.chain().focus().toggleItalic().run()}
                  className={`p-2 rounded ${editor.isActive('italic') ? 'bg-gray-700' : 'hover:bg-gray-800'}`}
                >
                  <Italic className="w-4 h-4 text-gray-300" />
                </button>
                <button
                  onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                  className={`p-2 rounded ${editor.isActive('heading', { level: 2 }) ? 'bg-gray-700' : 'hover:bg-gray-800'}`}
                >
                  <Heading2 className="w-4 h-4 text-gray-300" />
                </button>
                <button
                  onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                  className={`p-2 rounded ${editor.isActive('heading', { level: 3 }) ? 'bg-gray-700' : 'hover:bg-gray-800'}`}
                >
                  <Heading3 className="w-4 h-4 text-gray-300" />
                </button>
                <button
                  onClick={() => editor.chain().focus().toggleBulletList().run()}
                  className={`p-2 rounded ${editor.isActive('bulletList') ? 'bg-gray-700' : 'hover:bg-gray-800'}`}
                >
                  <List className="w-4 h-4 text-gray-300" />
                </button>
                <button
                  onClick={() => editor.chain().focus().toggleOrderedList().run()}
                  className={`p-2 rounded ${editor.isActive('orderedList') ? 'bg-gray-700' : 'hover:bg-gray-800'}`}
                >
                  <ListOrdered className="w-4 h-4 text-gray-300" />
                </button>
                <button
                  onClick={() => editor.chain().focus().toggleBlockquote().run()}
                  className={`p-2 rounded ${editor.isActive('blockquote') ? 'bg-gray-700' : 'hover:bg-gray-800'}`}
                >
                  <Quote className="w-4 h-4 text-gray-300" />
                </button>
                <button
                  onClick={() => editor.chain().focus().setHorizontalRule().run()}
                  className="p-2 rounded hover:bg-gray-800"
                >
                  <Minus className="w-4 h-4 text-gray-300" />
                </button>
                <button onClick={insertImage} className="p-2 rounded hover:bg-gray-800">
                  <ImageIcon className="w-4 h-4 text-gray-300" />
                </button>
                <button onClick={insertLink} className="p-2 rounded hover:bg-gray-800">
                  <LinkIcon className="w-4 h-4 text-gray-300" />
                </button>
              </div>
            )}

            {/* エディター本体 */}
            <div className="bg-gray-900 rounded-lg p-6">
              <EditorContent editor={editor} />
            </div>

            {/* 有料部分の説明 */}
            {price > 0 && (
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                <p className="text-yellow-400 text-sm">
                  有料記事の場合、<code className="bg-gray-800 px-1 rounded">&lt;!-- paid --&gt;</code> と記述した箇所より下が有料部分になります。
                </p>
              </div>
            )}
          </div>

          {/* サイドバー */}
          <div className="space-y-6">
            {/* カバー画像 */}
            <div className="bg-gray-900 rounded-lg p-4">
              <h3 className="text-white font-medium mb-3">カバー画像</h3>
              {coverImageUrl ? (
                <div className="relative aspect-video">
                  <NextImage
                    src={coverImageUrl}
                    alt="カバー画像"
                    fill
                    sizes="300px"
                    className="object-cover rounded"
                  />
                  <button
                    onClick={() => setCoverImageUrl('')}
                    className="absolute top-2 right-2 p-1 bg-black/50 text-white rounded hover:bg-black/70 z-10"
                  >
                    ×
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-gray-700 rounded-lg cursor-pointer hover:border-gray-600 transition">
                  {uploading ? (
                    <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
                  ) : (
                    <>
                      <ImageIcon className="w-6 h-6 text-gray-400 mb-2" />
                      <span className="text-sm text-gray-400">画像をアップロード</span>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    disabled={uploading}
                  />
                </label>
              )}
            </div>

            {/* 概要 */}
            <div className="bg-gray-900 rounded-lg p-4">
              <h3 className="text-white font-medium mb-3">概要（抜粋）</h3>
              <textarea
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
                placeholder="記事の概要を入力"
              />
            </div>

            {/* カテゴリ */}
            <div className="bg-gray-900 rounded-lg p-4">
              <h3 className="text-white font-medium mb-3">カテゴリ</h3>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              >
                <option value="">カテゴリを選択</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 価格設定 */}
            <div className="bg-gray-900 rounded-lg p-4">
              <h3 className="text-white font-medium mb-3">価格設定</h3>
              <div className="flex items-center gap-2">
                <span className="text-gray-400">¥</span>
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(Number(e.target.value))}
                  min={0}
                  step={100}
                  className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                0円で無料記事になります
              </p>
            </div>

            {/* アフィリエイト設定 */}
            <div className="bg-gray-900 rounded-lg p-4">
              <h3 className="text-white font-medium mb-3">アフィリエイト設定</h3>
              <label className="flex items-center gap-2 mb-3">
                <input
                  type="checkbox"
                  checked={affiliateEnabled}
                  onChange={(e) => setAffiliateEnabled(e.target.checked)}
                  className="rounded border-gray-600 bg-gray-700 text-emerald-500 focus:ring-emerald-500"
                />
                <span className="text-gray-300">アフィリエイトを有効にする</span>
              </label>
              {affiliateEnabled && (
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={affiliateRate}
                    onChange={(e) => setAffiliateRate(Number(e.target.value))}
                    min={1}
                    max={50}
                    className="w-20 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                  <span className="text-gray-400">%還元</span>
                </div>
              )}
            </div>

            {/* プレビューボタン */}
            {article?.slug && (
              <Link
                href={`/articles/${article.slug}`}
                target="_blank"
                className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition"
              >
                <Eye className="w-4 h-4" />
                プレビュー
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
