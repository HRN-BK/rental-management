'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Loader2,
  User,
  Mail,
  Lock,
  Save,
  Key,
  Shield,
  Calendar,
  CheckCircle,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

export default function ProfilePage() {
  const { user, updateProfile, updatePassword, signOut } = useAuth()
  const router = useRouter()

  // Profile state
  const [displayName, setDisplayName] = useState('')
  const [profileLoading, setProfileLoading] = useState(false)
  const [profileError, setProfileError] = useState('')
  const [profileSuccess, setProfileSuccess] = useState('')

  // Password state
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState('')

  useEffect(() => {
    if (user?.user_metadata?.full_name) {
      setDisplayName(user.user_metadata.full_name)
    }
  }, [user])

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!displayName.trim()) {
      setProfileError('Vui lòng nhập họ tên')
      return
    }

    setProfileLoading(true)
    setProfileError('')
    setProfileSuccess('')

    try {
      await updateProfile({ full_name: displayName.trim() })
      setProfileSuccess('Cập nhật thông tin thành công!')
    } catch (error) {
      console.error('Profile update error:', error)
      setProfileError(
        error instanceof Error ? error.message : 'Cập nhật thất bại'
      )
    } finally {
      setProfileLoading(false)
    }
  }

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('Vui lòng điền đầy đủ thông tin')
      return
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Mật khẩu mới và xác nhận không khớp')
      return
    }

    if (newPassword.length < 6) {
      setPasswordError('Mật khẩu mới phải có ít nhất 6 ký tự')
      return
    }

    if (newPassword === currentPassword) {
      setPasswordError('Mật khẩu mới phải khác mật khẩu hiện tại')
      return
    }

    setPasswordLoading(true)
    setPasswordError('')
    setPasswordSuccess('')

    try {
      await updatePassword(newPassword)
      setPasswordSuccess('Đổi mật khẩu thành công!')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (error) {
      console.error('Password update error:', error)
      setPasswordError(
        error instanceof Error ? error.message : 'Đổi mật khẩu thất bại'
      )
    } finally {
      setPasswordLoading(false)
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      router.push('/auth')
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-6 sm:py-8 max-w-4xl pb-20 md:pb-8">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2 leading-tight">
          Thông tin tài khoản
        </h1>
        <p className="text-gray-600 dark:text-gray-300 text-sm sm:text-base">
          Quản lý thông tin cá nhân và bảo mật tài khoản
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Profile Summary Card */}
        <div className="lg:col-span-1 order-2 lg:order-1">
          <Card className="sticky top-4 dark:bg-gray-800 dark:border-gray-700">
            <CardHeader className="text-center pb-4 px-4 sm:px-6">
              <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
                <User className="h-10 w-10 text-blue-600 dark:text-blue-400" />
              </div>
              <CardTitle className="text-lg sm:text-xl dark:text-white truncate">
                {user.user_metadata?.full_name || user.email}
              </CardTitle>
              <CardDescription className="flex items-center justify-center gap-2 text-sm">
                <Mail className="h-4 w-4" />
                <span className="truncate">{user.email}</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4 px-4 sm:px-6">
              <div className="space-y-4 text-sm">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                    <span className="text-gray-600 dark:text-gray-300">
                      Ngày tạo:
                    </span>
                  </div>
                  <p className="text-gray-900 dark:text-gray-100 ml-6 text-sm">
                    {new Date(user.created_at).toLocaleDateString('vi-VN')}
                  </p>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                    <span className="text-gray-600 dark:text-gray-300">
                      Trạng thái:
                    </span>
                  </div>
                  <div className="flex items-center gap-2 ml-6">
                    <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                    <span className="text-green-600 dark:text-green-400 font-medium text-sm">
                      Email đã xác thực
                    </span>
                  </div>
                </div>
              </div>

              <Separator className="my-4 dark:bg-gray-600" />

              <Button
                variant="outline"
                className="w-full h-11 text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-900 font-medium touch-manipulation"
                onClick={handleSignOut}
              >
                Đăng xuất
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Settings Tabs */}
        <div className="lg:col-span-2 order-1 lg:order-2">
          <Tabs defaultValue="profile" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 h-12">
              <TabsTrigger
                value="profile"
                className="flex items-center gap-2 text-sm sm:text-base py-2 sm:py-2.5"
              >
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">Thông tin cá nhân</span>
                <span className="sm:hidden">Thông tin</span>
              </TabsTrigger>
              <TabsTrigger
                value="security"
                className="flex items-center gap-2 text-sm sm:text-base py-2 sm:py-2.5"
              >
                <Lock className="h-4 w-4" />
                <span className="hidden sm:inline">Bảo mật</span>
                <span className="sm:hidden">Mật khẩu</span>
              </TabsTrigger>
            </TabsList>

            {/* Profile Tab */}
            <TabsContent value="profile">
              <Card className="dark:bg-gray-800 dark:border-gray-700">
                <CardHeader className="px-4 sm:px-6">
                  <CardTitle className="flex items-center gap-2 text-lg sm:text-xl dark:text-white">
                    <User className="h-5 w-5" />
                    Cập nhật thông tin
                  </CardTitle>
                  <CardDescription className="text-sm sm:text-base dark:text-gray-300">
                    Thay đổi thông tin hiển thị và các tùy chọn khác
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-4 sm:px-6">
                  <form
                    onSubmit={handleProfileUpdate}
                    className="space-y-5 sm:space-y-4"
                  >
                    {profileError && (
                      <Alert
                        variant="destructive"
                        className="dark:bg-red-900 dark:border-red-800"
                      >
                        <AlertDescription className="dark:text-red-200">
                          {profileError}
                        </AlertDescription>
                      </Alert>
                    )}
                    {profileSuccess && (
                      <Alert className="dark:bg-green-900 dark:border-green-800">
                        <CheckCircle className="h-4 w-4" />
                        <AlertDescription className="dark:text-green-200">
                          {profileSuccess}
                        </AlertDescription>
                      </Alert>
                    )}

                    <div className="space-y-3 sm:space-y-2">
                      <Label
                        htmlFor="email"
                        className="text-sm font-medium dark:text-gray-200"
                      >
                        Email (không thể thay đổi)
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={user.email || ''}
                        disabled
                        className="bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 h-12 sm:h-10 text-base sm:text-sm"
                      />
                    </div>

                    <div className="space-y-3 sm:space-y-2">
                      <Label
                        htmlFor="displayName"
                        className="text-sm font-medium dark:text-gray-200"
                      >
                        Họ và tên *
                      </Label>
                      <Input
                        id="displayName"
                        type="text"
                        placeholder="Nguyễn Văn A"
                        value={displayName}
                        onChange={e => setDisplayName(e.target.value)}
                        disabled={profileLoading}
                        className="h-12 sm:h-10 text-base sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        required
                      />
                    </div>

                    <div className="flex justify-end pt-4">
                      <Button
                        type="submit"
                        disabled={profileLoading || !displayName.trim()}
                        className="h-12 sm:h-10 px-6 text-base sm:text-sm font-medium touch-manipulation"
                      >
                        {profileLoading ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Đang cập nhật...
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4 mr-2" />
                            Lưu thay đổi
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Security Tab */}
            <TabsContent value="security">
              <Card className="dark:bg-gray-800 dark:border-gray-700">
                <CardHeader className="px-4 sm:px-6">
                  <CardTitle className="flex items-center gap-2 text-lg sm:text-xl dark:text-white">
                    <Key className="h-5 w-5" />
                    Đổi mật khẩu
                  </CardTitle>
                  <CardDescription className="text-sm sm:text-base dark:text-gray-300">
                    Cập nhật mật khẩu để bảo mật tài khoản tốt hơn
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-4 sm:px-6">
                  <form
                    onSubmit={handlePasswordUpdate}
                    className="space-y-5 sm:space-y-4"
                  >
                    {passwordError && (
                      <Alert
                        variant="destructive"
                        className="dark:bg-red-900 dark:border-red-800"
                      >
                        <AlertDescription className="dark:text-red-200">
                          {passwordError}
                        </AlertDescription>
                      </Alert>
                    )}
                    {passwordSuccess && (
                      <Alert className="dark:bg-green-900 dark:border-green-800">
                        <CheckCircle className="h-4 w-4" />
                        <AlertDescription className="dark:text-green-200">
                          {passwordSuccess}
                        </AlertDescription>
                      </Alert>
                    )}

                    <div className="space-y-3 sm:space-y-2">
                      <Label
                        htmlFor="currentPassword"
                        className="text-sm font-medium dark:text-gray-200"
                      >
                        Mật khẩu hiện tại *
                      </Label>
                      <Input
                        id="currentPassword"
                        type="password"
                        placeholder="Nhập mật khẩu hiện tại"
                        value={currentPassword}
                        onChange={e => setCurrentPassword(e.target.value)}
                        disabled={passwordLoading}
                        className="h-12 sm:h-10 text-base sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        required
                      />
                    </div>

                    <div className="space-y-3 sm:space-y-2">
                      <Label
                        htmlFor="newPassword"
                        className="text-sm font-medium dark:text-gray-200"
                      >
                        Mật khẩu mới *
                      </Label>
                      <Input
                        id="newPassword"
                        type="password"
                        placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
                        value={newPassword}
                        onChange={e => setNewPassword(e.target.value)}
                        disabled={passwordLoading}
                        className="h-12 sm:h-10 text-base sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        required
                        minLength={6}
                      />
                    </div>

                    <div className="space-y-3 sm:space-y-2">
                      <Label
                        htmlFor="confirmPassword"
                        className="text-sm font-medium dark:text-gray-200"
                      >
                        Xác nhận mật khẩu mới *
                      </Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        placeholder="Nhập lại mật khẩu mới"
                        value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                        disabled={passwordLoading}
                        className="h-12 sm:h-10 text-base sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        required
                        minLength={6}
                      />
                    </div>

                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                      <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 space-y-1">
                        <p className="font-medium mb-2">Yêu cầu mật khẩu:</p>
                        <p>• Tối thiểu 6 ký tự</p>
                        <p>• Nên kết hợp chữ cái, số và ký tự đặc biệt</p>
                        <p>• Khác với mật khẩu hiện tại</p>
                      </div>
                    </div>

                    <div className="flex justify-end pt-4">
                      <Button
                        type="submit"
                        disabled={
                          passwordLoading ||
                          !currentPassword ||
                          !newPassword ||
                          !confirmPassword
                        }
                        className="h-12 sm:h-10 px-6 text-base sm:text-sm font-medium touch-manipulation"
                      >
                        {passwordLoading ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Đang cập nhật...
                          </>
                        ) : (
                          <>
                            <Lock className="h-4 w-4 mr-2" />
                            Đổi mật khẩu
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
