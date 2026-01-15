interface EmailTemplate {
  subject: string
  html: string
}

// Brand colors matching app theme
const COLORS = {
  primary: '#ff9940',
  destructive: '#ff3333',
  success: '#059669',
  warning: '#f59e0b',
  info: '#2563eb',
  text: '#5c6166',
  muted: '#828a95',
  border: '#e6e4e4',
  background: '#fbfbfb',
  card: '#ffffff',
}

function emailLayout(content: string, accentColor: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: ${COLORS.background}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: ${COLORS.background}; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 560px; background-color: ${COLORS.card}; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); overflow: hidden;">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, ${accentColor} 0%, ${accentColor}dd 100%); padding: 24px 32px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <span style="font-size: 24px; font-weight: 700; color: #ffffff; letter-spacing: -0.5px;">OpenLivestock</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding: 32px;">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding: 24px 32px; border-top: 1px solid ${COLORS.border}; background-color: ${COLORS.background};">
              <p style="margin: 0; font-size: 13px; color: ${COLORS.muted}; text-align: center;">
                You're receiving this because you enabled notifications in OpenLivestock.
              </p>
              <p style="margin: 8px 0 0 0; font-size: 13px; color: ${COLORS.muted}; text-align: center;">
                <a href="#" style="color: ${COLORS.primary}; text-decoration: none;">Manage preferences</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

