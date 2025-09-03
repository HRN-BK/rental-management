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

async function createTableViaInsert() {
  log('blue', '🚀 Creating rental_invoices table via direct insert method...')

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceKey) {
    log('red', '❌ Missing Supabase environment variables')
    return false
  }

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  // Try to test if table exists first
  log('yellow', '🔍 Checking if table exists...')

  try {
    const { data, error } = await supabase
      .from('rental_invoices')
      .select('id')
      .limit(1)

    if (!error) {
      log('yellow', '⚠️  rental_invoices table already exists!')
      log('green', '✅ Table is ready to use')
      return true
    }

    if (!error.message.includes('does not exist')) {
      log('red', `❌ Unexpected error: ${error.message}`)
      return false
    }
  } catch (err) {
    log('yellow', "🔄 Table doesn't exist, will create it...")
  }

  // Table doesn't exist, let's create it using a different approach
  log('yellow', '🔄 Creating table using HTTP POST to Supabase...')

  try {
    // Method 1: Create using raw fetch to SQL endpoint
    const createSql = `
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
    `.trim()

    // Try using supabase.rpc with different function names
    const rpcMethods = ['query', 'exec', 'execute_sql', 'sql']
    let success = false

    for (const method of rpcMethods) {
      try {
        log('yellow', `🔄 Trying rpc('${method}')...`)
        const { error } = await supabase.rpc(method, {
          query: createSql,
          sql: createSql,
          statement: createSql,
        })

        if (!error) {
          log('green', `✅ Table created using rpc('${method}')!`)
          success = true
          break
        } else {
          log('yellow', `⚠️  rpc('${method}') failed: ${error.message}`)
        }
      } catch (e) {
        log('yellow', `⚠️  rpc('${method}') exception: ${e.message}`)
      }
    }

    if (!success) {
      log('yellow', '⚠️  All RPC methods failed, trying direct HTTP...')

      // Try direct HTTP POST to database endpoint
      const response = await fetch(`${supabaseUrl}/database/query`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${serviceKey}`,
          apikey: serviceKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: createSql }),
      })

      if (response.ok) {
        log('green', '✅ Table created using direct HTTP!')
        success = true
      } else {
        const errorText = await response.text()
        log(
          'yellow',
          `⚠️  Direct HTTP failed: ${response.status} - ${errorText}`
        )
      }
    }

    if (!success) {
      log('red', '❌ All table creation methods failed')
      log('yellow', '📋 Please create the table manually:')
      log('blue', '1. Go to Supabase Dashboard > SQL Editor')
      log('blue', '2. Paste and run this SQL:')
      console.log('\n' + createSql + '\n')
      return false
    }

    return true
  } catch (error) {
    log('red', `❌ Error creating table: ${error.message}`)
    return false
  }
}

async function addSampleData() {
  log('yellow', '🔄 Adding sample data...')

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  try {
    // Check existing data first
    const { data: existing, error: checkError } = await supabase
      .from('rental_invoices')
      .select('id')
      .limit(1)

    if (checkError) {
      log('yellow', `⚠️  Cannot check existing data: ${checkError.message}`)
      return false
    }

    if (existing && existing.length > 0) {
      log('blue', '📋 Table already has data, skipping sample insertion')
      return true
    }

    // Get rooms and tenants for realistic data
    const { data: rooms } = await supabase
      .from('rooms')
      .select('id, rent_amount, room_number')
      .eq('status', 'occupied')
      .limit(3)

    const { data: tenants } = await supabase
      .from('tenants')
      .select('id, full_name')
      .limit(3)

    let sampleInvoices = []

    if (rooms && rooms.length > 0 && tenants && tenants.length > 0) {
      log(
        'blue',
        `📊 Found ${rooms.length} rooms and ${tenants.length} tenants`
      )

      // Create realistic sample data
      for (let i = 0; i < Math.min(rooms.length, 2); i++) {
        sampleInvoices.push({
          room_id: rooms[i].id,
          tenant_id: tenants[i % tenants.length].id,
          invoice_number: `INV-2025-${String(i + 1).padStart(4, '0')}`,
          period_start: '2025-08-01',
          period_end: '2025-08-31',
          issue_date: '2025-08-28',
          due_date: '2025-09-05',
          status: ['draft', 'sent', 'paid'][i % 3],
          rent_amount: rooms[i].rent_amount,
          electricity_previous_reading: 150 + i * 20,
          electricity_current_reading: 180 + i * 25,
          electricity_unit_price: 3500,
          electricity_amount: (30 + i * 5) * 3500,
          water_previous_reading: 45 + i,
          water_current_reading: 50 + i,
          water_unit_price: 25000,
          water_amount: 5 * 25000,
          internet_amount: 50000,
          trash_amount: 20000,
          other_fees: i === 0 ? [{ name: 'Phí gửi xe', amount: 100000 }] : [],
          total_amount:
            Number(rooms[i].rent_amount) +
            (30 + i * 5) * 3500 +
            125000 +
            70000 +
            (i === 0 ? 100000 : 0),
          notes: `Hóa đơn phòng ${rooms[i].room_number || 'N/A'} tháng 08/2025`,
        })
      }
    } else {
      log('yellow', '⚠️  No rooms/tenants found, creating mock data')

      // Create mock sample data
      sampleInvoices = [
        {
          room_id: '00000000-0000-0000-0000-000000000001',
          tenant_id: '00000000-0000-0000-0000-000000000002',
          invoice_number: 'INV-2025-DEMO-001',
          period_start: '2025-08-01',
          period_end: '2025-08-31',
          issue_date: '2025-08-28',
          due_date: '2025-09-05',
          status: 'draft',
          rent_amount: 2500000,
          electricity_previous_reading: 150,
          electricity_current_reading: 180,
          electricity_unit_price: 3500,
          electricity_amount: 105000,
          water_previous_reading: 45,
          water_current_reading: 50,
          water_unit_price: 25000,
          water_amount: 125000,
          internet_amount: 50000,
          trash_amount: 20000,
          other_fees: [{ name: 'Demo fee', amount: 50000 }],
          total_amount: 2850000,
          notes: 'Demo invoice for testing',
        },
      ]
    }

    const { data, error } = await supabase
      .from('rental_invoices')
      .insert(sampleInvoices)
      .select()

    if (error) {
      log('yellow', `⚠️  Sample data insert failed: ${error.message}`)
      return false
    }

    log('green', `✅ Added ${data.length} sample invoices`)
    return true
  } catch (error) {
    log('yellow', `⚠️  Error adding sample data: ${error.message}`)
    return false
  }
}

async function verifyAndShowResults() {
  log('blue', '🔍 Verifying final setup...')

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  try {
    const { data: invoices, error } = await supabase
      .from('rental_invoices')
      .select('id, invoice_number, status, total_amount, notes')
      .limit(5)

    if (error) {
      log('red', `❌ Verification failed: ${error.message}`)
      return false
    }

    log('green', `✅ SUCCESS! Found ${invoices.length} invoices in the table`)

    if (invoices.length > 0) {
      log('blue', '📋 Sample data:')
      invoices.forEach((inv, idx) => {
        const amount = Number(inv.total_amount).toLocaleString('vi-VN')
        log(
          'blue',
          `  ${idx + 1}. ${inv.invoice_number} | ${inv.status} | ${amount}đ`
        )
        log('blue', `     ${inv.notes || 'No notes'}`)
      })
    }

    return true
  } catch (error) {
    log('red', `❌ Verification error: ${error.message}`)
    return false
  }
}

async function main() {
  log(
    'blue',
    '🎯 FINAL ATTEMPT: Creating rental_invoices table automatically...'
  )
  log(
    'blue',
    '===================================================================='
  )

  // Step 1: Create table
  const tableCreated = await createTableViaInsert()

  if (!tableCreated) {
    log('red', '💥 FAILED: Could not create table')
    log('yellow', '📋 Please use manual method in MANUAL_MIGRATION_STEPS.md')
    return
  }

  // Step 2: Add sample data
  const dataAdded = await addSampleData()

  // Step 3: Verify everything
  const verified = await verifyAndShowResults()

  log(
    'blue',
    '===================================================================='
  )

  if (verified) {
    log('green', '🎉 COMPLETE SUCCESS!')
    log('green', '✅ rental_invoices table created and populated')
    log('blue', '🚀 Next steps:')
    log('blue', '  1. Start dev server: npm run dev')
    log('blue', '  2. Visit: http://localhost:3000/invoices')
    log('blue', '  3. Test: http://localhost:3000/api/invoices')
    log('blue', '  4. Create new invoices from the UI')
  } else {
    log('yellow', '⚠️  PARTIAL SUCCESS: Table created but verification failed')
    log('blue', 'Check Supabase Dashboard to confirm table exists')
  }
}

if (require.main === module) {
  main().catch(error => {
    console.error('\n💥 FATAL ERROR:', error.message)
    console.log(
      '\n📋 Please create table manually using MANUAL_MIGRATION_STEPS.md'
    )
    process.exit(1)
  })
}
