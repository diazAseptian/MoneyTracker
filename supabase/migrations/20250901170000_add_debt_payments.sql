-- Create table for debt payment tracking
CREATE TABLE debt_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  debt_id uuid NOT NULL REFERENCES hutang(id) ON DELETE CASCADE,
  jumlah numeric(15,2) NOT NULL,
  tanggal date NOT NULL DEFAULT CURRENT_DATE,
  keterangan text DEFAULT '',
  created_at timestamptz DEFAULT now()
);