import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// 安全なリダイレクト先かチェック
function isValidRedirectPath(path: string): boolean {
  // 空または/で始まらない場合は無効
  if (!path || !path.startsWith('/')) return false
  // プロトコル相対URL（//example.com）を防ぐ
  if (path.startsWith('//')) return false
  // URLエンコードされたプロトコルを防ぐ
  if (path.includes('://') || path.includes('%3A%2F%2F')) return false
  return true
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const nextParam = searchParams.get('next') ?? '/'

  // リダイレクト先をバリデーション
  const next = isValidRedirectPath(nextParam) ? nextParam : '/'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/signin?error=auth_callback_error`)
}
