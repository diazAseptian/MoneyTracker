import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      kategori: {
        Row: {
          id: string
          user_id: string
          nama: string
          tipe: 'pemasukan' | 'pengeluaran'
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          nama: string
          tipe: 'pemasukan' | 'pengeluaran'
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          nama?: string
          tipe?: 'pemasukan' | 'pengeluaran'
          created_at?: string
        }
      }
      pemasukan: {
        Row: {
          id: string
          user_id: string
          tanggal: string
          jumlah: number
          sumber: string
          keterangan: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          tanggal: string
          jumlah: number
          sumber: string
          keterangan?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          tanggal?: string
          jumlah?: number
          sumber?: string
          keterangan?: string
          created_at?: string
        }
      }
      pengeluaran: {
        Row: {
          id: string
          user_id: string
          tanggal: string
          jumlah: number
          kategori_id: string | null
          keterangan: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          tanggal: string
          jumlah: number
          kategori_id?: string | null
          keterangan?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          tanggal?: string
          jumlah?: number
          kategori_id?: string | null
          keterangan?: string
          created_at?: string
        }
      }
      goals: {
        Row: {
          id: string
          user_id: string
          nama: string
          target: number
          progress: number
          deadline: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          nama: string
          target: number
          progress?: number
          deadline?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          nama?: string
          target?: number
          progress?: number
          deadline?: string | null
          created_at?: string
        }
      }
      budget: {
        Row: {
          id: string
          user_id: string
          kategori_id: string
          limit_amount: number
          bulan: number
          tahun: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          kategori_id: string
          limit_amount: number
          bulan: number
          tahun: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          kategori_id?: string
          limit_amount?: number
          bulan?: number
          tahun?: number
          created_at?: string
        }
      }
    }
  }
}