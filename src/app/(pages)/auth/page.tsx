'use client'

import { useRouter } from 'next/navigation'
import LoginForm from "../../components/auth/login/LoginForm"
import RegisterForm from "../../components/auth/register/RegisterForm"
import React, { Suspense, useState, useEffect } from "react"

// Create a client component wrapper for useSearchParams
function AuthStateHandler({ onStateChange }: { onStateChange: (state: 'login' | 'register') => void }) {
  const searchParams = useSearchParams()
  
  useEffect(() => {
    const state = searchParams.get('state') 
    if (state === 'login' || state === 'register') {
      onStateChange(state)
    }
  }, [searchParams, onStateChange])
  
  return null
}

// Import useSearchParams in a separate component to use with Suspense
import { useSearchParams } from 'next/navigation'

function AuthPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [authState, setAuthState] = useState<'login' | 'register'>('login')

  // ดึงค่า callbackUrl 
  const callbackUrl = searchParams.get('callbackUrl') || '/'
  
  useEffect(() => {
    // Default to login if no state is present initially
    if (window.location.search === '') {
      router.replace('?state=login', { scroll: false }) 
    }
  }, [router])

  const handleStateChange = (state: 'login' | 'register') => {
    setAuthState(state)
  }
  
  const toggleAuthState = () => {
    const newState = authState === 'login' ? 'register' : 'login'
    setAuthState(newState)
    router.replace(`?state=${newState}`, { scroll: false })
  }
  
  return (
    <div className="fixed inset-0 z-[200] bg-white overflow-y-auto">
      <div className="min-h-screen w-full flex items-center justify-center">
      <Suspense fallback={null}>
        <AuthStateHandler onStateChange={handleStateChange} />
      </Suspense>
      
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

export default AuthPage