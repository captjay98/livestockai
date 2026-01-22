/**
 * Roadmap timeline section
 */

export function RoadmapTimeline() {
  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto space-y-8">
          <div className="border-l-2 border-primary pl-6">
            <h3 className="text-xl font-bold">Q1 2025 - Foundation</h3>
            <ul className="mt-2 space-y-2 text-muted-foreground">
              <li>Core batch management</li>
              <li>Health tracking</li>
              <li>Inventory management</li>
            </ul>
          </div>
          <div className="border-l-2 border-muted pl-6">
            <h3 className="text-xl font-bold">Q2 2025 - Growth</h3>
            <ul className="mt-2 space-y-2 text-muted-foreground">
              <li>Advanced analytics</li>
              <li>Mobile app</li>
              <li>Multi-tenant support</li>
            </ul>
          </div>
          <div className="border-l-2 border-dashed pl-6">
            <h3 className="text-xl font-bold">Q3+ 2025 - Scale</h3>
            <p className="mt-2 text-muted-foreground">
              AI predictions, integrations, and more.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
