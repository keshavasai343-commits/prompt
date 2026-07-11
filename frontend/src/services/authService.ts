import { apiClient } from './api'
import type { AuthResponse, User } from '@/types'

interface LoginRequest { email: string; password: string }
interface RegisterRequest { email: string; username: string; password: string; full_name?: string }
interface UpdateProfileRequest { full_name?: string; bio?: string; avatar_url?: string; preferred_model?: string; theme?: string }

export const authService = {
  async login(data: LoginRequest): Promise<AuthResponse> {
    const { data: res } = await apiClient.post<AuthResponse>('/auth/login', data)
    return res
  },

  async register(data: RegisterRequest): Promise<AuthResponse> {
    const { data: res } = await apiClient.post<AuthResponse>('/auth/register', data)
    return res
  },

  async getMe(): Promise<User> {
    const { data } = await apiClient.get<User>('/auth/me')
    return data
  },

  async updateMe(data: UpdateProfileRequest): Promise<User> {
    const { data: res } = await apiClient.put<User>('/auth/me', data)
    return res
  },

  async changePassword(current_password: string, new_password: string): Promise<void> {
    await apiClient.post('/auth/change-password', { current_password, new_password })
  },
}
