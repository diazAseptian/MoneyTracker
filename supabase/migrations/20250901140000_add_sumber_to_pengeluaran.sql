-- Add sumber column to existing pengeluaran table
ALTER TABLE pengeluaran 
ADD COLUMN IF NOT EXISTS sumber text DEFAULT 'Cash';