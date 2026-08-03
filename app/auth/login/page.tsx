'use client'
import { useState } from 'react'
import Link from 'next/link'
import { GraduationCap, Eye, EyeOff, ArrowRight, Sparkles, FlaskConical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuthStore } from '@/store'
import { isSupabaseConfigured } from '@/lib/env'

const MAX_ATTEMPTS = 5
const DEMO_EMAIL = 'demo@mnemo.test'
const DEMO_PASSWORD = 'demo123456'
const TEST_EMAIL = 'test@mnemo.test'
const TEST_PASSWORD = 'test123456'

function classifyError(err: unknown): string {
  if (err instanceof TypeError && err.message.toLowerCase().includes('fetch')) {
    return 'Unable to connect. Please check your internet connection.'
  }
  return 'Incorrect email or password.'
}

export default function LoginPage() {
  const { signIn } = useAuthStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [error, setError] = useState('')
  const [attemptCount, setAttemptCount] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isLockedOut = attemptCount >= MAX_ATTEMPTS

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (isLockedOut || isSubmitting) return
    setError('')
    setIsSubmitting(true)
    try {
      await signIn(email, password, rememberMe)
      window.location.href = '/dashboard'
    } catch (err) {
      const next = attemptCount + 1
      setAttemptCount(next)
      if (next >= MAX_ATTEMPTS) {
        setError('Your account has been temporarily locked. Please try again later or reset your password.')
      } else {
        setError(classifyError(err))
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const quickLogin = async (e: string, p: string) => {
    setError('')
    setAttemptCount(0)
    setIsSubmitting(true)
    try {
      await signIn(e, p, rememberMe)
      window.location.href = '/dashboard'
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen hero-gradient flex items-center justify-center p-4 sm:p-6">
      <div className="absolute top-1/4 left-1/3 w-96 h-96 rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md relative">
        {/* Logo */}
        <div className="text-center mb-6 sm:mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5 mb-4 sm:mb-6">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-indigo-500/30 shrink-0">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold gradient-text-study">Mnemo</span>
          </Link>
          <h1 className="text-2xl font-bold text-foreground">Welcome back</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">Sign in to your study dashboard</p>
        </div>

        {/* Dev hint */}
        <div className="glass border border-indigo-500/25 rounded-xl p-3 sm:p-3.5 mb-4 sm:mb-5 flex items-start gap-2">
          <Sparkles size={14} className="text-indigo-400 shrink-0 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-muted-foreground">
            {isSupabaseConfigured() ? (
              <>
                <span className="text-indigo-300 font-medium">Portfolio demo:</span> Sign in with <strong>demo@mnemo.test</strong> to explore a populated account, or <strong>test@mnemo.test</strong> to start from zero.
              </>
            ) : (
              <>
                <span className="text-indigo-300 font-medium">Demo mode:</span> Click &ldquo;Use demo account&rdquo; below to explore the full app with realistic study data and AI responses.
              </>
            )}
          </p>
        </div>

        {/* Form */}
        <div className="glass border border-white/[0.07] rounded-2xl p-5 sm:p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="min-h-[44px]"
                disabled={isLockedOut}
              />
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between">
                <Label htmlFor="password">Password</Label>
                <Link href="#" className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="pr-10 min-h-[44px]"
                  disabled={isLockedOut}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-2"
                  disabled={isLockedOut}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                id="remember-me"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-white/20 bg-white/5 accent-indigo-500 cursor-pointer"
                disabled={isLockedOut}
              />
              <Label htmlFor="remember-me" className="text-sm font-normal cursor-pointer select-none">
                Remember me
              </Label>
            </div>

            {error && (
              <p className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <Button
              type="submit"
              className="w-full min-h-[44px]"
              size="lg"
              disabled={isSubmitting || isLockedOut}
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                  Signing in...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  Sign in <ArrowRight size={16} />
                </span>
              )}
            </Button>
          </form>

          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/[0.06]" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-card px-3 text-muted-foreground">or</span>
            </div>
          </div>

          {isSupabaseConfigured() ? (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground text-center">Try it instantly — no signup required</p>
              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  variant="outline"
                  className="flex-1 min-h-[44px]"
                  size="lg"
                  onClick={() => quickLogin(DEMO_EMAIL, DEMO_PASSWORD)}
                  disabled={isSubmitting}
                >
                  <Sparkles size={14} className="mr-2" />
                  Demo (seeded)
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 min-h-[44px]"
                  size="lg"
                  onClick={() => quickLogin(TEST_EMAIL, TEST_PASSWORD)}
                  disabled={isSubmitting}
                >
                  <FlaskConical size={14} className="mr-2" />
                  Test (empty)
                </Button>
              </div>
            </div>
          ) : (
            <Button
              variant="outline"
              className="w-full min-h-[44px]"
              size="lg"
              onClick={() => quickLogin('alex@mnemo.app', 'demo1234')}
              disabled={isSubmitting}
            >
              Use demo account
            </Button>
          )}
        </div>

        <p className="text-center text-xs sm:text-sm text-muted-foreground mt-4 sm:mt-5 px-2 sm:px-0">
          Don&apos;t have an account?{' '}
          <Link href="/auth/signup" className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
            Sign up free
          </Link>
        </p>
      </div>
    </div>
  )
}
