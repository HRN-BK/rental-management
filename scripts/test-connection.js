#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

async function testConnection() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Missing Supabase environment variables')
    console.error(
      'Make sure you have NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local'
    )
    process.exit(1)
  }

  console.log('🔍 Testing Supabase connection...')
  console.log(`📡 URL: ${supabaseUrl}`)

  const supabase = createClient(supabaseUrl, supabaseAnonKey)

  try {
    // Test basic connection by trying to access any system table
    console.log('✅ Supabase connection initialized!')

    // Check if tables exist
    console.log('🔍 Checking database tables...')

    const tables = [
      'properties',
      'rooms',
      'tenants',
      'rental_contracts',
      'payment_records',
      'receipts',
    ]

    for (const table of tables) {
      try {
        const { data, error } = await supabase.from(table).select('*').limit(1)
        if (error) {
          console.log(
            `❌ Table '${table}' not found or inaccessible: ${error.message}`
          )
        } else {
          console.log(`✅ Table '${table}' exists and accessible`)
        }
      } catch (err) {
        console.log(`❌ Table '${table}' error: ${err.message}`)
      }
    }

    // Try to fetch some data
    console.log('📊 Testing data retrieval...')
    try {
      const { data: properties, error } = await supabase
        .from('properties')
        .select('*')
        .limit(5)
      if (error) {
        console.log('⚠️  No properties found, database might be empty')
      } else {
        console.log(`✅ Found ${properties?.length || 0} properties`)
        if (properties && properties.length > 0) {
          console.log('Sample data:')
          properties.forEach(prop => {
            console.log(`   - ${prop.name}`)
          })
        }
      }
    } catch (err) {
      console.log('⚠️  Could not fetch properties:', err.message)
    }
  } catch (error) {
    console.error('❌ Test failed:', error)
    process.exit(1)
  }
}

testConnection()
