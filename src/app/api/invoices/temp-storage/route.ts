import { NextRequest, NextResponse } from 'next/server'
import { writeFile, readFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'
import type { RentalInvoice } from '@/types/database'

const STORAGE_DIR = path.join(process.cwd(), 'temp-invoices')
const INVOICES_FILE = path.join(STORAGE_DIR, 'invoices.json')

// Ensure storage directory exists
async function ensureStorageDir() {
  if (!existsSync(STORAGE_DIR)) {
    await mkdir(STORAGE_DIR, { recursive: true })
  }
}

// Read all invoices from file
async function readInvoices(): Promise<RentalInvoice[]> {
  await ensureStorageDir()

  try {
    if (!existsSync(INVOICES_FILE)) {
      return []
    }

    const data = await readFile(INVOICES_FILE, 'utf-8')
    return JSON.parse(data) as RentalInvoice[]
  } catch {
    return []
  }
}

// Write all invoices to file
async function writeInvoices(invoices: RentalInvoice[]) {
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

// GET - Get all invoices
export async function GET(request: NextRequest) {
  try {
    const invoices = await readInvoices()

    const url = new URL(request.url)
    const roomId = url.searchParams.get('room_id')

    let filteredInvoices = invoices
    if (roomId) {
      filteredInvoices = invoices.filter(inv => inv.room_id === roomId)
    }

    return NextResponse.json({
      success: true,
      data: filteredInvoices,
      message: `Found ${filteredInvoices.length} invoices`,
    })
  } catch (error) {
    console.error('Error reading invoices:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to read invoices',
      },
      { status: 500 }
    )
  }
}

// POST - Create new invoice
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const invoices = await readInvoices()

    // Generate invoice data
    const newInvoice: RentalInvoice = {
      id: crypto.randomUUID(),
      room_id: body.room_id || '',
      tenant_id: body.tenant_id || '',
      contract_id: body.contract_id || null,
      invoice_number: body.invoice_number || generateInvoiceNumber(),
      period_start: body.period_start || '',
      period_end: body.period_end || '',
      issue_date: body.issue_date || new Date().toISOString().split('T')[0],
      due_date: body.due_date || '',
      template_type: body.template_type || 'professional',
      status: body.status || 'draft',
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
      pdf_url: body.pdf_url || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    // Add to array and save
    invoices.push(newInvoice)
    await writeInvoices(invoices)

    return NextResponse.json({
      success: true,
      data: newInvoice,
      message: 'Invoice created successfully',
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

// PUT - Update invoice
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const invoices = await readInvoices()

    const index = invoices.findIndex(inv => inv.id === body.id)
    if (index === -1) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invoice not found',
        },
        { status: 404 }
      )
    }

    // Update invoice
    invoices[index] = {
      ...invoices[index],
      ...body,
      updated_at: new Date().toISOString(),
    }

    await writeInvoices(invoices)

    return NextResponse.json({
      success: true,
      data: invoices[index],
      message: 'Invoice updated successfully',
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

// DELETE - Delete invoice
export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const id = url.searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invoice ID required',
        },
        { status: 400 }
      )
    }

    const invoices = await readInvoices()
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

    // Remove invoice
    invoices.splice(index, 1)
    await writeInvoices(invoices)

    return NextResponse.json({
      success: true,
      message: 'Invoice deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting invoice:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete invoice',
      },
      { status: 500 }
    )
  }
}
