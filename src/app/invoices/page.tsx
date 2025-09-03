'use client'

import { useState, useEffect } from 'react'
import {
  Plus,
  FileText,
  UserCheck,
  Home as HomeIcon,
  Building2,
  Search,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CollectionFormModal } from '@/components/invoices/collection-form-modal'
import { CollectionList } from '@/components/invoices/collection-list'
import { InvoicePreviewModal } from '@/components/invoices/invoice-preview-modal'
import { MobileInvoices } from '@/components/invoices/mobile-invoices'
import type {
  Room,
  Property,
  Tenant,
  RentalContract,
  RentalInvoice,
} from '@/types/database'

// Types for API responses
type OccupiedRoom = Room & {
  property: Property
  current_contract: RentalContract & { tenant: Tenant }
}

export default function InvoicesPage() {
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('')
  const [selectedRoomId, setSelectedRoomId] = useState<string>('')
  const [selectedRoom, setSelectedRoom] = useState<OccupiedRoom | null>(null)
  const [collectionFormOpen, setCollectionFormOpen] = useState(false)
  const [previewInvoice, setPreviewInvoice] = useState<RentalInvoice | null>(
    null
  )
  const [previewOpen, setPreviewOpen] = useState(false)
  const [invoices, setInvoices] = useState<RentalInvoice[]>([])
  const [occupiedRooms, setOccupiedRooms] = useState<OccupiedRoom[]>([])
  const [filteredRooms, setFilteredRooms] = useState<OccupiedRoom[]>([])
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [, setLoading] = useState(true)

  // Fetch occupied rooms on component mount
  useEffect(() => {
    fetchOccupiedRooms()
  }, [])

  // Filter rooms based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredRooms(occupiedRooms)
      return
    }

    const query = searchTerm.toLowerCase()
    const filtered = occupiedRooms.filter(room => {
      const tenantName =
        room.current_contract?.tenant?.full_name?.toLowerCase() || ''
      const roomNumber = room.room_number.toLowerCase()
      const propertyName = room.property.name.toLowerCase()

      return (
        tenantName.includes(query) ||
        roomNumber.includes(query) ||
        propertyName.includes(query)
      )
    })

    setFilteredRooms(filtered)
  }, [searchTerm, occupiedRooms])

  // Fetch invoices when room is selected
  useEffect(() => {
    if (selectedRoomId) {
      fetchRoomInvoices(selectedRoomId)
    } else {
      setInvoices([])
    }
  }, [selectedRoomId])

  const fetchOccupiedRooms = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/rooms/occupied')
      const result = await response.json()

      if (result.success) {
        setOccupiedRooms(result.data)
        setFilteredRooms(result.data)
      } else {
        console.error('Failed to fetch occupied rooms:', result.error)
      }
    } catch (error) {
      console.error('Error fetching occupied rooms:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchRoomInvoices = async (roomId: string) => {
    try {
      const response = await fetch(`/api/invoices/by-room/${roomId}`)
      const result = await response.json()

      if (result.success) {
        setInvoices(result.data)
      } else {
        console.error('Failed to fetch room invoices:', result.error)
      }
    } catch (error) {
      console.error('Error fetching room invoices:', error)
    }
  }

  const handlePropertySelect = (propertyId: string) => {
    setSelectedPropertyId(propertyId)
    setSelectedRoomId('')
    setSelectedRoom(null)
  }

  const handleRoomSelect = (roomId: string) => {
    setSelectedRoomId(roomId)
    const room = occupiedRooms.find(r => r.id === roomId)
    setSelectedRoom(room || null)
  }

  const handleCreateCollection = () => {
    if (selectedRoom) {
      setCollectionFormOpen(true)
    }
  }

  const handleSaveInvoice = async (invoiceData: Partial<RentalInvoice>) => {
    try {
      // Add contract_id to the invoice data
      const fullInvoiceData = {
        ...invoiceData,
        contract_id: selectedRoom?.current_contract?.id,
      }

      const response = await fetch('/api/invoices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(fullInvoiceData),
      })

      const result = await response.json()

      if (result.success) {
        // Refresh invoices for current room
        if (selectedRoomId) {
          fetchRoomInvoices(selectedRoomId)
        }
        console.log('Saved invoice:', result.data)
      } else {
        console.error('Failed to save invoice:', result.error)
      }
    } catch (error) {
      console.error('Error saving invoice:', error)
    }
  }

  const handlePreviewInvoice = (invoice: RentalInvoice) => {
    setPreviewInvoice(invoice)
    setPreviewOpen(true)
  }

  const handleMarkPaid = async (invoiceId: string) => {
    try {
      const response = await fetch('/api/invoices', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: invoiceId,
          status: 'paid',
        }),
      })

      const result = await response.json()

      if (result.success) {
        // Update local state
        setInvoices(prev =>
          prev.map(inv =>
            inv.id === invoiceId ? { ...inv, status: 'paid' as const } : inv
          )
        )
      } else {
        console.error('Failed to mark invoice as paid:', result.error)
      }
    } catch (error) {
      console.error('Error marking invoice as paid:', error)
    }
  }

  const handleDeleteInvoice = async (invoiceId: string) => {
    try {
      const response = await fetch(`/api/invoices/${invoiceId}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (result.success) {
        // Update local state
        setInvoices(prev => prev.filter(inv => inv.id !== invoiceId))
      } else {
        console.error('Failed to delete invoice:', result.error)
      }
    } catch (error) {
      console.error('Error deleting invoice:', error)
    }
  }

  const getRoomInvoices = () => {
    return invoices
  }

  return (
    <>
      {/* Mobile Version */}
      <MobileInvoices
        occupiedRooms={occupiedRooms}
        invoices={invoices}
        selectedRoom={selectedRoom}
        collectionFormOpen={collectionFormOpen}
        previewInvoice={previewInvoice}
        previewOpen={previewOpen}
        onPropertySelect={handlePropertySelect}
        onRoomSelect={handleRoomSelect}
        onCreateCollection={handleCreateCollection}
        onSaveInvoice={handleSaveInvoice}
        onPreviewInvoice={handlePreviewInvoice}
        onMarkPaid={handleMarkPaid}
        onDeleteInvoice={handleDeleteInvoice}
        setCollectionFormOpen={setCollectionFormOpen}
        setPreviewOpen={setPreviewOpen}
      />

      {/* Desktop Version */}
      <div className="hidden md:block min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Simple Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-blue-600 dark:bg-blue-500 rounded-xl">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                Thu tiền phòng
              </h1>
              <p className="text-gray-600 dark:text-gray-400 text-sm md:text-base">
                Quản lý thu tiền và hóa đơn
              </p>
            </div>
          </div>

          {/* Search and Filter */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex flex-col lg:flex-row gap-4 items-start">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Tìm kiếm theo tên người thuê, số phòng, tên nhà..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white placeholder:text-gray-400 transition-all duration-200"
                />

                {/* Search Results Dropdown */}
                {searchTerm && filteredRooms.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl shadow-lg z-50 max-h-80 overflow-y-auto">
                    <div className="p-2">
                      <div className="text-xs text-gray-500 dark:text-gray-400 px-3 py-2 font-medium">
                        Tìm thấy {filteredRooms.length} kết quả:
                      </div>
                      {filteredRooms.slice(0, 8).map(room => (
                        <button
                          key={room.id}
                          onClick={() => {
                            setSelectedPropertyId(room.property.id)
                            setSelectedRoomId(room.id)
                            setSearchTerm('')
                          }}
                          className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors text-left"
                        >
                          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                            <UserCheck className="w-5 h-5 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-gray-900 dark:text-white truncate">
                              {room.current_contract?.tenant?.full_name ||
                                'Không có tên'}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                              Phòng {room.room_number} - {room.property.name}
                            </div>
                            <div className="text-xs text-blue-600 dark:text-blue-400">
                              {room.current_contract?.tenant?.phone ||
                                'Không có SĐT'}
                            </div>
                          </div>
                        </button>
                      ))}
                      {filteredRooms.length > 8 && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 px-3 py-2 text-center">
                          ... và {filteredRooms.length - 8} kết quả khác
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {searchTerm && filteredRooms.length === 0 && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl shadow-lg z-50">
                    <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                      <Search className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                      <div className="font-medium">Không tìm thấy kết quả</div>
                      <div className="text-sm">
                        Thử tìm kiếm với từ khóa khác
                      </div>
                    </div>
                  </div>
                )}
              </div>
              {searchTerm && (
                <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                  <span>
                    Hiển thị: {filteredRooms.length}/{occupiedRooms.length}{' '}
                    phòng
                  </span>
                  <button
                    onClick={() => setSearchTerm('')}
                    className="text-blue-500 hover:text-blue-700 font-medium"
                  >
                    Xóa bộ lọc
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Room Selection - Professional Design with Dark Mode */}
          <Card className="bg-white dark:bg-gray-800 border-0 shadow-xl rounded-2xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-700 dark:to-gray-600 border-b dark:border-gray-600">
              <CardTitle className="flex items-center gap-3 text-lg dark:text-white">
                <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl text-white">
                  <HomeIcon className="w-5 h-5" />
                </div>
                Chọn phòng và người thuê
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    Chọn nhà cho thuê
                  </Label>
                  <Select
                    value={selectedPropertyId}
                    onValueChange={handlePropertySelect}
                  >
                    <SelectTrigger className="h-12 border-2 border-gray-200 dark:border-gray-600 hover:border-blue-400 focus:border-blue-500 rounded-xl transition-colors dark:bg-gray-700 dark:text-white">
                      <SelectValue placeholder="Vui lòng chọn nhà cho thuê..." />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-0 shadow-lg dark:bg-gray-800 dark:border-gray-600">
                      {[
                        ...new Map(
                          filteredRooms.map(room => [
                            room.property.id,
                            room.property,
                          ])
                        ).values(),
                      ].map(property => (
                        <SelectItem
                          key={property.id}
                          value={property.id}
                          className="rounded-lg dark:text-white dark:hover:bg-gray-700"
                        >
                          <div className="flex items-center gap-3 p-1">
                            <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                              <Building2 className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                            </div>
                            <div>
                              <div className="font-medium">{property.name}</div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {property.address}
                              </div>
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedPropertyId && (
                  <div className="space-y-3">
                    <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                      <HomeIcon className="w-4 h-4" />
                      Chọn phòng
                    </Label>
                    <Select
                      value={selectedRoomId}
                      onValueChange={handleRoomSelect}
                    >
                      <SelectTrigger className="h-12 border-2 border-gray-200 dark:border-gray-600 hover:border-blue-400 focus:border-blue-500 rounded-xl transition-colors dark:bg-gray-700 dark:text-white">
                        <SelectValue placeholder="Vui lòng chọn phòng..." />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-0 shadow-lg dark:bg-gray-800 dark:border-gray-600">
                        {filteredRooms
                          .filter(
                            room => room.property.id === selectedPropertyId
                          )
                          .map(room => (
                            <SelectItem
                              key={room.id}
                              value={room.id}
                              className="rounded-lg dark:text-white dark:hover:bg-gray-700"
                            >
                              <div className="flex items-center gap-3 p-1">
                                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                                  <HomeIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div>
                                  <div className="font-medium">
                                    Phòng {room.room_number}
                                  </div>
                                  <div className="text-sm text-gray-500 dark:text-gray-400">
                                    {room.current_contract?.tenant.full_name}
                                  </div>
                                </div>
                              </div>
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {selectedRoom && (
                  <div className="space-y-3">
                    <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                      <UserCheck className="w-4 h-4" />
                      Thông tin người thuê
                    </Label>
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-2 border-green-200 dark:border-green-800 rounded-xl p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                          <UserCheck className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900 dark:text-white">
                            {selectedRoom.current_contract?.tenant.full_name}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {selectedRoom.current_contract?.tenant.phone}
                          </div>
                          <div className="text-xs text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-800 inline-block px-2 py-1 rounded-full mt-1">
                            Phòng {selectedRoom.room_number} -{' '}
                            {selectedRoom.property.name}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {selectedRoom && (
                <div className="flex gap-3 pt-6 border-t dark:border-gray-600 mt-6">
                  <Button
                    onClick={handleCreateCollection}
                    className="h-12 px-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    Tạo khoản thu mới
                  </Button>
                  <Button
                    variant="outline"
                    className="h-12 px-6 border-2 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl font-semibold transition-all duration-200 dark:text-gray-300"
                  >
                    <FileText className="w-5 h-5 mr-2" />
                    Xem lịch sử
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Collection List */}
          {selectedRoom && (
            <CollectionList
              room={selectedRoom}
              invoices={getRoomInvoices()}
              onEdit={handlePreviewInvoice}
              onDelete={handleDeleteInvoice}
              onMarkPaid={handleMarkPaid}
            />
          )}

          {/* Modals */}
          <CollectionFormModal
            isOpen={collectionFormOpen}
            onClose={() => setCollectionFormOpen(false)}
            room={selectedRoom as any}
            onSave={handleSaveInvoice}
          />

          {previewInvoice && (
            <InvoicePreviewModal
              isOpen={previewOpen}
              onClose={() => setPreviewOpen(false)}
              invoice={previewInvoice}
            />
          )}
        </div>
      </div>
    </>
  )
}
