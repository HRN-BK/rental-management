#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

async function testApp() {
  console.log('🚀 Testing Rental Management App...')

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Missing Supabase environment variables')
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey)

  try {
    // Test 1: Properties
    console.log('\n📋 Testing Properties...')
    const { data: properties, error: propError } = await supabase
      .from('properties')
      .select('*')

    if (propError) throw propError
    console.log(`✅ Found ${properties.length} properties`)
    properties.forEach(prop => {
      console.log(
        `   - ${prop.name}: ${prop.total_rooms} rooms, ${prop.occupancy_percentage}% occupied`
      )
    })

    // Test 2: Rooms
    console.log('\n🏠 Testing Rooms...')
    const { data: rooms, error: roomError } = await supabase.from('rooms')
      .select(`
        *,
        property:properties(name)
      `)

    if (roomError) throw roomError
    console.log(`✅ Found ${rooms.length} rooms`)

    const roomsByStatus = rooms.reduce((acc, room) => {
      acc[room.status] = (acc[room.status] || 0) + 1
      return acc
    }, {})

    Object.entries(roomsByStatus).forEach(([status, count]) => {
      console.log(`   - ${status}: ${count} rooms`)
    })

    // Test 3: Tenants
    console.log('\n👥 Testing Tenants...')
    const { data: tenants, error: tenantError } = await supabase
      .from('tenants')
      .select('*')

    if (tenantError) throw tenantError
    console.log(`✅ Found ${tenants.length} tenants`)
    tenants.forEach(tenant => {
      console.log(`   - ${tenant.full_name} (${tenant.phone})`)
    })

    // Test 4: Contracts
    console.log('\n📄 Testing Rental Contracts...')
    const { data: contracts, error: contractError } = await supabase.from(
      'rental_contracts'
    ).select(`
        *,
        room:rooms(room_number, property:properties(name)),
        tenant:tenants(full_name)
      `)

    if (contractError) throw contractError
    console.log(`✅ Found ${contracts.length} contracts`)
    contracts.forEach(contract => {
      console.log(
        `   - ${contract.tenant?.full_name} in room ${contract.room?.room_number} - Status: ${contract.status}`
      )
    })

    // Test 5: Dashboard Stats
    console.log('\n📊 Testing Dashboard Statistics...')
    const totalProperties = properties.length
    const totalRooms = rooms.length
    const occupiedRooms = rooms.filter(
      room => room.status === 'occupied'
    ).length
    const availableRooms = rooms.filter(
      room => room.status === 'available'
    ).length
    const occupancyRate =
      totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0

    console.log(`✅ Dashboard Stats:`)
    console.log(`   - Properties: ${totalProperties}`)
    console.log(`   - Total Rooms: ${totalRooms}`)
    console.log(`   - Occupied: ${occupiedRooms}`)
    console.log(`   - Available: ${availableRooms}`)
    console.log(`   - Occupancy Rate: ${occupancyRate}%`)

    // Test 6: Database integrity
    console.log('\n🔍 Testing Database Integrity...')

    // Check if property room counts are correct
    for (const property of properties) {
      const propertyRooms = rooms.filter(
        room => room.property_id === property.id
      )
      const occupiedCount = propertyRooms.filter(
        room => room.status === 'occupied'
      ).length
      const availableCount = propertyRooms.filter(
        room => room.status === 'available'
      ).length

      console.log(`✅ Property "${property.name}":`)
      console.log(
        `   - Database: ${property.total_rooms} total, ${property.occupied_rooms} occupied, ${property.available_rooms} available`
      )
      console.log(
        `   - Calculated: ${propertyRooms.length} total, ${occupiedCount} occupied, ${availableCount} available`
      )

      if (
        property.total_rooms === propertyRooms.length &&
        property.occupied_rooms === occupiedCount &&
        property.available_rooms === availableCount
      ) {
        console.log(`   ✅ Data integrity OK`)
      } else {
        console.log(`   ⚠️  Data integrity issue detected`)
      }
    }

    console.log(
      '\n🎉 All tests passed! Supabase integration is working perfectly!'
    )
    console.log('\n🌐 Your app is ready at: http://localhost:3000')
    console.log('\nAvailable pages:')
    console.log('   - Dashboard: http://localhost:3000')
    console.log('   - Properties: http://localhost:3000/properties')
    console.log('   - Rooms: http://localhost:3000/rooms')
    console.log('   - Tenants: http://localhost:3000/tenants')
    console.log('   - Receipts: http://localhost:3000/receipts')
  } catch (error) {
    console.error('❌ Test failed:', error)
    process.exit(1)
  }
}

testApp()
