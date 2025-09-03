'use client'

import { useState, useRef, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Label } from '@/components/ui/label'
import {
  CalendarIcon,
  FileImage,
  Building2,
  Home as HomeIcon,
  Search,
  User,
} from 'lucide-react'
import ReceiptTemplate from '@/components/receipts/receipt-template'
import ColorPicker, {
  type ColorTheme,
} from '@/components/receipts/color-picker'
import type {
  RentalInvoice,
  Room,
  Property,
  Tenant,
  RentalContract,
} from '@/types/database'

// Types for API responses
type OccupiedRoom = Room & {
  property: Property
  current_contract: RentalContract & { tenant: Tenant }
}

function ReceiptsPageContent() {
  const searchParams = useSearchParams()
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('')
  const [occupiedRooms, setOccupiedRooms] = useState<OccupiedRoom[]>([])
  const [filteredRooms, setFilteredRooms] = useState<OccupiedRoom[]>([])
  const [tenantSearchQuery, setTenantSearchQuery] = useState<string>('')
  const [invoices, setInvoices] = useState<RentalInvoice[]>([])
  const [selectedRoom, setSelectedRoom] = useState<string>('')
  const [selectedInvoice, setSelectedInvoice] = useState<string>('')
  const [currentInvoice, setCurrentInvoice] = useState<RentalInvoice | null>(
    null
  )
  const [isLoading, setIsLoading] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [colorTheme, setColorTheme] = useState<'green' | 'blue'>('green')
  const [customColorTheme, setCustomColorTheme] =
    useState<Partial<ColorTheme> | null>(null)
  const receiptRef = useRef<HTMLDivElement>(null)

  // Handle URL parameters for pre-selection
  useEffect(() => {
    const invoiceId = searchParams.get('invoiceId')
    const roomId = searchParams.get('roomId')

    if (roomId) {
      setSelectedRoom(roomId)
    }

    if (invoiceId) {
      setSelectedInvoice(invoiceId)
    }
  }, [searchParams])

  // Load occupied rooms
  useEffect(() => {
    const fetchRooms = async () => {
      try {
        console.log('Fetching occupied rooms...')
        const response = await fetch('/api/rooms/occupied')
        const data = await response.json()
        console.log('Rooms response:', data)

        if (data.success) {
          setOccupiedRooms(data.data)
          console.log('Rooms loaded:', data.data.length)
          console.log('Sample room data:', data.data[0]) // Debug: check first room structure

          // Auto-select property if room is pre-selected
          const roomId = searchParams.get('roomId')
          if (roomId) {
            const room = data.data.find((r: OccupiedRoom) => r.id === roomId)
            if (room) {
              setSelectedPropertyId(room.property.id)
            }
          }
        } else {
          console.error('Failed to fetch rooms:', data.error)
        }
      } catch (error) {
        console.error('Error fetching rooms:', error)
      }
    }
    fetchRooms()
  }, [])

  // Filter rooms by tenant search query
  useEffect(() => {
    if (!tenantSearchQuery.trim()) {
      setFilteredRooms([])
      return
    }

    const query = tenantSearchQuery.toLowerCase()
    const filtered = occupiedRooms.filter(room => {
      const tenantName =
        room.current_contract?.tenant?.full_name?.toLowerCase() || ''
      return tenantName.includes(query)
    })

    setFilteredRooms(filtered)
  }, [tenantSearchQuery, occupiedRooms])

  // Handle property selection
  const handlePropertySelect = (propertyId: string) => {
    setSelectedPropertyId(propertyId)
    setSelectedRoom('')
    setSelectedInvoice('')
    setCurrentInvoice(null)
  }

  // Handle room selection
  const handleRoomSelect = (roomId: string) => {
    setSelectedRoom(roomId)
    setSelectedInvoice('')
    setCurrentInvoice(null)
  }

  // Load invoices for selected room
  useEffect(() => {
    if (!selectedRoom) return

    const fetchInvoices = async () => {
      setIsLoading(true)
      try {
        const response = await fetch(`/api/invoices/by-room/${selectedRoom}`)
        const data = await response.json()
        if (data.success) {
          setInvoices(data.data)
        }
      } catch (error) {
        console.error('Error fetching invoices:', error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchInvoices()
  }, [selectedRoom])

  // Load specific invoice
  useEffect(() => {
    if (!selectedInvoice) {
      setCurrentInvoice(null)
      return
    }

    const invoice = invoices.find(inv => inv.id === selectedInvoice)
    setCurrentInvoice(invoice || null)
  }, [selectedInvoice, invoices])

  // Use Puppeteer for reliable screenshot generation with Save As dialog
  const generateScreenshot = async (format: 'png' | 'pdf' = 'png') => {
    if (!receiptRef.current || !currentInvoice) {
      throw new Error('Receipt element or invoice not found')
    }

    console.log('Generating screenshot with Puppeteer...', format)

    // Get the receipt HTML content
    const receiptHtml = receiptRef.current.outerHTML

    const timestamp = new Date()
      .toISOString()
      .slice(0, 16)
      .replace(/[-:]/g, '')
      .replace('T', '_')
    const defaultFilename = `bien-lai-${currentInvoice.invoice_number}-${timestamp}.${format}`

    // Call our Puppeteer API
    const response = await fetch('/api/receipts/screenshot', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        receiptHtml,
        format,
        filename: defaultFilename,
      }),
    })

    const result = await response.json()

    if (!result.success) {
      throw new Error(result.error || 'Screenshot generation failed')
    }

    // Convert base64 to blob
    const base64Data = result.data
    const binaryString = atob(base64Data)
    const bytes = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }

    const blob = new Blob([bytes], { type: result.contentType })

    // Try to use File System Access API for Save As dialog
    if ('showSaveFilePicker' in window) {
      try {
        const fileHandle = await (window as any).showSaveFilePicker({
          suggestedName: defaultFilename,
          types: [
            {
              description: format === 'png' ? 'PNG Images' : 'PDF Files',
              accept: {
                [result.contentType]: [`.${format}`],
              },
            },
          ],
        })

        const writable = await fileHandle.createWritable()
        await writable.write(blob)
        await writable.close()

        return {
          filename: fileHandle.name,
          size: blob.size,
        }
      } catch (error) {
        // User cancelled or API not supported, fall back to automatic download
        console.log('Save As cancelled or not supported, falling back to download')
      }
    }

    // Fallback to automatic download
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = defaultFilename
    link.click()

    // Cleanup
    setTimeout(() => URL.revokeObjectURL(url), 1000)

    return {
      filename: defaultFilename,
      size: blob.size,
    }
  }

  // Export as PNG with Save As dialog
  const handleExportPNG = async () => {
    if (!currentInvoice) {
      alert('Vui lòng chọn hóa đơn trước khi xuất.')
      return
    }

    setIsExporting(true)
    try {
      const result = await generateScreenshot('png')
      // Show success toast instead of alert
      const message = `Đã xuất PNG thành công! ${result.filename} (${(result.size / 1024).toFixed(1)} KB)`
      console.log(message)

      // Create a temporary success notification
      const notification = document.createElement('div')
      notification.className =
        'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50'
      notification.textContent = 'Xuất PNG thành công!'
      document.body.appendChild(notification)
      setTimeout(() => document.body.removeChild(notification), 3000)
    } catch (error) {
      console.error('PNG Export failed:', error)
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error'

      // Create error notification
      const notification = document.createElement('div')
      notification.className =
        'fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50'
      notification.textContent = `Lỗi xuất PNG: ${errorMessage}`
      document.body.appendChild(notification)
      setTimeout(() => document.body.removeChild(notification), 5000)
    } finally {
      setIsExporting(false)
    }
  }

  // Handle color theme change from color picker
  const handleColorThemeChange = async (newTheme: ColorTheme) => {
    setCustomColorTheme(newTheme)

    // Also update the invoice in database if we have a selected invoice
    if (currentInvoice) {
      try {
        const response = await fetch(`/api/invoices/${currentInvoice.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            color_settings: {
              header_bg: newTheme.header_bg,
              header_text: newTheme.header_text,
              total_bg: newTheme.total_bg,
              total_text: newTheme.total_text,
              theme_name: newTheme.theme_name,
            },
          }),
        })

        if (response.ok) {
          // Update local invoice state
          setCurrentInvoice(prev =>
            prev
              ? {
                  ...prev,
                  color_settings: {
                    header_bg: newTheme.header_bg,
                    header_text: newTheme.header_text,
                    total_bg: newTheme.total_bg,
                    total_text: newTheme.total_text,
                    theme_name: newTheme.theme_name,
                  },
                }
              : null
          )
          console.log('Color theme saved successfully to database! ✅')
        } else {
          console.warn('Failed to save color theme to database, but applied locally')
        }
      } catch (error) {
        console.error('Error saving color theme:', error)
        console.log('Color theme applied locally only')
      }
    }
  }

  const selectedRoomData = occupiedRooms.find(room => room.id === selectedRoom)

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Biên lai thanh toán
          </h1>
          <p className="text-muted-foreground">
            Chọn nhà cho thuê, phòng và kỳ thanh toán để xem và xuất biên lai
          </p>
        </div>

        <Separator />

        {/* Tenant Search */}
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-900 dark:text-blue-100">
              <Search className="h-5 w-5" />
              Tìm kiếm theo tên người thuê
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="text"
                placeholder="Nhập tên người thuê để tìm kiếm..."
                value={tenantSearchQuery}
                onChange={e => setTenantSearchQuery(e.target.value)}
                className="pl-10 bg-white dark:bg-gray-800"
              />
            </div>
            {tenantSearchQuery && filteredRooms.length > 0 && (
              <div className="mt-3 space-y-2">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Tìm thấy {filteredRooms.length} phòng:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {filteredRooms.slice(0, 6).map(room => (
                    <Button
                      key={room.id}
                      variant="outline"
                      size="sm"
                      className="justify-start h-auto p-3"
                      onClick={() => {
                        setSelectedPropertyId(room.property.id)
                        setSelectedRoom(room.id)
                        setTenantSearchQuery('')
                      }}
                    >
                      <div className="text-left">
                        <div className="font-medium">
                          {room.current_contract?.tenant?.full_name ||
                            'Không có tên'}
                        </div>
                        <div className="text-xs text-gray-500">
                          {room.property.name} - Phòng {room.room_number}
                        </div>
                      </div>
                    </Button>
                  ))}
                </div>
                {filteredRooms.length > 6 && (
                  <p className="text-xs text-gray-500">
                    ... và {filteredRooms.length - 6} phòng khác
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Selection Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              Chọn nhà cho thuê, phòng và kỳ thanh toán
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Property Selection */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  Nhà cho thuê
                </Label>
                <Select
                  value={selectedPropertyId}
                  onValueChange={handlePropertySelect}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn nhà cho thuê" />
                  </SelectTrigger>
                  <SelectContent>
                    {[
                      ...new Map(
                        occupiedRooms.map(room => [
                          room.property.id,
                          room.property,
                        ])
                      ).values(),
                    ].map(property => (
                      <SelectItem key={property.id} value={property.id}>
                        <span className="font-medium">{property.name}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Room Selection */}
              {selectedPropertyId && (
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <HomeIcon className="w-4 h-4" />
                    Phòng
                  </Label>
                  <Select value={selectedRoom} onValueChange={handleRoomSelect}>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn phòng" />
                    </SelectTrigger>
                    <SelectContent>
                      {occupiedRooms
                        .filter(room => room.property.id === selectedPropertyId)
                        .map(room => (
                          <SelectItem key={room.id} value={room.id}>
                            <span className="font-medium">
                              Phòng {room.room_number}
                              {room.current_contract?.tenant?.full_name
                                ? ` - ${room.current_contract.tenant.full_name}`
                                : ' (Chưa có thông tin người thuê)'}
                            </span>
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Invoice Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Kỳ thanh toán</label>
                <Select
                  value={selectedInvoice}
                  onValueChange={setSelectedInvoice}
                  disabled={!selectedRoom || isLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn kỳ thanh toán" />
                  </SelectTrigger>
                  <SelectContent>
                    {invoices.map(invoice => (
                      <SelectItem key={invoice.id} value={invoice.id}>
                        {new Date(invoice.period_start).toLocaleDateString(
                          'vi-VN'
                        )}{' '}
                        đến{' '}
                        {new Date(invoice.period_end).toLocaleDateString(
                          'vi-VN'
                        )}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Export Buttons */}
            {currentInvoice && (
              <div className="flex justify-end pt-4">
                <Button
                  onClick={handleExportPNG}
                  disabled={isExporting}
                  className="flex items-center gap-2"
                >
                  {isExporting ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  ) : (
                    <FileImage className="h-4 w-4" />
                  )}
                  {isExporting ? 'Đang xuất...' : 'Xuất PNG'}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Advanced Color Picker */}
        {currentInvoice && (
          <ColorPicker
            currentTheme={
              currentInvoice.color_settings || customColorTheme || undefined
            }
            onThemeChange={handleColorThemeChange}
          />
        )}

        {/* Receipt Preview */}
        {currentInvoice && selectedRoomData ? (
          <Card>
            <CardHeader>
              <CardTitle>Xem trước biên lai</CardTitle>
            </CardHeader>
            <CardContent>
              <ReceiptTemplate
                ref={receiptRef}
                invoice={currentInvoice}
                roomInfo={{
                  name: `${selectedRoomData.current_contract?.tenant?.full_name || 'N/A'} – Phòng Số ${selectedRoomData.room_number}`,
                }}
                propertyInfo={{
                  name: selectedRoomData.property.name,
                  address: selectedRoomData.property.address,
                }}
                colorTheme={colorTheme}
                customColorTheme={customColorTheme || undefined}
              />
            </CardContent>
          </Card>
        ) : (
          <div className="text-center py-12">
            <CalendarIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">
              Chưa có biên lai để hiển thị
            </h2>
            <p className="text-muted-foreground">
              Vui lòng chọn phòng và kỳ thanh toán để xem biên lai.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default function ReceiptsPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-2 text-gray-600">Đang tải...</span>
        </div>
      </div>
    }>
      <ReceiptsPageContent />
    </Suspense>
  )
}
