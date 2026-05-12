'use server'

import { redirect } from 'next/navigation'
import { createClient } from '../../lib/supabase/server'

export async function login(formData: FormData) {
  const supabase = await createClient()

  const email = String(formData.get('email') ?? '').trim()
  const password = String(formData.get('password') ?? '')

  console.log('LOGIN_ATTEMPT', {
    email,
    hasPassword: password.length > 0,
  })

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  console.log('LOGIN_RESULT', {
    userId: data.user?.id ?? null,
    error: error?.message ?? null,
  })

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`)
  }

  redirect('/dashboard')
}