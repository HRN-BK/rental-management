import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { writeFile, readFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'
import type { RentalInvoice } from '@/types/database'

// Temporary storage configuration
const STORAGE_DIR = path.join(process.cwd(), 'temp-invoices')
const INVOICES_FILE = path.join(STORAGE_DIR, 'invoices.json')

// Ensure storage directory exists
async function ensureStorageDir() {
  if (!existsSync(STORAGE_DIR)) {
    await mkdir(STORAGE_DIR, { recursive: true })
  }
}

// Temporary storage functions
async function readTempInvoices(): Promise<RentalInvoice[]> {
  await ensureStorageDir()
  try {
    if (!existsSync(INVOICES_FILE)) return []
    const data = await readFile(INVOICES_FILE, 'utf-8')
    return JSON.parse(data) as RentalInvoice[]
  } catch {
    return []
  }
}

async function writeTempInvoices(invoices: RentalInvoice[]) {
  await ensureStorageDir()
  await writeFile(INVOICES_FILE, JSON.stringify(invoices, null, 2))
}

// Generate unique invoice number
function generateInvoiceNumber(): string {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const timestamp = Date.now().toString().slice(-4)
  return `INV-${year}${month}-${timestamp}`
}

export async function GET() {
  try {
    // Try Supabase first
    try {
      const supabase = await createServerSupabaseClient()
      const { data: invoices, error } = await supabase
        .from('rental_invoices')
        .select('*')
        .order('created_at', { ascending: false })

      if (!error && invoices) {
        return NextResponse.json({
          success: true,
          data: invoices,
          source: 'supabase',
        })
      }
    } catch (error) {
      console.log('Supabase not available, using temporary storage:', error)
    }

    // Fallback to temporary storage
    const tempInvoices = await readTempInvoices()
    return NextResponse.json({
      success: true,
      data: tempInvoices,
      source: 'temporary',
      message:
        tempInvoices.length === 0
          ? 'No invoices found. Create your first invoice!'
          : `Found ${tempInvoices.length} invoices in temporary storage`,
    })
  } catch (error) {
    console.error('Server error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Generate invoice number if not provided
    const invoiceNumber = body.invoice_number || generateInvoiceNumber()

    // Generate issue and due dates if not provided
    const issueDate = body.issue_date || new Date().toISOString().split('T')[0]
    const dueDate =
      body.due_date ||
      new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    const invoiceData = {
      room_id: body.room_id,
      tenant_id: body.tenant_id,
      contract_id: body.contract_id,
      invoice_number: invoiceNumber,
      period_start: body.period_start,
      period_end: body.period_end,
      issue_date: issueDate,
      due_date: dueDate,
      template_type: body.template_type || 'professional',
      status: body.status || 'draft',

      // Amounts
      rent_amount: Number(body.rent_amount || 0),
      electricity_previous_reading: Number(
        body.electricity_previous_reading || 0
      ),
      electricity_current_reading: Number(
        body.electricity_current_reading || 0
      ),
      electricity_unit_price: Number(body.electricity_unit_price || 0),
      electricity_amount: Number(body.electricity_amount || 0),
      electricity_note: body.electricity_note || '',

      water_previous_reading: Number(body.water_previous_reading || 0),
      water_current_reading: Number(body.water_current_reading || 0),
      water_unit_price: Number(body.water_unit_price || 0),
      water_amount: Number(body.water_amount || 0),
      water_note: body.water_note || '',

      internet_amount: Number(body.internet_amount || 0),
      internet_note: body.internet_note || '',
      trash_amount: Number(body.trash_amount || 0),
      trash_note: body.trash_note || '',

      other_fees: body.other_fees || [],
      total_amount: Number(body.total_amount || 0),
      notes: body.notes || '',
    }

    // Try Supabase first
    try {
      const supabase = await createServerSupabaseClient()
      const { data: newInvoice, error } = await supabase
        .from('rental_invoices')
        .insert([invoiceData])
        .select()
        .single()

      if (!error && newInvoice) {
        return NextResponse.json({
          success: true,
          data: newInvoice,
          source: 'supabase',
          message: 'Invoice saved to database successfully!',
        })
      }
    } catch (error) {
      console.log('Supabase not available, using temporary storage:', error)
    }

    // Fallback to temporary storage
    const invoices = await readTempInvoices()
    const newInvoice: RentalInvoice = {
      id: crypto.randomUUID(),
      ...invoiceData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    invoices.push(newInvoice)
    await writeTempInvoices(invoices)

    return NextResponse.json({
      success: true,
      data: newInvoice,
      source: 'temporary',
      message:
        'Invoice saved to temporary storage successfully! (Database not available)',
    })
  } catch (error) {
    console.error('Error creating invoice:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create invoice',
      },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invoice ID is required',
        },
        { status: 400 }
      )
    }

    // Try Supabase first
    try {
      const supabase = await createServerSupabaseClient()
      const { data: updatedInvoice, error } = await supabase
        .from('rental_invoices')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (!error && updatedInvoice) {
        return NextResponse.json({
          success: true,
          data: updatedInvoice,
          source: 'supabase',
          message: 'Invoice updated in database successfully!',
        })
      }
    } catch (error) {
      console.log('Supabase not available, using temporary storage:', error)
    }

    // Fallback to temporary storage
    const invoices = await readTempInvoices()
    const index = invoices.findIndex(inv => inv.id === id)

    if (index === -1) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invoice not found',
        },
        { status: 404 }
      )
    }

    invoices[index] = {
      ...invoices[index],
      ...updateData,
      updated_at: new Date().toISOString(),
    }

    await writeTempInvoices(invoices)

    return NextResponse.json({
      success: true,
      data: invoices[index],
      source: 'temporary',
      message: 'Invoice updated in temporary storage successfully!',
    })
  } catch (error) {
    console.error('Error updating invoice:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update invoice',
      },
      { status: 500 }
    )
  }
}
