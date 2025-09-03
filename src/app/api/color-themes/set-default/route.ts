import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { themeId } = body

    if (!themeId) {
      return NextResponse.json(
        { success: false, error: 'Theme ID is required' },
        { status: 400 }
      )
    }

    const supabase = await createServerSupabaseClient()

    // First, unset all current defaults
    const { error: unsetError } = await supabase
      .from('color_themes')
      .update({ is_default: false })
      .neq('id', '00000000-0000-0000-0000-000000000000') // Update all

    if (unsetError) {
      console.error('Error unsetting current defaults:', unsetError)
      return NextResponse.json(
        { success: false, error: 'Failed to update default theme' },
        { status: 500 }
      )
    }

    // Then set the new default
    const { data: updatedTheme, error: setError } = await supabase
      .from('color_themes')
      .update({ is_default: true })
      .eq('id', themeId)
      .select()
      .single()

    if (setError) {
      console.error('Error setting new default:', setError)
      return NextResponse.json(
        { success: false, error: 'Failed to set default theme' },
        { status: 500 }
      )
    }

    if (!updatedTheme) {
      return NextResponse.json(
        { success: false, error: 'Theme not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: updatedTheme,
      message: `Đã đặt "${updatedTheme.name}" làm màu mặc định cho tất cả biên lai`,
    })
  } catch (error) {
    console.error('Set default theme error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
