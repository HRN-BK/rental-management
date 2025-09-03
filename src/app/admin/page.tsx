'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Database, Loader2, CheckCircle, XCircle } from 'lucide-react'

export default function AdminPage() {
  const [isSeeding, setIsSeeding] = useState(false)
  const [seedResult, setSeedResult] = useState<{
    success: boolean
    message: string
    details?: any
  } | null>(null)

  const handleSeedData = async () => {
    setIsSeeding(true)
    setSeedResult(null)

    try {
      // Call seed API endpoint
      const response = await fetch('/api/admin/seed', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const result = await response.json()

      setSeedResult({
        success: result.success,
        message:
          result.message ||
          (result.success ? 'Seed thành công!' : 'Có lỗi xảy ra'),
        details: result.details,
      })
    } catch (error) {
      setSeedResult({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Không thể kết nối đến server',
      })
    } finally {
      setIsSeeding(false)
    }
  }

  const handleClearData = async () => {
    if (
      !confirm(
        'Bạn có chắc chắn muốn xóa toàn bộ dữ liệu? Hành động này không thể hoàn tác.'
      )
    ) {
      return
    }

    setIsSeeding(true)
    setSeedResult(null)

    try {
      const response = await fetch('/api/admin/clear', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const result = await response.json()

      setSeedResult({
        success: result.success,
        message:
          result.message ||
          (result.success ? 'Xóa dữ liệu thành công!' : 'Có lỗi xảy ra'),
        details: result.details,
      })
    } catch (error) {
      setSeedResult({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Không thể kết nối đến server',
      })
    } finally {
      setIsSeeding(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Panel</h1>
          <p className="text-muted-foreground">
            Quản lý dữ liệu hệ thống và thực hiện các tác vụ bảo trì
          </p>
        </div>

        <Separator />

        {/* Data Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Quản lý dữ liệu
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Seed dữ liệu mẫu</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Tạo dữ liệu mẫu bao gồm properties, rooms, tenants, contracts và
                invoices để test hệ thống.
              </p>
              <Button
                onClick={handleSeedData}
                disabled={isSeeding}
                className="flex items-center gap-2"
              >
                {isSeeding ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Đang tạo dữ liệu...
                  </>
                ) : (
                  <>
                    <Database className="h-4 w-4" />
                    Seed dữ liệu mẫu
                  </>
                )}
              </Button>
            </div>

            <Separator />

            <div>
              <h3 className="text-lg font-semibold mb-2 text-red-600">
                Xóa toàn bộ dữ liệu
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                ⚠️ Cẩn thận! Hành động này sẽ xóa toàn bộ dữ liệu trong
                database. Chỉ sử dụng trong môi trường development.
              </p>
              <Button
                variant="destructive"
                onClick={handleClearData}
                disabled={isSeeding}
                className="flex items-center gap-2"
              >
                {isSeeding ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Đang xóa...
                  </>
                ) : (
                  <>
                    <XCircle className="h-4 w-4" />
                    Xóa toàn bộ dữ liệu
                  </>
                )}
              </Button>
            </div>

            {/* Result Display */}
            {seedResult && (
              <div
                className={`p-4 rounded-lg border ${
                  seedResult.success
                    ? 'bg-green-50 border-green-200 text-green-800'
                    : 'bg-red-50 border-red-200 text-red-800'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  {seedResult.success ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600" />
                  )}
                  <span className="font-semibold">
                    {seedResult.success ? 'Thành công!' : 'Có lỗi xảy ra!'}
                  </span>
                </div>
                <p className="text-sm">{seedResult.message}</p>
                {seedResult.details && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-sm underline">
                      Chi tiết
                    </summary>
                    <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
                      {JSON.stringify(seedResult.details, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
