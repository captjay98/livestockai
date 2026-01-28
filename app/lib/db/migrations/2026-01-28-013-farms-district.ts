import { sql } from 'kysely'
import type { Kysely } from 'kysely'

export async function up(db: Kysely<unknown>): Promise<void> {
    // Add district_id column to farms
    await db.schema
        .alterTable('farms')
        .addColumn('districtId', 'uuid', (col) =>
            col.references('regions.id').onDelete('set null'),
        )
        .execute()

    await sql`CREATE INDEX idx_farms_district ON farms(district_id) WHERE district_id IS NOT NULL`.execute(
        db,
    )

    // Trigger to validate district is level 2
    await sql`
    CREATE OR REPLACE FUNCTION validate_farm_district() RETURNS TRIGGER AS $$
    BEGIN
      IF NEW.district_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM regions WHERE id = NEW.district_id AND level = 2) THEN
          RAISE EXCEPTION 'Farm district must be a level 2 region';
        END IF;
      END IF;
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql
  `.execute(db)

    await sql`
    CREATE TRIGGER check_farm_district
      BEFORE INSERT OR UPDATE OF district_id ON farms
      FOR EACH ROW EXECUTE FUNCTION validate_farm_district()
  `.execute(db)

    // Trigger to revoke access grants when farm changes district
    await sql`
    CREATE OR REPLACE FUNCTION revoke_grants_on_district_change() RETURNS TRIGGER AS $$
    BEGIN
      IF OLD.district_id IS DISTINCT FROM NEW.district_id THEN
        UPDATE access_grants
        SET revoked_at = NOW(),
            revoked_reason = 'Farm changed district'
        WHERE farm_id = NEW.id
          AND revoked_at IS NULL
          AND expires_at > NOW();
      END IF;
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql
  `.execute(db)

    await sql`
    CREATE TRIGGER revoke_grants_on_district_change
      AFTER UPDATE OF district_id ON farms
      FOR EACH ROW EXECUTE FUNCTION revoke_grants_on_district_change()
  `.execute(db)
}

export async function down(db: Kysely<unknown>): Promise<void> {
    await sql`DROP TRIGGER IF EXISTS revoke_grants_on_district_change ON farms`.execute(
        db,
    )
    await sql`DROP FUNCTION IF EXISTS revoke_grants_on_district_change()`.execute(
        db,
    )
    await sql`DROP TRIGGER IF EXISTS check_farm_district ON farms`.execute(db)
    await sql`DROP FUNCTION IF EXISTS validate_farm_district()`.execute(db)
    await sql`DROP INDEX IF EXISTS idx_farms_district`.execute(db)
    await db.schema.alterTable('farms').dropColumn('districtId').execute()
}
