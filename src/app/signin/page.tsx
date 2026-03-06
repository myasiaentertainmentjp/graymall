import { Suspense } from 'react'
import SignInClient from './SignInClient'

export default function SignInPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-pulse text-gray-400">読み込み中...</div>
      </div>
    }>
      <SignInClient />
    </Suspense>
  )
}
