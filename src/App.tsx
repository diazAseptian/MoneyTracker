import React, { useState } from 'react'
import { Menu } from 'lucide-react'
import { useAuth } from './hooks/useAuth'
import { useBackground } from './hooks/useBackground'
import { useTheme } from './hooks/useTheme'
import { useNotifications } from './hooks/useNotifications'
import { AuthPage } from './components/auth/AuthPage'
import { Dashboard } from './components/dashboard/Dashboard'
import { Sidebar } from './components/layout/Sidebar'
import { IncomePage } from './components/income/IncomePage'
import { ExpensePage } from './components/expenses/ExpensePage'
import { GoalsPage } from './components/goals/GoalsPage'
import { DebtPage } from './components/debt/DebtPage'
import { NotificationCenter } from './components/notifications/NotificationCenter'
import { Button } from './components/ui/Button'
import { Toaster } from 'react-hot-toast'

function App() {
  const { user, loading } = useAuth()
  useBackground() // Initialize background hook
  useTheme() // Initialize theme hook
  useNotifications() // Initialize notifications hook
  const [activeTab, setActiveTab] = useState('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user) {
    return (
      <>
        <AuthPage />
        <Toaster position="top-right" />
      </>
    )
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />
      case 'pemasukan':
        return <IncomePage />
      case 'pengeluaran':
        return <ExpensePage />
      case 'target':
        return <GoalsPage />
      case 'hutang':
        return <DebtPage />
      default:
        return <Dashboard />
    }
  }

  return (
    <div className="min-h-screen">
      {/* Mobile header */}
      <div className="lg:hidden bg-white dark:bg-gray-800 shadow-sm p-4 flex items-center justify-between fixed top-0 left-0 right-0 z-10">
        <h1 className="text-lg font-bold text-gray-900 dark:text-white">MoneyTracker</h1>
        <div className="flex items-center space-x-2">
          <NotificationCenter />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(true)}
            className="p-2"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>
      
      <Sidebar 
        activeTab={activeTab} 
        onTabChange={(tab) => {
          setActiveTab(tab)
          setSidebarOpen(false)
        }} 
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />
      <main className="lg:ml-64 p-4 lg:p-8 pt-20 lg:pt-8">
        {renderContent()}
      </main>
      <Toaster position="top-right" />
    </div>
  )
}

export default App