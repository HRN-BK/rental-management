#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

require('dotenv').config({ path: '.env.local' })

async function setupDatabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase environment variables')
    console.error(
      'Make sure you have NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local'
    )
    process.exit(1)
  }

  console.log('🚀 Setting up Supabase database...')

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  try {
    // Read the SQL migration file
    const migrationPath = path.join(
      __dirname,
      '../supabase/migrations/001_initial_schema.sql'
    )
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8')

    console.log('📋 Applying database schema...')

    // Execute the migration
    const { error } = await supabase.rpc('exec_sql', { sql: migrationSQL })

    if (error) {
      console.error('❌ Error applying schema:', error)

      // Try alternative approach - split and execute parts
      console.log('🔄 Trying alternative approach...')
      await applySchemaAlternatively(supabase, migrationSQL)
    } else {
      console.log('✅ Database schema applied successfully!')
    }

    // Test connection by fetching properties
    console.log('🔍 Testing database connection...')
    const { data, error: fetchError } = await supabase
      .from('properties')
      .select('*')
      .limit(5)

    if (fetchError) {
      console.error('❌ Error fetching data:', fetchError)
    } else {
      console.log(
        `✅ Database connection successful! Found ${data?.length || 0} properties`
      )
      if (data && data.length > 0) {
        console.log('📊 Sample data:')
        data.forEach(property => {
          console.log(
            `   - ${property.name} (${property.total_rooms} rooms, ${property.occupancy_percentage}% occupied)`
          )
        })
      }
    }
  } catch (error) {
    console.error('❌ Setup failed:', error)
    process.exit(1)
  }
}

async function applySchemaAlternatively(supabase, sql) {
  // Split SQL into individual statements
  const statements = sql
    .split(';')
    .map(stmt => stmt.trim())
    .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))

  console.log(`📝 Executing ${statements.length} SQL statements...`)

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i] + ';'

    try {
      const { error } = await supabase.rpc('exec_sql', { sql: statement })
      if (error && !error.message.includes('already exists')) {
        console.warn(`⚠️  Warning on statement ${i + 1}:`, error.message)
      } else {
        console.log(`✅ Statement ${i + 1}/${statements.length} executed`)
      }
    } catch (err) {
      console.warn(`⚠️  Error on statement ${i + 1}:`, err.message)
    }
  }
}

// Run the setup
setupDatabase()
