const { createClient } = require('@supabase/supabase-js')

// Read environment variables
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function addColorSettingsColumn() {
  try {
    console.log('🔄 Adding color_settings column to rental_invoices...')

    // Try to execute the SQL directly using the REST API
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`,
      },
      body: JSON.stringify({
        sql: `ALTER TABLE rental_invoices ADD COLUMN IF NOT EXISTS color_settings JSONB DEFAULT NULL;`
      })
    })

    if (response.ok) {
      console.log('✅ Successfully added color_settings column!')
    } else {
      const error = await response.text()
      console.log('⚠️  Direct SQL execution not available')
      console.log('Please manually run this in Supabase SQL Editor:')
      console.log('\nALTER TABLE rental_invoices ADD COLUMN IF NOT EXISTS color_settings JSONB DEFAULT NULL;')
      console.log(`\n🔗 https://supabase.com/dashboard/project/${supabaseUrl.split('//')[1].split('.')[0]}/sql`)
    }

  } catch (error) {
    console.error('❌ Failed to add column:', error.message)
    console.log('\n📋 Please manually run this SQL in your Supabase dashboard:')
    console.log('\nALTER TABLE rental_invoices ADD COLUMN IF NOT EXISTS color_settings JSONB DEFAULT NULL;')
    console.log(`\n🔗 https://supabase.com/dashboard/project/${supabaseUrl.split('//')[1].split('.')[0]}/sql`)
  }
}

addColorSettingsColumn()
