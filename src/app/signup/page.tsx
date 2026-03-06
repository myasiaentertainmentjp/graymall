import { redirect } from 'next/navigation'

export default function SignupPage({
  searchParams,
}: {
  searchParams: { redirect?: string }
}) {
  const redirectTo = searchParams.redirect
  const signinUrl = redirectTo ? `/signin?redirect=${encodeURIComponent(redirectTo)}` : '/signin'
  redirect(signinUrl)
}
