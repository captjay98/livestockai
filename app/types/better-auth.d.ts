declare module 'better-auth/types' {
    interface User {
        role: 'admin' | 'user'
        banned: boolean
        banReason: string | null
        banExpires: Date | null
    }
}
