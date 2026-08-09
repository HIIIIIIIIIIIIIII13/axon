"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();

    setError("");
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <main className="min-h-screen bg-[#05070a] text-white flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <div className="text-center">
          <img
            src="/axon-logo.png"
            alt="Axon"
            className="mx-auto h-24 w-24 object-contain"
          />

          <h1 className="mt-5 text-3xl font-bold">Welcome back</h1>

          <p className="mt-2 text-white/45">
            Log in to your Axon account
          </p>
        </div>

        <form
          onSubmit={handleLogin}
          className="mt-8 rounded-3xl border border-white/10 bg-white/[0.03] p-6"
        >
          <label className="text-sm text-white/70">
            Email
          </label>

          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none focus:border-cyan-400/40"
          />

          <label className="mt-5 block text-sm text-white/70">
            Password
          </label>

          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Your password"
            className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none focus:border-cyan-400/40"
          />

          {error && (
            <p className="mt-4 text-sm text-red-400">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-6 w-full rounded-xl bg-cyan-400 px-4 py-3 font-semibold text-black transition hover:bg-cyan-300 disabled:opacity-50"
          >
            {loading ? "Logging in..." : "Log in"}
          </button>

          <p className="mt-6 text-center text-sm text-white/40">
            Don&apos;t have an account?{" "}
            <button
              type="button"
              onClick={() => router.push("/signup")}
              className="text-cyan-300 hover:text-cyan-200"
            >
              Sign up
            </button>
          </p>
        </form>
      </div>
    </main>
  );
}