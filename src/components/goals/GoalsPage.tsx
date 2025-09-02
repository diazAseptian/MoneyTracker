import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card'
import { GoalsSection } from '../dashboard/GoalsSection'
import { Wallet, CreditCard, History, Edit2, Trash2 } from 'lucide-react'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Modal } from '../ui/Modal'
import toast from 'react-hot-toast'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { format } from 'date-fns'
import { id as localeId } from 'date-fns/locale'

interface SavingRecord {
  id: string
  jumlah: number
  sumber: string
  tanggal: string
  keterangan: string
  goals: {
    nama: string
  }
}

export function GoalsPage() {
  const [savingsBalance, setSavingsBalance] = useState({ cash: 0, debit: 0 })
  const [savingsHistory, setSavingsHistory] = useState<SavingRecord[]>([])
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingSaving, setEditingSaving] = useState<SavingRecord | null>(null)
  const [editAmount, setEditAmount] = useState('')
  const [editNote, setEditNote] = useState('')
  const { user } = useAuth()

  useEffect(() => {
    if (user) {
      fetchSavingsData()
    }
  }, [user])

  const fetchSavingsData = async () => {
    // Get savings balance
    const { data: cashSavings } = await supabase
      .from('goal_savings')
      .select('jumlah')
      .eq('user_id', user?.id)
      .eq('sumber', 'Cash')

    const { data: debitSavings } = await supabase
      .from('goal_savings')
      .select('jumlah')
      .eq('user_id', user?.id)
      .eq('sumber', 'Debit')

    const totalCashSavings = cashSavings?.reduce((sum, item) => sum + item.jumlah, 0) || 0
    const totalDebitSavings = debitSavings?.reduce((sum, item) => sum + item.jumlah, 0) || 0

    setSavingsBalance({
      cash: totalCashSavings,
      debit: totalDebitSavings
    })

    // Get savings history
    const { data: history } = await supabase
      .from('goal_savings')
      .select('*, goals(nama)')
      .eq('user_id', user?.id)
      .order('created_at', { ascending: false })
      .limit(10)

    setSavingsHistory(history || [])
  }

  const handleEditSaving = (saving: SavingRecord) => {
    setEditingSaving(saving)
    setEditAmount(saving.jumlah.toString())
    setEditNote(saving.keterangan || '')
    setIsEditModalOpen(true)
  }

  const handleUpdateSaving = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editAmount || !editingSaving) return

    const newAmount = parseFloat(editAmount)
    if (newAmount <= 0) {
      toast.error('Jumlah harus lebih dari 0')
      return
    }

    const oldAmount = editingSaving.jumlah
    const difference = newAmount - oldAmount

    // Update saving record
    const { error: savingError } = await supabase
      .from('goal_savings')
      .update({ 
        jumlah: newAmount,
        keterangan: editNote
      })
      .eq('id', editingSaving.id)

    if (savingError) {
      toast.error('Gagal mengupdate tabungan')
      return
    }

    // Update goal progress
    const { data: goalData } = await supabase
      .from('goals')
      .select('progress')
      .eq('id', editingSaving.goal_id)
      .single()

    if (goalData) {
      const newProgress = goalData.progress + difference
      await supabase
        .from('goals')
        .update({ progress: Math.max(0, newProgress) })
        .eq('id', editingSaving.goal_id)
    }

    toast.success('Tabungan berhasil diupdate')
    fetchSavingsData()
    setIsEditModalOpen(false)
    setEditingSaving(null)
    setEditAmount('')
    setEditNote('')
  }

  const handleDeleteSaving = async (saving: SavingRecord) => {
    if (!confirm('Yakin ingin menghapus riwayat tabungan ini?')) return

    // Delete saving record
    const { error: deleteError } = await supabase
      .from('goal_savings')
      .delete()
      .eq('id', saving.id)

    if (deleteError) {
      toast.error('Gagal menghapus tabungan')
      return
    }

    // Update goal progress
    const { data: goalData } = await supabase
      .from('goals')
      .select('progress')
      .eq('id', saving.goal_id)
      .single()

    if (goalData) {
      const newProgress = goalData.progress - saving.jumlah
      await supabase
        .from('goals')
        .update({ progress: Math.max(0, newProgress) })
        .eq('id', saving.goal_id)
    }

    toast.success('Riwayat tabungan berhasil dihapus')
    fetchSavingsData()
  }

  return (
    <div className="space-y-6">
      {/* Savings Balance Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <CardContent className="flex items-center space-x-4 min-h-[120px] p-6">
            <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
              <Wallet className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Nabung Cash</p>
              <p className="text-xl font-semibold text-gray-900 dark:text-white">
                Rp {savingsBalance.cash.toLocaleString('id-ID')}
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
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Nabung Debit</p>
              <p className="text-xl font-semibold text-gray-900 dark:text-white">
                Rp {savingsBalance.debit.toLocaleString('id-ID')}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Goals Section */}
      <GoalsSection onSavingAdded={fetchSavingsData} />

      {/* Savings History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <History className="h-5 w-5 text-purple-600" />
            <span>Riwayat Nabung</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {savingsHistory.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                Belum ada riwayat nabung
              </p>
            ) : (
              savingsHistory.map((record) => (
                <div key={record.id} className="p-3 lg:p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <div className="flex flex-col space-y-2 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
                    <div className="flex-1">
                      <div className="flex flex-col space-y-1 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
                        <h4 className="font-medium text-gray-900 dark:text-white text-sm lg:text-base">
                          {record.goals.nama}
                        </h4>
                        <p className="font-semibold text-base lg:text-lg text-green-600">
                          +Rp {record.jumlah.toLocaleString('id-ID')}
                        </p>
                      </div>
                      <div className="flex flex-col space-y-1 lg:flex-row lg:items-center text-xs lg:text-sm text-gray-600 dark:text-gray-400 lg:space-y-0 lg:space-x-4 mt-1">
                        <span>{format(new Date(record.tanggal), 'dd MMM yyyy', { locale: localeId })}</span>
                        <span className="lg:before:content-['•'] lg:before:mr-1">{record.sumber}</span>
                        {record.keterangan && (
                          <span className="lg:before:content-['•'] lg:before:mr-1">{record.keterangan}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex space-x-1 justify-end lg:ml-4">
                      <Button variant="ghost" size="sm" onClick={() => handleEditSaving(record)}>
                        <Edit2 className="h-3 w-3 lg:h-4 lg:w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteSaving(record)}>
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

      {/* Edit Saving Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false)
          setEditingSaving(null)
          setEditAmount('')
        }}
        title={`Edit Tabungan - ${editingSaving?.goals.nama}`}
      >
        <form onSubmit={handleUpdateSaving} className="space-y-4">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              Jumlah saat ini: Rp {editingSaving?.jumlah.toLocaleString('id-ID')}
            </p>
          </div>
          <Input
            label="Jumlah Baru (Rp)"
            type="number"
            value={editAmount}
            onChange={(e) => setEditAmount(e.target.value)}
            placeholder="50000"
            required
          />
          
          <Input
            label="Catatan (Opsional)"
            value={editNote}
            onChange={(e) => setEditNote(e.target.value)}
            placeholder="Contoh: Bank BCA, Dompet, Celengan, dll"
          />
          
          <div className="flex space-x-3 pt-4">
            <Button type="submit" className="flex-1">
              Update
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => {
                setIsEditModalOpen(false)
                setEditingSaving(null)
                setEditAmount('')
                setEditNote('')
              }}
            >
              Batal
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}