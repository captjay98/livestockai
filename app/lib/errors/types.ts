export interface ErrorMetadata {
    userId?: string
    farmId?: string
    resourceId?: string
    resourceType?: string
    action?: string
    field?: string
    [key: string]: unknown
}

export interface ErrorDefinition {
    code: number
    httpStatus: number
    category: 'AUTH' | 'VALIDATION' | 'NOT_FOUND' | 'FORBIDDEN' | 'SERVER'
    message: string // Developer message (not shown to users)
}
