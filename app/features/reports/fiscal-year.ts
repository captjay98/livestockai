/**
 * Fiscal Year Utilities
 *
 * Handles fiscal year date calculations for financial reports.
 */

/**
 * Get the start date of the fiscal year for a given date
 */
export function getFiscalYearStart(
    fiscalStartMonth: number,
    date: Date = new Date(),
): Date {
    const year = date.getFullYear()
    const month = date.getMonth() + 1

    if (month < fiscalStartMonth) {
        return new Date(year - 1, fiscalStartMonth - 1, 1)
    }
    return new Date(year, fiscalStartMonth - 1, 1)
}

/**
 * Get the end date of the fiscal year for a given date
 */
export function getFiscalYearEnd(
    fiscalStartMonth: number,
    date: Date = new Date(),
): Date {
    const start = getFiscalYearStart(fiscalStartMonth, date)
    return new Date(start.getFullYear() + 1, start.getMonth(), 0)
}

/**
 * Get a label for the fiscal year
 */
export function getFiscalYearLabel(
    fiscalStartMonth: number,
    date: Date = new Date(),
): string {
    const start = getFiscalYearStart(fiscalStartMonth, date)
    const end = getFiscalYearEnd(fiscalStartMonth, date)
    return `FY ${start.getFullYear()}-${end.getFullYear()}`
}
