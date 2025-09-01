import React from 'react'
import { useAuth } from '../../hooks/useAuth'
import { useTheme } from '../../hooks/useTheme'
import { Button } from '../ui/Button'
import { Wallet, Sun, Moon, LogOut } from 'lucide-react'
import toast from 'react-hot-toast'

export function Navbar() {
  const { user, signOut } = useAuth()
  const { isDark, toggleTheme } = useTheme()

  const handleSignOut = async () => {
    const { error } = await signOut()
    if (error) {
      toast.error('Gagal keluar')
    } else {
      toast.success('Berhasil keluar')
    }
  }

  return (
    <nav className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-600 rounded-lg">
              <Wallet className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              MoneyTracker
            </h1>
          </div>
          
          <div className="flex items-center space-x-3">
            <span className="text-sm text-gray-600 dark:text-gray-400 hidden sm:block">
              {user?.email}
            </span>
            <Button variant="ghost" size="sm" onClick={toggleTheme}>
              {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </nav>
  )
}