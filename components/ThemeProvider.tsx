'use client'
import { useEffect } from 'react'
import { useUIStore, type Theme } from '@/store'

const STORAGE_KEY = 'mnemo-theme'

function resolveClass(theme: Theme): 'dark' | 'light' {
  if (theme === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }
  return theme
}

function applyTheme(theme: Theme) {
  const root = document.documentElement
  const cls = resolveClass(theme)
  root.classList.remove('dark', 'light')
  root.classList.add(cls)
  localStorage.setItem(STORAGE_KEY, theme)
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { theme, setTheme } = useUIStore()

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Theme | null
    if (stored && stored !== theme) {
      setTheme(stored)
      applyTheme(stored)
    } else {
      applyTheme(theme)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    applyTheme(theme)

    if (theme !== 'system') return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = () => applyTheme('system')
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [theme])

  return <>{children}</>
}

// Inline script for <head> — prevents flash before React hydrates
export const themeScript = `(function(){try{var t=localStorage.getItem('mnemo-theme')||'dark';var d=t==='dark'||(t==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.add(d?'dark':'light');}catch(e){document.documentElement.classList.add('dark');}})()`
