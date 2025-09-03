'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Mail, Building2, ArrowLeft, CheckCircle } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const { resetPassword } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email) {
      setError('Vui lòng nhập địa chỉ email')
      return
    }

    setLoading(true)
    setError('')

    try {
      await resetPassword(email)
      setSuccess(true)
    } catch (error) {
      console.error('Reset password error:', error)
      setError(
        error instanceof Error
          ? error.message
          : 'Có lỗi xảy ra, vui lòng thử lại'
      )
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4 sm:p-6">
        <Card className="w-full max-w-md shadow-xl border-0 dark:bg-gray-800 dark:border-gray-700">
          <CardHeader className="text-center px-4 sm:px-6">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
              <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <CardTitle className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white leading-tight">
              Kiểm tra email
            </CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-300 text-sm sm:text-base">
              Chúng tôi đã gửi hướng dẫn khôi phục mật khẩu đến email của bạn
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 px-4 sm:px-6">
            <Alert className="dark:bg-gray-700 dark:border-gray-600">
              <Mail className="h-4 w-4" />
              <AlertDescription className="text-sm sm:text-base dark:text-gray-200">
                Chúng tôi đã gửi email khôi phục mật khẩu đến{' '}
                <strong className="dark:text-white">{email}</strong>. Vui lòng
                kiểm tra email và làm theo hướng dẫn để đặt lại mật khẩu.
              </AlertDescription>
            </Alert>

            <div className="text-center space-y-4">
              <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400">
                Không thấy email? Kiểm tra thư mục spam hoặc thử lại
              </p>
              <div className="flex flex-col gap-3">
                <Button
                  onClick={() => {
                    setSuccess(false)
                    setEmail('')
                  }}
                  variant="outline"
                  className="h-12 sm:h-10 text-base sm:text-sm font-medium"
                >
                  Gửi lại email
                </Button>
                <Link href="/auth">
                  <Button className="w-full bg-blue-600 hover:bg-blue-700 h-12 sm:h-10 text-base sm:text-sm font-medium">
                    Quay lại đăng nhập
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-md">
        {/* Logo/Brand */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 bg-blue-600 dark:bg-blue-500 rounded-2xl">
              <Building2 className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2 leading-tight">
            Rental Pro
          </h1>
          <p className="text-gray-600 dark:text-gray-300 text-sm sm:text-base">
            Khôi phục mật khẩu
          </p>
        </div>

        <Card className="shadow-xl border-0 dark:bg-gray-800 dark:border-gray-700">
          <CardHeader className="text-center space-y-2 px-4 sm:px-6">
            <CardTitle className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white leading-tight">
              Quên mật khẩu?
            </CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-300 text-sm sm:text-base">
              Nhập email của bạn để nhận hướng dẫn khôi phục mật khẩu
            </CardDescription>
          </CardHeader>

          <CardContent className="px-4 sm:px-6">
            <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-4">
              {error && (
                <Alert
                  variant="destructive"
                  className="dark:bg-red-900 dark:border-red-800"
                >
                  <AlertDescription className="text-sm sm:text-base dark:text-red-200">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-3 sm:space-y-2">
                <Label
                  htmlFor="email"
                  className="text-sm font-medium dark:text-gray-200"
                >
                  Địa chỉ email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-4 h-4" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="example@gmail.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="pl-10 h-12 sm:h-10 text-base sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    disabled={loading}
                    required
                  />
                </div>
              </div>

              <div className="text-sm sm:text-sm text-gray-500 dark:text-gray-400 bg-blue-50 dark:bg-gray-700 p-3 rounded-lg">
                <p className="mb-1 font-medium">💡 Lưu ý:</p>
                <p>
                  Chúng tôi sẽ gửi link khôi phục mật khẩu đến email này. Vui
                  lòng đảm bảo đây là email bạn đã sử dụng để đăng ký tài khoản.
                </p>
              </div>

              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white h-12 sm:h-10 text-base sm:text-sm font-medium touch-manipulation"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Đang gửi...
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4 mr-2" />
                    Gửi hướng dẫn khôi phục
                  </>
                )}
              </Button>
            </form>
          </CardContent>

          <CardFooter className="flex flex-col space-y-4 px-4 sm:px-6">
            <Link
              href="/auth"
              className="flex items-center justify-center text-sm sm:text-base text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 font-medium"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Quay lại đăng nhập
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
