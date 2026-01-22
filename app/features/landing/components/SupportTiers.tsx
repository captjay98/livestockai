/**
 * Support tiers section
 */

export function SupportTiers() {
  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-3 gap-6">
          <div className="border rounded-lg p-6">
            <h3 className="text-xl font-bold mb-2">Community</h3>
            <p className="text-muted-foreground mb-4">Free community support</p>
          </div>
          <div className="border rounded-lg p-6">
            <h3 className="text-xl font-bold mb-2">Pro</h3>
            <p className="text-muted-foreground mb-4">Priority email support</p>
          </div>
          <div className="border rounded-lg p-6">
            <h3 className="text-xl font-bold mb-2">Enterprise</h3>
            <p className="text-muted-foreground mb-4">Dedicated support team</p>
          </div>
        </div>
      </div>
    </section>
  )
}
