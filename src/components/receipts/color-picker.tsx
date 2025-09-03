'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Palette, Check, RefreshCw, Save, Star } from 'lucide-react'
import { toast } from 'sonner'

export interface ColorTheme {
  header_bg: string
  header_text: string
  total_bg: string
  total_text: string
  theme_name: string
}

interface ColorPickerProps {
  currentTheme?: Partial<ColorTheme>
  onThemeChange: (theme: ColorTheme) => void
  className?: string
}

const PRESET_THEMES: ColorTheme[] = [
  {
    header_bg: '#86efac',
    header_text: '#166534',
    total_bg: '#bbf7d0',
    total_text: '#14532d',
    theme_name: 'Xanh lá truyền thống',
  },
  {
    header_bg: '#93c5fd',
    header_text: '#1e3a8a',
    total_bg: '#bfdbfe',
    total_text: '#1e3a8a',
    theme_name: 'Xanh dương truyền thống',
  },
  {
    header_bg: '#fbbf24',
    header_text: '#92400e',
    total_bg: '#fcd34d',
    total_text: '#92400e',
    theme_name: 'Vàng nắng',
  },
  {
    header_bg: '#f472b6',
    header_text: '#831843',
    total_bg: '#f9a8d4',
    total_text: '#831843',
    theme_name: 'Hồng ngọt ngào',
  },
  {
    header_bg: '#a78bfa',
    header_text: '#581c87',
    total_bg: '#c4b5fd',
    total_text: '#581c87',
    theme_name: 'Tím lãng mạn',
  },
  {
    header_bg: '#fb7185',
    header_text: '#881337',
    total_bg: '#fda4af',
    total_text: '#881337',
    theme_name: 'Đỏ rượu vang',
  },
  {
    header_bg: '#34d399',
    header_text: '#064e3b',
    total_bg: '#6ee7b7',
    total_text: '#064e3b',
    theme_name: 'Xanh mint',
  },
  {
    header_bg: '#60a5fa',
    header_text: '#1e3a8a',
    total_bg: '#93c5fd',
    total_text: '#1e3a8a',
    theme_name: 'Xanh sky',
  },
]

