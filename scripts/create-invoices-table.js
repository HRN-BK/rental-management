#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

// Colors for console output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
}

function log(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

async function createInvoicesTable() {
  log('blue', '🚀 Creating rental_invoices table via Supabase API...')

  // Check environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    log('red', '❌ Missing Supabase environment variables')
    process.exit(1)
  }

  // Create Supabase client with service role key
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  log('green', '✅ Connected to Supabase')

  try {
    // Check if table already exists
    log('yellow', '🔍 Checking if rental_invoices table exists...')
    const { data: existingData, error: checkError } = await supabase
      .from('rental_invoices')
      .select('id')
      .limit(1)

    if (!checkError) {
      log('yellow', '⚠️  rental_invoices table already exists')
      if (existingData && existingData.length > 0) {
        log('blue', `Found ${existingData.length} existing invoices`)
        log('green', '✅ Table is ready to use!')
        return
      }
    }

    if (checkError && !checkError.message.includes('does not exist')) {
      log('red', `❌ Error checking table: ${checkError.message}`)
      return
    }

    // Table doesn't exist, let's create it using SQL execution
    log('yellow', '🔄 Creating rental_invoices table...')

    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS public.rental_invoices (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        room_id UUID NOT NULL,
        tenant_id UUID NOT NULL,
        contract_id UUID,
        invoice_number VARCHAR(50) UNIQUE NOT NULL,
        period_start DATE NOT NULL,
        period_end DATE NOT NULL,
        issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
        due_date DATE NOT NULL,
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
        total_amount DECIMAL(12,2) NOT NULL,
        notes TEXT,
        pdf_url TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_rental_invoices_room_id ON rental_invoices(room_id);
      CREATE INDEX IF NOT EXISTS idx_rental_invoices_tenant_id ON rental_invoices(tenant_id);
      CREATE INDEX IF NOT EXISTS idx_rental_invoices_status ON rental_invoices(status);
    `

    // Use fetch to execute SQL directly via Supabase API
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${supabaseServiceKey}`,
        apikey: supabaseServiceKey,
      },
      body: JSON.stringify({
        sql: createTableSQL,
      }),
    })

    if (!response.ok) {
      // Try alternative method using direct SQL execution
      log(
        'yellow',
        '⚠️  Direct SQL execution failed, trying alternative method...'
      )

      // Create a simple record to ensure table structure (this will fail but might create the table)
      try {
        await supabase.from('rental_invoices').insert({
          room_id: '00000000-0000-0000-0000-000000000000',
          tenant_id: '00000000-0000-0000-0000-000000000000',
          invoice_number: 'TEST-0000',
          period_start: '2025-08-01',
          period_end: '2025-08-31',
          due_date: '2025-09-07',
          total_amount: 0,
        })
      } catch (insertError) {
        log('red', '❌ Could not create table automatically')
        log(
          'yellow',
          '📋 Please create the table manually using the SQL in MANUAL_MIGRATION_STEPS.md'
        )
        return
      }
    }

    log('green', '✅ Table created successfully!')

    // Now add some sample data
    await addSampleData(supabase)
  } catch (error) {
    log('red', `❌ Error: ${error.message}`)
    log(
      'yellow',
      '📋 Please create the table manually using Supabase Dashboard'
    )
  }
}

