#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

async function createTestUser() {
  console.log('🔧 Creating test user for authentication...')

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
    // Create test user with admin service key
    const testEmail = 'test@rental.com'
    const testPassword = 'test123456'

    console.log(`📧 Creating user: ${testEmail}`)

    const { data, error } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        full_name: 'Test User',
      },
    })

    if (error) {
      if (error.message.includes('User already registered')) {
        console.log('✅ Test user already exists!')
        console.log(`📧 Email: ${testEmail}`)
        console.log(`🔒 Password: ${testPassword}`)
      } else {
        throw error
      }
    } else {
      console.log('✅ Test user created successfully!')
      console.log(`📧 Email: ${testEmail}`)
      console.log(`🔒 Password: ${testPassword}`)
      console.log(`👤 User ID: ${data.user.id}`)
    }

    console.log('\n🚀 You can now test login at: http://localhost:3000/auth')
    console.log('Use the credentials above to log in')
  } catch (error) {
    console.error('❌ Failed to create test user:', error.message)
    process.exit(1)
  }
}

if (require.main === module) {
  createTestUser().catch(console.error)
}
