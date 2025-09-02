import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Modal } from '../ui/Modal'
import { Plus, CreditCard, Edit2, Trash2, DollarSign } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { id as localeId } from 'date-fns/locale'

interface Debt {
  id: string
  nama_kreditor: string
  jumlah_hutang: number
  jumlah_terbayar: number
  tanggal_hutang: string
  tanggal_jatuh_tempo: string | null
  keterangan: string
  status: string
}

export function DebtPage() {
  const [debts, setDebts] = useState<Debt[]>([])
  const [filteredDebts, setFilteredDebts] = useState<Debt[]>([])
  const [statusFilter, setStatusFilter] = useState('semua')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [editingDebt, setEditingDebt] = useState<Debt | null>(null)
  const [selectedDebt, setSelectedDebt] = useState<Debt | null>(null)
  const [paymentAmount, setPaymentAmount] = useState('')
  const [formData, setFormData] = useState({
    nama_kreditor: '',
    jumlah_hutang: '',
    tanggal_hutang: new Date().toISOString().split('T')[0],
    tanggal_jatuh_tempo: '',
    keterangan: ''
  })
  const { user } = useAuth()

  useEffect(() => {
    if (user) {
      fetchDebts()
    }
  }, [user])

  useEffect(() => {
    filterDebts()
  }, [debts, statusFilter])

  const fetchDebts = async () => {
    const { data, error } = await supabase
      .from('hutang')
      .select('*')
      .eq('user_id', user?.id)
      .order('created_at', { ascending: false })

    if (error) {
      toast.error('Gagal mengambil data hutang')
    } else {
      setDebts(data || [])
    }
  }

  const filterDebts = () => {
    let filtered = debts
    const today = new Date()

    switch (statusFilter) {
      case 'aktif':
        filtered = debts.filter(debt => debt.status === 'aktif')
        break
      case 'lunas':
        filtered = debts.filter(debt => debt.status === 'lunas')
        break
      case 'lewat_tempo':
        filtered = debts.filter(debt => {
          if (!debt.tanggal_jatuh_tempo || debt.status === 'lunas') return false
          const dueDate = new Date(debt.tanggal_jatuh_tempo)
          return dueDate < today
        })
        break
      default:
        filtered = debts
    }

    setFilteredDebts(filtered)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.nama_kreditor || !formData.jumlah_hutang) {
      toast.error('Nama kreditor dan jumlah hutang harus diisi')
      return
    }

    const debtData = {
      user_id: user?.id,
      nama_kreditor: formData.nama_kreditor,
      jumlah_hutang: parseFloat(formData.jumlah_hutang),
      tanggal_hutang: formData.tanggal_hutang,
      tanggal_jatuh_tempo: formData.tanggal_jatuh_tempo || null,
      keterangan: formData.keterangan
    }

    if (editingDebt) {
      const { error } = await supabase
        .from('hutang')
        .update(debtData)
        .eq('id', editingDebt.id)

      if (error) {
        toast.error('Gagal mengupdate hutang')
      } else {
        toast.success('Hutang berhasil diupdate')
        fetchDebts()
        resetForm()
      }
    } else {
      const { error } = await supabase
        .from('hutang')
        .insert([debtData])

      if (error) {
        toast.error('Gagal menambah hutang')
      } else {
        toast.success('Hutang berhasil ditambahkan')
        fetchDebts()
        resetForm()
      }
    }
  }

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!paymentAmount || !selectedDebt) return

    const amount = parseFloat(paymentAmount)
    const newPaid = selectedDebt.jumlah_terbayar + amount
    const status = newPaid >= selectedDebt.jumlah_hutang ? 'lunas' : 'aktif'

    const { error } = await supabase
      .from('hutang')
      .update({ 
        jumlah_terbayar: newPaid,
        status: status
      })
      .eq('id', selectedDebt.id)

    if (error) {
      toast.error('Gagal mencatat pembayaran')
    } else {
      toast.success(`Pembayaran Rp ${amount.toLocaleString('id-ID')} berhasil dicatat`)
      fetchDebts()
      setIsPaymentModalOpen(false)
      setPaymentAmount('')
      setSelectedDebt(null)
    }
  }

  const resetForm = () => {
    setFormData({
      nama_kreditor: '',
      jumlah_hutang: '',
      tanggal_hutang: new Date().toISOString().split('T')[0],
      tanggal_jatuh_tempo: '',
      keterangan: ''
    })
    setEditingDebt(null)
    setIsModalOpen(false)
  }

  const handleEdit = (debt: Debt) => {
    setEditingDebt(debt)
    setFormData({
      nama_kreditor: debt.nama_kreditor,
      jumlah_hutang: debt.jumlah_hutang.toString(),
      tanggal_hutang: debt.tanggal_hutang,
      tanggal_jatuh_tempo: debt.tanggal_jatuh_tempo || '',
      keterangan: debt.keterangan
    })
    setIsModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from('hutang')
      .delete()
      .eq('id', id)

    if (error) {
      toast.error('Gagal menghapus hutang')
    } else {
      toast.success('Hutang berhasil dihapus')
      fetchDebts()
    }
  }

  const handlePaymentModal = (debt: Debt) => {
    setSelectedDebt(debt)
    setPaymentAmount('')
    setIsPaymentModalOpen(true)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col space-y-4 lg:flex-row lg:justify-between lg:items-center lg:space-y-0">
          <CardTitle className="flex items-center space-x-2">
            <CreditCard className="h-5 w-5 text-red-600" />
            <span>Daftar Hutang</span>
          </CardTitle>
          <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors dark:border-gray-600 dark:bg-gray-800 dark:text-white w-full sm:w-40"
            >
              <option value="semua">Semua Status</option>
              <option value="aktif">Aktif</option>
              <option value="lunas">Lunas</option>
              <option value="lewat_tempo">Lewat Tempo</option>
            </select>
            <Button size="sm" onClick={() => setIsModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Tambah
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {filteredDebts.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">
              {debts.length === 0 ? 'Belum ada hutang tercatat' : 'Tidak ada hutang dengan status ini'}
            </p>
          ) : (
            filteredDebts.map((debt) => {
              const remaining = debt.jumlah_hutang - debt.jumlah_terbayar
              const percentage = (debt.jumlah_terbayar / debt.jumlah_hutang) * 100
              const isOverdue = debt.tanggal_jatuh_tempo && new Date(debt.tanggal_jatuh_tempo) < new Date() && debt.status === 'aktif'
              
              return (
                <div key={debt.id} className={`p-4 border rounded-lg ${
                  isOverdue 
                    ? 'border-red-300 bg-red-50 dark:border-red-700 dark:bg-red-900/20'
                    : 'border-gray-200 dark:border-gray-700'
                }`}>
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">{debt.nama_kreditor}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {debt.keterangan}
                      </p>
                      {debt.tanggal_jatuh_tempo && (
                        <p className={`text-xs mt-1 ${
                          isOverdue ? 'text-red-600 font-medium' : 'text-gray-500'
                        }`}>
                          Jatuh tempo: {new Date(debt.tanggal_jatuh_tempo).toLocaleDateString('id-ID')}
                          {isOverdue && ' (Lewat Tempo)'}
                        </p>
                      )}
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      debt.status === 'lunas' 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                        : isOverdue
                        ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
                    }`}>
                      {debt.status === 'lunas' ? 'Lunas' : isOverdue ? 'Lewat Tempo' : 'Aktif'}
                    </span>
                  </div>
                  
                  <div className="mb-3">
                    <div className="flex justify-between text-sm mb-1">
                      <span>Progress Pembayaran</span>
                      <span>{percentage.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-green-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-sm">
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">
                        Terbayar: Rp {debt.jumlah_terbayar.toLocaleString('id-ID')}
                      </p>
                      <p className="text-red-600 font-medium">
                        Sisa: Rp {remaining.toLocaleString('id-ID')}
                      </p>
                    </div>
                    <div className="flex space-x-1">
                      {debt.status === 'aktif' && (
                        <Button variant="ghost" size="sm" onClick={() => handlePaymentModal(debt)}>
                          <DollarSign className="h-4 w-4 text-green-600" />
                        </Button>
                      )}
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(debt)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(debt.id)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </CardContent>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={resetForm}
        title={editingDebt ? 'Edit Hutang' : 'Tambah Hutang Baru'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Nama Kreditor"
            value={formData.nama_kreditor}
            onChange={(e) => setFormData({ ...formData, nama_kreditor: e.target.value })}
            placeholder="Bank, Teman, dll"
            required
          />
          <Input
            label="Jumlah Hutang (Rp)"
            type="number"
            value={formData.jumlah_hutang}
            onChange={(e) => setFormData({ ...formData, jumlah_hutang: e.target.value })}
            placeholder="1000000"
            required
          />
          <Input
            label="Tanggal Hutang"
            type="date"
            value={formData.tanggal_hutang}
            onChange={(e) => setFormData({ ...formData, tanggal_hutang: e.target.value })}
            required
          />
          <Input
            label="Tanggal Jatuh Tempo (Opsional)"
            type="date"
            value={formData.tanggal_jatuh_tempo}
            onChange={(e) => setFormData({ ...formData, tanggal_jatuh_tempo: e.target.value })}
          />
          <Input
            label="Keterangan"
            value={formData.keterangan}
            onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
            placeholder="Deskripsi hutang"
          />
          <div className="flex space-x-3 pt-4">
            <Button type="submit" className="flex-1">
              {editingDebt ? 'Update' : 'Tambah'}
            </Button>
            <Button type="button" variant="outline" onClick={resetForm}>
              Batal
            </Button>
          </div>
        </form>
      </Modal>

      {/* Payment Modal */}
      <Modal
        isOpen={isPaymentModalOpen}
        onClose={() => {
          setIsPaymentModalOpen(false)
          setPaymentAmount('')
          setSelectedDebt(null)
        }}
        title={`Bayar Hutang - ${selectedDebt?.nama_kreditor}`}
      >
        <form onSubmit={handlePayment} className="space-y-4">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              Sisa hutang: Rp {selectedDebt ? (selectedDebt.jumlah_hutang - selectedDebt.jumlah_terbayar).toLocaleString('id-ID') : 0}
            </p>
          </div>
          <Input
            label="Jumlah Pembayaran (Rp)"
            type="number"
            value={paymentAmount}
            onChange={(e) => setPaymentAmount(e.target.value)}
            placeholder="100000"
            required
          />
          <div className="flex space-x-3 pt-4">
            <Button type="submit" className="flex-1">
              Bayar
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => {
                setIsPaymentModalOpen(false)
                setPaymentAmount('')
                setSelectedDebt(null)
              }}
            >
              Batal
            </Button>
          </div>
        </form>
      </Modal>
    </Card>
  )
}