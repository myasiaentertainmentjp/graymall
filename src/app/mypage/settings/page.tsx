import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import SettingsClient from './SettingsClient'

export const metadata = {
  title: 'アカウント設定',
}

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/signin?redirect=/mypage/settings')
  }

  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-950" />}>
      <SettingsClient profile={profile} userId={user.id} />
    </Suspense>
  )
}
