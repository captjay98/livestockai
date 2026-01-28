/**
 * Extension Worker Mode Constants
 * Configurable via environment variables
 */

export const EXTENSION_DEFAULTS = {
    /** Time window (hours) for editing visit records after creation */
    VISIT_EDIT_WINDOW_HOURS: Number(process.env.VISIT_EDIT_WINDOW_HOURS) || 24,

    /** Days until pending access requests auto-expire */
    ACCESS_REQUEST_EXPIRY_DAYS:
        Number(process.env.ACCESS_REQUEST_EXPIRY_DAYS) || 30,

    /** Default duration (days) for access grants */
    ACCESS_GRANT_DEFAULT_DAYS:
        Number(process.env.ACCESS_GRANT_DEFAULT_DAYS) || 90,

    /** Days before expiry to send warning notifications */
    ACCESS_EXPIRY_WARNING_DAYS:
        Number(process.env.ACCESS_EXPIRY_WARNING_DAYS) || 7,

    /** Max pending access requests per agent per day */
    MAX_ACCESS_REQUESTS_PER_DAY: 5,

    /** Max farms per district dashboard query */
    MAX_FARMS_PER_QUERY: 100,

    /** Default page size for district dashboard */
    DEFAULT_PAGE_SIZE: 50,
} as const

/** Minimum farms required to trigger outbreak alert */
export const OUTBREAK_MIN_FARMS = 3

/** Minimum batch size to include in outbreak detection */
export const OUTBREAK_MIN_BATCH_SIZE = 50

/** Minimum batch age (days) to include in outbreak detection */
export const OUTBREAK_MIN_BATCH_AGE = 7

/** Days to look back for outbreak detection */
export const OUTBREAK_WINDOW_DAYS = 7

/** Visit attachment constraints */
export const VISIT_ATTACHMENT = {
    MAX_SIZE_BYTES: 5 * 1024 * 1024, // 5MB
    ALLOWED_TYPES: ['image/jpeg', 'image/png', 'application/pdf'],
    PATH_PREFIX: 'visit-records',
} as const
