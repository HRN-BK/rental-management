'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { format, parseISO } from 'date-fns'
import {
  ChevronDown,
  ChevronRight,
  Calendar,
  Check,
  X,
  Zap,
  Droplet,
  Home,
  DollarSign,
  AlertCircle,
  Edit,
  Trash2,
  FileText,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { RentalInvoice, Room, Tenant } from '@/types/database'

interface CollectionListProps {
  room?: Room & {
    property?: { name: string; address: string }
    current_contract?: {
      tenant?: Tenant
      monthly_rent: number
    }
  }
  invoices: RentalInvoice[]
  onEdit?: (invoice: RentalInvoice) => void
  onDelete?: (invoiceId: string) => void
  onMarkPaid?: (invoiceId: string) => void
}

export function CollectionList({
  room,
  invoices = [],
  onEdit,
  onDelete,
  onMarkPaid,
}: CollectionListProps) {
  const router = useRouter()
  const [expandedInvoices, setExpandedInvoices] = useState<Set<string>>(
    new Set()
  )

  const toggleExpanded = (invoiceId: string) => {
    const newExpanded = new Set(expandedInvoices)
    if (newExpanded.has(invoiceId)) {
      newExpanded.delete(invoiceId)
    } else {
      newExpanded.add(invoiceId)
    }
    setExpandedInvoices(newExpanded)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200">
            <Check className="w-3 h-3 mr-1" />
            ĐÃ THANH TOÁN
          </Badge>
        )
      case 'overdue':
        return (
          <Badge className="bg-red-100 text-red-800 border-red-200">
            <AlertCircle className="w-3 h-3 mr-1" />
            QUÁ HẠN
          </Badge>
        )
      default:
        return (
          <Badge className="bg-rose-100 text-rose-800 border-rose-200">
            <X className="w-3 h-3 mr-1" />
            CHƯA THANH TOÁN
          </Badge>
        )
    }
  }

  const getTotalUnpaid = () => {
    return invoices
      .filter(invoice => invoice.status !== 'paid')
      .reduce((total, invoice) => total + invoice.total_amount, 0)
  }

  const handlePrintReceipt = (invoice: RentalInvoice) => {
    // Navigate to receipts page with pre-selected invoice
    const url = new URL('/receipts', window.location.origin)
    url.searchParams.set('invoiceId', invoice.id)
    url.searchParams.set('roomId', invoice.room_id || '')
    router.push(url.pathname + url.search)
  }

  if (!room?.current_contract?.tenant) {
    return (
      <Card className="p-6">
        <p className="text-gray-600 text-center">
          Phòng này chưa có người thuê.
        </p>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header statistics - Professional Design */}
      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl rounded-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                <DollarSign className="w-7 h-7" />
              </div>
              <div>
                <h2 className="text-xl font-bold mb-1">Danh sách thu tiền</h2>
                <p className="text-orange-100 text-sm">
                  Phòng {room?.room_number} -{' '}
                  {room?.current_contract?.tenant?.full_name}
                </p>
              </div>
            </div>

            {getTotalUnpaid() > 0 && (
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4">
                <div className="text-center">
                  <AlertCircle className="w-8 h-8 mx-auto mb-2 text-yellow-300" />
                  <p className="text-xs text-orange-100 uppercase tracking-wide mb-1">
                    Tổng nợ
                  </p>
                  <p className="text-2xl font-bold">
                    {getTotalUnpaid().toLocaleString('vi-VN')} đ
                  </p>
                  <div className="bg-red-400/80 text-white text-xs px-3 py-1 rounded-full mt-2 font-medium">
                    CHƪ TH. TOÁN
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Danh sách hóa đơn */}
      {invoices.length === 0 ? (
        <Card className="p-8">
          <div className="text-center text-gray-500">
            <DollarSign className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>Chưa có hóa đơn nào được tạo</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {invoices.map(invoice => {
            const isExpanded = expandedInvoices.has(invoice.id)

            return (
              <Card
                key={invoice.id}
                className={`transition-all duration-200 ${
                  invoice.status === 'paid'
                    ? 'bg-green-50 border-green-200'
                    : invoice.status === 'overdue'
                      ? 'bg-red-50 border-red-200'
                      : 'bg-blue-50 border-blue-200'
                }`}
              >
                {/* Header row */}
                <div className="p-4">
                  <div
                    className="flex items-center justify-between cursor-pointer"
                    onClick={() => toggleExpanded(invoice.id)}
                  >
                    <div className="flex items-center gap-3">
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-gray-500" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-gray-500" />
                      )}
                      <Calendar className="w-5 h-5 text-blue-600" />
                      <div>
                        <p className="font-semibold text-gray-900">
                          Kỳ:{' '}
                          {format(parseISO(invoice.period_start), 'yyyy-MM-dd')}{' '}
                          đến{' '}
                          {format(parseISO(invoice.period_end), 'yyyy-MM-dd')}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-lg font-bold text-cyan-600">
                          {invoice.total_amount.toLocaleString('vi-VN')} VNĐ
                        </p>
                        <ChevronDown className="w-4 h-4 text-cyan-600 inline ml-2" />
                        <Edit className="w-4 h-4 text-gray-400 inline ml-1" />
                      </div>
                      {getStatusBadge(invoice.status)}
                    </div>
                  </div>

                  {/* Expanded details */}
                  {isExpanded && (
                    <div className="mt-4 space-y-3 border-t pt-4">
                      {/* Chi tiết các khoản */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {/* Tiền điện */}
                        {invoice.electricity_amount > 0 && (
                          <div className="flex items-center justify-between p-2 bg-white rounded border">
                            <div className="flex items-center gap-2">
                              <Zap className="w-4 h-4 text-orange-500" />
                              <span className="text-sm">
                                Tiền điện
                                {invoice.electricity_previous_reading !==
                                  undefined &&
                                  invoice.electricity_current_reading !==
                                    undefined &&
                                  ` (${invoice.electricity_previous_reading} → ${invoice.electricity_current_reading} kWh)`}
                              </span>
                            </div>
                            <div className="text-right">
                              <p className="font-medium">
                                {invoice.electricity_amount.toLocaleString(
                                  'vi-VN'
                                )}{' '}
                                VNĐ
                              </p>
                              {getStatusBadge(invoice.status)}
                              <div className="flex gap-1 mt-1">
                                <Check className="w-3 h-3 text-gray-400" />
                                <Trash2 className="w-3 h-3 text-gray-400" />
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Tiền nước */}
                        {invoice.water_amount > 0 && (
                          <div className="flex items-center justify-between p-2 bg-white rounded border">
                            <div className="flex items-center gap-2">
                              <Droplet className="w-4 h-4 text-blue-500" />
                              <span className="text-sm">
                                Tiền nước
                                {invoice.water_previous_reading !== undefined &&
                                  invoice.water_current_reading !== undefined &&
                                  ` (${invoice.water_previous_reading} → ${invoice.water_current_reading} m³)`}
                              </span>
                            </div>
                            <div className="text-right">
                              <p className="font-medium">
                                {invoice.water_amount.toLocaleString('vi-VN')}{' '}
                                VNĐ
                              </p>
                              {getStatusBadge(invoice.status)}
                              <div className="flex gap-1 mt-1">
                                <Check className="w-3 h-3 text-gray-400" />
                                <Trash2 className="w-3 h-3 text-gray-400" />
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Tiền phòng */}
                        {invoice.rent_amount > 0 && (
                          <div className="flex items-center justify-between p-2 bg-white rounded border">
                            <div className="flex items-center gap-2">
                              <Home className="w-4 h-4 text-green-500" />
                              <span className="text-sm">Tiền phòng</span>
                            </div>
                            <div className="text-right">
                              <p className="font-medium">
                                {invoice.rent_amount.toLocaleString('vi-VN')}{' '}
                                VNĐ
                              </p>
                              {getStatusBadge(invoice.status)}
                              <div className="flex gap-1 mt-1">
                                <Check className="w-3 h-3 text-gray-400" />
                                <Trash2 className="w-3 h-3 text-gray-400" />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div className="flex gap-2 justify-end pt-2 border-t">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-blue-600 border-blue-300 hover:bg-blue-50"
                          onClick={() => handlePrintReceipt(invoice)}
                        >
                          <FileText className="w-4 h-4 mr-1" />
                          In biên lai
                        </Button>

                        {invoice.status !== 'paid' && (
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => onMarkPaid?.(invoice.id)}
                          >
                            <Check className="w-4 h-4 mr-1" />
                            Đánh dấu đã thanh toán
                          </Button>
                        )}

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onEdit?.(invoice)}
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Sửa
                        </Button>

                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 border-red-300 hover:bg-red-50"
                          onClick={() => onDelete?.(invoice.id)}
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Xóa
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
