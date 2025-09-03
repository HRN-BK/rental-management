#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

async function createTableDirect() {
  console.log('🚀 Creating rental_invoices table via Supabase API...')

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceKey) {
    console.error('❌ Missing Supabase environment variables')
    return
  }

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  try {
    // First try to insert a test record to see if table exists
    console.log('🔍 Checking if table exists...')
    const { error: testError } = await supabase
      .from('rental_invoices')
      .select('id')
      .limit(1)

    if (!testError) {
      console.log('✅ Table already exists!')
      return
    }

    console.log('📄 Table does not exist. Please create it manually:')
    console.log('1. Go to Supabase Dashboard > SQL Editor')
    console.log('2. Run this SQL:')

    const createTableSQL = `
-- Create rental_invoices table
CREATE TABLE IF NOT EXISTS public.rental_invoices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID,
  tenant_id UUID,
  contract_id UUID,
  invoice_number VARCHAR(50) UNIQUE,
  period_start DATE,
  period_end DATE,
  issue_date DATE DEFAULT CURRENT_DATE,
  due_date DATE,
  template_type VARCHAR(20) DEFAULT 'professional',
  status VARCHAR(20) DEFAULT 'draft',
  rent_amount DECIMAL(12,2) DEFAULT 0,
  electricity_previous_reading INTEGER DEFAULT 0,
  electricity_current_reading INTEGER DEFAULT 0,
  electricity_unit_price DECIMAL(10,2) DEFAULT 0,
  electricity_amount DECIMAL(12,2) DEFAULT 0,
  electricity_note TEXT,
  water_previous_reading INTEGER DEFAULT 0,
  water_current_reading INTEGER DEFAULT 0,
  water_unit_price DECIMAL(10,2) DEFAULT 0,
  water_amount DECIMAL(12,2) DEFAULT 0,
  water_note TEXT,
  internet_amount DECIMAL(12,2) DEFAULT 0,
  internet_note TEXT,
  trash_amount DECIMAL(12,2) DEFAULT 0,
  trash_note TEXT,
  other_fees JSONB DEFAULT '[]',
  total_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  notes TEXT,
  pdf_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_rental_invoices_room_id ON rental_invoices(room_id);
CREATE INDEX IF NOT EXISTS idx_rental_invoices_tenant_id ON rental_invoices(tenant_id);
CREATE INDEX IF NOT EXISTS idx_rental_invoices_status ON rental_invoices(status);

-- Enable RLS (optional)
ALTER TABLE rental_invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations" ON rental_invoices FOR ALL USING (true);

-- Insert sample data
INSERT INTO rental_invoices (
  room_id, tenant_id, invoice_number, period_start, period_end, due_date,
  rent_amount, electricity_amount, water_amount, internet_amount, trash_amount,
  total_amount, notes
) VALUES (
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222', 
  'INV-2025-TEST-001',
  '2025-08-01',
  '2025-08-31',
  '2025-09-05',
  2500000,
  105000,
  125000,
  50000,
  20000,
  2800000,
  'Sample invoice for testing'
);`

    console.log('\n' + createTableSQL + '\n')

    console.log('3. After running the SQL, try the app again')
  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

if (require.main === module) {
  createTableDirect().catch(console.error)
}
