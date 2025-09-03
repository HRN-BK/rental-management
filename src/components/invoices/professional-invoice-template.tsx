import { format, parseISO } from 'date-fns'
import { vi } from 'date-fns/locale'
import { Home, Phone, Mail, MapPin, Calendar, DollarSign } from 'lucide-react'
import type { RentalInvoice } from '@/types/database'

interface ProfessionalInvoiceTemplateProps {
  invoice: RentalInvoice
}

export function ProfessionalInvoiceTemplate({
  invoice,
}: ProfessionalInvoiceTemplateProps) {
  return (
    <div className="p-8 bg-white min-h-[700px] text-black">
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
              <Home className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">RentalPro</h1>
              <p className="text-blue-600 text-sm font-medium">
                Quản lý cho thuê chuyên nghiệp
              </p>
            </div>
          </div>
          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              <span>{invoice.room?.property?.address}</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4" />
              <span>0123 456 789</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              <span>contact@rentalpro.vn</span>
            </div>
          </div>
        </div>

        <div className="text-right">
          <h2 className="text-3xl font-bold text-blue-600 mb-2">HÓA ĐƠN</h2>
          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-sm text-gray-600">Mã hóa đơn</p>
            <p className="font-mono font-bold text-lg text-blue-700">
              {invoice.invoice_number}
            </p>
          </div>
        </div>
      </div>

      {/* Invoice Details */}
      <div className="grid grid-cols-2 gap-8 mb-8">
        {/* Bill To */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">KH</span>
            </div>
            Thông tin khách thuê
          </h3>
          <div className="space-y-2">
            <p className="text-gray-900 font-semibold text-lg">
              {invoice.tenant?.full_name}
            </p>
            <div className="flex items-center gap-2 text-gray-600">
              <Phone className="w-4 h-4" />
              <span>{invoice.tenant?.phone}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Mail className="w-4 h-4" />
              <span>{invoice.tenant?.email}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <MapPin className="w-4 h-4" />
              <span>{invoice.tenant?.address}</span>
            </div>
          </div>
        </div>

        {/* Invoice Info */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-700">
                  Ngày xuất
                </span>
              </div>
              <p className="font-bold text-gray-900">
                {format(parseISO(invoice.issue_date), 'dd/MM/yyyy', {
                  locale: vi,
                })}
              </p>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4 text-orange-600" />
                <span className="text-sm font-medium text-orange-700">
                  Hạn thanh toán
                </span>
              </div>
              <p className="font-bold text-gray-900">
                {format(parseISO(invoice.due_date), 'dd/MM/yyyy', {
                  locale: vi,
                })}
              </p>
            </div>
          </div>

          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-4 h-4 text-purple-600" />
              <span className="text-sm font-medium text-purple-700">
                Chu kì thanh toán
              </span>
            </div>
            <p className="font-bold text-gray-900">
              {format(parseISO(invoice.period_start), 'dd/MM/yyyy', {
                locale: vi,
              })}{' '}
              -{' '}
              {format(parseISO(invoice.period_end), 'dd/MM/yyyy', {
                locale: vi,
              })}
            </p>
          </div>
        </div>
      </div>

      {/* Room Info */}
      <div className="mb-8">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Home className="w-5 h-5 text-blue-600" />
          Thông tin phòng thuê
        </h3>
        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-6 rounded-lg border border-blue-100">
          <div className="grid grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Home className="w-8 h-8 text-blue-600" />
              </div>
              <p className="text-sm text-gray-600">Phòng</p>
              <p className="font-bold text-xl text-blue-700">
                #{invoice.room?.room_number}
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-green-600 font-bold text-lg">
                  {invoice.room?.area_sqm}
                </span>
              </div>
              <p className="text-sm text-gray-600">Diện tích</p>
              <p className="font-bold text-xl text-green-700">
                {invoice.room?.area_sqm}m²
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-purple-600 font-bold text-sm">
                  {invoice.room?.floor || 'GF'}
                </span>
              </div>
              <p className="text-sm text-gray-600">Tầng</p>
              <p className="font-bold text-xl text-purple-700">
                {invoice.room?.floor || 'N/A'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Invoice Items */}
      <div className="mb-8">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-green-600" />
          Chi tiết thanh toán
        </h3>
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white">
                <th className="p-4 text-left font-semibold">Mô tả dịch vụ</th>
                <th className="p-4 text-center font-semibold">Số lượng</th>
                <th className="p-4 text-right font-semibold">Đơn giá</th>
                <th className="p-4 text-right font-semibold">Thành tiền</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-100 hover:bg-gray-50">
                <td className="p-4">
                  <div>
                    <p className="font-medium text-gray-900">
                      Tiền thuê phòng {invoice.room?.room_number}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      Chu kì:{' '}
                      {format(parseISO(invoice.period_start), 'dd/MM/yyyy', {
                        locale: vi,
                      })}{' '}
                      -{' '}
                      {format(parseISO(invoice.period_end), 'dd/MM/yyyy', {
                        locale: vi,
                      })}
                    </p>
                    <p className="text-xs text-blue-600 mt-1">
                      🏠 Diện tích: {invoice.room?.area_sqm}m² • Tầng:{' '}
                      {invoice.room?.floor || 'N/A'}
                    </p>
                  </div>
                </td>
                <td className="p-4 text-center">
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm font-medium">
                    1 tháng
                  </span>
                </td>
                <td className="p-4 text-right font-medium text-gray-900">
                  {invoice.rent_amount.toLocaleString('vi-VN')} VNĐ
                </td>
                <td className="p-4 text-right font-bold text-blue-600">
                  {invoice.rent_amount.toLocaleString('vi-VN')} VNĐ
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Total */}
      <div className="flex justify-end mb-8">
        <div className="w-80">
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-lg border border-green-200">
            <div className="flex justify-between items-center mb-2">
              <span className="font-semibold text-gray-700">Tổng phụ:</span>
              <span className="font-medium text-gray-900">
                {invoice.rent_amount.toLocaleString('vi-VN')} VNĐ
              </span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="font-semibold text-gray-700">
                Thuế VAT (0%):
              </span>
              <span className="font-medium text-gray-900">0 VNĐ</span>
            </div>
            <div className="border-t border-green-200 pt-3 mt-3">
              <div className="flex justify-between items-center">
                <span className="font-bold text-lg text-gray-900">
                  TỔNG CỘNG:
                </span>
                <span className="font-bold text-2xl text-green-600">
                  {invoice.total_amount.toLocaleString('vi-VN')} VNĐ
                </span>
              </div>
              <p className="text-sm text-gray-600 mt-2 text-right italic">
                (Bằng chữ: {numberToWords(invoice.total_amount)} đồng)
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Info & Footer */}
      <div className="grid grid-cols-2 gap-8 mt-8 pt-6 border-t border-gray-200">
        <div>
          <h4 className="font-semibold text-gray-900 mb-3">
            Thông tin thanh toán:
          </h4>
          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <ul className="text-sm text-gray-700 space-y-2">
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                Thanh toán bằng tiền mặt hoặc chuyển khoản
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                Vui lòng thanh toán đúng hạn để tránh phí trễ hạn
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                Liên hệ 0123 456 789 nếu có thắc mắc
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                Giữ lại hóa đơn để làm bằng chứng thanh toán
              </li>
            </ul>
          </div>
        </div>

        <div className="text-center">
          <p className="text-sm text-gray-600 mb-6">
            TP.HCM, ngày{' '}
            {format(parseISO(invoice.issue_date), 'dd', { locale: vi })} tháng{' '}
            {format(parseISO(invoice.issue_date), 'MM', { locale: vi })} năm{' '}
            {format(parseISO(invoice.issue_date), 'yyyy', { locale: vi })}
          </p>
          <div className="bg-blue-50 p-4 rounded-lg inline-block">
            <p className="font-semibold text-gray-900 mb-8">
              Người xuất hóa đơn
            </p>
            <div className="border-t border-blue-200 pt-2">
              <p className="text-sm text-blue-600">(Ký và ghi rõ họ tên)</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom branding */}
      <div className="text-center mt-8 pt-4 border-t border-gray-100">
        <p className="text-xs text-gray-400">
          Được tạo bởi RentalPro - Hệ thống quản lý cho thuê chuyên nghiệp
        </p>
      </div>
    </div>
  )
}

