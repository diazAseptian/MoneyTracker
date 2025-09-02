import React from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card'

interface BalanceChartProps {
  data: Array<{
    month: string
    balance: number
  }>
}

export function BalanceChart({ data }: BalanceChartProps) {
  return (
    <Card className="balance-chart">
      <CardHeader>
        <CardTitle>Perkembangan Saldo</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis tickFormatter={(value) => `Rp ${(value / 1000000).toFixed(1)}M`} />
              <Tooltip formatter={(value) => [`Rp ${value.toLocaleString('id-ID')}`, 'Saldo']} />
              <Line 
                type="monotone" 
                dataKey="balance" 
                stroke="#3B82F6" 
                strokeWidth={3}
                dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}