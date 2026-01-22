/**
 * Landing hero section
 */

export function LandingHero() {
  return (
    <section className="py-24">
      <div className="container mx-auto px-4 text-center">
        <h1 className="text-5xl font-bold tracking-tight mb-6">
          OpenLivestock
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
          Modern livestock management for modern farmers. Track health,
          inventory, sales and more.
        </p>
        <div className="flex justify-center gap-4">
          <a
            href="/login"
            className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-primary-foreground hover:bg-primary/90"
          >
            Get Started
          </a>
          <a
            href="/docs"
            className="inline-flex items-center justify-center rounded-md border px-6 py-3 hover:bg-muted"
          >
            Documentation
          </a>
        </div>
      </div>
    </section>
  )
}
