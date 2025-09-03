const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Read environment variables
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local')
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function runMigration() {
  try {
    console.log('🔄 Running migration: Add color_settings column to rental_invoices...')
    
    // Read the SQL migration file
    const migrationPath = path.join(__dirname, '../migrations/add_color_settings_to_invoices.sql')
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8')
    
    // Execute the migration
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: migrationSQL
    })
    
    if (error) {
      // If the RPC function doesn't exist, try direct SQL execution
      console.log('⚠️  RPC function not available, trying direct column addition...')
      
      // Try to add the column directly
      const { data: columnData, error: columnError } = await supabase
        .from('rental_invoices')
        .select('color_settings')
        .limit(1)
      
      if (columnError && columnError.message.includes("color_settings")) {
        console.log('✅ Column color_settings needs to be added')
        console.log('📋 Please run this SQL in your Supabase SQL Editor:')
        console.log('\n' + '='.repeat(60))
        console.log(migrationSQL)
        console.log('='.repeat(60))
        console.log('\n🔗 Go to: https://supabase.com/dashboard/project/' + supabaseUrl.split('//')[1].split('.')[0] + '/sql')
      } else {
        console.log('✅ Column color_settings already exists or table is ready')
      }
    } else {
      console.log('✅ Migration completed successfully!')
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message)
    
    // Provide manual instructions
    console.log('\n📋 Please manually run this SQL in your Supabase dashboard:')
    console.log('\n' + '='.repeat(60))
    console.log('ALTER TABLE rental_invoices ADD COLUMN IF NOT EXISTS color_settings JSONB DEFAULT NULL;')
    console.log('='.repeat(60))
    console.log('\n🔗 Go to: https://supabase.com/dashboard > SQL Editor')
  }
}

// Test connection first
async function testConnection() {
  try {
    const { data, error } = await supabase
      .from('rental_invoices')
      .select('id')
      .limit(1)
    
    if (error) {
      console.error('❌ Cannot connect to Supabase:', error.message)
      return false
    }
    
    console.log('✅ Connected to Supabase successfully')
    return true
  } catch (error) {
    console.error('❌ Connection test failed:', error.message)
    return false
  }
}

async function main() {
  console.log('🚀 Starting database migration...\n')
  
  const connected = await testConnection()
  if (connected) {
    await runMigration()
  }
  
  console.log('\n✨ Migration process completed')
}

main().catch(console.error)
