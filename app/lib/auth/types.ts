export interface User {
  id: string
  email: string
  name: string
  role: 'admin' | 'user'
  banned?: boolean
  banReason?: string | null
  banExpires?: Date | null
  createdAt: Date
  updatedAt: Date
}

export interface Session {
  id: string
  userId: string
  expiresAt: Date
  createdAt: Date
}

export interface AuthContext {
  user: User | null
  session: Session | null
  isLoading: boolean
  isAuthenticated: boolean
}
