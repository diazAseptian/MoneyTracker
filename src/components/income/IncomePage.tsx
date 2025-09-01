import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card'
import { TransactionList } from '../transactions/TransactionList'
import { TransactionForm } from '../transactions/TransactionForm'
import { Plus, TrendingUp } from 'lucide-react'
import { Button } from '../ui/Button'
import { Modal } from '../ui/Modal'

export function IncomePage() {
  const [showForm, setShowForm] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState(null)
  const [refreshKey, setRefreshKey] = useState(0)

  const handleEdit = (transaction: any) => {
    setEditingTransaction(transaction)
    setShowForm(true)
  }

  const handleSuccess = () => {
    setShowForm(false)
    setEditingTransaction(null)
    setRefreshKey(prev => prev + 1)
  }

  return (
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
  )
}