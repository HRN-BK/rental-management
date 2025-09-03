'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { UtilityCard } from '@/components/utilities/utility-card'
import { UtilityFormModal } from '@/components/utilities/utility-form-modal'
import { UtilityBillFormModal } from '@/components/utilities/utility-bill-form-modal'
import { ArrowLeft, Plus, Building2, AlertCircle } from 'lucide-react'
import type { Property, Utility, UtilityBill } from '@/types/database'

// Mock data - replace with real API calls
const mockProperty: Property = {
  id: '1',
  name: 'Bạch Đằng, P.Gia Định - TpHCM',
  address: '325/16/9 đường Bạch Đằng, Phường Gia Định - Tp.HCM.',
  city: 'Ho Chi Minh City',
  total_rooms: 8,
  occupied_rooms: 6,
  available_rooms: 2,
  occupancy_percentage: 75,
  status: 'active',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}

const mockUtilities: Utility[] = [
  {
    id: '1',
    property_id: '1',
    name: 'Tiền Điện',
    type: 'electricity',
    provider: 'Công ty Điện Lực Gia Định',
    customer_code: 'PE0400072448',
    monthly_due_date: 2,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '2',
    property_id: '1',
    name: 'Tiền Nước',
    type: 'water',
    provider: 'Công ty Cổ phần Cấp Nước Gia Định',
    customer_code: '1423461705',
    monthly_due_date: 25,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '3',
    property_id: '1',
    name: 'Tiền Rác',
    type: 'trash',
    provider: '-',
    monthly_due_date: undefined,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '4',
    property_id: '1',
    name: 'Internet',
    type: 'internet',
    provider: 'FPT Telecom',
    customer_code: 'SGD299902',
    monthly_due_date: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '5',
    property_id: '1',
    name: 'Điện Thoại',
    type: 'tv',
    provider: 'VNPT',
    customer_code: '02838404068',
    monthly_due_date: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '6',
    property_id: '1',
    name: 'Truyền Hình',
    type: 'tv',
    provider: 'SCTV',
    customer_code: '18056031A',
    monthly_due_date: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
]

export default function PropertyUtilitiesPage() {
  const params = useParams()
  const [property, setProperty] = useState<Property | null>(null)
  const [utilities, setUtilities] = useState<Utility[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [utilityFormModal, setUtilityFormModal] = useState<{
    isOpen: boolean
    utility?: Utility
  }>({ isOpen: false })
  const [billFormModal, setBillFormModal] = useState<{
    isOpen: boolean
    utility?: Utility
    bill?: UtilityBill
  }>({ isOpen: false })

  useEffect(() => {
    // Mock loading data
    setTimeout(() => {
      setProperty(mockProperty)
      setUtilities(mockUtilities)
      setIsLoading(false)
    }, 500)
  }, [params.id])

  const handleEditUtility = (utility: Utility) => {
    setUtilityFormModal({ isOpen: true, utility })
  }

  const handleAddBill = (utility: Utility) => {
    setBillFormModal({ isOpen: true, utility })
  }

  const handleAddUtility = () => {
    setUtilityFormModal({ isOpen: true })
  }

  const handleUtilityFormSubmit = async (data: Partial<Utility>) => {
    try {
      console.log('Submitting utility:', data)
      // TODO: Call API to save utility

      // Update local state (mock)
      if (utilityFormModal.utility) {
        // Edit existing utility
        setUtilities(prev =>
          prev.map(u =>
            u.id === utilityFormModal.utility?.id
              ? { ...u, ...data, updated_at: new Date().toISOString() }
              : u
          )
        )
      } else {
        // Add new utility
        const newUtility: Utility = {
          id: Date.now().toString(),
          property_id: params.id as string,
          name: data.name!,
          type: data.type!,
          provider: data.provider || '',
          customer_code: data.customer_code || '',
          monthly_due_date: data.monthly_due_date,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
        setUtilities(prev => [...prev, newUtility])
      }

      setUtilityFormModal({ isOpen: false })
    } catch (error) {
      console.error('Error saving utility:', error)
    }
  }

  const handleBillFormSubmit = async (data: Partial<UtilityBill>) => {
    try {
      console.log('Submitting bill:', data)
      // TODO: Call API to save bill

      setBillFormModal({ isOpen: false })
    } catch (error) {
      console.error('Error saving bill:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">
            Đang tải thông tin...
          </p>
        </div>
      </div>
    )
  }

  if (!property) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Không tìm thấy nhà cho thuê
          </h2>
          <Link href="/properties">
            <Button>Quay lại danh sách</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/properties">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Quay lại
                </Button>
              </Link>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {property.name}
                  </h1>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Quản lý tiện ích và dịch vụ
                  </p>
                </div>
              </div>
            </div>
            <Button
              onClick={handleAddUtility}
              className="bg-blue-500 hover:bg-blue-600"
            >
              <Plus className="w-4 h-4 mr-2" />
              Thêm Dịch Vụ
            </Button>
          </div>
        </div>
      </div>

      {/* Property Info */}
      <div className="p-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 mb-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-teal-600 dark:text-teal-400 mb-3">
            {property.name}
          </h2>
          <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <div>
              <span className="font-semibold text-gray-700 dark:text-gray-300">
                Địa chỉ:
              </span>
              <span className="ml-2">{property.address}</span>
            </div>
            <div>
              <span className="font-semibold text-gray-700 dark:text-gray-300">
                Ghi chú:
              </span>
              <span className="ml-2">Tất cả dịch vụ tiện ích của nhà</span>
            </div>
          </div>
        </div>

        {/* Utilities Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {utilities.map(utility => (
            <UtilityCard
              key={utility.id}
              utility={utility}
              onEdit={handleEditUtility}
              onAddBill={handleAddBill}
            />
          ))}
        </div>

        {/* Empty State */}
        {utilities.length === 0 && (
          <div className="text-center py-12">
            <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Chưa có dịch vụ tiện ích
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              Bắt đầu bằng cách thêm dịch vụ đầu tiên cho nhà này.
            </p>
            <Button
              onClick={handleAddUtility}
              className="bg-blue-500 hover:bg-blue-600"
            >
              <Plus className="w-4 h-4 mr-2" />
              Thêm Dịch Vụ Đầu Tiên
            </Button>
          </div>
        )}
      </div>

      {/* Modals */}
      <UtilityFormModal
        isOpen={utilityFormModal.isOpen}
        onClose={() => setUtilityFormModal({ isOpen: false })}
        onSubmit={handleUtilityFormSubmit}
        utility={utilityFormModal.utility}
        propertyId={params.id as string}
      />

      {billFormModal.utility && (
        <UtilityBillFormModal
          isOpen={billFormModal.isOpen}
          onClose={() => setBillFormModal({ isOpen: false })}
          onSubmit={handleBillFormSubmit}
          utility={billFormModal.utility}
          bill={billFormModal.bill}
        />
      )}
    </div>
  )
}
