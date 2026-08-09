"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type PlanName = "free" | "plus" | "pro";

type Profile = {
  id: string;
  email: string | null;
  plan: PlanName;
  is_admin: boolean;
};

const plans = [
  {
    id: "free" as PlanName,
    name: "Free",
    price: "$0",
    description: "Explore Axon and get everyday AI help.",
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
    id: "plus" as PlanName,
    name: "Plus",
    price: "$9.99",
    description: "More power for everyday work and creativity.",
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
    id: "pro" as PlanName,
    name: "Pro",
    price: "$19.99",
    description: "The most powerful version of Axon.",
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
  const supabase = createClient();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [changingPlan, setChangingPlan] =
    useState<PlanName | null>(null);

  const [openingPortal, setOpeningPortal] =
    useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    setLoading(true);

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setProfile(null);
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("id, email, plan, is_admin")
        .eq("id", user.id)
        .single();

      if (error) {
        console.error("Profile error:", error);
        setProfile(null);
        return;
      }

      setProfile(data as Profile);
    } finally {
      setLoading(false);
    }
  }

  async function switchAdminPlan(
    plan: PlanName
  ) {
    if (!profile?.is_admin) return;

    setChangingPlan(plan);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.push("/login");
        return;
      }

      const response = await fetch(
        "/api/admin/set-plan",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            plan,
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        alert(
          data.error ||
            "Could not change your plan."
        );
        return;
      }

      setProfile((current) => {
        if (!current) return current;

        return {
          ...current,
          plan,
        };
      });
    } catch (error) {
      console.error(
        "Plan switch error:",
        error
      );

      alert(
        "Could not change your plan."
      );
    } finally {
      setChangingPlan(null);
    }
  }

  async function manageSubscription() {
    if (openingPortal) {
      return;
    }

    try {
      setOpeningPortal(true);

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.push("/login");
        return;
      }

      const response = await fetch(
        "/api/stripe/portal",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Could not open subscription management."
        );
      }

      if (!data.url) {
        throw new Error(
          "Stripe did not return a portal URL."
        );
      }

      window.location.href =
        data.url;
    } catch (error) {
      console.error(
        "Manage subscription error:",
        error
      );

      alert(
        "Could not open subscription management."
      );
    } finally {
      setOpeningPortal(false);
    }
  }

  async function handlePlanClick(
    plan: PlanName
  ) {
    if (!profile) {
      router.push("/login");
      return;
    }

    if (profile.plan === plan) {
      return;
    }

    if (profile.is_admin) {
      await switchAdminPlan(plan);
      return;
    }

    if (plan === "free") {
      alert(
        "Use Manage subscription to change or cancel your paid subscription."
      );

      return;
    }

    try {
      setChangingPlan(plan);

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.push("/login");
        return;
      }

      const response = await fetch(
        "/api/checkout",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            plan,
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Could not start checkout."
        );
      }

      if (!data.url) {
        throw new Error(
          "Stripe did not return a checkout URL."
        );
      }

      window.location.href =
        data.url;
    } catch (error) {
      console.error(
        "Checkout error:",
        error
      );

      alert(
        "Could not start Stripe checkout."
      );
    } finally {
      setChangingPlan(null);
    }
  }

  function getButtonText(
    plan: PlanName
  ) {
    if (loading) {
      return "Loading...";
    }

    if (!profile) {
      if (plan === "free") {
        return "Start Free";
      }

      return plan === "plus"
        ? "Get Plus"
        : "Get Pro";
    }

    if (profile.plan === plan) {
      return "Current plan";
    }

    if (profile.is_admin) {
      if (
        changingPlan === plan
      ) {
        return "Switching...";
      }

      return `Switch to ${
        plan
          .charAt(0)
          .toUpperCase() +
        plan.slice(1)
      }`;
    }

    if (
      changingPlan === plan
    ) {
      return "Opening checkout...";
    }

    if (plan === "free") {
      return "Free";
    }

    return plan === "plus"
      ? "Upgrade to Plus"
      : "Upgrade to Pro";
  }

  function isDisabled(
    plan: PlanName
  ) {
    if (loading) {
      return true;
    }

    if (
      profile?.plan === plan
    ) {
      return true;
    }

    if (
      changingPlan !== null
    ) {
      return true;
    }

    return false;
  }

  return (
    <main className="min-h-screen bg-[#05070a] text-white">
      {/* Header */}

      <header className="flex items-center justify-between border-b border-white/10 px-6 py-4">
        <button
          onClick={() =>
            router.push("/")
          }
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

        <div className="flex items-center gap-3">
          {profile && (
            <div className="hidden rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-right sm:block">
              <p className="max-w-52 truncate text-xs text-white/60">
                {profile.email}
              </p>

              <p className="text-xs font-semibold text-cyan-300">
                {profile.plan.toUpperCase()}

                {profile.is_admin
                  ? " · ADMIN"
                  : ""}
              </p>
            </div>
          )}

          {profile &&
            !profile.is_admin &&
            profile.plan !==
              "free" && (
              <button
                onClick={
                  manageSubscription
                }
                disabled={
                  openingPortal
                }
                className="rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-sm font-semibold text-cyan-200 transition hover:bg-cyan-400/20 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {openingPortal
                  ? "Opening..."
                  : "Manage subscription"}
              </button>
            )}

          <button
            onClick={() =>
              router.push("/")
            }
            className="rounded-xl border border-white/10 px-4 py-2 text-sm text-white/70 transition hover:bg-white/5 hover:text-white"
          >
            Back to Axon
          </button>
        </div>
      </header>

      {/* Hero */}

      <section className="px-6 pb-10 pt-16 text-center">
        <div className="mx-auto mb-5 w-fit rounded-full border border-cyan-400/20 bg-cyan-400/5 px-4 py-1.5 text-sm text-cyan-300">
          AXON PLANS
        </div>

        <h1 className="text-4xl font-bold tracking-tight md:text-6xl">
          Unlock more with{" "}
          <span className="text-cyan-300">
            Axon
          </span>
        </h1>

        <p className="mx-auto mt-5 max-w-2xl text-base text-white/50 md:text-lg">
          Start free. Upgrade when you want
          more intelligence, more tools, and
          more ways to create.
        </p>

        {profile?.is_admin && (
          <div className="mx-auto mt-5 w-fit rounded-xl border border-purple-400/20 bg-purple-400/5 px-4 py-2 text-sm text-purple-300">
            Admin mode — you can switch plans
            without payment.
          </div>
        )}

        {profile &&
          !profile.is_admin &&
          profile.plan !==
            "free" && (
            <div className="mx-auto mt-5 w-fit rounded-xl border border-cyan-400/20 bg-cyan-400/5 px-4 py-2 text-sm text-cyan-200">
              You&apos;re subscribed to Axon{" "}
              {profile.plan ===
              "plus"
                ? "Plus"
                : "Pro"}
              .
            </div>
          )}

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
        {plans.map(
          (plan) => {
            const isCurrent =
              profile?.plan ===
              plan.id;

            return (
              <div
                key={plan.id}
                className={`relative flex flex-col rounded-3xl border p-7 ${
                  isCurrent
                    ? "border-cyan-400 bg-cyan-400/[0.08] shadow-[0_0_55px_rgba(34,211,238,0.12)]"
                    : plan.popular
                    ? "border-cyan-400/50 bg-cyan-400/[0.05]"
                    : "border-white/10 bg-white/[0.03]"
                }`}
              >
                {isCurrent ? (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-cyan-400 px-4 py-1 text-xs font-bold text-black">
                    CURRENT PLAN
                  </div>
                ) : (
                  plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-cyan-400 px-4 py-1 text-xs font-bold text-black">
                      MOST POPULAR
                    </div>
                  )
                )}

                <div>
                  <h2 className="text-2xl font-bold">
                    {plan.name}
                  </h2>

                  <p className="mt-2 min-h-12 text-sm leading-6 text-white/45">
                    {
                      plan.description
                    }
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
                  disabled={isDisabled(
                    plan.id
                  )}
                  onClick={() =>
                    handlePlanClick(
                      plan.id
                    )
                  }
                  className={`mt-7 w-full rounded-xl px-4 py-3 font-semibold transition ${
                    isCurrent
                      ? "cursor-default bg-white/5 text-white/40"
                      : plan.popular
                      ? "bg-cyan-400 text-black hover:bg-cyan-300"
                      : "border border-white/15 bg-white/5 hover:bg-white/10"
                  } disabled:cursor-not-allowed disabled:opacity-60`}
                >
                  {getButtonText(
                    plan.id
                  )}
                </button>

                {isCurrent &&
                  profile &&
                  !profile.is_admin &&
                  profile.plan !==
                    "free" && (
                    <button
                      onClick={
                        manageSubscription
                      }
                      disabled={
                        openingPortal
                      }
                      className="mt-3 w-full rounded-xl border border-cyan-400/20 bg-cyan-400/5 px-4 py-3 text-sm font-semibold text-cyan-200 transition hover:bg-cyan-400/10 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {openingPortal
                        ? "Opening Stripe..."
                        : "Manage subscription"}
                    </button>
                  )}

                <div className="my-7 h-px bg-white/10" />

                <p className="mb-4 text-sm font-semibold">
                  What&apos;s included
                </p>

                <div className="space-y-4">
                  {plan.features.map(
                    (feature) => (
                      <div
                        key={
                          feature
                        }
                        className="flex items-start gap-3 text-sm text-white/70"
                      >
                        <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-cyan-400/10 text-xs text-cyan-300">
                          ✓
                        </div>

                        <span>
                          {
                            feature
                          }
                        </span>
                      </div>
                    )
                  )}
                </div>
              </div>
            );
          }
        )}
      </section>

      {/* Bottom */}

      <section className="border-t border-white/10 px-6 py-10 text-center">
        <p className="text-sm text-white/35">
          Secure checkout and subscription
          management are powered by Stripe
          sandbox while Axon is in testing.
        </p>
      </section>
    </main>
  );
}