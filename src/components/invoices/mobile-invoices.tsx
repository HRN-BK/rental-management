'use client'

import { useState } from 'react'
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

interface MobileInvoicesProps {
  occupiedRooms: OccupiedRoom[]
  invoices: RentalInvoice[]
  selectedRoom: OccupiedRoom | null
  collectionFormOpen: boolean
  previewInvoice: RentalInvoice | null
  previewOpen: boolean
  onPropertySelect: (propertyId: string) => void
  onRoomSelect: (roomId: string) => void
  onCreateCollection: () => void
  onSaveInvoice: (invoiceData: Partial<RentalInvoice>) => Promise<void>
  onPreviewInvoice: (invoice: RentalInvoice) => void
  onMarkPaid: (invoiceId: string) => Promise<void>
  onDeleteInvoice: (invoiceId: string) => Promise<void>
  setCollectionFormOpen: (open: boolean) => void
  setPreviewOpen: (open: boolean) => void
}

export function MobileInvoices({
  occupiedRooms,
  invoices,
  selectedRoom,
  collectionFormOpen,
  previewInvoice,
  previewOpen,
  onPropertySelect,
  onRoomSelect,
  onCreateCollection,
  onSaveInvoice,
  onPreviewInvoice,
  onMarkPaid,
  onDeleteInvoice,
  setCollectionFormOpen,
  setPreviewOpen,
}: MobileInvoicesProps) {
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('')
  const [selectedRoomId, setSelectedRoomId] = useState<string>('')
  const [searchTerm, setSearchTerm] = useState('')

  const handlePropertySelect = (propertyId: string) => {
    setSelectedPropertyId(propertyId)
    setSelectedRoomId('')
    onPropertySelect(propertyId)
  }

  const handleRoomSelect = (roomId: string) => {
    setSelectedRoomId(roomId)
    onRoomSelect(roomId)
  }

  // Filter rooms based on search term (tenant name)
  const filteredRooms = occupiedRooms.filter(room => {
    if (!searchTerm.trim()) return true
    const tenantName = room.current_contract?.tenant.full_name.toLowerCase()
    const roomNumber = room.room_number.toLowerCase()
    const propertyName = room.property.name.toLowerCase()
    const search = searchTerm.toLowerCase()

    return (
      tenantName?.includes(search) ||
      roomNumber.includes(search) ||
      propertyName.includes(search)
    )
  })

  const uniqueProperties = [
    ...new Map(
      filteredRooms.map(room => [room.property.id, room.property])
    ).values(),
  ]

  return (
    <div className="md:hidden flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 pt-12">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <FileText className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              Thu tiền phòng
            </h1>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Tìm kiếm theo tên người thuê..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-4">
        {/* Room Selection Card */}
        <Card className="mb-4">
          <CardHeader className="p-4 pb-3">
            <CardTitle className="flex items-center gap-3 text-base">
              <div className="p-1.5 bg-blue-600 rounded-lg text-white">
                <HomeIcon className="w-4 h-4" />
              </div>
              Chọn phòng và người thuê
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="space-y-4">
              {/* Property Selection */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <Building2 className="w-3 h-3" />
                  Chọn nhà cho thuê
                </Label>
                <Select
                  value={selectedPropertyId}
                  onValueChange={handlePropertySelect}
                >
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Vui lòng chọn nhà cho thuê..." />
                  </SelectTrigger>
                  <SelectContent>
                    {uniqueProperties.map(property => (
                      <SelectItem key={property.id} value={property.id}>
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-purple-600" />
                          <div>
                            <div className="font-medium">{property.name}</div>
                            <div className="text-sm text-gray-500">
                              {property.address}
                            </div>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Room Selection */}
              {selectedPropertyId && (
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <HomeIcon className="w-3 h-3" />
                    Chọn phòng
                  </Label>
                  <Select
                    value={selectedRoomId}
                    onValueChange={handleRoomSelect}
                  >
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder="Vui lòng chọn phòng..." />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredRooms
                        .filter(room => room.property.id === selectedPropertyId)
                        .map(room => (
                          <SelectItem key={room.id} value={room.id}>
                            <div className="flex items-center gap-2">
                              <HomeIcon className="w-4 h-4 text-blue-600" />
                              <div>
                                <div className="font-medium">
                                  Phòng {room.room_number}
                                </div>
                                <div className="text-sm text-gray-500">
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

              {/* Selected Room Info */}
              {selectedRoom && (
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <UserCheck className="w-3 h-3" />
                    Thông tin người thuê
                  </Label>
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                        <UserCheck className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900 dark:text-white">
                          {selectedRoom.current_contract?.tenant.full_name}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {selectedRoom.current_contract?.tenant.phone}
                        </div>
                        <div className="text-xs text-green-600 bg-green-100 dark:bg-green-800 inline-block px-2 py-1 rounded-full mt-1">
                          Phòng {selectedRoom.room_number} -{' '}
                          {selectedRoom.property.name}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Button */}
              {selectedRoom && (
                <div className="pt-3 border-t">
                  <Button
                    onClick={onCreateCollection}
                    className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Tạo khoản thu mới
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Collection List */}
        {selectedRoom && (
          <CollectionList
            room={selectedRoom}
            invoices={invoices}
            onEdit={onPreviewInvoice}
            onDelete={onDeleteInvoice}
            onMarkPaid={onMarkPaid}
          />
        )}

        {!selectedRoom && (
          <div className="text-center py-16">
            <FileText className="w-20 h-20 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Chọn phòng để bắt đầu
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              Vui lòng chọn nhà và phòng để tạo khoản thu
            </p>
          </div>
        )}
      </div>

      {/* Modals */}
      <CollectionFormModal
        isOpen={collectionFormOpen}
        onClose={() => setCollectionFormOpen(false)}
        room={selectedRoom as any}
        onSave={onSaveInvoice}
      />

      {previewInvoice && (
        <InvoicePreviewModal
          isOpen={previewOpen}
          onClose={() => setPreviewOpen(false)}
          invoice={previewInvoice}
        />
      )}
    </div>
  )
}
