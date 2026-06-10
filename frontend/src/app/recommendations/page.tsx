"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Sparkles, Brain, Users, TrendingUp, RefreshCw, Star, Clock, Heart, Wand2 } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { api, img } from "@/lib/api";
import { useAuthStore } from "@/store/useAuthStore";

interface Rec {
  tmdb_id: number;
  title: string;
  poster_path: string;
  vote_average: number;
  score: number;
  reason: string;
}

const REASON_META: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
  "Similar to movies you love": {
    icon: <Heart size={13} />,
    color: "bg-red-600/20 text-red-400 border-red-500/30",
    label: "Matches your taste",
  },
  "Fans with your taste loved this": {
    icon: <Users size={13} />,
    color: "bg-blue-600/20 text-blue-400 border-blue-500/30",
    label: "Community pick",
  },
  "Matches your quiz preferences": {
    icon: <Wand2 size={13} />,
    color: "bg-purple-600/20 text-purple-400 border-purple-500/30",
    label: "Quiz match",
  },
  "Trending & highly rated": {
    icon: <TrendingUp size={13} />,
    color: "bg-green-600/20 text-green-400 border-green-500/30",
    label: "Trending",
  },
};

function ScoreBar({ score }: { score: number }) {
  const pct = Math.round(score * 100);
  return (
    <div className="flex items-center gap-2 mt-2">
      <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-red-600 to-orange-400 rounded-full transition-all duration-700"
          style={{ width: `${Math.min(pct * 3, 100)}%` }}
        />
      </div>
      <span className="text-xs text-gray-500">{pct}% match</span>
    </div>
  );
}

