'use client'

export const dynamic = 'force-dynamic';

import { useRouter, useSearchParams } from 'next/navigation'
import LoginForm from "../../components/auth/login/LoginForm"
import RegisterForm from "../../components/auth/register/RegisterForm"
import React, { Suspense, useState, useEffect } from "react"

function AuthPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [authState, setAuthState] = useState<'login' | 'register'>('login')

  const callbackUrl = searchParams.get('callbackUrl') || '/'

  useEffect(() => {
    const state = searchParams.get('state')
    if (state === 'login' || state === 'register') {
      setAuthState(state)
    } else if (window.location.search === '' || !searchParams.get('state')) {
      router.replace('?state=login', { scroll: false })
    }
  }, [searchParams, router])

  const toggleAuthState = () => {
    const newState = authState === 'login' ? 'register' : 'login'
    setAuthState(newState)
    router.replace(`?state=${newState}`, { scroll: false })
  }

  return (
    <div className="fixed inset-0 z-[200] bg-white overflow-y-auto">
      <div className="min-h-screen w-full flex items-center justify-center">
        {authState === 'login' ? (
          <LoginForm
            onRegisterClick={toggleAuthState}
            callbackUrl={callbackUrl}
          />
        ) : (
          <RegisterForm onLoginClick={toggleAuthState} />
        )}
      </div>
    </div>
  )
}

export default function AuthPage() {
  return (
    <Suspense fallback={
      <div className="fixed inset-0 z-[200] bg-white overflow-y-auto">
        <div className="min-h-screen w-full flex items-center justify-center">
          <div className="animate-pulse">Loading...</div>
        </div>
      </div>
    }>
      <AuthPageContent />
    </Suspense>
  )
}