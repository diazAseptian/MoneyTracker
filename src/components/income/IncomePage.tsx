import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card'
import { TransactionList } from '../transactions/TransactionList'
import { TransactionForm } from '../transactions/TransactionForm'
import { Plus, TrendingUp, Wallet, CreditCard } from 'lucide-react'
import { Button } from '../ui/Button'
import { Modal } from '../ui/Modal'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'

export function IncomePage() {
  const [showForm, setShowForm] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const [balances, setBalances] = useState({ cash: 0, debit: 0 })
  const { user } = useAuth()

  const handleEdit = (transaction: any) => {
    setEditingTransaction(transaction)
    setShowForm(true)
  }

  const handleSuccess = () => {
    setShowForm(false)
    setEditingTransaction(null)
    setRefreshKey(prev => prev + 1)
    fetchBalances()
  }

  useEffect(() => {
    if (user) {
      fetchBalances()
    }
  }, [user, refreshKey])

  const fetchBalances = async () => {
    // Get cash income
    const { data: cashIncome } = await supabase
      .from('pemasukan')
      .select('jumlah')
      .eq('user_id', user?.id)
      .eq('sumber', 'Cash')

    // Get debit income
    const { data: debitIncome } = await supabase
      .from('pemasukan')
      .select('jumlah')
      .eq('user_id', user?.id)
      .eq('sumber', 'Debit')

    // Get cash expenses
    const { data: cashExpenses } = await supabase
      .from('pengeluaran')
      .select('jumlah')
      .eq('user_id', user?.id)
      .eq('sumber', 'Cash')

    // Get debit expenses
    const { data: debitExpenses } = await supabase
      .from('pengeluaran')
      .select('jumlah')
      .eq('user_id', user?.id)
      .eq('sumber', 'Debit')

    const totalCashIncome = cashIncome?.reduce((sum, item) => sum + item.jumlah, 0) || 0
    const totalDebitIncome = debitIncome?.reduce((sum, item) => sum + item.jumlah, 0) || 0
    const totalCashExpenses = cashExpenses?.reduce((sum, item) => sum + item.jumlah, 0) || 0
    const totalDebitExpenses = debitExpenses?.reduce((sum, item) => sum + item.jumlah, 0) || 0

    setBalances({
      cash: totalCashIncome - totalCashExpenses,
      debit: totalDebitIncome - totalDebitExpenses
    })
  }

  return (
    <div className="space-y-6">
      {/* Balance Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <CardContent className="flex items-center space-x-4 min-h-[120px] p-6">
            <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
              <Wallet className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Saldo Cash</p>
              <p className="text-xl font-semibold text-gray-900 dark:text-white">
                Rp {balances.cash.toLocaleString('id-ID')}
              </p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="flex items-center space-x-4 min-h-[120px] p-6">
            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <CreditCard className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Saldo Debit</p>
              <p className="text-xl font-semibold text-gray-900 dark:text-white">
                Rp {balances.debit.toLocaleString('id-ID')}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transactions */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <span>Pemasukan</span>
            </CardTitle>
            <Button size="sm" onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Tambah
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <TransactionList key={refreshKey} type="pemasukan" onEdit={handleEdit} />
        </CardContent>
      
      <Modal isOpen={showForm} onClose={() => { setShowForm(false); setEditingTransaction(null) }} title={editingTransaction ? "Edit Pemasukan" : "Tambah Pemasukan"}>
        <TransactionForm 
          type="pemasukan" 
          transaction={editingTransaction}
          onSuccess={handleSuccess}
          onCancel={() => { setShowForm(false); setEditingTransaction(null) }}
        />
      </Modal>
      </Card>
    </div>
  )
}