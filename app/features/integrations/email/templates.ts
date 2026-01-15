interface EmailTemplate {
  subject: string
  html: string
}

export const emailTemplates = {
  highMortality: (message: string, species: string): EmailTemplate => ({
    subject: `🚨 High Mortality Alert - ${species}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc2626;">⚠️ High Mortality Alert</h2>
        <p style="font-size: 16px; color: #374151;">${message}</p>
        <p style="color: #6b7280; font-size: 14px;">Please investigate immediately.</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
        <p style="color: #9ca3af; font-size: 12px;">OpenLivestock Manager</p>
      </div>
    `,
  }),

  lowStock: (itemName: string, quantity: number): EmailTemplate => ({
    subject: `⚠️ Low Stock Alert - ${itemName}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #f59e0b;">📦 Low Stock Warning</h2>
        <p style="font-size: 16px; color: #374151;"><strong>${itemName}</strong> is running low.</p>
        <p style="font-size: 14px; color: #6b7280;">Current quantity: ${quantity.toFixed(1)}</p>
        <p style="color: #6b7280; font-size: 14px;">Consider restocking soon.</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
        <p style="color: #9ca3af; font-size: 12px;">OpenLivestock Manager</p>
      </div>
    `,
  }),

  invoiceDue: (
    invoiceNumber: string,
    customerName: string,
    daysUntilDue: number,
  ): EmailTemplate => ({
    subject: `📋 Invoice ${invoiceNumber} Due Soon`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #3b82f6;">💰 Invoice Due Reminder</h2>
        <p style="font-size: 16px; color: #374151;">Invoice <strong>${invoiceNumber}</strong> for <strong>${customerName}</strong> is due in ${daysUntilDue} days.</p>
        <p style="color: #6b7280; font-size: 14px;">Please follow up on payment.</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
        <p style="color: #9ca3af; font-size: 12px;">OpenLivestock Manager</p>
      </div>
    `,
  }),

  batchHarvest: (
    batchName: string,
    species: string,
    daysUntilHarvest: number,
    quantity: number,
  ): EmailTemplate => ({
    subject: `🌾 Batch Ready for Harvest - ${batchName || species}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #10b981;">🎉 Harvest Time Approaching</h2>
        <p style="font-size: 16px; color: #374151;"><strong>${batchName || species}</strong> batch is ready for harvest in ${daysUntilHarvest} days.</p>
        <p style="font-size: 14px; color: #6b7280;">Current quantity: ${quantity} units</p>
        <p style="color: #6b7280; font-size: 14px;">Start preparing for sale.</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
        <p style="color: #9ca3af; font-size: 12px;">OpenLivestock Manager</p>
      </div>
    `,
  }),

  test: (): EmailTemplate => ({
    subject: '✅ OpenLivestock Test Email',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #10b981;">✅ Email Integration Working!</h2>
        <p style="font-size: 16px; color: #374151;">Your email integration is configured correctly.</p>
        <p style="color: #6b7280; font-size: 14px;">You will now receive critical alerts via email.</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
        <p style="color: #9ca3af; font-size: 12px;">OpenLivestock Manager</p>
      </div>
    `,
  }),
}