function RecCard({ rec }: { rec: Rec }) {
  const meta = REASON_META[rec.reason] ?? REASON_META["Trending & highly rated"];

  return (
    <Link href={`/movie/${rec.tmdb_id}`}>
      <div className="group relative bg-white/5 border border-white/8 rounded-xl overflow-hidden hover:border-red-500/40 hover:bg-white/8 transition-all duration-300 hover:-translate-y-1">
        {/* Poster */}
        <div className="relative aspect-[2/3] overflow-hidden">
          {rec.poster_path ? (
            <img
              src={img(rec.poster_path, "w342")}
              alt={rec.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full bg-white/10 flex items-center justify-center">
              <span className="text-gray-600 text-xs text-center px-2">{rec.title}</span>
            </div>
          )}
          {/* Rating badge */}
          <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-sm rounded-md px-1.5 py-0.5 flex items-center gap-1">
            <Star size={10} className="text-yellow-400 fill-yellow-400" />
            <span className="text-xs text-white font-medium">{rec.vote_average?.toFixed(1)}</span>
          </div>
        </div>

        {/* Info */}
        <div className="p-3">
          <h3 className="text-white text-sm font-semibold line-clamp-2 leading-snug mb-1">
            {rec.title}
          </h3>

          {/* Reason badge */}
          <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${meta.color}`}>
            {meta.icon}
            {meta.label}
          </span>

          <ScoreBar score={rec.score} />
        </div>
      </div>
    </Link>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="bg-white/5 border border-white/8 rounded-xl p-4 flex items-center gap-3">
      <div className="text-red-400">{icon}</div>
      <div>
        <p className="text-white font-bold text-lg">{value}</p>
        <p className="text-gray-400 text-xs">{label}</p>
      </div>
    </div>
  );
}

export default function RecommendationsPage() {
  const { user, token, fetchMe } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (token && !user) fetchMe();
  }, [token, user, fetchMe]);

  useEffect(() => {
    if (!token) router.replace("/");
  }, [token, router]);

  const { data: recs, isLoading, refetch, isFetching } = useQuery<Rec[]>({
    queryKey: ["recommendations-page"],
    queryFn: () => api.get("/recommendations/?limit=40").then((r) => r.data),
    enabled: !!user,
  });

  const { data: history } = useQuery({
    queryKey: ["watch-history"],
    queryFn: () => api.get("/users/me/watch-history").then((r) => r.data),
    enabled: !!user,
  });

  const { data: ratings } = useQuery({
    queryKey: ["my-ratings"],
    queryFn: () => api.get("/users/me/ratings").then((r) => r.data),
    enabled: !!user,
  });

  if (!token) return null;

  const byReason = (recs ?? []).reduce<Record<string, Rec[]>>((acc, r) => {
    (acc[r.reason] ??= []).push(r);
    return acc;
  }, {});

  const groups = Object.entries(byReason).sort((a, b) => b[1].length - a[1].length);

  return (
    <div className="min-h-screen bg-[#141414]">
      <Navbar />

      <div className="pt-24 pb-20 px-4 md:px-12 max-w-screen-2xl mx-auto">

        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-red-600/20 rounded-lg">
              <Sparkles size={22} className="text-red-400" />
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-white">
              Your Recommendations
            </h1>
          </div>
          <p className="text-gray-400 text-sm max-w-xl">
            Powered by a hybrid AI engine — it learns from your quiz answers, watch history,
            and ratings, then combines content matching with community taste patterns.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
          <StatCard icon={<Brain size={20} />} label="AI picks ready" value={String(recs?.length ?? 0)} />
          <StatCard icon={<Clock size={20} />} label="Movies watched" value={String(history?.length ?? 0)} />
          <StatCard icon={<Star size={20} />} label="Movies rated" value={String(ratings?.length ?? 0)} />
          <StatCard
            icon={<RefreshCw size={20} />}
            label="Engine"
            value="Hybrid AI"
          />
        </div>

        {/* Refresh button */}
        <div className="flex items-center justify-between mb-8">
          <p className="text-gray-500 text-sm">
            {recs?.length
              ? `Showing ${recs.length} personalised picks`
              : "Watch or rate a few movies to unlock deep personalisation"}
          </p>
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="flex items-center gap-2 bg-white/8 hover:bg-white/12 border border-white/10 text-sm text-gray-300 hover:text-white px-4 py-2 rounded-lg transition-all disabled:opacity-50"
          >
            <RefreshCw size={14} className={isFetching ? "animate-spin" : ""} />
            Refresh picks
          </button>
        </div>

        {/* Loading skeletons */}
        {isLoading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {Array.from({ length: 18 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-[2/3] bg-white/8 rounded-xl mb-2" />
                <div className="h-3 bg-white/8 rounded w-3/4 mb-1" />
                <div className="h-3 bg-white/8 rounded w-1/2" />
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && (!recs || recs.length === 0) && (
          <div className="text-center py-24">
            <Brain size={56} className="text-gray-700 mx-auto mb-4" />
            <h2 className="text-white text-xl font-bold mb-2">The AI is still learning about you</h2>
            <p className="text-gray-500 text-sm mb-6 max-w-sm mx-auto">
              Watch a few movies, rate what you&apos;ve seen, and complete the quiz.
              The more you interact, the smarter the recommendations get.
            </p>
            <div className="flex gap-3 justify-center">
              <Link href="/home" className="bg-red-600 hover:bg-red-700 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors">
                Browse Movies
              </Link>
              <Link href="/quiz" className="bg-white/10 hover:bg-white/15 text-white text-sm px-5 py-2.5 rounded-lg transition-colors">
                Retake Quiz
              </Link>
            </div>
          </div>
        )}

        {/* Grouped recommendations */}
        {!isLoading && groups.length > 0 && groups.map(([reason, movies]) => {
          const meta = REASON_META[reason] ?? REASON_META["Trending & highly rated"];
          return (
            <div key={reason} className="mb-12">
              <div className="flex items-center gap-2 mb-5">
                <span className={`p-1.5 rounded-lg border ${meta.color}`}>{meta.icon}</span>
                <h2 className="text-white font-bold text-lg">{reason}</h2>
                <span className="text-gray-600 text-sm">({movies.length})</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {movies.map((rec) => (
                  <RecCard key={rec.tmdb_id} rec={rec} />
                ))}
              </div>
            </div>
          );
        })}

        {/* How it works */}
        <div className="mt-16 bg-white/3 border border-white/8 rounded-2xl p-6 md:p-8">
          <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
            <Brain size={18} className="text-red-400" /> How the AI decides
          </h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 text-sm text-gray-400">
            <div>
              <div className="flex items-center gap-2 text-red-400 font-semibold mb-1">
                <Heart size={14} /> Content Match (35%)
              </div>
              Analyses genres, cast, and plot of movies you&apos;ve watched, saved, and rated.
              Finds new movies with a similar story background using TF-IDF + cosine similarity.
            </div>
            <div>
              <div className="flex items-center gap-2 text-purple-400 font-semibold mb-1">
                <Wand2 size={14} /> Quiz Preferences (25%)
              </div>
              Uses your mood, language choice, and favourite genres from the quiz to discover
              brand-new movies from TMDB that match exactly what you said you enjoy.
            </div>
            <div>
              <div className="flex items-center gap-2 text-blue-400 font-semibold mb-1">
                <Users size={14} /> Community Taste (25%)
              </div>
              Groups users with similar rating patterns and surfaces movies they loved
              that you haven&apos;t seen yet — collaborative filtering.
            </div>
            <div>
              <div className="flex items-center gap-2 text-green-400 font-semibold mb-1">
                <TrendingUp size={14} /> Popularity Signal (15%)
              </div>
              Blends in a trending score so new users still get great picks
              before enough history builds up.
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
