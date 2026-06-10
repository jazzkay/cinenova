"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { Check, ChevronRight, Loader2, Search } from "lucide-react";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/useAuthStore";

const MOODS = [
  { emoji: "⚡", label: "Excited" },
  { emoji: "😄", label: "Happy" },
  { emoji: "😢", label: "Emotional" },
  { emoji: "😱", label: "Scared" },
  { emoji: "🤔", label: "Thoughtful" },
  { emoji: "😴", label: "Relaxed" },
];

const LANGUAGES = [
  "English", "Hindi", "Telugu", "Tamil", "Korean", "Japanese", "French", "Spanish", "Any",
];

const GENRES = [
  "Action", "Thriller", "Sci-Fi", "Romance", "Horror", "Crime", "Comedy",
  "Drama", "Animation", "Documentary", "Fantasy", "Mystery",
];

export default function QuizPage() {
  const [step, setStep] = useState(0);
  const [mood, setMood] = useState("");
  const [language, setLanguage] = useState("");
  const [genres, setGenres] = useState<string[]>([]);
  const [favoriteSearch, setFavoriteSearch] = useState("");
  const [favorites, setFavorites] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { fetchMe } = useAuthStore();

  const steps = ["Mood", "Language", "Genres", "Favorites"];

  const toggleGenre = (g: string) =>
    setGenres((prev) => prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]);

  const addFavorite = () => {
    const t = favoriteSearch.trim();
    if (t && !favorites.includes(t) && favorites.length < 5) {
      setFavorites([...favorites, t]);
      setFavoriteSearch("");
    }
  };

  const canNext = [
    !!mood,
    !!language,
    genres.length > 0,
    true,
  ][step];

  const handleFinish = async () => {
    setLoading(true);
    try {
      await api.post("/users/quiz", {
        mood,
        language,
        genres,
        favorite_movies: favorites,
      });
      await fetchMe();
      router.push("/home");
    } catch {
      router.push("/home");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#141414] flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-xl">
        {/* Header */}
        <div className="text-center mb-10">
          <span className="text-red-600 font-black text-2xl">CINENOVA</span>
          <h1 className="text-3xl font-black text-white mt-4 mb-2">Let&apos;s personalise your feed</h1>
          <p className="text-gray-400 text-sm">Quick 4-step quiz to build your AI profile</p>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-2 mb-8">
          {steps.map((s, i) => (
            <div key={s} className="flex-1 flex flex-col items-center gap-1">
              <div
                className={`h-1.5 w-full rounded-full transition-all duration-300 ${
                  i <= step ? "bg-red-600" : "bg-white/20"
                }`}
              />
              <span className={`text-xs ${i === step ? "text-white" : "text-gray-500"}`}>{s}</span>
            </div>
          ))}
        </div>

        {/* Steps */}
        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div key="mood" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}>
              <h2 className="text-xl font-bold text-white mb-6">What mood are you in?</h2>
              <div className="grid grid-cols-3 gap-3">
                {MOODS.map(({ emoji, label }) => (
                  <button
                    key={label}
                    onClick={() => setMood(label)}
                    className={`glass rounded-xl p-4 flex flex-col items-center gap-2 transition-all ${
                      mood === label ? "border-red-500 bg-red-600/20" : "border-white/10 hover:border-white/30"
                    } border`}
                  >
                    <span className="text-3xl">{emoji}</span>
                    <span className="text-sm text-white">{label}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div key="lang" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}>
              <h2 className="text-xl font-bold text-white mb-6">Preferred language?</h2>
              <div className="grid grid-cols-3 gap-3">
                {LANGUAGES.map((lang) => (
                  <button
                    key={lang}
                    onClick={() => setLanguage(lang)}
                    className={`glass rounded-xl px-4 py-3 text-sm font-medium transition-all ${
                      language === lang ? "border-red-500 bg-red-600/20 text-white" : "border-white/10 hover:border-white/30 text-gray-300"
                    } border`}
                  >
                    {lang}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="genres" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}>
              <h2 className="text-xl font-bold text-white mb-2">Favourite genres?</h2>
              <p className="text-gray-400 text-sm mb-6">Pick as many as you like</p>
              <div className="flex flex-wrap gap-3">
                {GENRES.map((g) => (
                  <button
                    key={g}
                    onClick={() => toggleGenre(g)}
                    className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium border transition-all ${
                      genres.includes(g)
                        ? "border-red-500 bg-red-600/20 text-white"
                        : "border-white/20 text-gray-300 hover:border-white/40"
                    }`}
                  >
                    {genres.includes(g) && <Check size={14} />}
                    {g}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="fav" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}>
              <h2 className="text-xl font-bold text-white mb-2">Favourite movies?</h2>
              <p className="text-gray-400 text-sm mb-6">Type up to 5 movies you love (optional)</p>

              <div className="flex gap-2 mb-4">
                <div className="relative flex-1">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    value={favoriteSearch}
                    onChange={(e) => setFavoriteSearch(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addFavorite()}
                    placeholder="e.g. Interstellar..."
                    className="w-full bg-white/10 border border-white/20 text-white rounded-lg pl-9 pr-4 py-3 text-sm outline-none focus:border-red-500 transition placeholder:text-gray-500"
                  />
                </div>
                <button
                  onClick={addFavorite}
                  disabled={!favoriteSearch.trim() || favorites.length >= 5}
                  className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white px-4 py-3 rounded-lg text-sm font-semibold"
                >
                  Add
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                {favorites.map((f) => (
                  <span
                    key={f}
                    onClick={() => setFavorites(favorites.filter((x) => x !== f))}
                    className="flex items-center gap-1.5 bg-red-600/20 border border-red-500/50 text-white text-sm rounded-full px-3 py-1.5 cursor-pointer hover:bg-red-600/30"
                  >
                    {f} ×
                  </span>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex gap-3 mt-10">
          {step > 0 && (
            <button
              onClick={() => setStep(step - 1)}
              className="flex-1 border border-white/20 text-white py-3 rounded-lg font-semibold hover:border-white/40 transition"
            >
              Back
            </button>
          )}
          {step < 3 ? (
            <button
              onClick={() => setStep(step + 1)}
              disabled={!canNext}
              className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition"
            >
              Next <ChevronRight size={18} />
            </button>
          ) : (
            <button
              onClick={handleFinish}
              disabled={loading}
              className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : "Start Watching →"}
            </button>
          )}
        </div>

        {step === 3 && (
          <button
            onClick={() => router.push("/home")}
            className="w-full text-center text-gray-500 hover:text-gray-300 text-sm mt-4 transition"
          >
            Skip for now
          </button>
        )}
      </div>
    </div>
  );
}
