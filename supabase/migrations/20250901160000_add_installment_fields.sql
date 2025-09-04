-- Add installment fields to hutang table
ALTER TABLE hutang 
ADD COLUMN IF NOT EXISTS cicilan_bulanan numeric(15,2),
ADD COLUMN IF NOT EXISTS tanggal_cicilan integer,
ADD COLUMN IF NOT EXISTS durasi_bulan integer;