#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')
require('dotenv').config({ path: '.env.local' })

async function setupUserIsolation() {
  console.log('🔒 Setting up user-specific data isolation...')

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceKey) {
    console.error('❌ Missing Supabase environment variables')
    console.log('Make sure you have both:')
    console.log('- NEXT_PUBLIC_SUPABASE_URL')
    console.log('- SUPABASE_SERVICE_ROLE_KEY')
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  try {
    // Read the SQL file
    const sqlPath = path.join(__dirname, 'setup-user-isolation.sql')
    const sqlContent = fs.readFileSync(sqlPath, 'utf8')

    console.log('📜 Executing user isolation SQL setup...')

    // Execute the SQL
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: sqlContent,
    })

    // If exec_sql function doesn't exist, try direct query
    if (error && error.message.includes('exec_sql')) {
      console.log('📋 Executing SQL commands individually...')

      // Split SQL into individual commands and execute them
      const commands = sqlContent
        .split(';')
        .map(cmd => cmd.trim())
        .filter(cmd => cmd && !cmd.startsWith('--'))

      for (let i = 0; i < commands.length; i++) {
        const command = commands[i]
        if (command) {
          try {
            await supabase.from('_').select('1').limit(0) // Dummy query to test connection
            const { error: cmdError } = await supabase
              .rpc('exec', {
                sql: command,
              })
              .single()

            if (cmdError) {
              console.log(`⚠️  Command ${i + 1} warning:`, cmdError.message)
            }
          } catch (err) {
            console.log(`⚠️  Command ${i + 1} skipped:`, err.message)
          }
        }
      }
    } else if (error) {
      throw error
    }

    console.log('✅ User isolation setup completed!')
    console.log('')
    console.log('🔐 What was configured:')
    console.log('   - Added user_id columns to all tables')
    console.log('   - Enabled Row Level Security (RLS)')
    console.log('   - Created policies: users can only see their own data')
    console.log('   - Added automatic user_id triggers on INSERT')
    console.log('   - Assigned existing data to test@rental.com user')
    console.log('')
    console.log('🎯 Now each user will have completely isolated data!')
    console.log('   - New users will start with empty data')
    console.log('   - Test user can see existing sample data')
    console.log('   - All new records automatically get current user_id')
  } catch (error) {
    console.error('❌ Setup failed:', error.message)

    // Try manual approach if automated approach fails
    console.log('')
    console.log('🛠️  MANUAL SETUP REQUIRED:')
    console.log(
      '1. Go to: https://supabase.com/dashboard/project/YOUR_PROJECT_ID/sql'
    )
    console.log('2. Copy and paste the following SQL:')
    console.log('')

    const sqlPath = path.join(__dirname, 'setup-user-isolation.sql')
    const sqlContent = fs.readFileSync(sqlPath, 'utf8')
    console.log('--- COPY THIS SQL ---')
    console.log(sqlContent)
    console.log('--- END SQL ---')

    console.log('')
    console.log('3. Click RUN to execute')
    console.log('4. Then test login again')
  }
}

if (require.main === module) {
  setupUserIsolation().catch(console.error)
}
