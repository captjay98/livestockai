async function test() {
  try {
    const { getDb } = await import('./app/lib/db/index')
    const db = await getDb()

    await db.selectFrom('users').select('id').limit(1).execute()

    await db.selectFrom('user_settings').select('id').limit(1).execute()
  } catch (err: any) {
    if (err.message.includes('relation "user_settings" does not exist')) {
      throw new Error('CRITICAL: user_settings table is missing!')
    }
    throw err
  }
}

test()
