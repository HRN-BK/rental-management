import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { readFile } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'
import type { RentalInvoice } from '@/types/database'

// Temporary storage configuration
const STORAGE_DIR = path.join(process.cwd(), 'temp-invoices')
const INVOICES_FILE = path.join(STORAGE_DIR, 'invoices.json')

// Temporary storage functions
async function readTempInvoices(): Promise<RentalInvoice[]> {
  try {
    if (!existsSync(INVOICES_FILE)) return []
    const data = await readFile(INVOICES_FILE, 'utf-8')
    return JSON.parse(data) as RentalInvoice[]
  } catch {
    return []
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId } = await params

    if (!roomId) {
      return NextResponse.json(
        { success: false, error: 'Room ID is required' },
        { status: 400 }
      )
    }

    // Try Supabase first
    try {
      const supabase = await createServerSupabaseClient()

      // Fetch invoices for the specific room (without joins since we don't have foreign keys)
      const { data: invoicesWithDetails, error } = await supabase
        .from('rental_invoices')
        .select('*')
        .eq('room_id', roomId)
        .order('created_at', { ascending: false })

      if (!error && invoicesWithDetails) {
        return NextResponse.json({
          success: true,
          data: invoicesWithDetails,
          source: 'supabase',
        })
      }

      if (error) {
        console.error('Supabase error:', error)
      }
    } catch (error) {
      console.log('Supabase not available, using temporary storage:', error)
    }

    // Fallback to temporary storage
    const tempInvoices = await readTempInvoices()
    const roomInvoices = tempInvoices.filter(
      invoice => invoice.room_id === roomId
    )

    return NextResponse.json({
      success: true,
      data: roomInvoices,
      source: 'temporary',
      message:
        roomInvoices.length === 0
          ? 'No invoices found for this room. Create your first invoice!'
          : `Found ${roomInvoices.length} invoices for this room in temporary storage`,
    })
  } catch (error) {
    console.error('Error fetching invoices for room:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch invoices for room' },
      { status: 500 }
    )
  }
}
