import { createNotification } from './server'

/**
 * Send external notification (email/SMS) if configured
 * Fire-and-forget - errors are logged but don't block
 */
async function sendExternalNotification(
  userId: string,
  type: 'lowStock' | 'highMortality' | 'invoiceDue' | 'batchHarvest',
  templateData: Record<string, unknown>,
): Promise<void> {
  try {
    const { db } = await import('~/lib/db')
    const { INTEGRATIONS } = await import('../integrations/config')

    if (!INTEGRATIONS.email) return

    const user = await db
      .selectFrom('users')
      .select(['email'])
      .where('id', '=', userId)
      .executeTakeFirst()

    if (!user?.email) return

    const { sendEmail } = await import('../integrations/email')
    const { emailTemplates } = await import('../integrations/email')

    let template
    switch (type) {
      case 'lowStock':
        template = emailTemplates.lowStock(
          templateData.itemName as string,
          templateData.quantity as number,
        )
        break
      case 'invoiceDue':
        template = emailTemplates.invoiceDue(
          templateData.invoiceNumber as string,
          templateData.customerName as string,
          templateData.daysUntilDue as number,
        )
        break
      case 'batchHarvest':
        template = emailTemplates.batchHarvest(
          templateData.batchName as string,
          templateData.species as string,
          templateData.daysUntilHarvest as number,
          templateData.quantity as number,
        )
        break
      default:
        return
    }

    await sendEmail({ to: user.email, ...template })
  } catch (error) {
    console.error('External notification failed:', error)
  }
}

/**
 * Check for low stock and create notifications
 */
export async function checkLowStockNotifications(
  userId: string,
  farmId?: string,
): Promise<number> {
  const { db } = await import('~/lib/db')
  const { getUserFarms } = await import('../auth/utils')

  // Get user settings
  const settings = await db
    .selectFrom('user_settings')
    .select(['notifications'])
    .where('userId', '=', userId)
    .executeTakeFirst()

  if (!settings?.notifications.lowStock) {
    return 0
  }

  // Determine target farms
  let targetFarmIds: Array<string> = []
  if (farmId) {
    targetFarmIds = [farmId]
  } else {
    targetFarmIds = await getUserFarms(userId)
  }

  if (targetFarmIds.length === 0) return 0

  let notificationCount = 0

  // Check feed inventory
  const lowFeedItems = await db
    .selectFrom('feed_inventory')
    .select([
      'id',
      'farmId',
      'feedType',
      'quantityKg',
      'minThresholdKg',
      'updatedAt',
    ])
    .where('farmId', 'in', targetFarmIds)
    .where((eb) => eb('quantityKg', '<', eb.ref('minThresholdKg')))
    .execute()

  // Batch query existing notifications for all feed items
  const existingFeedNotifications = await db
    .selectFrom('notifications')
    .select(['metadata'])
    .where('userId', '=', userId)
    .where('type', '=', 'lowStock')
    .where('read', '=', false)
    .execute()

  const existingFeedMap = new Map<string, boolean>()
  for (const notif of existingFeedNotifications) {
    const meta = notif.metadata as { feedType?: string; farmId?: string }
    if (meta.feedType && meta.farmId) {
      existingFeedMap.set(`${meta.feedType}-${meta.farmId}`, true)
    }
  }

  for (const item of lowFeedItems) {
    const key = `${item.feedType}-${item.farmId}`
    if (!existingFeedMap.has(key)) {
      await createNotification({
        userId,
        farmId: item.farmId,
        type: 'lowStock',
        title: 'Low Feed Stock',
        message: `${item.feedType} feed is running low (${Number(item.quantityKg).toFixed(1)}kg remaining)`,
        actionUrl: '/inventory',
        metadata: { feedType: item.feedType, farmId: item.farmId },
      })
      // Send external notification (fire-and-forget)
      sendExternalNotification(userId, 'lowStock', {
        itemName: item.feedType,
        quantity: Number(item.quantityKg),
      })
      notificationCount++
    }
  }

  // Check medication inventory
  const lowMedItems = await db
    .selectFrom('medication_inventory')
    .select([
      'id',
      'farmId',
      'medicationName',
      'quantity',
      'unit',
      'expiryDate',
      'minThreshold',
      'updatedAt',
    ])
    .where('farmId', 'in', targetFarmIds)
    .where((eb) => eb('quantity', '<', eb.ref('minThreshold')))
    .execute()

  // Batch query existing notifications for all medication items
  const existingMedNotifications = await db
    .selectFrom('notifications')
    .select(['metadata'])
    .where('userId', '=', userId)
    .where('type', '=', 'lowStock')
    .where('read', '=', false)
    .execute()

  const existingMedMap = new Map<string, boolean>()
  for (const notif of existingMedNotifications) {
    const meta = notif.metadata as { medicationName?: string; farmId?: string }
    if (meta.medicationName && meta.farmId) {
      existingMedMap.set(`${meta.medicationName}-${meta.farmId}`, true)
    }
  }

  for (const item of lowMedItems) {
    const key = `${item.medicationName}-${item.farmId}`
    if (!existingMedMap.has(key)) {
      await createNotification({
        userId,
        farmId: item.farmId,
        type: 'lowStock',
        title: 'Low Medication Stock',
        message: `${item.medicationName} is running low (${item.quantity} ${item.unit} remaining)`,
        actionUrl: '/inventory',
        metadata: { medicationName: item.medicationName, farmId: item.farmId },
      })
      // Send external notification (fire-and-forget)
      sendExternalNotification(userId, 'lowStock', {
        itemName: item.medicationName,
        quantity: item.quantity,
      })
      notificationCount++
    }
  }

  return notificationCount
}

