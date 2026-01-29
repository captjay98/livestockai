import { ErrorMap } from './error-map'
import type { ReasonCode } from './error-map'
import type { ErrorMetadata } from './types'

export class AppError extends Error {
  public readonly reason: ReasonCode
  public readonly code: number
  public readonly httpStatus: number
  public readonly category: string
  public readonly metadata: ErrorMetadata

  constructor(
    reason: ReasonCode,
    options?: {
      message?: string
      metadata?: ErrorMetadata
      cause?: unknown
    },
  ) {
    const def = ErrorMap[reason]
    super(options?.message || def.message)
    this.name = 'AppError'
    this.reason = reason
    this.code = def.code
    this.httpStatus = def.httpStatus
    this.category = def.category
    this.metadata = options?.metadata ?? {}
    this.cause = options?.cause
  }

  toJSON() {
    return {
      name: this.name,
      reason: this.reason,
      code: this.code,
      httpStatus: this.httpStatus,
      category: this.category,
      message: this.message,
      metadata: this.metadata,
    }
  }

  static isAppError(error: unknown): error is AppError {
    return (
      error instanceof AppError ||
      (error instanceof Error && error.name === 'AppError')
    )
  }

  static fromJSON(json: ReturnType<AppError['toJSON']>): AppError {
    const err = new AppError(json.reason, {
      metadata: json.metadata,
      message: json.message,
    })
    return err
  }
}
