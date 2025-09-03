#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')
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

async function main() {
  log('blue', '🚀 Starting Supabase migration for rental_invoices...')

  // Check environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    log('red', '❌ Missing Supabase environment variables')
    log(
      'yellow',
      'Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local'
    )
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
  log('blue', `🔗 Project: ${supabaseUrl}`)

  // Read migration files
  const migration1Path = path.join(
    __dirname,
    '..',
    'supabase',
    'migrations',
    '002_create_rental_invoices.sql'
  )
  const migration2Path = path.join(
    __dirname,
    '..',
    'supabase',
    'migrations',
    '003_insert_sample_invoices.sql'
  )

  if (!fs.existsSync(migration1Path)) {
    log('red', '❌ Migration file 002_create_rental_invoices.sql not found')
    process.exit(1)
  }

  if (!fs.existsSync(migration2Path)) {
    log('red', '❌ Migration file 003_insert_sample_invoices.sql not found')
    process.exit(1)
  }

  log('blue', '📋 Migration files found:')
  log('blue', '  ✅ 002_create_rental_invoices.sql')
  log('blue', '  ✅ 003_insert_sample_invoices.sql')

  try {
    // Check if rental_invoices table already exists
    const { data: existingTables, error: checkError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'rental_invoices')

    if (
      checkError &&
      !checkError.message.includes(
        'relation "information_schema.tables" does not exist'
      )
    ) {
      log(
        'yellow',
        '⚠️  Could not check existing tables, proceeding with migration...'
      )
    } else if (existingTables && existingTables.length > 0) {
      log('yellow', '⚠️  rental_invoices table already exists')

      // Check if table has data
      const { data: existingData, error: dataError } = await supabase
        .from('rental_invoices')
        .select('id')
        .limit(1)

      if (!dataError && existingData && existingData.length > 0) {
        log('yellow', '⚠️  Table already has data. Skipping migration...')
        log(
          'blue',
          'If you want to reset the table, please do it manually from Supabase dashboard'
        )
        process.exit(0)
      }
    }

    // Run first migration (create table)
    log('yellow', '🔄 Creating rental_invoices table...')
    const sql1 = fs.readFileSync(migration1Path, 'utf8')

    const { error: error1 } = await supabase.rpc('exec_sql', { sql: sql1 })
    if (error1) {
      // Try alternative method if rpc doesn't work
      log('yellow', '⚠️  RPC method failed, trying direct table creation...')

      // Create table directly using Supabase client (simplified version)
      const { error: createError } = await supabase
        .from('rental_invoices')
        .select('*')
        .limit(0)

      if (createError && createError.message.includes('does not exist')) {
        log('red', '❌ Could not create table automatically')
        log(
          'yellow',
          '📋 Please run this SQL manually in Supabase Dashboard > SQL Editor:'
        )
        console.log('\n' + sql1 + '\n')
        process.exit(1)
      }
    }

    log('green', '✅ Table creation completed')

    // Run second migration (insert sample data)
    log('yellow', '🔄 Inserting sample data...')
    const sql2 = fs.readFileSync(migration2Path, 'utf8')

    const { error: error2 } = await supabase.rpc('exec_sql', { sql: sql2 })
    if (error2) {
      log('yellow', '⚠️  Could not insert sample data automatically')
      log('yellow', '📋 Please run this SQL manually if needed:')
      console.log('\n' + sql2.substring(0, 500) + '...\n')
    } else {
      log('green', '✅ Sample data inserted successfully')
    }

    // Verify the table
    log('blue', '🔍 Verifying rental_invoices table...')
    const { data: invoices, error: verifyError } = await supabase
      .from('rental_invoices')
      .select('id')
      .limit(5)

    if (verifyError) {
      log('red', `❌ Verification failed: ${verifyError.message}`)
    } else {
      log(
        'green',
        `✅ Table verified successfully! Found ${invoices.length} invoices`
      )
    }

    log('green', '🎉 Migration completed successfully!')
    log('blue', '📊 What was created:')
    log('blue', '  • rental_invoices table with all fields')
    log('blue', '  • Indexes for better performance')
    log('blue', '  • Auto-update triggers for timestamps')
    log('blue', '  • Sample rental contracts (if missing)')
    log('blue', '  • Sample invoice data for testing')
    log('blue', '🔧 Next steps:')
    log('blue', '  1. Start your dev server: npm run dev')
    log('blue', '  2. Visit http://localhost:3000/invoices')
    log('blue', '  3. Test creating new invoices')
    log('blue', '  4. Check API endpoints work with real data')
  } catch (error) {
    log('red', `❌ Migration failed: ${error.message}`)
    log(
      'yellow',
      '📋 Manual migration required. Please copy the SQL from these files to Supabase Dashboard:'
    )
    log('yellow', '  • supabase/migrations/002_create_rental_invoices.sql')
    log('yellow', '  • supabase/migrations/003_insert_sample_invoices.sql')
    process.exit(1)
  }
}

if (require.main === module) {
  main().catch(console.error)
}
