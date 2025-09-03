import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function POST() {
  try {
    console.log('🗑️ Starting data clearing...')
    const supabase = await createServerSupabaseClient()

    const results: any = {}

    // Order matters - delete in reverse dependency order
    const tables = [
      'rental_invoices',
      'payment_records',
      'receipts',
      'rental_contracts',
      'rooms',
      'tenants',
      'properties',
    ]

    for (const table of tables) {
      console.log(`Clearing ${table}...`)

      const { error } = await supabase
        .from(table)
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all except impossible ID

      if (error) {
        console.error(`Error clearing ${table}:`, error)
        return NextResponse.json(
          {
            success: false,
            message: `Lỗi xóa ${table}: ${error.message}`,
            details: error,
          },
          { status: 500 }
        )
      }

      // Count remaining rows to confirm deletion
      const { count, error: countError } = await supabase
        .from(table)
        .select('id', { count: 'exact' })

      if (!countError) {
        results[table] = `cleared (${count || 0} remaining)`
        console.log(`✅ Cleared ${table} - ${count || 0} rows remaining`)
      }
    }

    console.log('🎉 Data clearing completed successfully!')

    return NextResponse.json({
      success: true,
      message: 'Đã xóa thành công toàn bộ dữ liệu',
      details: results,
    })
  } catch (error) {
    console.error('❌ Error clearing data:', error)
    return NextResponse.json(
      {
        success: false,
        message:
          'Có lỗi xảy ra khi xóa dữ liệu: ' +
          (error instanceof Error ? error.message : 'Unknown error'),
        details: error,
      },
      { status: 500 }
    )
  }
}
