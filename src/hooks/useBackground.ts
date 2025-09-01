import { useState, useEffect } from 'react'

type BackgroundColor = 'slate' | 'gray' | 'zinc' | 'neutral' | 'stone' | 'red' | 'orange' | 'amber' | 'yellow' | 'lime' | 'green' | 'emerald' | 'teal' | 'cyan' | 'sky' | 'blue' | 'indigo' | 'violet' | 'purple' | 'fuchsia' | 'pink' | 'rose'

export function useBackground() {
  const [backgroundColor, setBackgroundColor] = useState<BackgroundColor>('gray')

  useEffect(() => {
    const saved = localStorage.getItem('background-color')
    if (saved) {
      setBackgroundColor(saved as BackgroundColor)
    }
  }, [])

  useEffect(() => {
    // Apply background class to body
    const bgClass = getBackgroundClass()
    document.body.className = bgClass
  }, [backgroundColor])

  const changeBackground = (color: BackgroundColor) => {
    setBackgroundColor(color)
    localStorage.setItem('background-color', color)
  }

  const getBackgroundClass = () => {
    const backgrounds = {
      slate: 'bg-slate-50 dark:bg-slate-900',
      gray: 'bg-gray-50 dark:bg-gray-900',
      zinc: 'bg-zinc-50 dark:bg-zinc-900',
      neutral: 'bg-neutral-50 dark:bg-neutral-900',
      stone: 'bg-stone-50 dark:bg-stone-900',
      red: 'bg-red-50 dark:bg-red-900',
      orange: 'bg-orange-50 dark:bg-orange-900',
      amber: 'bg-amber-50 dark:bg-amber-900',
      yellow: 'bg-yellow-50 dark:bg-yellow-900',
      lime: 'bg-lime-50 dark:bg-lime-900',
      green: 'bg-green-50 dark:bg-green-900',
      emerald: 'bg-emerald-50 dark:bg-emerald-900',
      teal: 'bg-teal-50 dark:bg-teal-900',
      cyan: 'bg-cyan-50 dark:bg-cyan-900',
      sky: 'bg-sky-50 dark:bg-sky-900',
      blue: 'bg-blue-50 dark:bg-blue-900',
      indigo: 'bg-indigo-50 dark:bg-indigo-900',
      violet: 'bg-violet-50 dark:bg-violet-900',
      purple: 'bg-purple-50 dark:bg-purple-900',
      fuchsia: 'bg-fuchsia-50 dark:bg-fuchsia-900',
      pink: 'bg-pink-50 dark:bg-pink-900',
      rose: 'bg-rose-50 dark:bg-rose-900'
    }
    return backgrounds[backgroundColor]
  }

  return {
    backgroundColor,
    changeBackground,
    getBackgroundClass
  }
}