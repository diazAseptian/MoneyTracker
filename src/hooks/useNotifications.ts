import { useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'
import toast from 'react-hot-toast'

export function useNotifications() {
  const { user } = useAuth()

  useEffect(() => {
    if ('Notification' in window && user) {
      requestNotificationPermission()
    }
  }, [user])

  const requestNotificationPermission = async () => {
    if (Notification.permission === 'default') {
      await Notification.requestPermission()
    }
  }

  const sendPushNotification = (title: string, body: string, icon?: string) => {
    if (Notification.permission === 'granted') {
      new Notification(title, {
        body,
        icon: icon || '/favicon.ico',
        badge: '/favicon.ico'
      })
    }
  }



  useEffect(() => {
    if (!user) return

    const checkNotifications = async () => {
      await Promise.all([
        checkGoalDeadlines(),
        checkDebtDueDates(),
        checkBudgetLimits()
      ])
    }

    // Check immediately and then every hour
    checkNotifications()
    const interval = setInterval(checkNotifications, 60 * 60 * 1000)

    return () => clearInterval(interval)
  }, [user])

  const checkGoalDeadlines = async () => {
    const { data: goals } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', user?.id)
      .not('deadline', 'is', null)

    goals?.forEach(goal => {
      const deadline = new Date(goal.deadline)
      const today = new Date()
      const daysLeft = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      
      if (daysLeft <= 7 && daysLeft > 0) {
        const message = `Target "${goal.nama}" akan berakhir dalam ${daysLeft} hari!`
        toast(`⏰ ${message}`, {
          duration: 5000,
          icon: '🎯'
        })
        sendPushNotification('🎯 Target Mendekati Deadline', message)
      }
    })
  }

  const checkDebtDueDates = async () => {
    const { data: debts } = await supabase
      .from('hutang')
      .select('*')
      .eq('user_id', user?.id)
      .eq('status', 'aktif')
      .not('tanggal_jatuh_tempo', 'is', null)

    debts?.forEach(debt => {
      const dueDate = new Date(debt.tanggal_jatuh_tempo)
      const today = new Date()
      const daysLeft = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      
      if (daysLeft <= 3 && daysLeft >= 0) {
        const message = `Hutang "${debt.nama_kreditor}" jatuh tempo dalam ${daysLeft} hari!`
        toast(`💳 ${message}`, {
          duration: 5000,
          icon: '⚠️'
        })
        sendPushNotification('⚠️ Hutang Jatuh Tempo', message)
      }
    })
  }

  const checkBudgetLimits = async () => {
    const currentMonth = new Date().getMonth() + 1
    const currentYear = new Date().getFullYear()

    const { data: budgets } = await supabase
      .from('budget')
      .select('*, kategori(nama)')
      .eq('user_id', user?.id)
      .eq('bulan', currentMonth)
      .eq('tahun', currentYear)

    for (const budget of budgets || []) {
      const { data: expenses } = await supabase
        .from('pengeluaran')
        .select('jumlah')
        .eq('user_id', user?.id)
        .eq('kategori_id', budget.kategori_id)
        .gte('tanggal', `${currentYear}-${currentMonth.toString().padStart(2, '0')}-01`)
        .lt('tanggal', `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}-01`)

      const totalExpenses = expenses?.reduce((sum, exp) => sum + exp.jumlah, 0) || 0
      const percentage = (totalExpenses / budget.limit_amount) * 100

      if (percentage >= 90) {
        const message = `Budget "${budget.kategori.nama}" sudah ${percentage.toFixed(0)}% terpakai!`
        toast(`🚨 ${message}`, {
          duration: 5000,
          icon: '💸'
        })
        sendPushNotification('🚨 Budget Hampir Habis', message)
      }
    }
  }

  return { checkGoalDeadlines, checkDebtDueDates, checkBudgetLimits, sendPushNotification }
}