/**
 * Check for invoices due soon and create notifications
 */
export async function checkInvoiceDueNotifications(
  userId: string,
  farmId?: string,
): Promise<number> {
  const { db } = await import('~/lib/db')
  const { getUserFarms } = await import('../auth/utils')

  // Get user settings
  const settings = await db
    .selectFrom('user_settings')
    .select(['notifications'])
    .where('userId', '=', userId)
    .executeTakeFirst()

  if (!settings?.notifications.invoiceDue) {
    return 0
  }

  // Determine target farms
  let targetFarmIds: Array<string> = []
  if (farmId) {
    targetFarmIds = [farmId]
  } else {
    targetFarmIds = await getUserFarms(userId)
  }

  if (targetFarmIds.length === 0) return 0

  // Check invoices due within 7 days
  const sevenDaysFromNow = new Date()
  sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7)

  const dueInvoices = await db
    .selectFrom('invoices')
    .leftJoin('customers', 'customers.id', 'invoices.customerId')
    .select([
      'invoices.id',
      'invoices.invoiceNumber',
      'invoices.dueDate',
      'invoices.totalAmount',
      'invoices.farmId',
      'customers.name as customerName',
    ])
    .where('invoices.farmId', 'in', targetFarmIds)
    .where('invoices.status', 'in', ['unpaid', 'partial'])
    .where('invoices.dueDate', 'is not', null)
    .where('invoices.dueDate', '<=', sevenDaysFromNow)
    .where('invoices.dueDate', '>=', new Date())
    .execute()

  let notificationCount = 0

  // Batch query existing notifications for all invoices
  const existingInvoiceNotifications = await db
    .selectFrom('notifications')
    .select(['metadata'])
    .where('userId', '=', userId)
    .where('type', '=', 'invoiceDue')
    .where('read', '=', false)
    .execute()

  const existingInvoiceMap = new Map<string, boolean>()
  for (const notif of existingInvoiceNotifications) {
    const meta = notif.metadata as { invoiceId?: string }
    if (meta.invoiceId) {
      existingInvoiceMap.set(meta.invoiceId, true)
    }
  }

  for (const invoice of dueInvoices) {
    if (!invoice.dueDate) continue

    if (!existingInvoiceMap.has(invoice.id)) {
      const daysUntilDue = Math.ceil(
        (new Date(invoice.dueDate).getTime() - Date.now()) /
          (1000 * 60 * 60 * 24),
      )

      await createNotification({
        userId,
        farmId: invoice.farmId,
        type: 'invoiceDue',
        title: 'Invoice Due Soon',
        message: `Invoice ${invoice.invoiceNumber} for ${invoice.customerName || 'customer'} is due in ${daysUntilDue} days`,
        actionUrl: `/invoices/${invoice.id}`,
        metadata: {
          invoiceId: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          daysUntilDue,
        },
      })
      // Send external notification (fire-and-forget)
      sendExternalNotification(userId, 'invoiceDue', {
        invoiceNumber: invoice.invoiceNumber,
        customerName: invoice.customerName || 'customer',
        daysUntilDue,
      })
      notificationCount++
    }
  }

  return notificationCount
}

