#!/usr/bin/env node

const https = require('https')
const http = require('http')
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

async function executeSQL(supabaseUrl, serviceKey, sql) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${supabaseUrl}/rest/v1/rpc/query`)
    const data = JSON.stringify({ query: sql })

    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${serviceKey}`,
        apikey: serviceKey,
        Prefer: 'return=minimal',
      },
    }

    const client = url.protocol === 'https:' ? https : http

    const req = client.request(url, options, res => {
      let responseBody = ''

      res.on('data', chunk => {
        responseBody += chunk
      })

      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({ success: true, data: responseBody })
        } else {
          resolve({
            success: false,
            error: responseBody,
            status: res.statusCode,
          })
        }
      })
    })

    req.on('error', error => {
      reject(error)
    })

    req.write(data)
    req.end()
  })
}

async function createTableDirectly() {
  log('blue', '🚀 Creating rental_invoices table directly via API...')

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceKey) {
    log('red', '❌ Missing Supabase environment variables')
    return false
  }

  // Create table SQL
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
      other_fees JSONB DEFAULT '[]'::jsonb,
      total_amount DECIMAL(12,2) NOT NULL,
      notes TEXT,
      pdf_url TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `

  try {
    log('yellow', '🔄 Executing CREATE TABLE command...')
    const result = await executeSQL(supabaseUrl, serviceKey, createTableSQL)

    if (result.success) {
      log('green', '✅ Table created successfully!')
    } else {
      log('yellow', `⚠️  SQL execution result: ${result.error}`)
      // Continue anyway, table might already exist
    }

    // Create indexes
    const indexSQL = `
      CREATE INDEX IF NOT EXISTS idx_rental_invoices_room_id ON rental_invoices(room_id);
      CREATE INDEX IF NOT EXISTS idx_rental_invoices_tenant_id ON rental_invoices(tenant_id);
      CREATE INDEX IF NOT EXISTS idx_rental_invoices_status ON rental_invoices(status);
    `

    log('yellow', '🔄 Creating indexes...')
    await executeSQL(supabaseUrl, serviceKey, indexSQL)
    log('green', '✅ Indexes created!')

    return true
  } catch (error) {
    log('red', `❌ Error creating table: ${error.message}`)
    return false
  }
}

async function addSampleDataViaAPI() {
  log('yellow', '🔄 Adding sample data...')

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: { autoRefreshToken: false, persistSession: false },
    }
  )

  try {
    // Get some rooms and tenants first
    const { data: rooms } = await supabase
      .from('rooms')
      .select('id, rent_amount, room_number')
      .eq('status', 'occupied')
      .limit(3)

    const { data: tenants } = await supabase
      .from('tenants')
      .select('id')
      .limit(3)

    if (!rooms || rooms.length === 0) {
      log(
        'yellow',
        '⚠️  No occupied rooms found, creating sample invoices with mock data'
      )

      // Insert with mock UUIDs
      const mockInvoices = [
        {
          room_id: '11111111-1111-1111-1111-111111111111',
          tenant_id: '22222222-2222-2222-2222-222222222222',
          invoice_number: 'INV-2025-MOCK-001',
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
          total_amount: 2800000,
          notes: 'Sample invoice for testing',
        },
      ]

      const { error } = await supabase
        .from('rental_invoices')
        .insert(mockInvoices)
      if (error) {
        log('yellow', `⚠️  Mock data insert failed: ${error.message}`)
      } else {
        log('green', '✅ Added mock sample data')
      }
      return
    }

    // Create real sample data with actual room/tenant IDs
    const sampleInvoices = []
    for (let i = 0; i < Math.min(rooms.length, 2); i++) {
      const room = rooms[i]
      const tenant = tenants[i] || tenants[0]

      sampleInvoices.push({
        room_id: room.id,
        tenant_id: tenant.id,
        invoice_number: `INV-2025-${String(i + 1).padStart(3, '0')}`,
        period_start: '2025-08-01',
        period_end: '2025-08-31',
        issue_date: '2025-08-28',
        due_date: '2025-09-05',
        status: i === 0 ? 'draft' : 'sent',
        rent_amount: room.rent_amount,
        electricity_previous_reading: 150 + i * 10,
        electricity_current_reading: 180 + i * 15,
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
          room.rent_amount +
          (30 + i * 5) * 3500 +
          125000 +
          50000 +
          20000 +
          (i === 0 ? 100000 : 0),
        notes: `Hóa đơn phòng ${room.room_number} - tháng 08/2025`,
      })
    }

    const { data, error } = await supabase
      .from('rental_invoices')
      .insert(sampleInvoices)
      .select()

    if (error) {
      log('yellow', `⚠️  Sample data error: ${error.message}`)
    } else {
      log('green', `✅ Added ${data.length} sample invoices`)
    }
  } catch (error) {
    log('yellow', `⚠️  Error in sample data: ${error.message}`)
  }
}

async function verifySetup() {
  log('blue', '🔍 Verifying setup...')

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: { autoRefreshToken: false, persistSession: false },
    }
  )

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
          `  • ${inv.invoice_number} - ${inv.status} - ${Number(inv.total_amount).toLocaleString('vi-VN')}đ`
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
  log('blue', '🚀 Starting automatic table creation...')

  // Step 1: Create table
  const tableCreated = await createTableDirectly()

  if (!tableCreated) {
    log('red', '❌ Failed to create table')
    return
  }

  // Step 2: Add sample data
  await addSampleDataViaAPI()

  // Step 3: Verify everything
  const verified = await verifySetup()

  if (verified) {
    log('green', '🎉 Setup completed successfully!')
    log('blue', '🔧 Next steps:')
    log('blue', '  1. Start your dev server: npm run dev')
    log('blue', '  2. Visit http://localhost:3000/invoices')
    log('blue', '  3. Test creating new invoices')
    log('blue', '  4. Check API endpoints: http://localhost:3000/api/invoices')
  } else {
    log('yellow', '⚠️  Setup completed but verification failed')
    log('blue', 'Table might still be created - check Supabase Dashboard')
  }
}

if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
}
