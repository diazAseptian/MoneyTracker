-- Create table for goal savings tracking
CREATE TABLE goal_savings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  goal_id uuid NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
  jumlah numeric(15,2) NOT NULL,
  sumber text NOT NULL DEFAULT 'Cash',
  tanggal date NOT NULL DEFAULT CURRENT_DATE,
  keterangan text DEFAULT '',
  created_at timestamptz DEFAULT now()
);