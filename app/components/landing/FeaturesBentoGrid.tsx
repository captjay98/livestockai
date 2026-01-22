/**
 * Features bento grid section
 */

export function FeaturesBentoGrid() {
  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="border rounded-lg p-6">
            <h3 className="text-lg font-bold">Batch Management</h3>
            <p className="text-muted-foreground mt-2">
              Track batches across all species
            </p>
          </div>
          <div className="border rounded-lg p-6">
            <h3 className="text-lg font-bold">Health Monitoring</h3>
            <p className="text-muted-foreground mt-2">
              Vaccinations, treatments & mortality
            </p>
          </div>
          <div className="border rounded-lg p-6">
            <h3 className="text-lg font-bold">Inventory</h3>
            <p className="text-muted-foreground mt-2">
              Feed & medication tracking
            </p>
          </div>
          <div className="border rounded-lg p-6">
            <h3 className="text-lg font-bold">Reports</h3>
            <p className="text-muted-foreground mt-2">Analytics & insights</p>
          </div>
          <div className="border rounded-lg p-6">
            <h3 className="text-lg font-bold">Invoicing</h3>
            <p className="text-muted-foreground mt-2">
              Sales & payment tracking
            </p>
          </div>
          <div className="border rounded-lg p-6">
            <h3 className="text-lg font-bold">Multi-Farm</h3>
            <p className="text-muted-foreground mt-2">
              Manage multiple locations
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
