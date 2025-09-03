#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

async function testAuth() {
  console.log('🔐 Testing basic authentication...')

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing environment variables')
    console.log('NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl)
    console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', !!supabaseKey)
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, supabaseKey)

  try {
    // Step 1: Test if we can check session (should be null initially)
    console.log('\n1️⃣ Testing getSession...')
    const {
      data: { session: initialSession },
      error: sessionError,
    } = await supabase.auth.getSession()

    if (sessionError) {
      console.error('❌ Session check failed:', sessionError.message)
    } else {
      console.log(
        '✅ Session check works, current session:',
        initialSession ? 'EXISTS' : 'NULL'
      )
    }

    // Step 2: Test login with test credentials
    console.log('\n2️⃣ Testing signInWithPassword...')
    const testEmail = 'test@rental.com'
    const testPassword = 'test123456'

    const { data: authData, error: authError } =
      await supabase.auth.signInWithPassword({
        email: testEmail,
        password: testPassword,
      })

    if (authError) {
      console.error('❌ Login failed:', authError.message)
      return
    }

    console.log('✅ Login successful!')
    console.log('   - User ID:', authData.user?.id)
    console.log('   - Email:', authData.user?.email)
    console.log('   - Session exists:', !!authData.session)
    console.log(
      '   - Access token length:',
      authData.session?.access_token?.length || 0
    )

    // Step 3: Test if we can get the session after login
    console.log('\n3️⃣ Testing getSession after login...')
    const {
      data: { session: newSession },
      error: newSessionError,
    } = await supabase.auth.getSession()

    if (newSessionError) {
      console.error(
        '❌ Post-login session check failed:',
        newSessionError.message
      )
    } else {
      console.log('✅ Post-login session check works')
      console.log('   - Session exists:', !!newSession)
      console.log('   - Same user:', newSession?.user?.id === authData.user?.id)
    }

    // Step 4: Test auth state listener
    console.log('\n4️⃣ Testing auth state change listener...')

    let listenerCalled = false
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('🔄 Auth state change:', event)
      console.log('   - Session exists:', !!session)
      console.log('   - User email:', session?.user?.email)
      listenerCalled = true
    })

    // Wait a bit to see if listener is called
    await new Promise(resolve => setTimeout(resolve, 1000))

    if (listenerCalled) {
      console.log('✅ Auth state listener works')
    } else {
      console.log('⚠️  Auth state listener not called (may be normal)')
    }

    subscription.unsubscribe()

    // Step 5: Test logout
    console.log('\n5️⃣ Testing signOut...')
    const { error: signOutError } = await supabase.auth.signOut()

    if (signOutError) {
      console.error('❌ Logout failed:', signOutError.message)
    } else {
      console.log('✅ Logout successful')
    }

    // Step 6: Verify session is cleared
    console.log('\n6️⃣ Testing session after logout...')
    const {
      data: { session: finalSession },
    } = await supabase.auth.getSession()
    console.log(
      '✅ Final session:',
      finalSession ? 'STILL EXISTS' : 'NULL (correct)'
    )

    console.log('\n🎉 Basic auth test completed!')
  } catch (error) {
    console.error('❌ Test failed:', error.message)
    console.error('Stack:', error.stack)
  }
}

if (require.main === module) {
  testAuth().catch(console.error)
}
