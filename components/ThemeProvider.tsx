'use client'
import { useEffect } from 'react'
import { useUIStore, type Theme } from '@/store'

const STORAGE_KEY = 'mnemo-theme'

function applyTheme(theme: Theme) {
  const root = document.documentElement
  root.classList.remove('dark', 'light')
  root.classList.add(theme)
  localStorage.setItem(STORAGE_KEY, theme)
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { theme, setTheme } = useUIStore()

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Theme | null
    if (stored === 'dark' || stored === 'light') {
      if (stored !== theme) {
        setTheme(stored)
      }
      applyTheme(stored)
    } else {
      applyTheme(theme)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  return <>{children}</>
}

// Inline script for <head> — prevents flash before React hydrates
export const themeScript = `(function(){try{var t=localStorage.getItem('mnemo-theme');document.documentElement.classList.add(t==='light'?'light':'dark');}catch(e){document.documentElement.classList.add('dark');}})()`
