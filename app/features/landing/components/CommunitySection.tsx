/**
 * Community section for landing page
 */

export function CommunitySection() {
  return (
    <section className="py-16">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-3xl font-bold mb-4">Join Our Community</h2>
        <p className="text-muted-foreground max-w-xl mx-auto mb-8">
          Connect with other farmers and developers building with OpenLivestock.
        </p>
        <a
          href="/community"
          className="inline-flex items-center justify-center rounded-md border px-6 py-3 hover:bg-muted"
        >
          Join Community
        </a>
      </div>
    </section>
  )
}