// Helper function to convert number to Vietnamese words (basic implementation)
function numberToWords(num: number): string {
  const ones = [
    '',
    'một',
    'hai',
    'ba',
    'bốn',
    'năm',
    'sáu',
    'bảy',
    'tám',
    'chín',
    'mười',
    'mười một',
    'mười hai',
    'mười ba',
    'mười bốn',
    'mười lăm',
    'mười sáu',
    'mười bảy',
    'mười tám',
    'mười chín',
  ]

  const tens = [
    '',
    '',
    'hai mười',
    'ba mười',
    'bốn mười',
    'năm mười',
    'sáu mười',
    'bảy mười',
    'tám mười',
    'chín mười',
  ]

  if (num < 20) return ones[num]
  if (num < 100)
    return (
      tens[Math.floor(num / 10)] + (num % 10 !== 0 ? ' ' + ones[num % 10] : '')
    )
  if (num < 1000)
    return (
      ones[Math.floor(num / 100)] +
      ' trăm' +
      (num % 100 !== 0 ? ' ' + numberToWords(num % 100) : '')
    )
  if (num < 1000000)
    return (
      numberToWords(Math.floor(num / 1000)) +
      ' nghìn' +
      (num % 1000 !== 0 ? ' ' + numberToWords(num % 1000) : '')
    )
  if (num < 1000000000)
    return (
      numberToWords(Math.floor(num / 1000000)) +
      ' triệu' +
      (num % 1000000 !== 0 ? ' ' + numberToWords(num % 1000000) : '')
    )

  return num.toLocaleString('vi-VN')
}
