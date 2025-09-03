import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient()

    // First, fetch rooms with properties
    const { data: rooms, error: roomsError } = await supabase
      .from('rooms')
      .select(
        `
        id,
        room_number,
        rent_amount,
        status,
        property:properties(
          id,
          name,
          address
        )
      `
      )
      .eq('status', 'occupied')

    if (roomsError) {
      console.error('Rooms query error:', roomsError)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch rooms' },
        { status: 500 }
      )
    }

    if (!rooms || rooms.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
      })
    }

    // Then, fetch contracts with tenants for these rooms
    const roomIds = rooms.map((room: any) => room.id)
    const { data: contracts, error: contractsError } = await supabase
      .from('rental_contracts')
      .select(
        `
        id,
        room_id,
        monthly_rent,
        start_date,
        end_date,
        status,
        tenant:tenants(
          id,
          full_name,
          phone,
          email
        )
      `
      )
      .in('room_id', roomIds)
      .eq('status', 'active')

    if (contractsError) {
      console.error('Contracts query error:', contractsError)
      // Continue without contract info rather than failing
    }

    // Combine the data
    const roomsWithDetails = rooms.map((room: any) => {
      const activeContract = contracts?.find((c: any) => c.room_id === room.id)

      return {
        id: room.id,
        room_number: room.room_number,
        rent_amount: room.rent_amount,
        status: room.status,
        property: {
          id: room.property?.id,
          name: room.property?.name || 'Unknown Property',
          address: room.property?.address || 'No address',
        },
        current_contract: activeContract
          ? {
              id: activeContract.id,
              monthly_rent: activeContract.monthly_rent,
              start_date: activeContract.start_date,
              end_date: activeContract.end_date,
              status: activeContract.status,
              tenant: activeContract.tenant,
            }
          : null,
      }
    })

    return NextResponse.json({
      success: true,
      data: roomsWithDetails,
    })
  } catch (error) {
    console.error('Error fetching occupied rooms:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch occupied rooms' },
      { status: 500 }
    )
  }
}
