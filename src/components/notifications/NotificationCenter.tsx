import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card'
import { Button } from '../ui/Button'
import { Bell, X, Target, CreditCard, AlertTriangle } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'

interface Notification {
  id: string
  type: 'goal' | 'debt' | 'budget'
  title: string
  message: string
  priority: 'low' | 'medium' | 'high'
  created_at: string
}

export function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const { user } = useAuth()

  useEffect(() => {
    if (user) {
      generateNotifications()
    }
  }, [user])

  const generateNotifications = async () => {
    const notifs: Notification[] = []

    // Check goal deadlines
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
        notifs.push({
          id: `goal-${goal.id}`,
          type: 'goal',
          title: 'Target Mendekati Deadline',
          message: `Target "${goal.nama}" akan berakhir dalam ${daysLeft} hari`,
          priority: daysLeft <= 3 ? 'high' : 'medium',
          created_at: new Date().toISOString()
        })
      }
    })

    // Check debt due dates
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
      
      if (daysLeft <= 5 && daysLeft >= 0) {
        notifs.push({
          id: `debt-${debt.id}`,
          type: 'debt',
          title: 'Hutang Jatuh Tempo',
          message: `Hutang "${debt.nama_kreditor}" jatuh tempo dalam ${daysLeft} hari`,
          priority: daysLeft <= 1 ? 'high' : 'medium',
          created_at: new Date().toISOString()
        })
      }
    })

    setNotifications(notifs)
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'goal': return Target
      case 'debt': return CreditCard
      case 'budget': return AlertTriangle
      default: return Bell
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50 dark:bg-red-900/20'
      case 'medium': return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20'
      default: return 'text-blue-600 bg-blue-50 dark:bg-blue-900/20'
    }
  }

  const dismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2"
      >
        <Bell className="h-5 w-5" />
        {notifications.length > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {notifications.length}
          </span>
        )}
      </Button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 max-h-96 overflow-y-auto z-50">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center justify-between">
                <span>Notifikasi ({notifications.length})</span>
                <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {notifications.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                  Tidak ada notifikasi
                </p>
              ) : (
                notifications.map((notif) => {
                  const Icon = getIcon(notif.type)
                  return (
                    <div
                      key={notif.id}
                      className={`p-3 rounded-lg ${getPriorityColor(notif.priority)} relative`}
                    >
                      <div className="flex items-start space-x-3">
                        <Icon className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{notif.title}</p>
                          <p className="text-xs mt-1 opacity-90">{notif.message}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => dismissNotification(notif.id)}
                          className="p-1 h-auto opacity-60 hover:opacity-100"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  )
                })
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}