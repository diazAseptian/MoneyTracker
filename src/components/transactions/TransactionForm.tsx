import React, { useState, useEffect } from 'react'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Modal } from '../ui/Modal'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import toast from 'react-hot-toast'

interface Category {
  id: string
  nama: string
  tipe: 'pemasukan' | 'pengeluaran'
}

interface Transaction {
  id?: string
  tanggal: string
  jumlah: number
  keterangan: string
  sumber?: string
  kategori_id?: string
}

interface TransactionFormProps {
  type: 'pemasukan' | 'pengeluaran'
  transaction?: Transaction | null
  onSuccess: () => void
  onCancel: () => void
}

export function TransactionForm({ type, transaction, onSuccess, onCancel }: TransactionFormProps) {
  const [categories, setCategories] = useState<Category[]>([])
  const [formData, setFormData] = useState({
    tanggal: new Date().toISOString().split('T')[0],
    jumlah: '',
    keterangan: '',
    sumber: 'Cash',
    kategori_id: '',
    bank: ''
  })
  const { user } = useAuth()

  useEffect(() => {
    if (user) {
      fetchCategories()
    }
  }, [user, type])

  useEffect(() => {
    if (transaction) {
      setFormData({
        tanggal: transaction.tanggal,
        jumlah: transaction.jumlah.toString(),
        keterangan: transaction.keterangan,
        sumber: transaction.sumber || 'Cash',
        kategori_id: transaction.kategori_id || '',
        bank: ''
      })
    } else {
      setFormData({
        tanggal: new Date().toISOString().split('T')[0],
        jumlah: '',
        keterangan: '',
        sumber: 'Cash',
        kategori_id: '',
        bank: ''
      })
    }
  }, [transaction])

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from('kategori')
      .select('*')
      .eq('user_id', user?.id)
      .eq('tipe', type)
      .order('nama')

    if (error) {
      toast.error('Gagal mengambil kategori')
    } else {
      setCategories(data || [])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.jumlah || !formData.keterangan) {
      toast.error('Jumlah dan keterangan harus diisi')
      return
    }

    // Prepare keterangan with bank info for debit transactions
    let keterangan = formData.keterangan
    if (type === 'pengeluaran' && formData.sumber === 'Debit' && formData.bank) {
      keterangan = formData.bank + (formData.keterangan ? ` - ${formData.keterangan}` : '')
    }

    const transactionData = {
      user_id: user?.id,
      tanggal: formData.tanggal,
      jumlah: parseFloat(formData.jumlah),
      keterangan: keterangan,
      ...(type === 'pemasukan' ? { sumber: formData.kategori_id === 'cash' ? 'Cash' : 'Debit' } : { kategori_id: formData.kategori_id, sumber: formData.sumber })
    }

    if (transaction?.id) {
      const { error } = await supabase
        .from(type)
        .update(transactionData)
        .eq('id', transaction.id)

      if (error) {
        toast.error(`Gagal mengupdate ${type}`)
      } else {
        toast.success(`${type} berhasil diupdate`)
        onSuccess()
      }
    } else {
      const { error } = await supabase
        .from(type)
        .insert([transactionData])

      if (error) {
        toast.error(`Gagal menambah ${type}`)
      } else {
        toast.success(`${type} berhasil ditambahkan`)
        onSuccess()
      }
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Tanggal"
          type="date"
          value={formData.tanggal}
          onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })}
          required
        />
        <Input
          label="Jumlah (Rp)"
          type="number"
          value={formData.jumlah}
          onChange={(e) => setFormData({ ...formData, jumlah: e.target.value })}
          placeholder="50000"
          required
        />
        
        {type === 'pemasukan' ? (
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Kategori
            </label>
            <select
              value={formData.kategori_id}
              onChange={(e) => setFormData({ ...formData, kategori_id: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              required
            >
              <option value="">Pilih kategori</option>
              <option value="cash">Cash</option>
              <option value="debit">Debit</option>
            </select>
          </div>
        ) : (
          <>
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Kategori
              </label>
              <select
                value={formData.kategori_id}
                onChange={(e) => setFormData({ ...formData, kategori_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                required
              >
                <option value="">Pilih kategori</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.nama}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Sumber Pembayaran
              </label>
              <select
                value={formData.sumber}
                onChange={(e) => {
                  setFormData({ ...formData, sumber: e.target.value, bank: '' })
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                required
              >
                <option value="Cash">Cash</option>
                <option value="Debit">Debit</option>
              </select>
            </div>
            
            {formData.sumber === 'Debit' && (
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Bank/E-Wallet
                </label>
                <select
                  value={formData.bank}
                  onChange={(e) => setFormData({ ...formData, bank: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                  required
                >
                  <option value="">Pilih Bank/E-Wallet</option>
                  <option value="DANA">DANA</option>
                  <option value="BTN">BTN</option>
                  <option value="Seabank">Seabank</option>
                </select>
              </div>
            )}
          </>
        )}
        
        <Input
          label="Keterangan"
          value={formData.keterangan}
          onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
          placeholder="Deskripsi transaksi"
          required
        />
        
        <div className="flex space-x-3 pt-4">
          <Button type="submit" className="flex-1">
            {transaction ? 'Update' : 'Tambah'}
          </Button>
          <Button type="button" variant="outline" onClick={onCancel}>
            Batal
          </Button>
        </div>
      </form>
  )
}