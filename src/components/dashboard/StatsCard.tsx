import React from 'react'
import { Card, CardContent } from '../ui/Card'
import { LucideIcon } from 'lucide-react'

interface StatsCardProps {
  title: string
  value: string
  icon: LucideIcon
  color: string
  trend?: {
    value: string
    isPositive: boolean
  }
}

export function StatsCard({ title, value, icon: Icon, color, trend }: StatsCardProps) {
  const colorClasses = {
    blue: 'bg-blue-500 text-blue-600',
    green: 'bg-green-500 text-green-600', 
    red: 'bg-red-500 text-red-600',
    purple: 'bg-purple-500 text-purple-600'
  }

  const iconColorClasses = {
    blue: 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400',
    green: 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400',
    red: 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-400',
    purple: 'bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-400'
  }

  return (
    <Card className="hover:shadow-lg transition-all duration-200 border-0 shadow-sm">
      <CardContent className="p-6 flex items-center justify-center min-h-[120px]">
        <div className="flex items-center justify-between w-full">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
              {title}
            </p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
              {value}
            </p>
            {trend && (
              <p className={`text-xs font-medium ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                {trend.isPositive ? '↗' : '↘'} {trend.value}
              </p>
            )}
          </div>
          <div className={`p-3 rounded-xl ${iconColorClasses[color as keyof typeof iconColorClasses]}`}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}