import React, { useState } from 'react'
import { Home, TrendingUp, TrendingDown, Target, CreditCard, LogOut, Palette, Sun, Moon, Menu, X } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useBackground } from '../../hooks/useBackground'
import { useTheme } from '../../hooks/useTheme'
import { Button } from '../ui/Button'

interface SidebarProps {
  activeTab: string
  onTabChange: (tab: string) => void
  isOpen: boolean
  onToggle: () => void
}

export function Sidebar({ activeTab, onTabChange, isOpen, onToggle }: SidebarProps) {
  const { signOut } = useAuth()
  const { backgroundColor, changeBackground } = useBackground()
  const { isDark, toggleTheme } = useTheme()
  const [showColorPicker, setShowColorPicker] = useState(false)

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'pemasukan', label: 'Pemasukan', icon: TrendingUp },
    { id: 'pengeluaran', label: 'Pengeluaran', icon: TrendingDown },
    { id: 'target', label: 'Target', icon: Target },
    { id: 'hutang', label: 'Hutang', icon: CreditCard },
  ]

  const handleSignOut = async () => {
    await signOut()
  }

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={onToggle}
        />
      )}
      
      {/* Sidebar */}
      <div className={`w-64 bg-white dark:bg-gray-800 shadow-lg h-screen flex flex-col fixed left-0 top-0 z-30 transform transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0`}>
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">MoneyTracker</h1>
      </div>
      
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                activeTab === item.id
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <Icon className="h-5 w-5" />
              <span>{item.label}</span>
            </button>
          )
        })}
      </nav>
      
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-3">
        <div className="flex items-center justify-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleTheme}
            className="p-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            title={isDark ? 'Mode Terang' : 'Mode Gelap'}
          >
            {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
          
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowColorPicker(!showColorPicker)}
              className="p-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              title="Tema Warna"
            >
              <Palette className="h-5 w-5" />
            </Button>
          
          {showColorPicker && (
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg w-56 sm:w-64">
              <div className="grid grid-cols-5 sm:grid-cols-6 gap-2">
                {[
                  { name: 'slate', color: 'bg-slate-400' },
                  { name: 'gray', color: 'bg-gray-400' },
                  { name: 'zinc', color: 'bg-zinc-400' },
                  { name: 'neutral', color: 'bg-neutral-400' },
                  { name: 'stone', color: 'bg-stone-400' },
                  { name: 'red', color: 'bg-red-400' },
                  { name: 'orange', color: 'bg-orange-400' },
                  { name: 'amber', color: 'bg-amber-400' },
                  { name: 'yellow', color: 'bg-yellow-400' },
                  { name: 'lime', color: 'bg-lime-400' },
                  { name: 'green', color: 'bg-green-400' },
                  { name: 'emerald', color: 'bg-emerald-400' },
                  { name: 'teal', color: 'bg-teal-400' },
                  { name: 'cyan', color: 'bg-cyan-400' },
                  { name: 'sky', color: 'bg-sky-400' },
                  { name: 'blue', color: 'bg-blue-400' },
                  { name: 'indigo', color: 'bg-indigo-400' },
                  { name: 'violet', color: 'bg-violet-400' },
                  { name: 'purple', color: 'bg-purple-400' },
                  { name: 'fuchsia', color: 'bg-fuchsia-400' },
                  { name: 'pink', color: 'bg-pink-400' },
                  { name: 'rose', color: 'bg-rose-400' }
                ].map((theme) => (
                  <button
                    key={theme.name}
                    onClick={() => {
                      changeBackground(theme.name as any)
                      setShowColorPicker(false)
                    }}
                    className={`w-6 h-6 rounded-full ${theme.color} border-2 hover:scale-110 transition-transform ${
                      backgroundColor === theme.name ? 'border-gray-900 dark:border-white' : 'border-gray-300'
                    }`}
                    title={theme.name}
                  />
                ))}
              </div>
            </div>
          )}
          </div>
        </div>
        
        <Button
          variant="ghost"
          onClick={handleSignOut}
          className="w-full flex items-center space-x-3 text-red-600 hover:text-red-700"
        >
          <LogOut className="h-5 w-5" />
          <span>Keluar</span>
        </Button>
      </div>
      
      {/* Close button for mobile */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onToggle}
        className="fixed top-4 right-4 z-40 lg:hidden p-2 bg-white dark:bg-gray-800 shadow-lg rounded-lg"
      >
        <X className="h-5 w-5" />
      </Button>
    </div>
    </>
  )
}