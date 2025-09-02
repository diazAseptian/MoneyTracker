-- Clean schema without triggers or complex constraints

-- Categories table
CREATE TABLE kategori (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  nama text NOT NULL,
  tipe text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Income table  
CREATE TABLE pemasukan (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  tanggal date NOT NULL,
  jumlah numeric(15,2) NOT NULL,
  sumber text NOT NULL,
  keterangan text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- Expenses table
CREATE TABLE pengeluaran (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  tanggal date NOT NULL,
  jumlah numeric(15,2) NOT NULL,
  kategori_id uuid,
  sumber text DEFAULT 'Cash',
  keterangan text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- Goals table
CREATE TABLE goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  nama text NOT NULL,
  target numeric(15,2) NOT NULL,
  progress numeric(15,2) DEFAULT 0,
  deadline date,
  created_at timestamptz DEFAULT now()
);

-- Budget table
CREATE TABLE budget (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  kategori_id uuid NOT NULL,
  limit_amount numeric(15,2) NOT NULL,
  bulan integer NOT NULL,
  tahun integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Debt table
CREATE TABLE hutang (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  nama_kreditor text NOT NULL,
  jumlah_hutang numeric(15,2) NOT NULL,
  jumlah_terbayar numeric(15,2) DEFAULT 0,
  tanggal_hutang date NOT NULL,
  tanggal_jatuh_tempo date,
  keterangan text DEFAULT '',
  status text DEFAULT 'aktif',
  created_at timestamptz DEFAULT now()
);