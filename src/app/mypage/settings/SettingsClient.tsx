'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { ArrowLeft, Loader2, Upload, Check } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/lib/database.types'

// Zodバリデーションスキーマ
const profileSchema = z.object({
  displayName: z.string().max(50, '表示名は50文字以内で入力してください').optional(),
  bio: z.string().max(500, '自己紹介は500文字以内で入力してください').optional(),
})

type UserProfile = Database['public']['Tables']['users']['Row']

interface SettingsClientProps {
  profile: UserProfile | null
  userId: string
}

export default function SettingsClient({ profile, userId }: SettingsClientProps) {
  const router = useRouter()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createClient() as any

  const [displayName, setDisplayName] = useState(profile?.display_name || '')
  const [bio, setBio] = useState(profile?.bio || '')
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<{ displayName?: string; bio?: string }>({})

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)

    const fileExt = file.name.split('.').pop()
    const fileName = `${userId}-${Date.now()}.${fileExt}`
    const filePath = `avatars/${fileName}`

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

    setAvatarUrl(publicUrl)
    setUploading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFieldErrors({})

    // Zodでバリデーション
    const result = profileSchema.safeParse({ displayName, bio })
    if (!result.success) {
      const errors: { displayName?: string; bio?: string } = {}
      result.error.issues.forEach((err) => {
        const field = err.path[0] as 'displayName' | 'bio'
        errors[field] = err.message
      })
      setFieldErrors(errors)
      return
    }

    setSaving(true)
    setSaved(false)

    const { error } = await supabase
      .from('users')
      .update({
        display_name: displayName,
        bio,
        avatar_url: avatarUrl,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)

    if (error) {
      toast.error('保存に失敗しました')
    } else {
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    }

    setSaving(false)
  }

  return (
    <div className="min-h-screen bg-gray-950 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="flex items-center gap-4 mb-8">
          <Link
            href="/mypage"
            className="p-2 text-gray-400 hover:text-white transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-bold text-white">アカウント設定</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* アバター */}
          <div className="bg-gray-900 rounded-lg p-6">
            <h2 className="text-lg font-medium text-white mb-4">プロフィール画像</h2>
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 rounded-full bg-gray-700 overflow-hidden relative">
                <Image
                  src={avatarUrl || '/noicon.png'}
                  alt="プロフィール画像"
                  fill
                  className="object-cover"
                  unoptimized={!!avatarUrl}
                />
              </div>
              <label className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition cursor-pointer">
                {uploading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4" />
                )}
                <span>{uploading ? 'アップロード中...' : '画像を変更'}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                  disabled={uploading}
                />
              </label>
            </div>
          </div>

          {/* 基本情報 */}
          <div className="bg-gray-900 rounded-lg p-6">
            <h2 className="text-lg font-medium text-white mb-4">基本情報</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  表示名
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className={`w-full px-4 py-2 bg-gray-800 border rounded-lg text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent ${
                    fieldErrors.displayName ? 'border-red-500' : 'border-gray-700'
                  }`}
                  placeholder="表示名を入力"
                />
                {fieldErrors.displayName && (
                  <p className="mt-1 text-sm text-red-500">{fieldErrors.displayName}</p>
                )}
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  自己紹介
                </label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={4}
                  className={`w-full px-4 py-2 bg-gray-800 border rounded-lg text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none ${
                    fieldErrors.bio ? 'border-red-500' : 'border-gray-700'
                  }`}
                  placeholder="自己紹介を入力"
                />
                {fieldErrors.bio && (
                  <p className="mt-1 text-sm text-red-500">{fieldErrors.bio}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">{bio.length}/500文字</p>
              </div>
            </div>
          </div>

          {/* メールアドレス（読み取り専用） */}
          <div className="bg-gray-900 rounded-lg p-6">
            <h2 className="text-lg font-medium text-white mb-4">アカウント情報</h2>
            <div>
              <label className="block text-sm text-gray-400 mb-1">
                メールアドレス
              </label>
              <input
                type="email"
                value={profile?.email || ''}
                disabled
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-500 cursor-not-allowed"
              />
              <p className="text-xs text-gray-500 mt-1">
                メールアドレスは変更できません
              </p>
            </div>
          </div>

          {/* 保存ボタン */}
          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-2 text-gray-400 hover:text-white transition"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : saved ? (
                <Check className="w-4 h-4" />
              ) : null}
              {saving ? '保存中...' : saved ? '保存しました' : '保存'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