export default function ColorPicker({
  currentTheme,
  onThemeChange,
  className = '',
}: ColorPickerProps) {
  const [customTheme, setCustomTheme] = useState<ColorTheme>({
    header_bg: currentTheme?.header_bg || '#86efac',
    header_text: currentTheme?.header_text || '#166534',
    total_bg: currentTheme?.total_bg || '#bbf7d0',
    total_text: currentTheme?.total_text || '#14532d',
    theme_name: currentTheme?.theme_name || 'Theme tùy chỉnh',
  })

  const [activeTab, setActiveTab] = useState<'presets' | 'custom'>('presets')
  const [isSaving, setIsSaving] = useState(false)

  const handlePresetSelect = (theme: ColorTheme) => {
    onThemeChange(theme)
  }

  const handleCustomChange = (field: keyof ColorTheme, value: string) => {
    const newTheme = { ...customTheme, [field]: value }
    setCustomTheme(newTheme)
  }

  const applyCustomTheme = () => {
    onThemeChange(customTheme)
  }

  const resetToDefault = () => {
    const defaultTheme = PRESET_THEMES[0]
    setCustomTheme(defaultTheme)
    onThemeChange(defaultTheme)
  }

  const isCurrentTheme = (theme: ColorTheme) => {
    return (
      currentTheme?.header_bg === theme.header_bg &&
      currentTheme?.header_text === theme.header_text &&
      currentTheme?.total_bg === theme.total_bg &&
      currentTheme?.total_text === theme.total_text
    )
  }

  const saveAsDefaultTheme = async () => {
    if (!currentTheme || !currentTheme.header_bg || !currentTheme.header_text || !currentTheme.total_bg || !currentTheme.total_text) {
      toast.error('Vui lòng chọn một màu trước khi lưu')
      return
    }

    setIsSaving(true)
    try {
      const response = await fetch('/api/color-themes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: currentTheme.theme_name || 'Màu tùy chỉnh',
          header_bg: currentTheme.header_bg,
          header_text: currentTheme.header_text,
          total_bg: currentTheme.total_bg,
          total_text: currentTheme.total_text,
          is_default: true,
        }),
      })

      const result = await response.json()
      
      if (result.success) {
        toast.success('Đã lưu làm màu mặc định cho tất cả biên lai! ⭐')
      } else {
        toast.error(result.error || 'Không thể lưu màu mặc định')
      }
    } catch (error) {
      console.error('Error saving default theme:', error)
      toast.error('Lỗi khi lưu màu mặc định')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Card className={`w-full ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Palette className="w-4 h-4 text-purple-600" />
          Chọn màu sắc biên lai
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Compact Preset Themes */}
        <div className="space-y-3">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {PRESET_THEMES.map((theme, index) => (
              <div
                key={index}
                className={`relative p-3 border-2 rounded-lg cursor-pointer transition-all hover:shadow-md group ${
                  isCurrentTheme(theme)
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-950 dark:border-blue-400'
                    : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600'
                }`}
                onClick={() => handlePresetSelect(theme)}
              >
                {/* Check mark for selected theme */}
                {isCurrentTheme(theme) && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                )}

                {/* Compact Preview */}
                <div className="space-y-1.5">
                  {/* Header preview */}
                  <div
                    className="p-2 rounded text-center text-xs font-medium"
                    style={{
                      backgroundColor: theme.header_bg,
                      color: theme.header_text,
                    }}
                  >
                    Phòng
                  </div>

                  {/* Total preview */}
                  <div
                    className="p-1.5 rounded text-xs font-semibold text-center"
                    style={{
                      backgroundColor: theme.total_bg,
                      color: theme.total_text,
                    }}
                  >
                    5,000,000
                  </div>
                </div>

                {/* Theme name - only show on hover */}
                <div className="mt-2 text-xs text-gray-600 dark:text-gray-300 text-center opacity-0 group-hover:opacity-100 transition-opacity truncate">
                  {theme.theme_name}
                </div>
              </div>
            ))}
          </div>

          {/* Advanced Options Toggle */}
          <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                setActiveTab(activeTab === 'presets' ? 'custom' : 'presets')
              }
              className="w-full text-xs text-gray-600 dark:text-gray-400"
            >
              {activeTab === 'presets'
                ? 'Tùy chỉnh màu sắc'
                : 'Quay lại mẫu có sẵn'}
            </Button>
          </div>
        </div>

        {/* Custom Theme - Only show when requested */}
        {activeTab === 'custom' && (
          <div className="space-y-4 pt-2 border-t border-gray-200 dark:border-gray-700">
            {/* Compact Preview */}
            <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
              <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                Xem trước:
              </div>
              <div className="space-y-2">
                <div
                  className="p-2 rounded text-center text-sm font-medium"
                  style={{
                    backgroundColor: customTheme.header_bg,
                    color: customTheme.header_text,
                  }}
                >
                  Tên phòng
                </div>
                <div
                  className="p-2 rounded font-semibold text-center"
                  style={{
                    backgroundColor: customTheme.total_bg,
                    color: customTheme.total_text,
                  }}
                >
                  5,000,000 VNĐ
                </div>
              </div>
            </div>

            {/* Simplified Controls */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-xs font-medium">Màu header</Label>
                <div className="flex gap-1">
                  <Input
                    type="color"
                    value={customTheme.header_bg}
                    onChange={e =>
                      handleCustomChange('header_bg', e.target.value)
                    }
                    className="w-8 h-8 p-1 rounded"
                  />
                  <Input
                    type="color"
                    value={customTheme.header_text}
                    onChange={e =>
                      handleCustomChange('header_text', e.target.value)
                    }
                    className="w-8 h-8 p-1 rounded"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium">Màu tổng</Label>
                <div className="flex gap-1">
                  <Input
                    type="color"
                    value={customTheme.total_bg}
                    onChange={e =>
                      handleCustomChange('total_bg', e.target.value)
                    }
                    className="w-8 h-8 p-1 rounded"
                  />
                  <Input
                    type="color"
                    value={customTheme.total_text}
                    onChange={e =>
                      handleCustomChange('total_text', e.target.value)
                    }
                    className="w-8 h-8 p-1 rounded"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={applyCustomTheme} size="sm" className="flex-1">
                Áp dụng
              </Button>
              <Button variant="outline" onClick={resetToDefault} size="sm">
                <RefreshCw className="w-3 h-3" />
              </Button>
            </div>
          </div>
        )}
        
        {/* Save as Default Section */}
        {currentTheme && (
          <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <div>
                <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  Lưu làm màu mặc định
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Màu này sẽ được áp dụng cho tất cả biên lai mới
                </div>
              </div>
            </div>
            <Button 
              onClick={saveAsDefaultTheme}
              disabled={isSaving}
              size="sm" 
              className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
            >
              {isSaving ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white" />
                  Đang lưu...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Star className="w-3 h-3" />
                  Lưu làm màu mặc định
                </div>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
