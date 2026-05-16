'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { GraduationCap, Eye, EyeOff, ArrowRight, Sparkles, FlaskConical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuthStore } from '@/store'
import { isSupabaseConfigured } from '@/lib/env'

const DEMO_EMAIL = 'demo@mnemo.test'
const DEMO_PASSWORD = 'demo123456'
const TEST_EMAIL = 'test@mnemo.test'
const TEST_PASSWORD = 'test123456'

export default function LoginPage() {
  const router = useRouter()
  const { signIn, isLoading } = useAuthStore()
  const [email, setEmail] = useState(isSupabaseConfigured() ? DEMO_EMAIL : 'alex@mnemo.app')
  const [password, setPassword] = useState(isSupabaseConfigured() ? DEMO_PASSWORD : 'demo1234')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      await signIn(email, password)
      router.push('/dashboard')
    } catch {
      setError('Invalid credentials. Try the demo account.')
    }
  }

  const quickLogin = async (e: string, p: string) => {
    setEmail(e)
    setPassword(p)
    setError('')
    try {
      await signIn(e, p)
      router.push('/dashboard')
    } catch {
      setError('Quick login failed. Is the database seeded?')
    }
  }

  return (
    <div className="min-h-screen hero-gradient flex items-center justify-center p-6">
      <div className="absolute top-1/4 left-1/3 w-96 h-96 rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md relative">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5 mb-6">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold gradient-text-study">Mnemo</span>
          </Link>
          <h1 className="text-2xl font-bold text-foreground">Welcome back</h1>
          <p className="text-sm text-muted-foreground mt-1">Sign in to your study dashboard</p>
        </div>

        {/* Demo hint */}
        <div className="glass border border-indigo-500/25 rounded-xl p-3.5 mb-5 flex items-start gap-2.5">
          <Sparkles size={14} className="text-indigo-400 shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground">
            {isSupabaseConfigured() ? (
              <>
                <span className="text-indigo-300 font-medium">Supabase connected:</span> Use <strong>demo@mnemo.test</strong> (seeded data) or <strong>test@mnemo.test</strong> (empty) for testing.
              </>
            ) : (
              <>
                <span className="text-indigo-300 font-medium">Demo mode:</span> Use the pre-filled credentials to explore the full app with realistic study data and AI responses.
              </>
            )}
          </p>
        </div>

        {/* Form */}
        <div className="glass border border-white/[0.07] rounded-2xl p-6">
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
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
              {isLoading ? (
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
              <p className="text-xs text-muted-foreground text-center">Quick Login (Dev Only)</p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  size="lg"
                  onClick={() => quickLogin(DEMO_EMAIL, DEMO_PASSWORD)}
                >
                  <Sparkles size={14} className="mr-2" />
                  Demo (seeded)
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  size="lg"
                  onClick={() => quickLogin(TEST_EMAIL, TEST_PASSWORD)}
                >
                  <FlaskConical size={14} className="mr-2" />
                  Test (empty)
                </Button>
              </div>
            </div>
          ) : (
            <Button
              variant="outline"
              className="w-full"
              size="lg"
              onClick={() => quickLogin('alex@mnemo.app', 'demo1234')}
            >
              Use demo account
            </Button>
          )}
        </div>

        <p className="text-center text-sm text-muted-foreground mt-5">
          Don&apos;t have an account?{' '}
          <Link href="/auth/signup" className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
            Sign up free
          </Link>
        </p>
      </div>
    </div>
  )
}
