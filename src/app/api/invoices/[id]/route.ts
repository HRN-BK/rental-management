import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { readFile, writeFile } from 'fs/promises'
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

async function writeTempInvoices(invoices: RentalInvoice[]) {
  await writeFile(INVOICES_FILE, JSON.stringify(invoices, null, 2))
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: invoiceId } = await params

    if (!invoiceId) {
      return NextResponse.json(
        { success: false, error: 'Invoice ID is required' },
        { status: 400 }
      )
    }

    // Try Supabase first
    try {
      const supabase = await createServerSupabaseClient()

      const { data: deletedInvoice, error } = await supabase
        .from('rental_invoices')
        .delete()
        .eq('id', invoiceId)
        .select()
        .single()

      if (!error && deletedInvoice) {
        return NextResponse.json({
          success: true,
          message: 'Invoice deleted successfully from database',
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
    const invoiceIndex = tempInvoices.findIndex(
      invoice => invoice.id === invoiceId
    )

    if (invoiceIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Invoice not found' },
        { status: 404 }
      )
    }

    // Remove the invoice from the array
    tempInvoices.splice(invoiceIndex, 1)
    await writeTempInvoices(tempInvoices)

    return NextResponse.json({
      success: true,
      message: 'Invoice deleted successfully from temporary storage',
      source: 'temporary',
    })
  } catch (error) {
    console.error('Error deleting invoice:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete invoice' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: invoiceId } = await params

    if (!invoiceId) {
      return NextResponse.json(
        { success: false, error: 'Invoice ID is required' },
        { status: 400 }
      )
    }

    // Try Supabase first
    try {
      const supabase = await createServerSupabaseClient()

      const { data: invoice, error } = await supabase
        .from('rental_invoices')
        .select('*')
        .eq('id', invoiceId)
        .single()

      if (!error && invoice) {
        return NextResponse.json({
          success: true,
          data: invoice,
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
    const invoice = tempInvoices.find(invoice => invoice.id === invoiceId)

    if (!invoice) {
      return NextResponse.json(
        { success: false, error: 'Invoice not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: invoice,
      source: 'temporary',
    })
  } catch (error) {
    console.error('Error fetching invoice:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch invoice' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: invoiceId } = await params
    const body = await request.json()

    if (!invoiceId) {
      return NextResponse.json(
        { success: false, error: 'Invoice ID is required' },
        { status: 400 }
      )
    }

    // Try Supabase first
    try {
      const supabase = await createServerSupabaseClient()

      const { data: updatedInvoice, error } = await supabase
        .from('rental_invoices')
        .update(body)
        .eq('id', invoiceId)
        .select()
        .single()

      if (!error && updatedInvoice) {
        return NextResponse.json({
          success: true,
          data: updatedInvoice,
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
    const invoiceIndex = tempInvoices.findIndex(
      invoice => invoice.id === invoiceId
    )

    if (invoiceIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Invoice not found' },
        { status: 404 }
      )
    }

    // Update the invoice
    tempInvoices[invoiceIndex] = { ...tempInvoices[invoiceIndex], ...body }
    await writeTempInvoices(tempInvoices)

    return NextResponse.json({
      success: true,
      data: tempInvoices[invoiceIndex],
      source: 'temporary',
    })
  } catch (error) {
    console.error('Error updating invoice:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update invoice' },
      { status: 500 }
    )
  }
}
