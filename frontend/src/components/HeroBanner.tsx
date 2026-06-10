"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Info, VolumeX, Volume2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { api, img } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Movie {
  id: number;
  title: string;
  overview: string;
  backdrop_path: string;
  poster_path: string;
  vote_average: number;
  release_date: string;
  genre_ids?: number[];
  genres?: { id: number; name: string }[];
}

export function HeroBanner() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [muted, setMuted] = useState(true);
  const router = useRouter();

  const { data } = useQuery({
    queryKey: ["trending"],
    queryFn: () => api.get("/movies/trending").then((r) => r.data),
  });

  const movies: Movie[] = data?.results?.slice(0, 5) || [];
  const movie = movies[currentIndex];

  useEffect(() => {
    if (movies.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((i) => (i + 1) % movies.length);
    }, 8000);
    return () => clearInterval(timer);
  }, [movies.length]);

  if (!movie) return <HeroSkeleton />;

  const year = movie.release_date?.slice(0, 4);
  const rating = movie.vote_average?.toFixed(1);

  return (
    <div className="relative h-[85vh] min-h-[500px] w-full overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={movie.id}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
          className="absolute inset-0"
        >
          <img
            src={img(movie.backdrop_path, "original")}
            alt={movie.title}
            className="w-full h-full object-cover object-center"
          />
        </motion.div>
      </AnimatePresence>

      {/* Gradients */}
      <div className="absolute inset-0 hero-gradient" />
      <div className="absolute bottom-0 left-0 right-0 h-40 hero-bottom-gradient" />

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`content-${movie.id}`}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="absolute bottom-[20%] left-0 px-8 md:px-16 max-w-xl lg:max-w-2xl"
        >
          <h1 className="text-4xl md:text-6xl font-black text-white mb-4 leading-tight drop-shadow-2xl">
            {movie.title}
          </h1>

          <div className="flex items-center gap-3 mb-4">
            <Badge className="bg-red-600 text-white border-0 text-xs">
              ★ {rating}
            </Badge>
            {year && <span className="text-gray-300 text-sm">{year}</span>}
          </div>

          <p className="text-gray-200 text-sm md:text-base line-clamp-3 mb-6 leading-relaxed">
            {movie.overview}
          </p>

          <div className="flex items-center gap-3 flex-wrap">
            <Button
              onClick={() => router.push(`/movie/${movie.id}`)}
              className="bg-white text-black hover:bg-gray-200 font-bold px-8 py-3 rounded flex items-center gap-2 text-sm"
            >
              <Play size={18} fill="black" />
              Play
            </Button>
            <Button
              onClick={() => router.push(`/movie/${movie.id}`)}
              variant="secondary"
              className="bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm font-semibold px-6 py-3 rounded flex items-center gap-2 text-sm"
            >
              <Info size={18} />
              More Info
            </Button>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Mute button */}
      <button
        onClick={() => setMuted(!muted)}
        className="absolute bottom-[22%] right-8 md:right-16 p-2 border border-white/40 rounded-full text-white hover:bg-white/10 transition"
      >
        {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
      </button>

      {/* Slide indicators */}
      {movies.length > 1 && (
        <div className="absolute bottom-[15%] right-8 md:right-16 flex gap-1.5">
          {movies.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentIndex(i)}
              className={`h-1 rounded-full transition-all duration-300 ${
                i === currentIndex ? "w-6 bg-red-500" : "w-2 bg-white/40"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function HeroSkeleton() {
  return (
    <div className="relative h-[85vh] min-h-[500px] w-full bg-zinc-900 animate-pulse">
      <div className="absolute bottom-[20%] left-8 md:left-16 space-y-4 max-w-xl">
        <div className="h-16 w-80 bg-zinc-700 rounded" />
        <div className="h-4 w-60 bg-zinc-700 rounded" />
        <div className="h-16 w-96 bg-zinc-700 rounded" />
        <div className="flex gap-3">
          <div className="h-12 w-28 bg-zinc-700 rounded" />
          <div className="h-12 w-32 bg-zinc-700 rounded" />
        </div>
      </div>
    </div>
  );
}
