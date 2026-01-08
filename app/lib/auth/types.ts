export interface User {
  id: string
  email: string
  name: string
  role: 'admin' | 'staff'
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