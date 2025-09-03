'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
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
import {
  Loader2,
  Mail,
  Lock,
  Building2,
  User,
  ArrowRight,
  CheckCircle,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

export default function SignupPage() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const { signUp, user } = useAuth()
  const router = useRouter()

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      router.push('/')
    }
  }, [user, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!fullName || !email || !password || !confirmPassword) {
      setError('Vui lòng điền đầy đủ thông tin')
      return
    }

    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp')
      return
    }

    if (password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự')
      return
    }

    setLoading(true)
    setError('')

    try {
      await signUp(email, password, fullName)
      setSuccess(true)
    } catch (error) {
      console.error('Signup error:', error)
      setError(error instanceof Error ? error.message : 'Đăng ký thất bại')
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
              Đăng ký thành công!
            </CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-300 text-sm sm:text-base">
              Tài khoản của bạn đã được tạo thành công
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 px-4 sm:px-6">
            <Alert className="dark:bg-gray-700 dark:border-gray-600">
              <Mail className="h-4 w-4" />
              <AlertDescription className="text-sm sm:text-base dark:text-gray-200">
                Chúng tôi đã gửi email xác nhận đến{' '}
                <strong className="dark:text-white">{email}</strong>. Vui lòng
                kiểm tra email và xác nhận tài khoản của bạn.
              </AlertDescription>
            </Alert>

            <div className="text-center space-y-4">
              <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400">
                Sau khi xác nhận email, bạn có thể đăng nhập vào hệ thống
              </p>
              <Button
                onClick={() => router.push('/auth')}
                className="w-full bg-blue-600 hover:bg-blue-700 h-12 sm:h-10 text-base sm:text-sm font-medium"
              >
                Đến trang đăng nhập
              </Button>
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
            Hệ thống quản lý nhà trọ chuyên nghiệp
          </p>
        </div>

        <Card className="shadow-xl border-0 dark:bg-gray-800 dark:border-gray-700">
          <CardHeader className="text-center space-y-2 px-4 sm:px-6">
            <CardTitle className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white leading-tight">
              Đăng ký tài khoản
            </CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-300 text-sm sm:text-base">
              Tạo tài khoản mới để bắt đầu sử dụng Rental Pro
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
                  htmlFor="fullName"
                  className="text-sm font-medium dark:text-gray-200"
                >
                  Họ và tên
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-4 h-4" />
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="Nguyễn Văn A"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    className="pl-10 h-12 sm:h-10 text-base sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    disabled={loading}
                    required
                  />
                </div>
              </div>

              <div className="space-y-3 sm:space-y-2">
                <Label
                  htmlFor="email"
                  className="text-sm font-medium dark:text-gray-200"
                >
                  Email
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

              <div className="space-y-3 sm:space-y-2">
                <Label
                  htmlFor="password"
                  className="text-sm font-medium dark:text-gray-200"
                >
                  Mật khẩu
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-4 h-4" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Mật khẩu (tối thiểu 6 ký tự)"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="pl-10 h-12 sm:h-10 text-base sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    disabled={loading}
                    required
                    minLength={6}
                  />
                </div>
              </div>

              <div className="space-y-3 sm:space-y-2">
                <Label
                  htmlFor="confirmPassword"
                  className="text-sm font-medium dark:text-gray-200"
                >
                  Xác nhận mật khẩu
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-4 h-4" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Nhập lại mật khẩu"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    className="pl-10 h-12 sm:h-10 text-base sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    disabled={loading}
                    required
                    minLength={6}
                  />
                </div>
              </div>

              <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 space-y-1 bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                <p>• Mật khẩu phải có ít nhất 6 ký tự</p>
                <p>• Nên sử dụng kết hợp chữ cái, số và ký tự đặc biệt</p>
              </div>

              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white h-12 sm:h-10 text-base sm:text-sm font-medium"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Đang tạo tài khoản...
                  </>
                ) : (
                  <>
                    Đăng ký
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </form>
          </CardContent>

          <CardFooter className="text-center px-4 sm:px-6">
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
              Đã có tài khoản?{' '}
              <Link
                href="/auth"
                className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium"
              >
                Đăng nhập ngay
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