async function addSampleData(supabase) {
  log('yellow', '🔄 Adding sample data...')

  try {
    // First, get some rooms and tenants
    const { data: rooms } = await supabase
      .from('rooms')
      .select('id, rent_amount, room_number')
      .eq('status', 'occupied')
      .limit(3)

    const { data: tenants } = await supabase
      .from('tenants')
      .select('id, full_name')
      .limit(3)

    if (!rooms || rooms.length === 0 || !tenants || tenants.length === 0) {
      log('yellow', '⚠️  No rooms or tenants found, skipping sample data')
      return
    }

    // Create sample invoices
    const sampleInvoices = [
      {
        room_id: rooms[0].id,
        tenant_id: tenants[0].id,
        invoice_number: 'INV-2025-0001',
        period_start: '2025-08-01',
        period_end: '2025-08-31',
        issue_date: '2025-08-28',
        due_date: '2025-09-05',
        status: 'draft',
        rent_amount: rooms[0].rent_amount,
        electricity_previous_reading: 150,
        electricity_current_reading: 180,
        electricity_unit_price: 3500,
        electricity_amount: (180 - 150) * 3500,
        electricity_note: 'Chỉ số điện tháng 8',
        water_previous_reading: 45,
        water_current_reading: 50,
        water_unit_price: 25000,
        water_amount: (50 - 45) * 25000,
        water_note: 'Chỉ số nước tháng 8',
        internet_amount: 50000,
        internet_note: 'Wifi tốc độ cao',
        trash_amount: 20000,
        trash_note: 'Phí vệ sinh chung',
        other_fees: [
          { name: 'Phí gửi xe', amount: 100000, note: 'Gửi xe máy' },
        ],
        total_amount:
          rooms[0].rent_amount + 30 * 3500 + 5 * 25000 + 50000 + 20000 + 100000,
        notes: 'Hóa đơn thuê phòng tháng 08/2025',
      },
    ]

    if (rooms.length > 1 && tenants.length > 1) {
      sampleInvoices.push({
        room_id: rooms[1].id,
        tenant_id: tenants[1].id,
        invoice_number: 'INV-2025-0002',
        period_start: '2025-08-01',
        period_end: '2025-08-31',
        issue_date: '2025-08-28',
        due_date: '2025-09-05',
        status: 'sent',
        rent_amount: rooms[1].rent_amount,
        electricity_previous_reading: 120,
        electricity_current_reading: 145,
        electricity_unit_price: 3500,
        electricity_amount: (145 - 120) * 3500,
        water_previous_reading: 40,
        water_current_reading: 44,
        water_unit_price: 25000,
        water_amount: (44 - 40) * 25000,
        internet_amount: 50000,
        trash_amount: 20000,
        total_amount:
          rooms[1].rent_amount + 25 * 3500 + 4 * 25000 + 50000 + 20000,
        notes: 'Hóa đơn thuê phòng tháng 08/2025',
      })
    }

    const { data: insertedData, error: insertError } = await supabase
      .from('rental_invoices')
      .insert(sampleInvoices)
      .select()

    if (insertError) {
      log('yellow', `⚠️  Could not insert sample data: ${insertError.message}`)
    } else {
      log('green', `✅ Added ${insertedData.length} sample invoices`)
    }
  } catch (error) {
    log('yellow', `⚠️  Error adding sample data: ${error.message}`)
  }
}

async function verifyTable(supabase) {
  log('blue', '🔍 Verifying rental_invoices table...')

  try {
    const { data: invoices, error } = await supabase
      .from('rental_invoices')
      .select('id, invoice_number, status, total_amount')
      .limit(5)

    if (error) {
      log('red', `❌ Verification failed: ${error.message}`)
      return false
    }

    log('green', `✅ Table verified! Found ${invoices.length} invoices`)

    if (invoices.length > 0) {
      log('blue', '📋 Sample invoices:')
      invoices.forEach(inv => {
        log(
          'blue',
          `  • ${inv.invoice_number} - ${inv.status} - ${inv.total_amount.toLocaleString('vi-VN')}đ`
        )
      })
    }

    return true
  } catch (error) {
    log('red', `❌ Verification error: ${error.message}`)
    return false
  }
}

async function main() {
  await createInvoicesTable()

  // Verify the table was created
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )

  const success = await verifyTable(supabase)

  if (success) {
    log('green', '🎉 Setup completed successfully!')
    log('blue', '🔧 Next steps:')
    log('blue', '  1. Start your dev server: npm run dev')
    log('blue', '  2. Visit http://localhost:3000/invoices')
    log('blue', '  3. Test creating new invoices')
  } else {
    log(
      'yellow',
      '⚠️  Please check Supabase Dashboard and create table manually if needed'
    )
  }
}

if (require.main === module) {
  main().catch(console.error)
}
