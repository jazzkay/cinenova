"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Play, Star, Zap, Users } from "lucide-react";

export default function LandingPage() {
  const features = [
    { icon: Zap, title: "AI-Powered Picks", desc: "Our hybrid engine learns your taste from every watch and rating." },
    { icon: Star, title: "Million+ Titles", desc: "Hollywood, Bollywood, Tollywood, K-Drama, Anime — all in one place." },
    { icon: Users, title: "Collaborative Filtering", desc: "Discover what people with your taste are watching right now." },
    { icon: Play, title: "Instant Trailers", desc: "Watch YouTube trailers without leaving the app." },
  ];

  return (
    <div className="min-h-screen bg-[#141414] text-white">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-8 md:px-16 py-6">
        <span className="text-red-600 font-black text-2xl tracking-tight">CINENOVA</span>
        <div className="flex items-center gap-4">
          <Link href="/auth/login" className="text-sm hover:text-gray-300 transition-colors">
            Sign In
          </Link>
          <Link
            href="/auth/register"
            className="bg-red-600 hover:bg-red-700 text-white text-sm font-semibold px-5 py-2 rounded transition-colors"
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative flex flex-col items-center justify-center text-center px-6 py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-[#141414]/80 to-[#141414]" />
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: "url('https://image.tmdb.org/t/p/original/628Dep6AxEtDxjZoGP78TsOxYbK.jpg')",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />

        <motion.div
          className="relative z-10 max-w-4xl"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1 className="text-5xl md:text-7xl font-black mb-6 leading-tight">
            Your Personal
            <span className="text-red-600 block">Movie Universe</span>
          </h1>
          <p className="text-gray-300 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            AI-powered recommendations that evolve with every movie you watch.
            Netflix-quality discovery for every taste.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/auth/register"
              className="bg-red-600 hover:bg-red-700 text-white font-bold px-10 py-4 rounded text-lg transition-colors"
            >
              Start Watching Free
            </Link>
            <Link
              href="/auth/login"
              className="bg-white/10 hover:bg-white/20 text-white font-semibold px-10 py-4 rounded text-lg backdrop-blur-sm transition-colors"
            >
              Sign In
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Features */}
      <section className="px-8 md:px-16 py-20">
        <h2 className="text-center text-3xl md:text-4xl font-black mb-14">Why CineNova?</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {features.map(({ icon: Icon, title, desc }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="glass rounded-xl p-6 text-center"
            >
              <div className="flex justify-center mb-4">
                <div className="bg-red-600/20 rounded-full p-3">
                  <Icon size={28} className="text-red-500" />
                </div>
              </div>
              <h3 className="text-white font-bold mb-2">{title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="text-center px-8 py-20">
        <h2 className="text-3xl md:text-4xl font-black mb-4">Ready to discover your next favorite?</h2>
        <p className="text-gray-400 mb-8">Takes 2 minutes. No credit card required.</p>
        <Link
          href="/auth/register"
          className="inline-block bg-red-600 hover:bg-red-700 text-white font-bold px-12 py-4 rounded text-lg transition-colors"
        >
          Create Free Account
        </Link>
      </section>

      <footer className="border-t border-white/10 text-center py-8 text-gray-500 text-sm">
        © 2025 CineNova. Built with Next.js, FastAPI &amp; AI.
      </footer>
    </div>
  );
}
