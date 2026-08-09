"use client";

import { useRouter } from "next/navigation";

const plans = [
  {
    name: "Free",
    price: "$0",
    description: "Explore Axon and get everyday AI help.",
    button: "Current plan",
    popular: false,
    features: [
      "Axon AI chat",
      "Basic AI model",
      "Limited daily messages",
      "Standard response speed",
      "Basic conversation tools",
    ],
  },
  {
    name: "Plus",
    price: "$9.99",
    description: "More power for everyday work and creativity.",
    button: "Get Plus",
    popular: true,
    features: [
      "Everything in Free",
      "Higher message limits",
      "Faster AI models",
      "Web search",
      "Image generation",
      "File uploads",
      "Voice conversations",
      "Axon Memory",
      "Limited Axon Code",
    ],
  },
  {
    name: "Pro",
    price: "$19.99",
    description: "The most powerful version of Axon.",
    button: "Get Pro",
    popular: false,
    features: [
      "Everything in Plus",
      "Highest message limits",
      "Best available AI models",
      "Full Axon Code",
      "Advanced AI tools",
      "Larger file uploads",
      "Extended memory",
      "Priority AI access",
      "Early access to new features",
    ],
  },
];

export default function PricingPage() {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-[#05070a] text-white">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-white/10 px-6 py-4">
        <button
          onClick={() => router.push("/")}
          className="flex items-center gap-3"
        >
          <img
            src="/axon-logo.png"
            alt="Axon"
            className="h-10 w-10 object-contain"
          />

          <span className="text-xl font-bold tracking-[0.2em] text-cyan-300">
            AXON
          </span>
        </button>

        <button
          onClick={() => router.push("/")}
          className="rounded-xl border border-white/10 px-4 py-2 text-sm text-white/70 transition hover:bg-white/5 hover:text-white"
        >
          Back to Axon
        </button>
      </header>

      {/* Hero */}
      <section className="px-6 pb-10 pt-16 text-center">
        <div className="mx-auto mb-5 w-fit rounded-full border border-cyan-400/20 bg-cyan-400/5 px-4 py-1.5 text-sm text-cyan-300">
          AXON PLANS
        </div>

        <h1 className="text-4xl font-bold tracking-tight md:text-6xl">
          Unlock more with{" "}
          <span className="text-cyan-300">Axon</span>
        </h1>

        <p className="mx-auto mt-5 max-w-2xl text-base text-white/50 md:text-lg">
          Start free. Upgrade when you want more intelligence, more tools,
          and more ways to create.
        </p>

        <div className="mt-6 inline-flex rounded-full border border-white/10 bg-white/5 p-1">
          <div className="rounded-full bg-white/10 px-5 py-2 text-sm">
            Monthly
          </div>

          <div className="px-5 py-2 text-sm text-white/35">
            Annual coming soon
          </div>
        </div>
      </section>

      {/* Plans */}
      <section className="mx-auto grid max-w-7xl gap-6 px-6 pb-20 md:grid-cols-3">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={`relative flex flex-col rounded-3xl border p-7 ${
              plan.popular
                ? "border-cyan-400/60 bg-cyan-400/[0.06] shadow-[0_0_50px_rgba(34,211,238,0.10)]"
                : "border-white/10 bg-white/[0.03]"
            }`}
          >
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-cyan-400 px-4 py-1 text-xs font-bold text-black">
                MOST POPULAR
              </div>
            )}

            <div>
              <h2 className="text-2xl font-bold">{plan.name}</h2>

              <p className="mt-2 min-h-12 text-sm leading-6 text-white/45">
                {plan.description}
              </p>
            </div>

            <div className="mt-7 flex items-end gap-2">
              <span className="text-5xl font-bold tracking-tight">
                {plan.price}
              </span>

              <span className="pb-1 text-sm text-white/40">
                / month
              </span>
            </div>

            <button
              disabled={plan.name === "Free"}
              onClick={() => {
                if (plan.name !== "Free") {
                  alert(
                    `${plan.name} payments will be connected next.`
                  );
                }
              }}
              className={`mt-7 w-full rounded-xl px-4 py-3 font-semibold transition ${
                plan.popular
                  ? "bg-cyan-400 text-black hover:bg-cyan-300"
                  : plan.name === "Free"
                  ? "cursor-default bg-white/5 text-white/40"
                  : "border border-white/15 bg-white/5 hover:bg-white/10"
              }`}
            >
              {plan.button}
            </button>

            <div className="my-7 h-px bg-white/10" />

            <p className="mb-4 text-sm font-semibold">
              What&apos;s included
            </p>

            <div className="space-y-4">
              {plan.features.map((feature) => (
                <div
                  key={feature}
                  className="flex items-start gap-3 text-sm text-white/70"
                >
                  <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-cyan-400/10 text-xs text-cyan-300">
                    ✓
                  </div>

                  <span>{feature}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>

      {/* Bottom message */}
      <section className="border-t border-white/10 px-6 py-10 text-center">
        <p className="text-sm text-white/35">
          Cancel anytime. Plus and Pro payments are not active yet.
        </p>
      </section>
    </main>
  );
}