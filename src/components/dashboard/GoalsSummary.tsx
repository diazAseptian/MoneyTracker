import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card'
import { Target } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'

interface Goal {
  id: string
  nama: string
  target: number
  progress: number
  deadline: string | null
}

export function GoalsSummary() {
  const [goals, setGoals] = useState<Goal[]>([])
  const { user } = useAuth()

  useEffect(() => {
    if (user) {
      fetchGoals()
    }
  }, [user])

  const fetchGoals = async () => {
    const { data } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', user?.id)
      .order('created_at', { ascending: false })
      .limit(3)

    setGoals(data || [])
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Target className="h-5 w-5 text-blue-600" />
          <span>Target Tabungan</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {goals.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">
              Belum ada target tabungan
            </p>
          ) : (
            goals.map((goal) => {
              const percentage = Math.min((goal.progress / goal.target) * 100, 100)
              return (
                <div key={goal.id} className="space-y-2">
                  <div className="flex justify-between items-start">
                    <h4 className="font-medium text-gray-900 dark:text-white text-sm">
                      {goal.nama}
                    </h4>
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      {percentage.toFixed(0)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Rp {goal.progress.toLocaleString('id-ID')} / Rp {goal.target.toLocaleString('id-ID')}
                  </p>
                </div>
              )
            })
          )}
        </div>
      </CardContent>
    </Card>
  )
}