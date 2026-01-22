/**
 * Call-to-action section component
 */

export function CTASection() {
  return (
    <section className="py-16 bg-muted/50">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-3xl font-bold mb-4">Ready to get started?</h2>
        <p className="text-muted-foreground mb-6">
          Start managing your livestock today.
        </p>
        <a
          href="/login"
          className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-primary-foreground hover:bg-primary/90"
        >
          Get Started
        </a>
      </div>
    </section>
  )
}
