// Shared types for user management components

export interface UserData {
  id: string
  name: string | null
  email: string
  role: string
  banned: boolean | null
  banReason: string | null
  banExpires: Date | null
  createdAt: Date
}

export interface FarmData {
  id: string
  name: string
  location: string | null
  type: string
  farmRole: string
}

export interface FarmAssignment {
  farmId: string
  role: string
  farmName: string
}
