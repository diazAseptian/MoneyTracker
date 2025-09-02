import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Modal } from '../ui/Modal'
import { Plus, Target, Edit2, Trash2, PiggyBank } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import toast from 'react-hot-toast'

interface Goal {
  id: string
  nama: string
  target: number
  progress: number
  deadline: string | null
}

interface GoalsSectionProps {
  onSavingAdded?: () => void
}

export function GoalsSection({ onSavingAdded }: GoalsSectionProps = {}) {
  const [goals, setGoals] = useState<Goal[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null)
  const [isSavingModalOpen, setIsSavingModalOpen] = useState(false)
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null)
  const [savingAmount, setSavingAmount] = useState('')
  const [savingSource, setSavingSource] = useState('Cash')
  const [savingNote, setSavingNote] = useState('')
  const [formData, setFormData] = useState({
    nama: '',
    target: '',
    deadline: ''
  })
  const { user } = useAuth()

  useEffect(() => {
    if (user) {
      fetchGoals()
    }
  }, [user])

  const fetchGoals = async () => {
    const { data, error } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', user?.id)
      .order('created_at', { ascending: false })

    if (error) {
      toast.error('Gagal mengambil data target')
    } else {
      setGoals(data || [])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.nama || !formData.target) {
      toast.error('Nama dan target harus diisi')
      return
    }

    const goalData = {
      user_id: user?.id,
      nama: formData.nama,
      target: parseFloat(formData.target),
      deadline: formData.deadline || null
    }

    if (editingGoal) {
      const { error } = await supabase
        .from('goals')
        .update(goalData)
        .eq('id', editingGoal.id)

      if (error) {
        toast.error('Gagal mengupdate target')
      } else {
        toast.success('Target berhasil diupdate')
        fetchGoals()
        resetForm()
      }
    } else {
      const { error } = await supabase
        .from('goals')
        .insert([goalData])

      if (error) {
        toast.error('Gagal menambah target')
      } else {
        toast.success('Target berhasil ditambahkan')
        fetchGoals()
        resetForm()
      }
    }
  }

  const resetForm = () => {
    setFormData({ nama: '', target: '', deadline: '' })
    setEditingGoal(null)
    setIsModalOpen(false)
  }

  const handleEdit = (goal: Goal) => {
    setEditingGoal(goal)
    setFormData({
      nama: goal.nama,
      target: goal.target.toString(),
      deadline: goal.deadline || ''
    })
    setIsModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from('goals')
      .delete()
      .eq('id', id)

    if (error) {
      toast.error('Gagal menghapus target')
    } else {
      toast.success('Target berhasil dihapus')
      fetchGoals()
    }
  }

  const handleSaving = (goal: Goal) => {
    setSelectedGoal(goal)
    setSavingAmount('')
    setSavingSource('Cash')
    setSavingNote('')
    setIsSavingModalOpen(true)
  }

  const handleSavingSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!savingAmount || !selectedGoal) return

    const amount = parseFloat(savingAmount)
    if (amount <= 0) {
      toast.error('Jumlah harus lebih dari 0')
      return
    }

    // Insert saving record
    const { error: savingError } = await supabase
      .from('goal_savings')
      .insert({
        user_id: user?.id,
        goal_id: selectedGoal.id,
        jumlah: amount,
        sumber: savingSource,
        keterangan: savingNote,
        tanggal: new Date().toISOString().split('T')[0]
      })

    if (savingError) {
      toast.error('Gagal mencatat tabungan')
      return
    }

    // Update goal progress
    const newProgress = selectedGoal.progress + amount
    const { error } = await supabase
      .from('goals')
      .update({ progress: newProgress })
      .eq('id', selectedGoal.id)

    if (error) {
      toast.error('Gagal mengupdate progress')
    } else {
      toast.success(`Berhasil menabung Rp ${amount.toLocaleString('id-ID')} dari ${savingSource}`)
      fetchGoals()
      onSavingAdded?.()
      setIsSavingModalOpen(false)
      setSavingAmount('')
      setSavingSource('Cash')
      setSavingNote('')
      setSelectedGoal(null)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center space-x-2">
            <Target className="h-5 w-5 text-blue-600" />
            <span>Target Tabungan</span>
          </CardTitle>
          <Button size="sm" onClick={() => setIsModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Tambah Target
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {goals.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">
              Belum ada target tabungan
            </p>
          ) : (
            goals.map((goal) => {
              const percentage = Math.min((goal.progress / goal.target) * 100, 100)
              return (
                <div key={goal.id} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">{goal.nama}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Target: Rp {goal.target.toLocaleString('id-ID')}
                      </p>
                    </div>
                    <div className="flex space-x-1">
                      <Button variant="ghost" size="sm" onClick={() => handleSaving(goal)}>
                        <PiggyBank className="h-4 w-4 text-green-600" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(goal)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(goal.id)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                  <div className="mb-2">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600 dark:text-gray-400">Progress</span>
                      <span className="text-gray-900 dark:text-white font-medium">
                        {percentage.toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Rp {goal.progress.toLocaleString('id-ID')} dari Rp {goal.target.toLocaleString('id-ID')}
                  </p>
                </div>
              )
            })
          )}
        </div>
      </CardContent>

      <Modal
        isOpen={isModalOpen}
        onClose={resetForm}
        title={editingGoal ? 'Edit Target' : 'Tambah Target Baru'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Nama Target"
            value={formData.nama}
            onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
            placeholder="Contoh: Beli laptop"
            required
          />
          <Input
            label="Target Amount (Rp)"
            type="number"
            value={formData.target}
            onChange={(e) => setFormData({ ...formData, target: e.target.value })}
            placeholder="5000000"
            required
          />
          <Input
            label="Deadline (Opsional)"
            type="date"
            value={formData.deadline}
            onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
          />
          <div className="flex space-x-3 pt-4">
            <Button type="submit" className="flex-1">
              {editingGoal ? 'Update' : 'Tambah'}
            </Button>
            <Button type="button" variant="outline" onClick={resetForm}>
              Batal
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={isSavingModalOpen}
        onClose={() => {
          setIsSavingModalOpen(false)
          setSavingAmount('')
          setSelectedGoal(null)
        }}
        title={`Nabung untuk ${selectedGoal?.nama}`}
      >
        <form onSubmit={handleSavingSubmit} className="space-y-4">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              Progress saat ini: Rp {selectedGoal?.progress.toLocaleString('id-ID')} / Rp {selectedGoal?.target.toLocaleString('id-ID')}
            </p>
          </div>
          <Input
            label="Jumlah Nabung (Rp)"
            type="number"
            value={savingAmount}
            onChange={(e) => setSavingAmount(e.target.value)}
            placeholder="50000"
            required
          />
          
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Sumber Dana
            </label>
            <select
              value={savingSource}
              onChange={(e) => setSavingSource(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              required
            >
              <option value="Cash">Cash</option>
              <option value="Debit">Debit</option>
            </select>
          </div>
          
          <Input
            label="Catatan (Opsional)"
            value={savingNote}
            onChange={(e) => setSavingNote(e.target.value)}
            placeholder="Contoh: Bank BCA, Dompet, Celengan, dll"
          />
          
          <div className="flex space-x-3 pt-4">
            <Button type="submit" className="flex-1">
              Nabung
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => {
                setIsSavingModalOpen(false)
                setSavingAmount('')
                setSavingSource('Cash')
                setSavingNote('')
                setSelectedGoal(null)
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