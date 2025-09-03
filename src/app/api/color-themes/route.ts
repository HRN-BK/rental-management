import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export interface ColorTheme {
  id: string
  name: string
  header_bg: string
  header_text: string
  total_bg: string
  total_text: string
  is_default: boolean
  created_at: string
  updated_at: string
}

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient()

    const { data: themes, error } = await supabase
      .from('color_themes')
      .select('*')
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching color themes:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch color themes' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: themes || [],
    })
  } catch (error) {
    console.error('Color themes API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, header_bg, header_text, total_bg, total_text, is_default } = body

    if (!name || !header_bg || !header_text || !total_bg || !total_text) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const supabase = await createServerSupabaseClient()

    // If this is set as default, first unset all other defaults
    if (is_default) {
      await supabase
        .from('color_themes')
        .update({ is_default: false })
        .neq('id', '00000000-0000-0000-0000-000000000000') // Update all
    }

    const { data: newTheme, error } = await supabase
      .from('color_themes')
      .insert({
        name,
        header_bg,
        header_text,
        total_bg,
        total_text,
        is_default: is_default || false,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating color theme:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to create color theme' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: newTheme,
      message: 'Color theme created successfully',
    })
  } catch (error) {
    console.error('Create color theme error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
