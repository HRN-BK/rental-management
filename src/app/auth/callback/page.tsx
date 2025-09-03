'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react'

function AuthCallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const supabase = createClientComponentClient()

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Handle auth code exchange for session if needed
        const code = searchParams.get('code')
        if (code) {
          await supabase.auth.exchangeCodeForSession(code)
        }

        const { data, error } = await supabase.auth.getSession()

        if (error) {
          setError(error.message)
          setLoading(false)
          return
        }

        if (data?.session) {
          setSuccess(true)
          setLoading(false)

          // Redirect to dashboard after 2 seconds
          setTimeout(() => {
            router.push('/')
          }, 2000)
        } else {
          setError('Không thể xác thực phiên đăng nhập')
          setLoading(false)
        }
      } catch (err) {
        setError('Có lỗi xảy ra trong quá trình xác thực')
        setLoading(false)
      }
    }

    handleAuthCallback()
  }, [router, searchParams, supabase.auth])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
              <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              Đang xác thực...
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-600">
              Vui lòng chờ trong khi chúng tôi xác thực đăng nhập của bạn
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              Đăng nhập thành công!
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-gray-600">
              Chào mừng bạn quay trở lại! Bạn sẽ được chuyển hướng đến trang chủ
              trong giây lát.
            </p>
            <div className="animate-pulse">
              <div className="h-1 bg-green-200 rounded-full overflow-hidden">
                <div className="h-full bg-green-500 rounded-full animate-progress"></div>
              </div>
            </div>
            <Button
              onClick={() => router.push('/')}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              Đi đến trang chủ ngay
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-pink-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            Lỗi xác thực
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-gray-600">
            {error || 'Có lỗi xảy ra trong quá trình đăng nhập'}
          </p>
          <Button
            onClick={() => router.push('/auth')}
            variant="outline"
            className="w-full"
          >
            Thử đăng nhập lại
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
                <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
              </div>
              <CardTitle className="text-2xl font-bold text-gray-900">
                Đang tải...
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-gray-600">Vui lòng chờ trong giây lát</p>
            </CardContent>
          </Card>
        </div>
      }
    >
      <AuthCallbackContent />
    </Suspense>
  )
}
