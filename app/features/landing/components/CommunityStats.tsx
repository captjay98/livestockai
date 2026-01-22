/**
 * Community stats section
 */

export function CommunityStats() {
  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-6 text-center">
          <div>
            <div className="text-3xl font-bold">1K+</div>
            <div className="text-muted-foreground">Users</div>
          </div>
          <div>
            <div className="text-3xl font-bold">500+</div>
            <div className="text-muted-foreground">Farms</div>
          </div>
          <div>
            <div className="text-3xl font-bold">50K+</div>
            <div className="text-muted-foreground">Animals Tracked</div>
          </div>
          <div>
            <div className="text-3xl font-bold">10+</div>
            <div className="text-muted-foreground">Countries</div>
          </div>
        </div>
      </div>
    </section>
  )
}
