import React, { useState } from 'react'
import { useAuth } from './hooks/useAuth'
import { useBackground } from './hooks/useBackground'
import { useTheme } from './hooks/useTheme'
import { AuthPage } from './components/auth/AuthPage'
import { Dashboard } from './components/dashboard/Dashboard'
import { Sidebar } from './components/layout/Sidebar'
import { IncomePage } from './components/income/IncomePage'
import { ExpensePage } from './components/expenses/ExpensePage'
import { GoalsPage } from './components/goals/GoalsPage'
import { DebtPage } from './components/debt/DebtPage'
import { Toaster } from 'react-hot-toast'

function App() {
  const { user, loading } = useAuth()
  useBackground() // Initialize background hook
  useTheme() // Initialize theme hook
  const [activeTab, setActiveTab] = useState('dashboard')

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
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      <main className="ml-64 p-8">
        {renderContent()}
      </main>
      <Toaster position="top-right" />
    </div>
  )
}

export default App