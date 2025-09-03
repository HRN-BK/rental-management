'use client'

import React, { forwardRef } from 'react'
import type { RentalInvoice } from '@/types/database'
import type { ColorTheme } from './color-picker'

interface ReceiptTemplateProps {
  invoice: RentalInvoice
  roomInfo?: {
    name: string
    address?: string
  }
  tenantInfo?: {
    name: string
  }
  propertyInfo?: {
    name: string
    address: string
  }
  colorTheme?: 'green' | 'blue' // Keep for backward compatibility
  customColorTheme?: Partial<ColorTheme> // New advanced color system
}

const ReceiptTemplate = forwardRef<HTMLDivElement, ReceiptTemplateProps>(
  (
    { invoice, roomInfo, propertyInfo, colorTheme = 'green', customColorTheme },
    ref
  ) => {
    // Format currency in VND
    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat('vi-VN').format(amount)
    }

    // Format date
    const formatDate = (dateString: string) => {
      return new Date(dateString).toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    }

    // Calculate electricity usage
    const electricityUsage =
      (invoice.electricity_current_reading || 0) -
      (invoice.electricity_previous_reading || 0)

    // Calculate water usage
    const waterUsage =
      (invoice.water_current_reading || 0) -
      (invoice.water_previous_reading || 0)

    // Theme colors - Priority: 1) Invoice color settings, 2) Custom theme prop, 3) Legacy theme prop
    const getTheme = () => {
      // First check if invoice has saved color settings
      if (invoice.color_settings) {
        return {
          headerBg: invoice.color_settings.header_bg || '#86efac',
          headerText: invoice.color_settings.header_text || '#166534',
          totalBg: invoice.color_settings.total_bg || '#bbf7d0',
          totalText: invoice.color_settings.total_text || '#14532d',
        }
      }

      // Then check custom theme prop
      if (customColorTheme) {
        return {
          headerBg: customColorTheme.header_bg || '#86efac',
          headerText: customColorTheme.header_text || '#166534',
          totalBg: customColorTheme.total_bg || '#bbf7d0',
          totalText: customColorTheme.total_text || '#14532d',
        }
      }

      // Finally fall back to legacy color theme
      return colorTheme === 'green'
        ? {
            headerBg: '#86efac',
            headerText: '#166534',
            totalBg: '#bbf7d0',
            totalText: '#14532d',
          }
        : {
            headerBg: '#93c5fd',
            headerText: '#1e3a8a',
            totalBg: '#bfdbfe',
            totalText: '#1e3a8a',
          }
    }

    const theme = getTheme()

    return (
      <div
        ref={ref}
        className="bg-white p-6 sm:p-8 max-w-3xl mx-auto shadow-lg print:shadow-none"
        style={{
          fontFamily: 'Arial, sans-serif',
          minHeight: 'fit-content',
          width: '100%',
          boxSizing: 'border-box',
        }}
        id="receipt-template"
      >
        {/* Header with themed background */}
        <div
          className="rounded-3xl px-8 py-6 text-center mb-6"
          style={{ backgroundColor: theme.headerBg }}
        >
          <h1
            className="text-2xl font-bold mb-1"
            style={{ fontSize: '24px', color: theme.headerText }}
          >
            {roomInfo?.name || 'Minh Trầm – Phòng Số 02'}
          </h1>
          <h2
            className="text-lg font-semibold"
            style={{ fontSize: '18px', color: theme.headerText }}
          >
            {propertyInfo?.address ||
              '325/16/9 đường Bach Đằng, Phường Gia Định - Tp.HCM'}
          </h2>
        </div>

        {/* Invoice content */}
        <div
          className="space-y-6 text-lg leading-relaxed"
          style={{ fontSize: '18px' }}
        >
          {/* Electricity */}
          <div className="space-y-2">
            <div className="font-bold text-black" style={{ fontSize: '20px' }}>
              Tiền Điện:
            </div>
            <div
              className="grid grid-cols-2 gap-4 text-black"
              style={{ fontSize: '16px' }}
            >
              <div>
                Chỉ số cũ:{' '}
                <span className="font-semibold">
                  {invoice.electricity_previous_reading}
                </span>
              </div>
              <div>
                Chỉ số mới:{' '}
                <span className="font-semibold">
                  {invoice.electricity_current_reading}
                </span>
              </div>
            </div>
            <div className="text-black" style={{ fontSize: '18px' }}>
              <span className="font-semibold">{electricityUsage} KW</span> x{' '}
              <span className="font-semibold">
                {formatCurrency(invoice.electricity_unit_price)}
              </span>{' '}
              ={' '}
              <span className="font-bold text-black">
                {formatCurrency(invoice.electricity_amount)}
              </span>
            </div>
            {invoice.electricity_note && (
              <div className="text-gray-600 text-sm italic mt-1">
                Ghi chú: {invoice.electricity_note}
              </div>
            )}
          </div>

          {/* Water */}
          <div className="space-y-2">
            <div className="font-bold text-black" style={{ fontSize: '20px' }}>
              Tiền Nước:
            </div>
            <div
              className="grid grid-cols-2 gap-4 text-black"
              style={{ fontSize: '16px' }}
            >
              <div>
                Chỉ số cũ:{' '}
                <span className="font-semibold">
                  {invoice.water_previous_reading}
                </span>
              </div>
              <div>
                Chỉ số mới:{' '}
                <span className="font-semibold">
                  {invoice.water_current_reading}
                </span>
              </div>
            </div>
            <div className="text-black" style={{ fontSize: '18px' }}>
              <span className="font-semibold">{waterUsage} m³</span> x{' '}
              <span className="font-semibold">
                {formatCurrency(invoice.water_unit_price)}
              </span>{' '}
              ={' '}
              <span className="font-bold text-black">
                {formatCurrency(invoice.water_amount)}
              </span>
            </div>
            {invoice.water_note && (
              <div className="text-gray-600 text-sm italic mt-1">
                Ghi chú: {invoice.water_note}
              </div>
            )}
          </div>

          {/* Internet */}
          <div className="flex justify-between items-center py-2">
            <div className="font-bold text-black" style={{ fontSize: '20px' }}>
              Tiền Internet:
            </div>
            <div className="font-bold text-black" style={{ fontSize: '20px' }}>
              {formatCurrency(invoice.internet_amount)}
            </div>
          </div>

          {/* Trash */}
          <div className="flex justify-between items-center py-2">
            <div className="font-bold text-black" style={{ fontSize: '20px' }}>
              Tiền Rác:
            </div>
            <div className="font-bold text-black" style={{ fontSize: '20px' }}>
              {formatCurrency(invoice.trash_amount)}
            </div>
          </div>

          {/* Rent */}
          <div className="flex justify-between items-center py-2">
            <div className="font-bold text-black" style={{ fontSize: '20px' }}>
              Tiền phòng (từ {formatDate(invoice.period_start)} đến{' '}
              {formatDate(invoice.period_end)}):
            </div>
            <div className="font-bold text-black" style={{ fontSize: '20px' }}>
              {formatCurrency(invoice.rent_amount)}
            </div>
          </div>

          {/* Other fees */}
          {invoice.other_fees &&
            Array.isArray(invoice.other_fees) &&
            invoice.other_fees.length > 0 && (
              <>
                {invoice.other_fees.map(
                  (fee: { name: string; amount: number }, index: number) => (
                    <div
                      key={index}
                      className="flex justify-between items-center py-2"
                    >
                      <div
                        className="font-bold text-black"
                        style={{ fontSize: '20px' }}
                      >
                        {fee.name}:
                      </div>
                      <div
                        className="font-bold text-black"
                        style={{ fontSize: '20px' }}
                      >
                        {formatCurrency(fee.amount)}
                      </div>
                    </div>
                  )
                )}
              </>
            )}
        </div>

        {/* Total */}
        <div
          className="rounded-xl p-6 mt-8"
          style={{ backgroundColor: theme.totalBg }}
        >
          <div className="flex justify-between items-center">
            <div
              className="font-bold"
              style={{ fontSize: '28px', color: theme.totalText }}
            >
              Tổng thanh toán:
            </div>
            <div
              className="font-bold"
              style={{ fontSize: '32px', color: theme.totalText }}
            >
              {formatCurrency(invoice.total_amount)}
            </div>
          </div>
        </div>

        {/* Notes */}
        {invoice.notes && (
          <div className="mt-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
            <div className="font-bold mb-2 text-gray-800">Ghi chú:</div>
            <div className="text-gray-700 leading-relaxed">{invoice.notes}</div>
          </div>
        )}
      </div>
    )
  }
)

ReceiptTemplate.displayName = 'ReceiptTemplate'

export default ReceiptTemplate
