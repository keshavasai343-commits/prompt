import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Settings, User, Key, Palette, Moon, Sun } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { authService } from '@/services/authService'
import { AI_MODELS } from '@/types'
import toast from 'react-hot-toast'

export function SettingsPage() {
  const { user, updateUser } = useAuth()
  const { theme, toggleTheme } = useTheme()

  const [profileForm, setProfileForm] = useState({
    full_name: user?.full_name ?? '',
    bio: user?.bio ?? '',
    preferred_model: user?.preferred_model ?? 'gpt-4o',
  })

  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  })

  const updateProfile = useMutation({
    mutationFn: (data: typeof profileForm) => authService.updateMe(data),
    onSuccess: (updated) => {
      updateUser(updated)
      toast.success('Profile updated')
    },
    onError: () => toast.error('Failed to update profile'),
  })

  const changePassword = useMutation({
    mutationFn: () => authService.changePassword(passwordForm.current_password, passwordForm.new_password),
    onSuccess: () => {
      toast.success('Password changed')
      setPasswordForm({ current_password: '', new_password: '', confirm_password: '' })
    },
    onError: () => toast.error('Failed to change password'),
  })

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      toast.error('Passwords do not match')
      return
    }
    changePassword.mutate()
  }

  return (
    <div className="flex flex-col min-h-full">
      <Header title="Settings" subtitle="Manage your account and preferences" />

      <div className="p-6 max-w-2xl space-y-6">
        {/* Profile */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Profile
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={(e) => { e.preventDefault(); updateProfile.mutate(profileForm) }} className="space-y-4">
              <Input
                label="Full Name"
                value={profileForm.full_name}
                onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })}
                placeholder="Your full name"
              />
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-foreground">Bio</label>
                <textarea
                  value={profileForm.bio}
                  onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                  placeholder="A short bio..."
                  rows={3}
                  className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-foreground">Preferred AI Model</label>
                <select
                  value={profileForm.preferred_model}
                  onChange={(e) => setProfileForm({ ...profileForm, preferred_model: e.target.value })}
                  className="rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  {AI_MODELS.map((model) => (
                    <option key={model.id} value={model.id}>
                      {model.name} ({model.provider})
                    </option>
                  ))}
                </select>
              </div>

              <Button type="submit" isLoading={updateProfile.isPending}>
                Save Profile
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Appearance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              Appearance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">Theme</p>
                <p className="text-xs text-muted-foreground">Switch between dark and light mode</p>
              </div>
              <button
                onClick={toggleTheme}
                className="flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-accent transition-colors"
              >
                {theme === 'dark' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                {theme === 'dark' ? 'Dark' : 'Light'} Mode
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Password */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-4 w-4" />
              Change Password
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <Input
                label="Current Password"
                type="password"
                value={passwordForm.current_password}
                onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
                placeholder="••••••••"
              />
              <Input
                label="New Password"
                type="password"
                value={passwordForm.new_password}
                onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                placeholder="Min 8 chars, uppercase, number"
              />
              <Input
                label="Confirm New Password"
                type="password"
                value={passwordForm.confirm_password}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })}
                placeholder="••••••••"
              />
              <Button type="submit" isLoading={changePassword.isPending}>
                Change Password
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Account info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Account Info
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Email</span>
              <span className="text-foreground">{user?.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Username</span>
              <span className="text-foreground">@{user?.username}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Member since</span>
              <span className="text-foreground">
                {user?.created_at ? new Date(user.created_at).toLocaleDateString() : '-'}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
