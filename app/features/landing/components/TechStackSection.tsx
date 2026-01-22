/**
 * Tech stack section for landing page
 */

export function TechStackSection() {
  return (
    <section className="py-16">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-2xl font-bold mb-8">Built with Modern Technology</h2>
        <div className="flex flex-wrap justify-center gap-4">
          <span className="px-3 py-1 bg-muted rounded">React 19</span>
          <span className="px-3 py-1 bg-muted rounded">TanStack Router</span>
          <span className="px-3 py-1 bg-muted rounded">Kysely</span>
          <span className="px-3 py-1 bg-muted rounded">PostgreSQL</span>
          <span className="px-3 py-1 bg-muted rounded">Cloudflare Workers</span>
        </div>
      </div>
    </section>
  )
}
