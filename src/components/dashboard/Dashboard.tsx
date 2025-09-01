import React, { useState, useEffect } from 'react'
import { StatsCard } from './StatsCard'
import { ExpenseChart } from './ExpenseChart'
import { BalanceChart } from './BalanceChart'
import { GoalsSummary } from './GoalsSummary'
import { TransactionList } from '../transactions/TransactionList'
import { TrendingUp, TrendingDown, Wallet, Target } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'

interface DashboardStats {
  totalIncome: number
  totalExpenses: number
  balance: number
  activeGoals: number
}

export function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalIncome: 0,
    totalExpenses: 0,
    balance: 0,
    activeGoals: 0
  })
  const [hasGoals, setHasGoals] = useState(false)
  const [expenseChartData, setExpenseChartData] = useState<any[]>([])
  const [balanceChartData, setBalanceChartData] = useState<any[]>([])
  const { user } = useAuth()

  useEffect(() => {
    if (user) {
      fetchStats()
      fetchChartData()
    }
  }, [user])

  const fetchStats = async () => {
    // Fetch total income
    const { data: incomeData } = await supabase
      .from('pemasukan')
      .select('jumlah')
      .eq('user_id', user?.id)

    // Fetch total expenses
    const { data: expenseData } = await supabase
      .from('pengeluaran')
      .select('jumlah')
      .eq('user_id', user?.id)

    // Fetch goals count
    const { data: goalsData } = await supabase
      .from('goals')
      .select('id')
      .eq('user_id', user?.id)

    const totalIncome = incomeData?.reduce((sum, item) => sum + item.jumlah, 0) || 0
    const totalExpenses = expenseData?.reduce((sum, item) => sum + item.jumlah, 0) || 0
    const activeGoals = goalsData?.length || 0

    setStats({
      totalIncome,
      totalExpenses,
      balance: totalIncome - totalExpenses,
      activeGoals
    })
    
    setHasGoals(activeGoals > 0)
  }

  const fetchChartData = async () => {
    // Fetch expense data by category
    const { data: expensesByCategory } = await supabase
      .from('pengeluaran')
      .select('jumlah, kategori(nama)')
      .eq('user_id', user?.id)

    const categoryTotals: { [key: string]: number } = {}
    expensesByCategory?.forEach((expense) => {
      const categoryName = expense.kategori?.nama || 'Lain-lain'
      categoryTotals[categoryName] = (categoryTotals[categoryName] || 0) + expense.jumlah
    })

    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4']
    const chartData = Object.entries(categoryTotals).map(([name, value], index) => ({
      name,
      value,
      color: colors[index % colors.length]
    }))

    setExpenseChartData(chartData)

    // Generate balance chart data (last 6 months)
    const months = []
    for (let i = 5; i >= 0; i--) {
      const date = new Date()
      date.setMonth(date.getMonth() - i)
      const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1)
      const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0)
      
      // Get income for this month
      const { data: monthIncome } = await supabase
        .from('pemasukan')
        .select('jumlah')
        .eq('user_id', user?.id)
        .gte('tanggal', startOfMonth.toISOString().split('T')[0])
        .lte('tanggal', endOfMonth.toISOString().split('T')[0])
      
      // Get expenses for this month
      const { data: monthExpenses } = await supabase
        .from('pengeluaran')
        .select('jumlah')
        .eq('user_id', user?.id)
        .gte('tanggal', startOfMonth.toISOString().split('T')[0])
        .lte('tanggal', endOfMonth.toISOString().split('T')[0])
      
      const income = monthIncome?.reduce((sum, item) => sum + item.jumlah, 0) || 0
      const expenses = monthExpenses?.reduce((sum, item) => sum + item.jumlah, 0) || 0
      
      months.push({
        month: date.toLocaleDateString('id-ID', { month: 'short' }),
        balance: income - expenses
      })
    }
    setBalanceChartData(months)
  }

  return (
    <div className="space-y-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Pemasukan"
          value={`Rp ${stats.totalIncome.toLocaleString('id-ID')}`}
          icon={TrendingUp}
          color="green"
        />
        <StatsCard
          title="Total Pengeluaran"
          value={`Rp ${stats.totalExpenses.toLocaleString('id-ID')}`}
          icon={TrendingDown}
          color="red"
        />
        <StatsCard
          title="Saldo"
          value={`Rp ${stats.balance.toLocaleString('id-ID')}`}
          icon={Wallet}
          color={stats.balance >= 0 ? 'blue' : 'red'}
        />
        <StatsCard
          title="Target Aktif"
          value={stats.activeGoals.toString()}
          icon={Target}
          color="purple"
        />
      </div>

      {/* Charts and Goals */}
      {(expenseChartData.length > 0 || balanceChartData.length > 0 || hasGoals) ? (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {expenseChartData.length > 0 && (
            <div className="xl:col-span-1">
              <ExpenseChart data={expenseChartData} />
            </div>
          )}
          <div className="xl:col-span-1">
            <BalanceChart data={balanceChartData} />
          </div>
          {hasGoals && (
            <div className="xl:col-span-1">
              <GoalsSummary />
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400 text-lg">
            Belum ada data untuk ditampilkan
          </p>
          <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">
            Mulai tambahkan pemasukan, pengeluaran, dan target keuangan
          </p>
        </div>
      )}
    </div>
  )
}