export const emailTemplates = {
  highMortality: (message: string, species: string): EmailTemplate => ({
    subject: `🚨 High Mortality Alert - ${species}`,
    html: emailLayout(
      `
      <div style="text-align: center; margin-bottom: 24px;">
        <span style="display: inline-block; width: 56px; height: 56px; background-color: #fef2f2; border-radius: 50%; line-height: 56px; font-size: 28px;">🚨</span>
      </div>
      <h1 style="margin: 0 0 16px 0; font-size: 22px; font-weight: 600; color: ${COLORS.destructive}; text-align: center;">
        High Mortality Alert
      </h1>
      <p style="margin: 0 0 24px 0; font-size: 16px; color: ${COLORS.text}; text-align: center; line-height: 1.6;">
        ${message}
      </p>
      <div style="background-color: #fef2f2; border-radius: 8px; padding: 16px; border-left: 4px solid ${COLORS.destructive};">
        <p style="margin: 0; font-size: 14px; color: ${COLORS.text};">
          <strong>Action Required:</strong> Please investigate immediately to prevent further losses.
        </p>
      </div>
      `,
      COLORS.destructive,
    ),
  }),

  lowStock: (itemName: string, quantity: number): EmailTemplate => ({
    subject: `⚠️ Low Stock Alert - ${itemName}`,
    html: emailLayout(
      `
      <div style="text-align: center; margin-bottom: 24px;">
        <span style="display: inline-block; width: 56px; height: 56px; background-color: #fffbeb; border-radius: 50%; line-height: 56px; font-size: 28px;">📦</span>
      </div>
      <h1 style="margin: 0 0 16px 0; font-size: 22px; font-weight: 600; color: ${COLORS.warning}; text-align: center;">
        Low Stock Warning
      </h1>
      <p style="margin: 0 0 24px 0; font-size: 16px; color: ${COLORS.text}; text-align: center; line-height: 1.6;">
        <strong>${itemName}</strong> is running low and needs restocking.
      </p>
      <div style="background-color: ${COLORS.background}; border-radius: 8px; padding: 20px; text-align: center;">
        <p style="margin: 0 0 4px 0; font-size: 13px; color: ${COLORS.muted}; text-transform: uppercase; letter-spacing: 0.5px;">Current Quantity</p>
        <p style="margin: 0; font-size: 32px; font-weight: 700; color: ${COLORS.warning};">${quantity.toFixed(1)} kg</p>
      </div>
      `,
      COLORS.warning,
    ),
  }),

  invoiceDue: (
    invoiceNumber: string,
    customerName: string,
    daysUntilDue: number,
  ): EmailTemplate => ({
    subject: `📋 Invoice ${invoiceNumber} Due Soon`,
    html: emailLayout(
      `
      <div style="text-align: center; margin-bottom: 24px;">
        <span style="display: inline-block; width: 56px; height: 56px; background-color: #eff6ff; border-radius: 50%; line-height: 56px; font-size: 28px;">💰</span>
      </div>
      <h1 style="margin: 0 0 16px 0; font-size: 22px; font-weight: 600; color: ${COLORS.info}; text-align: center;">
        Invoice Due Reminder
      </h1>
      <p style="margin: 0 0 24px 0; font-size: 16px; color: ${COLORS.text}; text-align: center; line-height: 1.6;">
        Payment for <strong>${customerName}</strong> is coming up.
      </p>
      <div style="background-color: ${COLORS.background}; border-radius: 8px; padding: 20px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid ${COLORS.border};">
              <span style="font-size: 14px; color: ${COLORS.muted};">Invoice</span>
            </td>
            <td style="padding: 8px 0; border-bottom: 1px solid ${COLORS.border}; text-align: right;">
              <span style="font-size: 14px; font-weight: 600; color: ${COLORS.text};">${invoiceNumber}</span>
            </td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid ${COLORS.border};">
              <span style="font-size: 14px; color: ${COLORS.muted};">Customer</span>
            </td>
            <td style="padding: 8px 0; border-bottom: 1px solid ${COLORS.border}; text-align: right;">
              <span style="font-size: 14px; font-weight: 600; color: ${COLORS.text};">${customerName}</span>
            </td>
          </tr>
          <tr>
            <td style="padding: 8px 0;">
              <span style="font-size: 14px; color: ${COLORS.muted};">Due In</span>
            </td>
            <td style="padding: 8px 0; text-align: right;">
              <span style="font-size: 14px; font-weight: 600; color: ${COLORS.info};">${daysUntilDue} days</span>
            </td>
          </tr>
        </table>
      </div>
      `,
      COLORS.info,
    ),
  }),

  batchHarvest: (
    batchName: string,
    species: string,
    daysUntilHarvest: number,
    quantity: number,
  ): EmailTemplate => ({
    subject: `🌾 Batch Ready for Harvest - ${batchName || species}`,
    html: emailLayout(
      `
      <div style="text-align: center; margin-bottom: 24px;">
        <span style="display: inline-block; width: 56px; height: 56px; background-color: #ecfdf5; border-radius: 50%; line-height: 56px; font-size: 28px;">🎉</span>
      </div>
      <h1 style="margin: 0 0 16px 0; font-size: 22px; font-weight: 600; color: ${COLORS.success}; text-align: center;">
        Harvest Time Approaching!
      </h1>
      <p style="margin: 0 0 24px 0; font-size: 16px; color: ${COLORS.text}; text-align: center; line-height: 1.6;">
        <strong>${batchName || species}</strong> is ready for harvest soon.
      </p>
      <div style="background-color: ${COLORS.background}; border-radius: 8px; padding: 20px; display: flex; justify-content: space-around;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td width="50%" style="text-align: center; padding: 12px;">
              <p style="margin: 0 0 4px 0; font-size: 13px; color: ${COLORS.muted}; text-transform: uppercase; letter-spacing: 0.5px;">Days Left</p>
              <p style="margin: 0; font-size: 28px; font-weight: 700; color: ${COLORS.success};">${daysUntilHarvest}</p>
            </td>
            <td width="50%" style="text-align: center; padding: 12px; border-left: 1px solid ${COLORS.border};">
              <p style="margin: 0 0 4px 0; font-size: 13px; color: ${COLORS.muted}; text-transform: uppercase; letter-spacing: 0.5px;">Quantity</p>
              <p style="margin: 0; font-size: 28px; font-weight: 700; color: ${COLORS.text};">${quantity}</p>
            </td>
          </tr>
        </table>
      </div>
      <p style="margin: 24px 0 0 0; font-size: 14px; color: ${COLORS.muted}; text-align: center;">
        Start preparing for sale and coordinate with buyers.
      </p>
      `,
      COLORS.success,
    ),
  }),

  test: (): EmailTemplate => ({
    subject: '✅ OpenLivestock Test Email',
    html: emailLayout(
      `
      <div style="text-align: center; margin-bottom: 24px;">
        <span style="display: inline-block; width: 56px; height: 56px; background-color: #fff7ed; border-radius: 50%; line-height: 56px; font-size: 28px;">✅</span>
      </div>
      <h1 style="margin: 0 0 16px 0; font-size: 22px; font-weight: 600; color: ${COLORS.primary}; text-align: center;">
        Email Integration Working!
      </h1>
      <p style="margin: 0 0 24px 0; font-size: 16px; color: ${COLORS.text}; text-align: center; line-height: 1.6;">
        Your email notifications are configured correctly. You'll now receive alerts for important farm events.
      </p>
      <div style="background-color: #fff7ed; border-radius: 8px; padding: 16px; text-align: center;">
        <p style="margin: 0; font-size: 14px; color: ${COLORS.text};">
          🔔 Mortality alerts &nbsp;•&nbsp; 📦 Low stock &nbsp;•&nbsp; 💰 Invoice reminders &nbsp;•&nbsp; 🌾 Harvest notifications
        </p>
      </div>
      `,
      COLORS.primary,
    ),
  }),

  // === NEW NOTIFICATION TEMPLATES ===

  vaccinationDue: (
    vaccineName: string,
    batchName: string,
    daysUntilDue: number,
  ): EmailTemplate => ({
    subject: `💉 Vaccination Due - ${vaccineName}`,
    html: emailLayout(
      `
      <div style="text-align: center; margin-bottom: 24px;">
        <span style="display: inline-block; width: 56px; height: 56px; background-color: #faf5ff; border-radius: 50%; line-height: 56px; font-size: 28px;">💉</span>
      </div>
      <h1 style="margin: 0 0 16px 0; font-size: 22px; font-weight: 600; color: #9333ea; text-align: center;">
        Vaccination Due Soon
      </h1>
      <p style="margin: 0 0 24px 0; font-size: 16px; color: ${COLORS.text}; text-align: center; line-height: 1.6;">
        <strong>${batchName}</strong> needs <strong>${vaccineName}</strong> vaccination.
      </p>
      <div style="background-color: #faf5ff; border-radius: 8px; padding: 20px; text-align: center; border-left: 4px solid #9333ea;">
        <p style="margin: 0 0 4px 0; font-size: 13px; color: ${COLORS.muted};">Due In</p>
        <p style="margin: 0; font-size: 32px; font-weight: 700; color: #9333ea;">${daysUntilDue} days</p>
      </div>
      <p style="margin: 24px 0 0 0; font-size: 14px; color: ${COLORS.muted}; text-align: center;">
        Timely vaccination prevents disease outbreaks and protects your flock.
      </p>
      `,
      '#9333ea',
    ),
  }),

  medicationExpiry: (
    medicationName: string,
    daysUntilExpiry: number,
    quantity: number,
    unit: string,
  ): EmailTemplate => ({
    subject: `⏰ Medication Expiring - ${medicationName}`,
    html: emailLayout(
      `
      <div style="text-align: center; margin-bottom: 24px;">
        <span style="display: inline-block; width: 56px; height: 56px; background-color: #fef2f2; border-radius: 50%; line-height: 56px; font-size: 28px;">⏰</span>
      </div>
      <h1 style="margin: 0 0 16px 0; font-size: 22px; font-weight: 600; color: ${COLORS.destructive}; text-align: center;">
        Medication Expiring Soon
      </h1>
      <p style="margin: 0 0 24px 0; font-size: 16px; color: ${COLORS.text}; text-align: center; line-height: 1.6;">
        <strong>${medicationName}</strong> will expire soon. Use or replace before expiry.
      </p>
      <div style="background-color: ${COLORS.background}; border-radius: 8px; padding: 20px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td width="50%" style="text-align: center; padding: 12px;">
              <p style="margin: 0 0 4px 0; font-size: 13px; color: ${COLORS.muted};">Expires In</p>
              <p style="margin: 0; font-size: 28px; font-weight: 700; color: ${COLORS.destructive};">${daysUntilExpiry} days</p>
            </td>
            <td width="50%" style="text-align: center; padding: 12px; border-left: 1px solid ${COLORS.border};">
              <p style="margin: 0 0 4px 0; font-size: 13px; color: ${COLORS.muted};">Remaining</p>
              <p style="margin: 0; font-size: 28px; font-weight: 700; color: ${COLORS.text};">${quantity} ${unit}</p>
            </td>
          </tr>
        </table>
      </div>
      `,
      COLORS.destructive,
    ),
  }),

  waterQualityAlert: (
    batchName: string,
    parameter: string,
    value: number,
    safeRange: string,
  ): EmailTemplate => ({
    subject: `🌊 Water Quality Alert - ${parameter}`,
    html: emailLayout(
      `
      <div style="text-align: center; margin-bottom: 24px;">
        <span style="display: inline-block; width: 56px; height: 56px; background-color: #eff6ff; border-radius: 50%; line-height: 56px; font-size: 28px;">🌊</span>
      </div>
      <h1 style="margin: 0 0 16px 0; font-size: 22px; font-weight: 600; color: ${COLORS.info}; text-align: center;">
        Water Quality Alert
      </h1>
      <p style="margin: 0 0 24px 0; font-size: 16px; color: ${COLORS.text}; text-align: center; line-height: 1.6;">
        <strong>${parameter}</strong> is outside safe range for <strong>${batchName}</strong>.
      </p>
      <div style="background-color: #fef2f2; border-radius: 8px; padding: 20px; border-left: 4px solid ${COLORS.destructive};">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td width="50%" style="text-align: center; padding: 12px;">
              <p style="margin: 0 0 4px 0; font-size: 13px; color: ${COLORS.muted};">Current Value</p>
              <p style="margin: 0; font-size: 28px; font-weight: 700; color: ${COLORS.destructive};">${value}</p>
            </td>
            <td width="50%" style="text-align: center; padding: 12px; border-left: 1px solid ${COLORS.border};">
              <p style="margin: 0 0 4px 0; font-size: 13px; color: ${COLORS.muted};">Safe Range</p>
              <p style="margin: 0; font-size: 28px; font-weight: 700; color: ${COLORS.success};">${safeRange}</p>
            </td>
          </tr>
        </table>
      </div>
      <p style="margin: 24px 0 0 0; font-size: 14px; color: ${COLORS.muted}; text-align: center;">
        Take immediate action to prevent fish stress or mortality.
      </p>
      `,
      COLORS.info,
    ),
  }),

  weeklySummary: (data: {
    farmName: string
    period: string
    revenue: string
    expenses: string
    profit: string
    salesCount: number
    mortalityCount: number
    activeBatches: number
  }): EmailTemplate => ({
    subject: `📊 Weekly Summary - ${data.farmName}`,
    html: emailLayout(
      `
      <div style="text-align: center; margin-bottom: 24px;">
        <span style="display: inline-block; width: 56px; height: 56px; background-color: #fff7ed; border-radius: 50%; line-height: 56px; font-size: 28px;">📊</span>
      </div>
      <h1 style="margin: 0 0 8px 0; font-size: 22px; font-weight: 600; color: ${COLORS.primary}; text-align: center;">
        Weekly Summary
      </h1>
      <p style="margin: 0 0 24px 0; font-size: 14px; color: ${COLORS.muted}; text-align: center;">
        ${data.period}
      </p>
      <div style="background-color: ${COLORS.background}; border-radius: 8px; padding: 20px; margin-bottom: 16px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td width="33%" style="text-align: center; padding: 12px;">
              <p style="margin: 0 0 4px 0; font-size: 12px; color: ${COLORS.muted};">Revenue</p>
              <p style="margin: 0; font-size: 20px; font-weight: 700; color: ${COLORS.success};">${data.revenue}</p>
            </td>
            <td width="33%" style="text-align: center; padding: 12px; border-left: 1px solid ${COLORS.border};">
              <p style="margin: 0 0 4px 0; font-size: 12px; color: ${COLORS.muted};">Expenses</p>
              <p style="margin: 0; font-size: 20px; font-weight: 700; color: ${COLORS.destructive};">${data.expenses}</p>
            </td>
            <td width="33%" style="text-align: center; padding: 12px; border-left: 1px solid ${COLORS.border};">
              <p style="margin: 0 0 4px 0; font-size: 12px; color: ${COLORS.muted};">Profit</p>
              <p style="margin: 0; font-size: 20px; font-weight: 700; color: ${COLORS.primary};">${data.profit}</p>
            </td>
          </tr>
        </table>
      </div>
      <div style="background-color: ${COLORS.background}; border-radius: 8px; padding: 16px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid ${COLORS.border};">
              <span style="font-size: 14px; color: ${COLORS.muted};">Sales</span>
            </td>
            <td style="padding: 8px 0; border-bottom: 1px solid ${COLORS.border}; text-align: right;">
              <span style="font-size: 14px; font-weight: 600; color: ${COLORS.text};">${data.salesCount} transactions</span>
            </td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid ${COLORS.border};">
              <span style="font-size: 14px; color: ${COLORS.muted};">Mortality</span>
            </td>
            <td style="padding: 8px 0; border-bottom: 1px solid ${COLORS.border}; text-align: right;">
              <span style="font-size: 14px; font-weight: 600; color: ${data.mortalityCount > 0 ? COLORS.destructive : COLORS.success};">${data.mortalityCount} deaths</span>
            </td>
          </tr>
          <tr>
            <td style="padding: 8px 0;">
              <span style="font-size: 14px; color: ${COLORS.muted};">Active Batches</span>
            </td>
            <td style="padding: 8px 0; text-align: right;">
              <span style="font-size: 14px; font-weight: 600; color: ${COLORS.text};">${data.activeBatches}</span>
            </td>
          </tr>
        </table>
      </div>
      `,
      COLORS.primary,
    ),
  }),

  dailySales: (data: {
    date: string
    totalRevenue: string
    salesCount: number
    topProduct: string
    topProductQty: number
  }): EmailTemplate => ({
    subject: `💵 Daily Sales Report - ${data.date}`,
    html: emailLayout(
      `
      <div style="text-align: center; margin-bottom: 24px;">
        <span style="display: inline-block; width: 56px; height: 56px; background-color: #ecfdf5; border-radius: 50%; line-height: 56px; font-size: 28px;">💵</span>
      </div>
      <h1 style="margin: 0 0 8px 0; font-size: 22px; font-weight: 600; color: ${COLORS.success}; text-align: center;">
        Daily Sales Report
      </h1>
      <p style="margin: 0 0 24px 0; font-size: 14px; color: ${COLORS.muted}; text-align: center;">
        ${data.date}
      </p>
      <div style="background-color: #ecfdf5; border-radius: 8px; padding: 24px; text-align: center; margin-bottom: 16px;">
        <p style="margin: 0 0 4px 0; font-size: 13px; color: ${COLORS.muted};">Total Revenue</p>
        <p style="margin: 0; font-size: 36px; font-weight: 700; color: ${COLORS.success};">${data.totalRevenue}</p>
        <p style="margin: 8px 0 0 0; font-size: 14px; color: ${COLORS.text};">${data.salesCount} sale${data.salesCount !== 1 ? 's' : ''}</p>
      </div>
      ${
        data.topProduct
          ? `
      <div style="background-color: ${COLORS.background}; border-radius: 8px; padding: 16px; text-align: center;">
        <p style="margin: 0 0 4px 0; font-size: 13px; color: ${COLORS.muted};">Top Seller</p>
        <p style="margin: 0; font-size: 16px; font-weight: 600; color: ${COLORS.text};">${data.topProduct} (${data.topProductQty} units)</p>
      </div>
      `
          : ''
      }
      `,
      COLORS.success,
    ),
  }),

  batchPerformance: (data: {
    batchName: string
    species: string
    ageWeeks: number
    currentWeight: string
    targetWeight: string
    fcr: string
    mortalityRate: string
    status: 'good' | 'warning' | 'poor'
  }): EmailTemplate => ({
    subject: `📈 Batch Performance - ${data.batchName || data.species}`,
    html: emailLayout(
      `
      <div style="text-align: center; margin-bottom: 24px;">
        <span style="display: inline-block; width: 56px; height: 56px; background-color: ${data.status === 'good' ? '#ecfdf5' : data.status === 'warning' ? '#fffbeb' : '#fef2f2'}; border-radius: 50%; line-height: 56px; font-size: 28px;">📈</span>
      </div>
      <h1 style="margin: 0 0 8px 0; font-size: 22px; font-weight: 600; color: ${data.status === 'good' ? COLORS.success : data.status === 'warning' ? COLORS.warning : COLORS.destructive}; text-align: center;">
        Batch Performance Report
      </h1>
      <p style="margin: 0 0 24px 0; font-size: 14px; color: ${COLORS.muted}; text-align: center;">
        ${data.batchName || data.species} • Week ${data.ageWeeks}
      </p>
      <div style="background-color: ${COLORS.background}; border-radius: 8px; padding: 20px; margin-bottom: 16px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td width="50%" style="text-align: center; padding: 12px;">
              <p style="margin: 0 0 4px 0; font-size: 12px; color: ${COLORS.muted};">Current Weight</p>
              <p style="margin: 0; font-size: 24px; font-weight: 700; color: ${COLORS.text};">${data.currentWeight}</p>
            </td>
            <td width="50%" style="text-align: center; padding: 12px; border-left: 1px solid ${COLORS.border};">
              <p style="margin: 0 0 4px 0; font-size: 12px; color: ${COLORS.muted};">Target Weight</p>
              <p style="margin: 0; font-size: 24px; font-weight: 700; color: ${COLORS.muted};">${data.targetWeight}</p>
            </td>
          </tr>
        </table>
      </div>
      <div style="background-color: ${COLORS.background}; border-radius: 8px; padding: 16px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid ${COLORS.border};">
              <span style="font-size: 14px; color: ${COLORS.muted};">FCR</span>
            </td>
            <td style="padding: 8px 0; border-bottom: 1px solid ${COLORS.border}; text-align: right;">
              <span style="font-size: 14px; font-weight: 600; color: ${COLORS.text};">${data.fcr}</span>
            </td>
          </tr>
          <tr>
            <td style="padding: 8px 0;">
              <span style="font-size: 14px; color: ${COLORS.muted};">Mortality Rate</span>
            </td>
            <td style="padding: 8px 0; text-align: right;">
              <span style="font-size: 14px; font-weight: 600; color: ${parseFloat(data.mortalityRate) > 5 ? COLORS.destructive : COLORS.success};">${data.mortalityRate}</span>
            </td>
          </tr>
        </table>
      </div>
      `,
      data.status === 'good'
        ? COLORS.success
        : data.status === 'warning'
          ? COLORS.warning
          : COLORS.destructive,
    ),
  }),

  paymentReceived: (data: {
    invoiceNumber: string
    customerName: string
    amount: string
    paymentMethod: string
  }): EmailTemplate => ({
    subject: `✅ Payment Received - ${data.invoiceNumber}`,
    html: emailLayout(
      `
      <div style="text-align: center; margin-bottom: 24px;">
        <span style="display: inline-block; width: 56px; height: 56px; background-color: #ecfdf5; border-radius: 50%; line-height: 56px; font-size: 28px;">✅</span>
      </div>
      <h1 style="margin: 0 0 16px 0; font-size: 22px; font-weight: 600; color: ${COLORS.success}; text-align: center;">
        Payment Received!
      </h1>
      <p style="margin: 0 0 24px 0; font-size: 16px; color: ${COLORS.text}; text-align: center; line-height: 1.6;">
        <strong>${data.customerName}</strong> has paid invoice <strong>${data.invoiceNumber}</strong>.
      </p>
      <div style="background-color: #ecfdf5; border-radius: 8px; padding: 24px; text-align: center; margin-bottom: 16px;">
        <p style="margin: 0 0 4px 0; font-size: 13px; color: ${COLORS.muted};">Amount Received</p>
        <p style="margin: 0; font-size: 36px; font-weight: 700; color: ${COLORS.success};">${data.amount}</p>
        <p style="margin: 8px 0 0 0; font-size: 14px; color: ${COLORS.text};">via ${data.paymentMethod}</p>
      </div>
      `,
      COLORS.success,
    ),
  }),
}
