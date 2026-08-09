"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();

    setError("");
    setMessage("");
    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setMessage(
      "Account created! Check your email to confirm your account."
    );

    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-[#05070a] text-white flex items-center justify-center px-6">
      <div className="w-full max-w-md">

        {/* Axon Logo */}
        <div className="text-center">
          <img
            src="/axon-logo.png"
            alt="Axon"
            className="mx-auto h-24 w-24 object-contain"
          />

          <h1 className="mt-5 text-3xl font-bold">
            Create your Axon account
          </h1>

          <p className="mt-2 text-white/45">
            Start with Axon Free
          </p>
        </div>

        {/* Signup Form */}
        <form
          onSubmit={handleSignup}
          className="mt-8 rounded-3xl border border-white/10 bg-white/[0.03] p-6"
        >
          {/* Email */}
          <label className="text-sm text-white/70">
            Email
          </label>

          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none transition focus:border-cyan-400/40"
          />

          {/* Password */}
          <label className="mt-5 block text-sm text-white/70">
            Password
          </label>

          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Create a password"
            className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none transition focus:border-cyan-400/40"
          />

          {/* Error */}
          {error && (
            <p className="mt-4 text-sm text-red-400">
              {error}
            </p>
          )}

          {/* Success */}
          {message && (
            <p className="mt-4 text-sm text-green-400">
              {message}
            </p>
          )}

          {/* Create Account */}
          <button
            type="submit"
            disabled={loading}
            className="mt-6 w-full rounded-xl bg-cyan-400 px-4 py-3 font-semibold text-black transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Creating account..." : "Create account"}
          </button>

          {/* Login */}
          <p className="mt-6 text-center text-sm text-white/40">
            Already have an account?{" "}
            <button
              type="button"
              onClick={() => router.push("/login")}
              className="text-cyan-300 transition hover:text-cyan-200"
            >
              Log in
            </button>
          </p>
        </form>

        {/* Back */}
        <button
          onClick={() => router.push("/")}
          className="mt-6 w-full text-center text-sm text-white/30 transition hover:text-white/60"
        >
          ← Back to Axon
        </button>

      </div>
    </main>
  );
}