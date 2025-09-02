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
  const [bankFilter, setBankFilter] = useState('')
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
    
    const matchesBank = !bankFilter || (transaction.keterangan && transaction.keterangan.toLowerCase().includes(bankFilter.toLowerCase()))
    
    return matchesSearch && matchesCategory && matchesBank
  })

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col space-y-3 lg:flex-row lg:justify-between lg:items-center lg:space-y-0">
          <CardTitle className="text-lg lg:text-xl">
            {type === 'pemasukan' ? 'Pemasukan' : 'Pengeluaran'}
          </CardTitle>
          <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-3">
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
            
            {type === 'pemasukan' && (
              <select
                value={bankFilter}
                onChange={(e) => setBankFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors dark:border-gray-600 dark:bg-gray-800 dark:text-white w-full sm:w-40"
              >
                <option value="">Semua Bank</option>
                <option value="DANA">DANA</option>
                <option value="BTN">BTN</option>
                <option value="Seabank">Seabank</option>
              </select>
            )}
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
              <div key={transaction.id} className="p-3 lg:p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                <div className="flex flex-col space-y-2 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
                  <div className="flex-1">
                    <div className="flex flex-col space-y-1 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
                      <h4 className="font-medium text-gray-900 dark:text-white text-sm lg:text-base">
                        {transaction.keterangan}
                      </h4>
                      <p className={`font-semibold text-base lg:text-lg ${type === 'pemasukan' ? 'text-green-600' : 'text-red-600'}`}>
                        {type === 'pemasukan' ? '+' : '-'}Rp {transaction.jumlah.toLocaleString('id-ID')}
                      </p>
                    </div>
                    <div className="flex flex-col space-y-1 lg:flex-row lg:items-center text-xs lg:text-sm text-gray-600 dark:text-gray-400 lg:space-y-0 lg:space-x-4 mt-1">
                      <span>{format(new Date(transaction.tanggal), 'dd MMM yyyy', { locale: localeId })}</span>
                      {type === 'pemasukan' && transaction.sumber && (
                        <span className="lg:before:content-['•'] lg:before:mr-1">{transaction.sumber}</span>
                      )}
                      {type === 'pengeluaran' && (
                        <>
                          {transaction.kategori && (
                            <span className="lg:before:content-['•'] lg:before:mr-1">{transaction.kategori.nama}</span>
                          )}
                          {transaction.sumber && (
                            <span className="lg:before:content-['•'] lg:before:mr-1">{transaction.sumber}</span>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex space-x-1 justify-end lg:ml-4">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(transaction)}>
                      <Edit2 className="h-3 w-3 lg:h-4 lg:w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(transaction.id)}>
                      <Trash2 className="h-3 w-3 lg:h-4 lg:w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>


    </Card>
  )
}