'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { signInWithEmail } from '@/lib/supabase/client'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Mail,
  Send,
  CheckCircle,
  Lock,
  Building2,
  ArrowRight,
  Loader2,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

export default function AuthPage() {
  // Magic link state
  const [magicEmail, setMagicEmail] = useState('')
  const [magicLoading, setMagicLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const [magicError, setMagicError] = useState('')

  // Email/password state
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const { signIn, user } = useAuth()
  const router = useRouter()

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      router.push('/')
    }
  }, [user, router])

  const handleMagicLinkSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!magicEmail) return

    setMagicLoading(true)
    setMagicError('')

    try {
      const { error } = await signInWithEmail(magicEmail)

      if (error) {
        setMagicError(error.message)
      } else {
        setEmailSent(true)
      }
    } catch (err) {
      setMagicError('Có lỗi xảy ra, vui lòng thử lại')
    } finally {
      setMagicLoading(false)
    }
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email || !password) {
      setError('Vui lòng nhập email và mật khẩu')
      return
    }

    setLoading(true)
    setError('')

    try {
      await signIn(email, password)
      // Don't redirect here - let useEffect handle it when user state changes
    } catch (error) {
      console.error('Login error:', error)
      let errorMessage = 'Đăng nhập thất bại'
      if (error instanceof Error) {
        if (error.message === 'Invalid login credentials') {
          errorMessage = 'Sai tài khoản hoặc mật khẩu'
        } else {
          errorMessage = error.message
        }
      }
      setError(errorMessage)
      setLoading(false)
    }
  }

  if (emailSent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4 sm:p-6">
        <Card className="w-full max-w-md shadow-xl border-0 dark:bg-gray-800 dark:border-gray-700">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
              <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <CardTitle className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white leading-tight">
              Kiểm tra email của bạn
            </CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-300 text-sm sm:text-base">
              Chúng tôi đã gửi link đăng nhập đến email của bạn
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className="dark:bg-gray-700 dark:border-gray-600">
              <Mail className="h-4 w-4" />
              <AlertDescription className="text-sm sm:text-base dark:text-gray-200">
                Chúng tôi đã gửi một email chứa link đăng nhập đến{' '}
                <strong className="dark:text-white">{magicEmail}</strong>. Hãy
                kiểm tra hộp thư và nhấn vào link để đăng nhập.
              </AlertDescription>
            </Alert>

            <div className="text-center space-y-2">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Không thấy email? Kiểm tra thư mục spam hoặc
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  setEmailSent(false)
                  setMagicEmail('')
                }}
                className="text-sm"
              >
                Gửi lại
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
              Đăng nhập
            </CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-300 text-sm sm:text-base">
              Chọn phương thức đăng nhập phù hợp với bạn
            </CardDescription>
          </CardHeader>

          <CardContent className="px-4 sm:px-6">
            <Tabs defaultValue="password" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger
                  value="password"
                  className="text-sm sm:text-base py-2 sm:py-2.5"
                >
                  Mật khẩu
                </TabsTrigger>
                <TabsTrigger
                  value="magic"
                  className="text-sm sm:text-base py-2 sm:py-2.5"
                >
                  Magic Link
                </TabsTrigger>
              </TabsList>

              {/* Email/Password Login */}
              <TabsContent
                value="password"
                className="space-y-5 sm:space-y-4 mt-4"
              >
                <form
                  onSubmit={handlePasswordSubmit}
                  className="space-y-5 sm:space-y-4"
                >
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
                      className="text-sm sm:text-sm font-medium dark:text-gray-200"
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
                      className="text-sm sm:text-sm font-medium dark:text-gray-200"
                    >
                      Mật khẩu
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-4 h-4" />
                      <Input
                        id="password"
                        type="password"
                        placeholder="Nhập mật khẩu"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        className="pl-10 h-12 sm:h-10 text-base sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        disabled={loading}
                        required
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <div className="text-sm">
                      <Link
                        href="/auth/forgot-password"
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium"
                      >
                        Quên mật khẩu?
                      </Link>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white h-12 sm:h-10 text-base sm:text-sm font-medium"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Đang đăng nhập...
                      </>
                    ) : (
                      <>
                        Đăng nhập
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                </form>
              </TabsContent>

              {/* Magic Link Login */}
              <TabsContent
                value="magic"
                className="space-y-5 sm:space-y-4 mt-4"
              >
                <form
                  onSubmit={handleMagicLinkSubmit}
                  className="space-y-5 sm:space-y-4"
                >
                  {magicError && (
                    <Alert
                      variant="destructive"
                      className="dark:bg-red-900 dark:border-red-800"
                    >
                      <AlertDescription className="text-sm sm:text-base dark:text-red-200">
                        {magicError}
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-3 sm:space-y-2">
                    <Label
                      htmlFor="magic-email"
                      className="text-sm sm:text-sm font-medium dark:text-gray-200"
                    >
                      Email
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-4 h-4" />
                      <Input
                        id="magic-email"
                        type="email"
                        placeholder="example@gmail.com"
                        value={magicEmail}
                        onChange={e => setMagicEmail(e.target.value)}
                        className="pl-10 h-12 sm:h-10 text-base sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        disabled={magicLoading}
                        required
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-purple-600 hover:bg-purple-700 dark:bg-purple-600 dark:hover:bg-purple-700 text-white h-12 sm:h-10 text-base sm:text-sm font-medium"
                    disabled={magicLoading || !magicEmail}
                  >
                    {magicLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Đang gửi...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Gửi link đăng nhập
                      </>
                    )}
                  </Button>

                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 text-center mt-3">
                    Chúng tôi sẽ gửi một link an toàn đến email của bạn
                  </p>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>

          <CardFooter className="text-center px-4 sm:px-6">
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
              Chưa có tài khoản?{' '}
              <Link
                href="/auth/signup"
                className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium"
              >
                Đăng ký ngay
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
