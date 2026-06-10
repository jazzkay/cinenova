"use client";

import { use } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Play, Plus, Check, Star, Clock, Calendar, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { api, img } from "@/lib/api";
import { Navbar } from "@/components/Navbar";
import { MovieRow } from "@/components/MovieRow";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useWatchlistStore } from "@/store/useWatchlistStore";
import { useAuthStore } from "@/store/useAuthStore";

interface Props {
  params: Promise<{ id: string }>;
}

export default function MovieDetailPage({ params }: Props) {
  const { id } = use(params);
  const router = useRouter();
  const { has, add, remove } = useWatchlistStore();
  const { user } = useAuthStore();

  const { data: movie, isLoading } = useQuery({
    queryKey: ["movie", id],
    queryFn: () => api.get(`/movies/${id}`).then((r) => r.data),
  });

  const tmdbId = movie?.id;
  const inList = has(tmdbId);

  const handleWatchlist = () => {
    if (!user) { router.push("/auth/login"); return; }
    inList ? remove(tmdbId) : add(tmdbId);
  };

  const handleWatched = async () => {
    if (!user) { router.push("/auth/login"); return; }
    try {
      await api.post(`/users/me/watch-history/${tmdbId}`);
    } catch { /* already added */ }
  };

  if (isLoading) return <MovieDetailSkeleton />;
  if (!movie) return null;

  const genres: { id: number; name: string }[] = movie.genres || [];
  const cast: { id: number; name: string; character: string; profile_path: string }[] =
    movie.credits?.cast?.slice(0, 8) || [];
  const similar = movie.similar?.results?.slice(0, 12) || [];
  const year = movie.release_date?.slice(0, 4);
  const runtime = movie.runtime
    ? `${Math.floor(movie.runtime / 60)}h ${movie.runtime % 60}m`
    : null;

  return (
    <div className="min-h-screen bg-[#141414]">
      <Navbar />

      {/* Backdrop */}
      <div className="relative h-[70vh] w-full">
        <img
          src={img(movie.backdrop_path, "original")}
          alt={movie.title}
          className="w-full h-full object-cover object-top"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-[#141414]/50 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#141414] via-transparent to-transparent" />

        <button
          onClick={() => router.back()}
          className="absolute top-24 left-6 md:left-12 flex items-center gap-2 text-white/70 hover:text-white transition"
        >
          <ArrowLeft size={20} />
          <span className="text-sm">Back</span>
        </button>
      </div>

      {/* Content */}
      <div className="px-6 md:px-12 -mt-64 relative z-10 pb-20">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Poster */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex-shrink-0"
          >
            <img
              src={img(movie.poster_path, "w342")}
              alt={movie.title}
              className="w-44 md:w-56 rounded-xl shadow-2xl ring-1 ring-white/10"
            />
          </motion.div>

          {/* Info */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex-1 pt-4 md:pt-16"
          >
            <h1 className="text-3xl md:text-5xl font-black text-white mb-2">{movie.title}</h1>
            {movie.tagline && (
              <p className="text-gray-400 italic text-sm mb-4">{movie.tagline}</p>
            )}

            <div className="flex flex-wrap items-center gap-4 mb-4 text-sm">
              <div className="flex items-center gap-1 text-yellow-400 font-bold">
                <Star size={16} fill="currentColor" />
                {movie.vote_average?.toFixed(1)}
                <span className="text-gray-400 font-normal">({movie.vote_count?.toLocaleString()})</span>
              </div>
              {year && (
                <span className="flex items-center gap-1 text-gray-400">
                  <Calendar size={14} /> {year}
                </span>
              )}
              {runtime && (
                <span className="flex items-center gap-1 text-gray-400">
                  <Clock size={14} /> {runtime}
                </span>
              )}
              {movie.imdb_rating && (
                <Badge className="bg-yellow-500 text-black font-bold border-0 text-xs">
                  IMDb {movie.imdb_rating}
                </Badge>
              )}
            </div>

            <div className="flex flex-wrap gap-2 mb-6">
              {genres.map((g) => (
                <Badge key={g.id} variant="secondary" className="bg-white/10 text-white border-0 text-xs">
                  {g.name}
                </Badge>
              ))}
            </div>

            <p className="text-gray-300 text-sm md:text-base leading-relaxed max-w-2xl mb-6">
              {movie.overview}
            </p>

            <div className="flex flex-wrap gap-3">
              {movie.trailer_key && (
                <a
                  href={`https://www.youtube.com/watch?v=${movie.trailer_key}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 bg-white text-black font-bold px-6 py-3 rounded hover:bg-gray-200 transition text-sm"
                >
                  <Play size={18} fill="black" /> Watch Trailer
                </a>
              )}
              <button
                onClick={handleWatchlist}
                className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white font-semibold px-6 py-3 rounded transition text-sm"
              >
                {inList ? <Check size={18} /> : <Plus size={18} />}
                {inList ? "In My List" : "Add to List"}
              </button>
              <button
                onClick={handleWatched}
                className="flex items-center gap-2 border border-white/30 hover:border-white/60 text-white font-semibold px-6 py-3 rounded transition text-sm"
              >
                Mark as Watched
              </button>
            </div>
          </motion.div>
        </div>

        {/* Cast */}
        {cast.length > 0 && (
          <section className="mt-12">
            <h2 className="text-xl font-bold text-white mb-4">Cast</h2>
            <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
              {cast.map((actor) => (
                <div key={actor.id} className="flex-shrink-0 w-24 text-center">
                  <div className="w-20 h-20 rounded-full overflow-hidden bg-zinc-800 mx-auto mb-2">
                    {actor.profile_path ? (
                      <img
                        src={img(actor.profile_path, "w185")}
                        alt={actor.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-600 text-2xl">
                        👤
                      </div>
                    )}
                  </div>
                  <p className="text-white text-xs font-semibold line-clamp-2">{actor.name}</p>
                  <p className="text-gray-500 text-[10px] line-clamp-1">{actor.character}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Similar movies */}
        {similar.length > 0 && (
          <div className="mt-12">
            <MovieRow title="More Like This" movies={similar} />
          </div>
        )}
      </div>
    </div>
  );
}

function MovieDetailSkeleton() {
  return (
    <div className="min-h-screen bg-[#141414]">
      <Navbar />
      <Skeleton className="h-[70vh] w-full bg-zinc-800" />
      <div className="px-6 md:px-12 -mt-48 relative z-10 flex gap-8">
        <Skeleton className="w-44 h-64 rounded-xl bg-zinc-800 flex-shrink-0" />
        <div className="space-y-4 flex-1 pt-16">
          <Skeleton className="h-12 w-80 bg-zinc-800" />
          <Skeleton className="h-4 w-60 bg-zinc-800" />
          <Skeleton className="h-20 w-full max-w-xl bg-zinc-800" />
          <div className="flex gap-3">
            <Skeleton className="h-12 w-36 bg-zinc-800" />
            <Skeleton className="h-12 w-36 bg-zinc-800" />
          </div>
        </div>
      </div>
    </div>
  );
}
