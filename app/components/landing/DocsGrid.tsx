/**
 * Docs grid section
 */

export function DocsGrid() {
  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-3 gap-6">
          <a
            href="/docs/getting-started"
            className="border rounded-lg p-6 hover:bg-muted/50 transition-colors"
          >
            <h3 className="text-lg font-bold">Getting Started</h3>
            <p className="text-muted-foreground mt-2">
              Quick start guide for new users
            </p>
          </a>
          <a
            href="/docs/api"
            className="border rounded-lg p-6 hover:bg-muted/50 transition-colors"
          >
            <h3 className="text-lg font-bold">API Reference</h3>
            <p className="text-muted-foreground mt-2">
              Complete API documentation
            </p>
          </a>
          <a
            href="/docs/guides"
            className="border rounded-lg p-6 hover:bg-muted/50 transition-colors"
          >
            <h3 className="text-lg font-bold">Guides</h3>
            <p className="text-muted-foreground mt-2">Step-by-step tutorials</p>
          </a>
        </div>
      </div>
    </section>
  )
}