/**
 * Check for batches approaching harvest date and create notifications
 */
export async function checkBatchHarvestNotifications(
  userId: string,
  farmId?: string,
): Promise<number> {
  const { db } = await import('~/lib/db')
  const { getUserFarms } = await import('../auth/utils')

  // Get user settings
  const settings = await db
    .selectFrom('user_settings')
    .select(['notifications'])
    .where('userId', '=', userId)
    .executeTakeFirst()

  if (!settings?.notifications.batchHarvest) {
    return 0
  }

  // Determine target farms
  let targetFarmIds: Array<string> = []
  if (farmId) {
    targetFarmIds = [farmId]
  } else {
    targetFarmIds = await getUserFarms(userId)
  }

  if (targetFarmIds.length === 0) return 0

  // Check batches with harvest date within 7 days
  const sevenDaysFromNow = new Date()
  sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7)

  const harvestBatches = await db
    .selectFrom('batches')
    .select([
      'id',
      'batchName',
      'species',
      'targetHarvestDate',
      'currentQuantity',
      'farmId',
    ])
    .where('farmId', 'in', targetFarmIds)
    .where('status', '=', 'active')
    .where('targetHarvestDate', 'is not', null)
    .where('targetHarvestDate', '<=', sevenDaysFromNow)
    .where('targetHarvestDate', '>=', new Date())
    .execute()

  let notificationCount = 0

  // Batch query existing notifications for all batches
  const existingBatchNotifications = await db
    .selectFrom('notifications')
    .select(['metadata'])
    .where('userId', '=', userId)
    .where('type', '=', 'batchHarvest')
    .where('read', '=', false)
    .execute()

  const existingBatchMap = new Map<string, boolean>()
  for (const notif of existingBatchNotifications) {
    const meta = notif.metadata as { batchId?: string }
    if (meta.batchId) {
      existingBatchMap.set(meta.batchId, true)
    }
  }

  for (const batch of harvestBatches) {
    if (!batch.targetHarvestDate) continue

    if (!existingBatchMap.has(batch.id)) {
      const daysUntilHarvest = Math.ceil(
        (new Date(batch.targetHarvestDate).getTime() - Date.now()) /
          (1000 * 60 * 60 * 24),
      )

      await createNotification({
        userId,
        farmId: batch.farmId,
        type: 'batchHarvest',
        title: 'Batch Ready for Harvest',
        message: `${batch.batchName || batch.species} batch is ready for harvest in ${daysUntilHarvest} days (${batch.currentQuantity} units)`,
        actionUrl: `/batches/${batch.id}`,
        metadata: {
          batchId: batch.id,
          species: batch.species,
          daysUntilHarvest,
        },
      })
      // Send external notification (fire-and-forget)
      sendExternalNotification(userId, 'batchHarvest', {
        batchName: batch.batchName || '',
        species: batch.species,
        daysUntilHarvest,
        quantity: batch.currentQuantity,
      })
      notificationCount++
    }
  }

  return notificationCount
}
