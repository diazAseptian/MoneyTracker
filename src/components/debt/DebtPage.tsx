import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Modal } from '../ui/Modal'
import { Plus, CreditCard, Edit2, Trash2, DollarSign, Calendar, Eye, ChevronDown, ChevronUp } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import toast from 'react-hot-toast'

interface Debt {
  id: string
  nama_kreditor: string
  jumlah_hutang: number
  jumlah_terbayar: number
  tanggal_hutang: string
  tanggal_jatuh_tempo: string | null
  keterangan: string
  status: string
  cicilan_bulanan?: number
  tanggal_cicilan?: number
  durasi_bulan?: number
}

export function DebtPage() {
  const [debts, setDebts] = useState<Debt[]>([])
  const [filteredDebts, setFilteredDebts] = useState<Debt[]>([])
  const [statusFilter, setStatusFilter] = useState('semua')
  const [debtSummary, setDebtSummary] = useState({
    totalDebt: 0,
    totalPaid: 0,
    remaining: 0,
    monthlyDebt: 0,
    monthlyCount: 0
  })
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [editingDebt, setEditingDebt] = useState<Debt | null>(null)
  const [selectedDebt, setSelectedDebt] = useState<Debt | null>(null)
  const [paymentAmount, setPaymentAmount] = useState('')
  const [paymentHistory, setPaymentHistory] = useState<any[]>([])
  const [showPaymentHistory, setShowPaymentHistory] = useState(false)
  const [showInstallmentDetail, setShowInstallmentDetail] = useState(false)
  const [installmentDetails, setInstallmentDetails] = useState<any[]>([])
  const [showPaidDebts, setShowPaidDebts] = useState(false)
  const [formData, setFormData] = useState({
    nama_kreditor: '',
    jumlah_hutang: '',
    tanggal_hutang: new Date().toISOString().split('T')[0],
    tanggal_jatuh_tempo: '',
    keterangan: '',
    cicilan_bulanan: '',
    tanggal_cicilan: '1',
    durasi_bulan: ''
  })
  const { user } = useAuth()

  useEffect(() => {
    if (user) {
      fetchDebts()
    }
  }, [user])

  useEffect(() => {
    filterDebts()
    calculateSummary()
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

    // Sort: aktif debts by due date (closest first), then lunas debts last
    filtered.sort((a, b) => {
      if (a.status === 'lunas' && b.status !== 'lunas') return 1
      if (a.status !== 'lunas' && b.status === 'lunas') return -1
      
      if (a.status !== 'lunas' && b.status !== 'lunas') {
        if (!a.tanggal_jatuh_tempo && b.tanggal_jatuh_tempo) return 1
        if (a.tanggal_jatuh_tempo && !b.tanggal_jatuh_tempo) return -1
        if (!a.tanggal_jatuh_tempo && !b.tanggal_jatuh_tempo) return 0
        
        const dateA = new Date(a.tanggal_jatuh_tempo!)
        const dateB = new Date(b.tanggal_jatuh_tempo!)
        return dateA.getTime() - dateB.getTime()
      }
      
      return 0
    })

    setFilteredDebts(filtered)
  }

  const calculateSummary = () => {
    const totalDebt = debts.reduce((sum, debt) => sum + debt.jumlah_hutang, 0)
    const totalPaid = debts.reduce((sum, debt) => sum + debt.jumlah_terbayar, 0)
    const remaining = totalDebt - totalPaid

    const monthlyInstallments = debts.filter(debt => {
      return debt.status === 'aktif' && debt.cicilan_bulanan && debt.tanggal_cicilan
    })
    
    const monthlyDebt = monthlyInstallments.reduce((sum, debt) => {
      return sum + (debt.cicilan_bulanan || 0)
    }, 0)

    setDebtSummary({
      totalDebt,
      totalPaid,
      remaining,
      monthlyDebt,
      monthlyCount: monthlyInstallments.length
    })
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
      keterangan: formData.keterangan,
      cicilan_bulanan: formData.cicilan_bulanan ? parseFloat(formData.cicilan_bulanan) : null,
      tanggal_cicilan: formData.tanggal_cicilan ? parseInt(formData.tanggal_cicilan) : null,
      durasi_bulan: formData.durasi_bulan ? parseInt(formData.durasi_bulan) : null
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
    
    const { error: paymentError } = await supabase
      .from('debt_payments')
      .insert({
        user_id: user?.id,
        debt_id: selectedDebt.id,
        jumlah: amount,
        tanggal: new Date().toISOString().split('T')[0]
      })

    if (paymentError) {
      toast.error('Gagal mencatat pembayaran')
      return
    }

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
      toast.error('Gagal mengupdate hutang')
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
      keterangan: '',
      cicilan_bulanan: '',
      tanggal_cicilan: '1',
      durasi_bulan: ''
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
      keterangan: debt.keterangan,
      cicilan_bulanan: debt.cicilan_bulanan?.toString() || '',
      tanggal_cicilan: debt.tanggal_cicilan?.toString() || '1',
      durasi_bulan: debt.durasi_bulan?.toString() || ''
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

  const handlePaymentModal = async (debt: Debt) => {
    setSelectedDebt(debt)
    setPaymentAmount('')
    setIsPaymentModalOpen(true)
    
    const { data } = await supabase
      .from('debt_payments')
      .select('*')
      .eq('debt_id', debt.id)
      .order('created_at', { ascending: false })
    
    setPaymentHistory(data || [])
  }

  const handleDeletePayment = async (paymentId: string, amount: number) => {
    if (!selectedDebt) return
    
    const { error: deleteError } = await supabase
      .from('debt_payments')
      .delete()
      .eq('id', paymentId)

    if (deleteError) {
      toast.error('Gagal menghapus pembayaran')
      return
    }

    const newPaid = selectedDebt.jumlah_terbayar - amount
    const status = newPaid >= selectedDebt.jumlah_hutang ? 'lunas' : 'aktif'

    const { error } = await supabase
      .from('hutang')
      .update({ 
        jumlah_terbayar: Math.max(0, newPaid),
        status: status
      })
      .eq('id', selectedDebt.id)

    if (error) {
      toast.error('Gagal mengupdate hutang')
    } else {
      toast.success('Pembayaran berhasil dihapus')
      fetchDebts()
      handlePaymentModal(selectedDebt)
    }
  }

  const fetchInstallmentDetails = async () => {
    const installments = debts.filter(debt => {
      return debt.status === 'aktif' && debt.cicilan_bulanan && debt.tanggal_cicilan
    })
    
    const details = installments.map(debt => ({
      id: debt.id,
      nama_kreditor: debt.nama_kreditor,
      cicilan_bulanan: debt.cicilan_bulanan,
      tanggal_cicilan: debt.tanggal_cicilan,
      durasi_bulan: debt.durasi_bulan,
      jumlah_hutang: debt.jumlah_hutang,
      jumlah_terbayar: debt.jumlah_terbayar,
      sisa_hutang: debt.jumlah_hutang - debt.jumlah_terbayar
    }))
    
    setInstallmentDetails(details)
    setShowInstallmentDetail(true)
  }

  const renderDebtCard = (debt: Debt) => {
    const remaining = debt.jumlah_hutang - debt.jumlah_terbayar
    const percentage = (debt.jumlah_terbayar / debt.jumlah_hutang) * 100
    const isOverdue = debt.tanggal_jatuh_tempo && new Date(debt.tanggal_jatuh_tempo) < new Date() && debt.status === 'aktif'
    
    return (
      <div key={debt.id} className={`p-4 border rounded-lg ${
        isOverdue 
          ? 'border-red-300 bg-red-50 dark:border-red-700 dark:bg-red-900/20'
          : debt.status === 'lunas'
          ? 'border-gray-200 dark:border-gray-700 bg-green-50 dark:bg-green-900/10'
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
            {debt.cicilan_bulanan && (
              <p className="text-xs mt-1 text-blue-600 font-medium">
                Cicilan: Rp {debt.cicilan_bulanan.toLocaleString('id-ID')}/bulan (tgl {debt.tanggal_cicilan})
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
            <span>{debt.status === 'lunas' ? '100' : percentage.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              className="bg-green-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${debt.status === 'lunas' ? 100 : percentage}%` }}
            />
          </div>
        </div>

        <div className="flex justify-between items-center text-sm">
          <div>
            {debt.status === 'lunas' ? (
              <>
                <p className="text-gray-600 dark:text-gray-400">
                  Total: Rp {debt.jumlah_hutang.toLocaleString('id-ID')}
                </p>
                <p className="text-green-600 font-medium">
                  ✓ Lunas
                </p>
              </>
            ) : (
              <>
                <p className="text-gray-600 dark:text-gray-400">
                  Terbayar: Rp {debt.jumlah_terbayar.toLocaleString('id-ID')}
                </p>
                <p className="text-red-600 font-medium">
                  Sisa: Rp {remaining.toLocaleString('id-ID')}
                </p>
              </>
            )}
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
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <CardContent className="flex items-center space-x-4 min-h-[120px] p-6">
            <div className="p-3 bg-red-100 dark:bg-red-900 rounded-lg">
              <CreditCard className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Hutang</p>
              <p className="text-xl font-semibold text-gray-900 dark:text-white">
                Rp {debtSummary.totalDebt.toLocaleString('id-ID')}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Sisa: Rp {debtSummary.remaining.toLocaleString('id-ID')}
              </p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="flex items-center justify-between min-h-[120px] p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-orange-100 dark:bg-orange-900 rounded-lg">
                <Calendar className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Cicilan Bulan Ini</p>
                <p className="text-xl font-semibold text-gray-900 dark:text-white">
                  Rp {debtSummary.monthlyDebt.toLocaleString('id-ID')}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {debtSummary.monthlyCount} cicilan aktif
                </p>
              </div>
            </div>
            {debtSummary.monthlyCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={fetchInstallmentDetails}
                className="text-orange-600 hover:text-orange-700"
              >
                <Eye className="h-4 w-4 mr-1" />
                Detail
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

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
              <>
                {/* Active Debts */}
                {filteredDebts.filter(debt => debt.status !== 'lunas').map(renderDebtCard)}
                
                {/* Paid Debts Section */}
                {filteredDebts.filter(debt => debt.status === 'lunas').length > 0 && (
                  <div className="mt-6">
                    <button
                      onClick={() => setShowPaidDebts(!showPaidDebts)}
                      className="flex items-center justify-between w-full p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <span className="font-medium text-gray-700 dark:text-gray-300">
                        Hutang Lunas ({filteredDebts.filter(debt => debt.status === 'lunas').length})
                      </span>
                      {showPaidDebts ? (
                        <ChevronUp className="h-4 w-4 text-gray-500" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-gray-500" />
                      )}
                    </button>
                    
                    {showPaidDebts && (
                      <div className="mt-3 space-y-3">
                        {filteredDebts.filter(debt => debt.status === 'lunas').map(renderDebtCard)}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>

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
          
          <div className="border-t pt-4">
            <h4 className="font-medium text-gray-900 dark:text-white mb-3">Cicilan (Opsional)</h4>
            
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Cicilan per Bulan (Rp)"
                type="number"
                value={formData.cicilan_bulanan}
                onChange={(e) => setFormData({ ...formData, cicilan_bulanan: e.target.value })}
                placeholder="500000"
              />
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Tanggal Cicilan
                </label>
                <select
                  value={formData.tanggal_cicilan}
                  onChange={(e) => setFormData({ ...formData, tanggal_cicilan: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                >
                  {Array.from({ length: 28 }, (_, i) => i + 1).map(day => (
                    <option key={day} value={day}>{day}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <Input
              label="Durasi (Bulan)"
              type="number"
              value={formData.durasi_bulan}
              onChange={(e) => setFormData({ ...formData, durasi_bulan: e.target.value })}
              placeholder="12"
            />
          </div>
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
          setPaymentHistory([])
        }}
        title={`Bayar Hutang - ${selectedDebt?.nama_kreditor}`}
      >
        <div className="space-y-4">
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
                  setPaymentHistory([])
                }}
              >
                Batal
              </Button>
            </div>
          </form>
          
          {/* Payment History */}
          {paymentHistory.length > 0 && (
            <div className="border-t pt-4">
              <div className="flex justify-between items-center mb-3">
                <h4 className="font-medium text-gray-900 dark:text-white">Riwayat Pembayaran</h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPaymentHistory(!showPaymentHistory)}
                >
                  {showPaymentHistory ? 'Sembunyikan' : 'Tampilkan'}
                </Button>
              </div>
              
              {showPaymentHistory && (
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {paymentHistory.map((payment) => (
                    <div key={payment.id} className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-800 rounded">
                      <div>
                        <p className="text-sm font-medium">Rp {payment.jumlah.toLocaleString('id-ID')}</p>
                        <p className="text-xs text-gray-500">{new Date(payment.tanggal).toLocaleDateString('id-ID')}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (confirm('Yakin ingin menghapus pembayaran ini?')) {
                            handleDeletePayment(payment.id, payment.jumlah)
                          }
                        }}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </Modal>

      {/* Installment Detail Modal */}
      <Modal
        isOpen={showInstallmentDetail}
        onClose={() => setShowInstallmentDetail(false)}
        title="Detail Cicilan Bulan Ini"
      >
        <div className="space-y-4">
          {installmentDetails.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-4">
              Tidak ada cicilan aktif
            </p>
          ) : (
            <div className="space-y-3">
              {installmentDetails.map((detail) => (
                <div key={detail.id} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold text-gray-900 dark:text-white">
                      {detail.nama_kreditor}
                    </h4>
                    <span className="text-lg font-bold text-orange-600">
                      Rp {detail.cicilan_bulanan.toLocaleString('id-ID')}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">Tanggal Cicilan</p>
                      <p className="font-medium">Setiap tanggal {detail.tanggal_cicilan}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">Durasi</p>
                      <p className="font-medium">{detail.durasi_bulan} bulan</p>
                    </div>
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">Total Hutang</p>
                      <p className="font-medium">Rp {detail.jumlah_hutang.toLocaleString('id-ID')}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">Sisa Hutang</p>
                      <p className="font-medium text-red-600">Rp {detail.sisa_hutang.toLocaleString('id-ID')}</p>
                    </div>
                  </div>
                  
                  <div className="mt-3">
                    <div className="flex justify-between text-xs mb-1">
                      <span>Progress Pembayaran</span>
                      <span>{((detail.jumlah_terbayar / detail.jumlah_hutang) * 100).toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-orange-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${(detail.jumlah_terbayar / detail.jumlah_hutang) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
              
              <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-900 dark:text-white">Total Cicilan Bulan Ini</span>
                  <span className="font-bold text-lg text-orange-600">
                    Rp {installmentDetails.reduce((sum, detail) => sum + detail.cicilan_bulanan, 0).toLocaleString('id-ID')}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  )
}