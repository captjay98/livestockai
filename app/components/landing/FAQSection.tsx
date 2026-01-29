import { ChevronDown } from 'lucide-react'

const faqs = [
  {
    question: 'Can I switch plans at any time?',
    answer:
      "Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately, and we'll prorate the cost accordingly.",
  },
  {
    question: 'Is self-hosting really free forever?',
    answer:
      'Yes. LivestockAI offers a free tier for small farms. For larger operations, we offer affordable paid plans with additional features and support.',
  },
  {
    question: 'What payment methods do you accept?',
    answer:
      'We accept all major credit cards, debit cards, bank transfers, and mobile money through Paystack. For Nigerian users, we also support USSD payments.',
  },
  {
    question: 'Do you offer refunds?',
    answer:
      "Yes. We offer a 14-day money-back guarantee for all paid plans. If you're not satisfied, contact support for a full refund.",
  },
  {
    question: 'Can I migrate from self-hosted to managed cloud?',
    answer:
      'Yes! We provide migration tools and support to help you move your data from self-hosted to our managed cloud seamlessly. Contact our support team for assistance.',
  },
]

export function FAQSection() {
  return (
    <section
      className="w-full py-32 px-6 lg:px-12 relative transition-colors duration-500"
      style={{ backgroundColor: 'var(--bg-landing-page)' }}
    >
      {/* Decorative gradient */}
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/5 dark:via-white/5 via-neutral-200 dark:via-neutral-800 to-transparent" />

      <div className="max-w-[900px] mx-auto">
        <h2
          className="text-3xl lg:text-5xl font-manrope font-semibold mb-16 text-center tracking-tight transition-colors duration-500"
          style={{ color: 'var(--text-landing-primary)' }}
        >
          Frequently Asked Questions
        </h2>

        <div className="space-y-4">
          {faqs.map((faq, idx) => (
            <details
              key={idx}
              className="glass-card rounded-2xl border p-2 group transition-all duration-300"
              style={{
                borderColor: 'var(--border-landing-subtle)',
                backgroundColor: 'var(--bg-landing-card)',
              }}
            >
              <summary
                className="font-medium cursor-pointer p-6 flex items-center justify-between list-none group-open:pb-2 transition-colors duration-500"
                style={{ color: 'var(--text-landing-primary)' }}
              >
                <span className="text-lg tracking-tight group-hover:text-emerald-400 transition-colors">
                  {faq.question}
                </span>
                <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center transition-transform duration-300 group-open:rotate-180">
                  <ChevronDown className="w-4 h-4 text-neutral-500" />
                </div>
              </summary>
              <div className="px-6 pb-6 pt-2">
                <p
                  className="text-[15px] font-light leading-relaxed transition-colors duration-500"
                  style={{
                    color: 'var(--text-landing-secondary)',
                  }}
                >
                  {faq.answer}
                </p>
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}
