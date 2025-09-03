#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

async function testDatabase() {
  console.log('🔍 Testing database connection...')

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  try {
    // Test basic connection
    console.log('📡 Testing basic connection...')
    const { data: rooms, error: roomsError } = await supabase
      .from('rooms')
      .select('id, room_number')
      .limit(3)

    if (roomsError) {
      console.error('❌ Cannot connect to rooms table:', roomsError.message)
      return
    }

    console.log('✅ Connected successfully!')
    console.log(`📊 Found ${rooms.length} rooms in database`)

    // Test rental_invoices table
    console.log('\n🔍 Testing rental_invoices table...')
    const { data: invoices, error: invoicesError } = await supabase
      .from('rental_invoices')
      .select('id, invoice_number')
      .limit(1)

    if (invoicesError) {
      console.error('❌ rental_invoices table does not exist')
      console.log('\n🛠️  TO FIX THIS ISSUE:')
      console.log(
        '1. Go to: https://supabase.com/dashboard/project/lbanrovptixrpdugwvwu/sql'
      )
      console.log('2. Copy and paste this SQL:')

      const sql = `-- Create rental_invoices table
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

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_rental_invoices_room_id ON rental_invoices(room_id);
CREATE INDEX IF NOT EXISTS idx_rental_invoices_tenant_id ON rental_invoices(tenant_id);
CREATE INDEX IF NOT EXISTS idx_rental_invoices_status ON rental_invoices(status);

-- Enable RLS and create policy
ALTER TABLE rental_invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations" ON rental_invoices FOR ALL USING (true);

-- Insert test data
INSERT INTO rental_invoices (
  room_id, tenant_id, invoice_number, period_start, period_end, due_date,
  rent_amount, electricity_amount, water_amount, internet_amount, trash_amount,
  total_amount, status, notes
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
  'draft',
  'Test invoice created via script'
);`

      console.log('\n--- COPY THIS SQL ---\n')
      console.log(sql)
      console.log('\n--- END SQL ---\n')

      console.log('3. Click RUN')
      console.log('4. Then run: npm run dev')
      console.log('5. Try creating invoices again!')
      return
    }

    console.log('✅ rental_invoices table exists!')
    console.log(`📊 Found ${invoices.length} invoices in database`)

    // Test creating a sample invoice
    console.log('\n🧪 Testing invoice creation...')
    const testInvoice = {
      room_id: rooms[0]?.id || '11111111-1111-1111-1111-111111111111',
      tenant_id: '22222222-2222-2222-2222-222222222222',
      invoice_number: `TEST-${Date.now()}`,
      period_start: '2025-08-01',
      period_end: '2025-08-31',
      due_date: '2025-09-05',
      rent_amount: 2500000,
      electricity_amount: 100000,
      water_amount: 50000,
      internet_amount: 50000,
      trash_amount: 20000,
      total_amount: 2720000,
      status: 'draft',
      notes: 'Test invoice created by script',
    }

    const { data: newInvoice, error: createError } = await supabase
      .from('rental_invoices')
      .insert(testInvoice)
      .select()
      .single()

    if (createError) {
      console.error('❌ Cannot create test invoice:', createError.message)
      return
    }

    console.log('✅ Successfully created test invoice!')
    console.log(
      '📋 Invoice:',
      newInvoice.invoice_number,
      '-',
      newInvoice.total_amount.toLocaleString('vi-VN'),
      'VNĐ'
    )

    console.log('\n🎉 DATABASE IS READY!')
    console.log('🚀 You can now:')
    console.log('1. Run: npm run dev')
    console.log('2. Go to: http://localhost:3000/invoices')
    console.log('3. Create invoices normally!')
  } catch (error) {
    console.error('❌ Database test failed:', error.message)
  }
}

if (require.main === module) {
  testDatabase().catch(console.error)
}
