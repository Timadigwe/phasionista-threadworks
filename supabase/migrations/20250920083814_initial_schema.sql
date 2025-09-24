-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (replaces current user schema)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  phasion_name TEXT UNIQUE NOT NULL,
  name TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin', 'designer', 'customer', 'ceo')),
  photo TEXT DEFAULT 'default.jpg',
  solana_wallet TEXT NOT NULL,
  active BOOLEAN DEFAULT TRUE,
  email_verified BOOLEAN DEFAULT FALSE,
  email_verification_token TEXT,
  email_verification_expires TIMESTAMP,
  password_reset_token TEXT,
  password_reset_expires TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Clothes table
CREATE TABLE clothes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  category TEXT NOT NULL,
  size TEXT,
  color TEXT,
  material TEXT,
  condition TEXT DEFAULT 'new',
  measurements TEXT,
  images TEXT[] DEFAULT '{}',
  is_available BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Escrow payments table
CREATE TABLE escrow_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cloth_id UUID REFERENCES clothes(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES users(id) ON DELETE CASCADE,
  designer_id UUID REFERENCES users(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  customer_wallet TEXT NOT NULL,
  designer_wallet TEXT NOT NULL,
  vault_public_key TEXT,
  vault_private_key TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'locked', 'released', 'refunded')),
  solana_transaction_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bookings table
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cloth_id UUID REFERENCES clothes(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES users(id) ON DELETE CASCADE,
  designer_id UUID REFERENCES users(id) ON DELETE CASCADE,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  total_amount DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reviews table
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cloth_id UUID REFERENCES clothes(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES users(id) ON DELETE CASCADE,
  designer_id UUID REFERENCES users(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_phasion_name ON users(phasion_name);
CREATE INDEX idx_users_solana_wallet ON users(solana_wallet);
CREATE INDEX idx_clothes_owner_id ON clothes(owner_id);
CREATE INDEX idx_clothes_category ON clothes(category);
CREATE INDEX idx_escrow_customer_id ON escrow_payments(customer_id);
CREATE INDEX idx_escrow_designer_id ON escrow_payments(designer_id);
CREATE INDEX idx_bookings_customer_id ON bookings(customer_id);
CREATE INDEX idx_bookings_designer_id ON bookings(designer_id);

-- Row Level Security (RLS) policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE clothes ENABLE ROW LEVEL SECURITY;
ALTER TABLE escrow_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Users can read their own data
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

-- Users can update their own data
CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Clothes are publicly readable
CREATE POLICY "Clothes are publicly readable" ON clothes
  FOR SELECT USING (true);

-- Only owners can modify their clothes
CREATE POLICY "Owners can modify their clothes" ON clothes
  FOR ALL USING (auth.uid() = owner_id);

-- Escrow payments are private to involved parties
CREATE POLICY "Escrow parties can view payments" ON escrow_payments
  FOR SELECT USING (auth.uid() = customer_id OR auth.uid() = designer_id);

-- Bookings are private to involved parties
CREATE POLICY "Booking parties can view bookings" ON bookings
  FOR SELECT USING (auth.uid() = customer_id OR auth.uid() = designer_id);

-- Reviews are publicly readable
CREATE POLICY "Reviews are publicly readable" ON reviews
  FOR SELECT USING (true);

-- Only customers can create reviews
CREATE POLICY "Customers can create reviews" ON reviews
  FOR INSERT WITH CHECK (auth.uid() = customer_id);