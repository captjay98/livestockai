/**
 * Advanced features section
 */

export function AdvancedFeatures() {
  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl font-bold text-center mb-8">Advanced Capabilities</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="border rounded-lg p-6">
            <h3 className="text-lg font-bold">Smart Alerts</h3>
            <p className="text-muted-foreground mt-2">AI-powered health & inventory alerts</p>
          </div>
          <div className="border rounded-lg p-6">
            <h3 className="text-lg font-bold">Offline First</h3>
            <p className="text-muted-foreground mt-2">Works without internet connection</p>
          </div>
        </div>
      </div>
    </section>
  )
}
