import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Plus, Edit2, Trash2, Search } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { TransactionForm } from './TransactionForm'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { id as localeId } from 'date-fns/locale'

interface Transaction {
  id: string
  tanggal: string
  jumlah: number
  keterangan: string
  sumber?: string
  kategori_id?: string
  kategori?: {
    nama: string
  }
}

interface TransactionListProps {
  type: 'pemasukan' | 'pengeluaran'
  onEdit?: (transaction: Transaction) => void
}

export function TransactionList({ type, onEdit }: TransactionListProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [categories, setCategories] = useState<any[]>([])
  const { user } = useAuth()

  useEffect(() => {
    if (user) {
      fetchTransactions()
      fetchCategories()
    }
  }, [user, type])

  const fetchTransactions = async () => {
    let query = supabase
      .from(type)
      .select(type === 'pengeluaran' ? '*, kategori(nama)' : '*')
      .eq('user_id', user?.id)
      .order('tanggal', { ascending: false })

    const { data, error } = await query

    if (error) {
      toast.error(`Gagal mengambil data ${type}`)
    } else {
      setTransactions(data || [])
    }
  }

  const fetchCategories = async () => {
    if (type === 'pemasukan') {
      setCategories([{ id: 'cash', nama: 'Cash' }, { id: 'debit', nama: 'Debit' }])
    } else {
      const { data } = await supabase
        .from('kategori')
        .select('*')
        .eq('user_id', user?.id)
        .eq('tipe', 'pengeluaran')
        .order('nama')
      setCategories(data || [])
    }
  }

  const handleEdit = (transaction: Transaction) => {
    if (onEdit) {
      onEdit(transaction)
    }
  }

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from(type)
      .delete()
      .eq('id', id)

    if (error) {
      toast.error(`Gagal menghapus ${type}`)
    } else {
      toast.success(`${type} berhasil dihapus`)
      fetchTransactions()
    }
  }

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = transaction.keterangan.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (transaction.sumber && transaction.sumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (transaction.kategori && transaction.kategori.nama.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesCategory = !categoryFilter || 
      (type === 'pemasukan' && transaction.sumber?.toLowerCase() === categoryFilter.toLowerCase()) ||
      (type === 'pengeluaran' && transaction.kategori_id === categoryFilter)
    
    return matchesSearch && matchesCategory
  })

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-3 sm:space-y-0">
          <CardTitle>
            {type === 'pemasukan' ? 'Pemasukan' : 'Pengeluaran'}
          </CardTitle>
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Cari transaksi..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full sm:w-48"
              />
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors dark:border-gray-600 dark:bg-gray-800 dark:text-white w-full sm:w-40"
            >
              <option value="">Semua Kategori</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.nama}
                </option>
              ))}
            </select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {filteredTransactions.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">
              {searchTerm ? 'Tidak ada transaksi yang cocok' : `Belum ada ${type}`}
            </p>
          ) : (
            filteredTransactions.map((transaction) => (
              <div key={transaction.id} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      {transaction.keterangan}
                    </h4>
                    <p className={`font-semibold text-lg ${type === 'pemasukan' ? 'text-green-600' : 'text-red-600'}`}>
                      {type === 'pemasukan' ? '+' : '-'}Rp {transaction.jumlah.toLocaleString('id-ID')}
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center text-sm text-gray-600 dark:text-gray-400 space-y-1 sm:space-y-0 sm:space-x-4 mt-1">
                    <span>{format(new Date(transaction.tanggal), 'dd MMMM yyyy', { locale: localeId })}</span>
                    {type === 'pemasukan' && transaction.sumber && (
                      <span>• {transaction.sumber}</span>
                    )}
                    {type === 'pengeluaran' && transaction.kategori && (
                      <span>• {transaction.kategori.nama}</span>
                    )}
                  </div>
                </div>
                <div className="flex space-x-1 ml-4">
                  <Button variant="ghost" size="sm" onClick={() => handleEdit(transaction)}>
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(transaction.id)}>
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>


    </Card>
  )
}