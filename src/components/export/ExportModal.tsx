import React, { useState, useEffect } from 'react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Download, FileText } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import toast from 'react-hot-toast'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

interface ExportModalProps {
  isOpen: boolean
  onClose: () => void
}

export function ExportModal({ isOpen, onClose }: ExportModalProps) {
  const [exportType, setExportType] = useState('all')
  const [dateRange, setDateRange] = useState({
    start: new Date().toISOString().slice(0, 10),
    end: new Date().toISOString().slice(0, 10)
  })
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [selectedSources, setSelectedSources] = useState<string[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [isExporting, setIsExporting] = useState(false)
  const [exportFormat, setExportFormat] = useState('csv')
  const { user } = useAuth()

  useEffect(() => {
    if (isOpen && user) {
      fetchCategories()
    }
  }, [isOpen, user])

  const fetchCategories = async () => {
    const { data } = await supabase
      .from('kategori')
      .select('*')
      .eq('user_id', user?.id)
      .order('nama')
    setCategories(data || [])
  }

  const exportData = async () => {
    setIsExporting(true)
    try {
      let csvContent = 'Laporan Keuangan MoneyTracker\n'
      csvContent += `Periode: ${new Date(dateRange.start).toLocaleDateString('id-ID')} - ${new Date(dateRange.end).toLocaleDateString('id-ID')}\n\n`

      // Export based on type
      if (exportType === 'all' || exportType === 'income') {
        const { data: incomeData } = await supabase
          .from('pemasukan')
          .select('*')
          .eq('user_id', user?.id)
          .gte('tanggal', dateRange.start)
          .lte('tanggal', dateRange.end)
          .order('tanggal', { ascending: true })

        csvContent += 'PEMASUKAN\n'
        csvContent += 'Tanggal,Jumlah,Sumber,Keterangan\n'
        
        let totalIncome = 0
        incomeData?.forEach(item => {
          totalIncome += item.jumlah
          csvContent += `${new Date(item.tanggal).toLocaleDateString('id-ID')},${item.jumlah.toLocaleString('id-ID')},${item.sumber},${item.keterangan}\n`
        })
        csvContent += `Total,${totalIncome.toLocaleString('id-ID')}\n\n`
      }

      if (exportType === 'all' || exportType === 'expenses') {
        const { data: expenseData } = await supabase
          .from('pengeluaran')
          .select('*, kategori(nama)')
          .eq('user_id', user?.id)
          .gte('tanggal', dateRange.start)
          .lte('tanggal', dateRange.end)
          .order('tanggal', { ascending: true })

        csvContent += 'PENGELUARAN\n'
        csvContent += 'Tanggal,Jumlah,Kategori,Sumber,Keterangan\n'
        
        let totalExpenses = 0
        expenseData?.forEach(item => {
          totalExpenses += item.jumlah
          csvContent += `${new Date(item.tanggal).toLocaleDateString('id-ID')},${item.jumlah.toLocaleString('id-ID')},${item.kategori?.nama || '-'},${item.sumber || 'Cash'},${item.keterangan}\n`
        })
        csvContent += `Total,${totalExpenses.toLocaleString('id-ID')}\n\n`
      }

      // Export Goals
      if (exportType === 'all' || exportType === 'goals') {
        const { data: goalsData } = await supabase
          .from('goals')
          .select('*')
          .eq('user_id', user?.id)
          .order('created_at', { ascending: false })

        csvContent += 'TARGET TABUNGAN\n'
        csvContent += 'Nama Target,Target Amount,Jumlah Terkumpul,Persentase,Deadline,Status\n'
        
        goalsData?.forEach(goal => {
          const percentage = ((goal.progress / goal.target) * 100).toFixed(1)
          const status = goal.progress >= goal.target ? 'Tercapai' : 'Dalam Progress'
          const deadline = goal.deadline ? new Date(goal.deadline).toLocaleDateString('id-ID') : '-'
          csvContent += `${goal.nama},${goal.target.toLocaleString('id-ID')},${goal.progress.toLocaleString('id-ID')},${percentage}%,${deadline},${status}\n`
        })
        csvContent += '\n'
      }

      // Export Debts
      if (exportType === 'all' || exportType === 'debts') {
        const { data: debtsData } = await supabase
          .from('hutang')
          .select('*')
          .eq('user_id', user?.id)
          .order('created_at', { ascending: false })

        csvContent += 'HUTANG\n'
        csvContent += 'Kreditor,Jumlah Hutang,Terbayar,Sisa,Status,Tanggal Hutang,Jatuh Tempo,Keterangan\n'
        
        debtsData?.forEach(debt => {
          const remaining = debt.jumlah_hutang - debt.jumlah_terbayar
          const dueDate = debt.tanggal_jatuh_tempo ? new Date(debt.tanggal_jatuh_tempo).toLocaleDateString('id-ID') : '-'
          const isOverdue = debt.tanggal_jatuh_tempo && new Date(debt.tanggal_jatuh_tempo) < new Date() && debt.status === 'aktif'
          const status = debt.status === 'lunas' ? 'Lunas' : isOverdue ? 'Lewat Tempo' : 'Aktif'
          
          csvContent += `${debt.nama_kreditor},${debt.jumlah_hutang.toLocaleString('id-ID')},${debt.jumlah_terbayar.toLocaleString('id-ID')},${remaining.toLocaleString('id-ID')},${status},${new Date(debt.tanggal_hutang).toLocaleDateString('id-ID')},${dueDate},${debt.keterangan}\n`
        })
        csvContent += '\n'
      }

      // Export Summary
      if (exportType === 'all' || exportType === 'summary') {
        const { data: allIncome } = await supabase
          .from('pemasukan')
          .select('jumlah')
          .eq('user_id', user?.id)
          .gte('tanggal', dateRange.start)
          .lte('tanggal', dateRange.end)

        const { data: allExpenses } = await supabase
          .from('pengeluaran')
          .select('jumlah')
          .eq('user_id', user?.id)
          .gte('tanggal', dateRange.start)
          .lte('tanggal', dateRange.end)

        const { data: goalsCount } = await supabase
          .from('goals')
          .select('id')
          .eq('user_id', user?.id)

        const { data: activeDebts } = await supabase
          .from('hutang')
          .select('id')
          .eq('user_id', user?.id)
          .eq('status', 'aktif')

        const totalIncome = allIncome?.reduce((sum, item) => sum + item.jumlah, 0) || 0
        const totalExpenses = allExpenses?.reduce((sum, item) => sum + item.jumlah, 0) || 0
        const balance = totalIncome - totalExpenses

        csvContent += 'RINGKASAN DASHBOARD\n'
        csvContent += `Total Pemasukan,${totalIncome.toLocaleString('id-ID')}\n`
        csvContent += `Total Pengeluaran,${totalExpenses.toLocaleString('id-ID')}\n`
        csvContent += `Saldo Bersih,${balance.toLocaleString('id-ID')}\n`
        csvContent += `Jumlah Target,${goalsCount?.length || 0}\n`
        csvContent += `Hutang Aktif,${activeDebts?.length || 0}\n`
      }

      if (exportFormat === 'csv') {
        // Download CSV
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const link = document.createElement('a')
        const url = URL.createObjectURL(blob)
        link.setAttribute('href', url)
        link.setAttribute('download', `laporan-${exportType}-${dateRange.start}.csv`)
        link.style.visibility = 'hidden'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      } else {
        // Generate PDF
        const pdf = new jsPDF('p', 'mm', 'a4')
        let yPosition = 20

        // Header
        pdf.setFontSize(18)
        pdf.text('Laporan Keuangan MoneyTracker', 105, yPosition, { align: 'center' })
        yPosition += 10
        pdf.setFontSize(12)
        pdf.text(`Periode: ${new Date(dateRange.start).toLocaleDateString('id-ID')} - ${new Date(dateRange.end).toLocaleDateString('id-ID')}`, 105, yPosition, { align: 'center' })
        yPosition += 20

        // Add charts for dashboard
        if (exportType === 'all' || exportType === 'summary') {
          try {
            const charts = document.querySelectorAll('.recharts-wrapper')
            for (const chart of charts) {
              const canvas = await html2canvas(chart as HTMLElement)
              const imgData = canvas.toDataURL('image/png')
              const imgWidth = 80
              const imgHeight = (canvas.height * imgWidth) / canvas.width
              
              if (yPosition + imgHeight > 280) {
                pdf.addPage()
                yPosition = 20
              }
              
              pdf.addImage(imgData, 'PNG', 15, yPosition, imgWidth, imgHeight)
              yPosition += imgHeight + 10
            }
          } catch (error) {
            console.log('Chart capture failed')
          }
        }

        // Add text content
        const lines = csvContent.split('\n')
        pdf.setFontSize(10)
        
        for (const line of lines) {
          if (yPosition > 280) {
            pdf.addPage()
            yPosition = 20
          }
          
          const cleanLine = line.replace(/\\n/g, '')
          if (cleanLine.trim()) {
            pdf.text(cleanLine, 15, yPosition)
            yPosition += 6
          }
        }

        pdf.save(`laporan-${exportType}-${dateRange.start}.pdf`)
      }

      toast.success('Laporan berhasil diexport!')
      onClose()
    } catch (error) {
      toast.error('Gagal export laporan')
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Export Data">
      <div className="space-y-4">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Jenis Data
          </label>
          <select
            value={exportType}
            onChange={(e) => setExportType(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          >
            <option value="all">Semua Data</option>
            <option value="income">Pemasukan</option>
            <option value="expenses">Pengeluaran</option>
            <option value="goals">Target Tabungan</option>
            <option value="debts">Hutang</option>
            <option value="summary">Ringkasan Dashboard</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Format Export
          </label>
          <select
            value={exportFormat}
            onChange={(e) => setExportFormat(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          >
            <option value="csv">CSV</option>
            <option value="pdf">PDF</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Tanggal Mulai"
            type="date"
            value={dateRange.start}
            onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
          />
          <Input
            label="Tanggal Akhir"
            type="date"
            value={dateRange.end}
            onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
          />
        </div>

        <div className="flex space-x-3 pt-4">
          <Button
            onClick={exportData}
            disabled={isExporting}
            className="flex-1"
          >
            {exportFormat === 'csv' ? (
              <Download className="h-4 w-4 mr-2" />
            ) : (
              <FileText className="h-4 w-4 mr-2" />
            )}
            {isExporting ? 'Mengexport...' : `Export ${exportFormat.toUpperCase()}`}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
          >
            Batal
          </Button>
        </div>
      </div>
    </Modal>
  )
}