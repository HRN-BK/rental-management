import { format, parseISO } from 'date-fns'
import { vi } from 'date-fns/locale'
import type { RentalInvoice } from '@/types/database'

interface SimpleInvoiceTemplateProps {
  invoice: RentalInvoice
}

export function SimpleInvoiceTemplate({ invoice }: SimpleInvoiceTemplateProps) {
  return (
    <div className="p-8 bg-white min-h-[600px] text-black">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          HÓA ĐƠN THUÊ PHÒNG
        </h1>
        <p className="text-gray-600">Mã hóa đơn: {invoice.invoice_number}</p>
      </div>

      {/* Company Info */}
      <div className="mb-8">
        <h2 className="font-semibold text-lg text-gray-900 mb-2">
          RentalPro - Quản lý cho thuê
        </h2>
        <p className="text-gray-600">
          Địa chỉ: {invoice.room?.property?.address}
        </p>
        <p className="text-gray-600">Điện thoại: 0123 456 789</p>
        <p className="text-gray-600">Email: contact@rentalpro.vn</p>
      </div>

      <div className="border-t border-gray-300 mb-6"></div>

      {/* Invoice Details */}
      <div className="grid grid-cols-2 gap-8 mb-8">
        {/* Bill To */}
        <div>
          <h3 className="font-semibold text-gray-900 mb-3">
            Thông tin khách thuê:
          </h3>
          <p className="text-gray-800 font-medium">
            {invoice.tenant?.full_name}
          </p>
          <p className="text-gray-600">{invoice.tenant?.phone}</p>
          <p className="text-gray-600">{invoice.tenant?.email}</p>
          <p className="text-gray-600">{invoice.tenant?.address}</p>
        </div>

        {/* Invoice Info */}
        <div>
          <h3 className="font-semibold text-gray-900 mb-3">
            Thông tin hóa đơn:
          </h3>
          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="text-gray-600">Ngày xuất:</span>
              <span className="text-gray-800">
                {format(parseISO(invoice.issue_date), 'dd/MM/yyyy', {
                  locale: vi,
                })}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Hạn thanh toán:</span>
              <span className="text-gray-800">
                {format(parseISO(invoice.due_date), 'dd/MM/yyyy', {
                  locale: vi,
                })}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Chu kì:</span>
              <span className="text-gray-800">
                {format(parseISO(invoice.period_start), 'MM/yyyy', {
                  locale: vi,
                })}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Room Info */}
      <div className="mb-8">
        <h3 className="font-semibold text-gray-900 mb-3">Thông tin phòng:</h3>
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-gray-600">
                Phòng:{' '}
                <span className="font-medium text-gray-900">
                  #{invoice.room?.room_number}
                </span>
              </p>
              <p className="text-gray-600">
                Diện tích:{' '}
                <span className="font-medium text-gray-900">
                  {invoice.room?.area_sqm}m²
                </span>
              </p>
            </div>
            <div>
              <p className="text-gray-600">
                Tầng:{' '}
                <span className="font-medium text-gray-900">
                  {invoice.room?.floor || 'N/A'}
                </span>
              </p>
              <p className="text-gray-600">
                Trạng thái:{' '}
                <span className="font-medium text-green-600">Đang thuê</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Chi tiết thanh toán */}
      <div className="mb-8 space-y-4">
        {/* Tiền Điện */}
        <div>
          <div className="font-semibold text-lg mb-2">Tiền Điện:</div>
          {invoice.electricity_previous_reading !== undefined &&
          invoice.electricity_current_reading !== undefined ? (
            <>
              <div className="ml-8">
                Chỉ số mới: {invoice.electricity_current_reading}
              </div>
              <div className="ml-8">
                Chỉ số cũ: {invoice.electricity_previous_reading} ={' '}
                {invoice.electricity_current_reading -
                  invoice.electricity_previous_reading}
                KW x {invoice.electricity_unit_price.toLocaleString('vi-VN')} ={' '}
                <span className="font-bold">
                  {invoice.electricity_amount.toLocaleString('vi-VN')}
                </span>
              </div>
            </>
          ) : (
            <div className="ml-8 font-bold">
              {invoice.electricity_amount.toLocaleString('vi-VN')}
            </div>
          )}
        </div>

        {/* Tiền Nước */}
        <div>
          <div className="font-semibold text-lg mb-2">Tiền Nước:</div>
          {invoice.water_previous_reading !== undefined &&
          invoice.water_current_reading !== undefined ? (
            <>
              <div className="ml-8">
                Chỉ số mới: {invoice.water_current_reading}
              </div>
              <div className="ml-8">
                Chỉ số cũ: {invoice.water_previous_reading} ={' '}
                {invoice.water_current_reading - invoice.water_previous_reading}
                m3 x {invoice.water_unit_price.toLocaleString('vi-VN')} ={' '}
                <span className="font-bold">
                  {invoice.water_amount.toLocaleString('vi-VN')}
                </span>
              </div>
            </>
          ) : (
            <div className="ml-8 font-bold">
              {invoice.water_amount.toLocaleString('vi-VN')}
            </div>
          )}
        </div>

        {/* Các khoản khác */}
        <div>
          <div className="font-semibold text-lg mb-2">Tiền Internet:</div>
          <div className="ml-8 font-bold text-right">
            {invoice.internet_amount.toLocaleString('vi-VN')}
          </div>
        </div>

        <div>
          <div className="font-semibold text-lg mb-2">Tiền Rác:</div>
          <div className="ml-8 font-bold text-right">
            {invoice.trash_amount.toLocaleString('vi-VN')}
          </div>
        </div>

        <div>
          <div className="font-semibold text-lg mb-2">
            Tiền phòng ({format(parseISO(invoice.period_start), 'dd-MM-yyyy')}{' '}
            đến {format(parseISO(invoice.period_end), 'dd-MM-yyyy')}):
          </div>
          <div className="ml-8 font-bold text-right">
            {invoice.rent_amount.toLocaleString('vi-VN')}
          </div>
        </div>
      </div>

      {/* Total */}
      <div className="flex justify-end mb-8">
        <div className="w-72">
          <div className="flex justify-between py-2 border-t border-gray-300">
            <span className="font-semibold text-gray-900">TỔNG CỘNG:</span>
            <span className="font-bold text-lg text-gray-900">
              {invoice.total_amount.toLocaleString('vi-VN')} VNĐ
            </span>
          </div>
          <p className="text-sm text-gray-600 mt-2 text-right">
            (Bằng chữ: {numberToWords(invoice.total_amount)} đồng)
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-gray-300 pt-4">
        <div className="grid grid-cols-2 gap-8">
          <div>
            <p className="text-sm text-gray-600 mb-4">Lưu ý:</p>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Vui lòng thanh toán đúng hạn</li>
              <li>• Liên hệ 0123 456 789 nếu có thắc mắc</li>
              <li>• Giữ hóa đơn để làm bằng chứng thanh toán</li>
            </ul>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">
              TP.HCM, ngày{' '}
              {format(parseISO(invoice.issue_date), 'dd', { locale: vi })} tháng{' '}
              {format(parseISO(invoice.issue_date), 'MM', { locale: vi })} năm{' '}
              {format(parseISO(invoice.issue_date), 'yyyy', { locale: vi })}
            </p>
            <p className="font-semibold text-gray-900 mt-8">
              Người xuất hóa đơn
            </p>
            <p className="text-sm text-gray-600 mt-12">(Ký và ghi rõ họ tên)</p>
          </div>
        </div>
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
