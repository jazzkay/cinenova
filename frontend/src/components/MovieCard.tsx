"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Plus, Check, Star, ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { img } from "@/lib/api";
import { useWatchlistStore } from "@/store/useWatchlistStore";
import { useAuthStore } from "@/store/useAuthStore";

interface Movie {
  id: number;
  title: string;
  poster_path: string | null;
  backdrop_path?: string | null;
  vote_average: number;
  release_date?: string;
  genres?: { id: number; name: string }[];
  genre_ids?: number[];
  overview?: string;
}

interface MovieCardProps {
  movie: Movie;
  size?: "sm" | "md" | "lg";
}

export function MovieCard({ movie, size = "md" }: MovieCardProps) {
  const [hovered, setHovered] = useState(false);
  const router = useRouter();
  const { has, add, remove } = useWatchlistStore();
  const { user } = useAuthStore();
  const inList = has(movie.id);

  const sizeClasses = {
    sm: "w-32 md:w-36",
    md: "w-40 md:w-48",
    lg: "w-48 md:w-56",
  };

  const handleWatchlist = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) { router.push("/auth/login"); return; }
    inList ? remove(movie.id) : add(movie.id);
  };

  const year = movie.release_date?.slice(0, 4);
  const rating = movie.vote_average?.toFixed(1);

  return (
    <motion.div
      className={`${sizeClasses[size]} flex-shrink-0 cursor-pointer relative rounded overflow-hidden`}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      whileHover={{ scale: 1.05, zIndex: 10 }}
      transition={{ duration: 0.2 }}
      onClick={() => router.push(`/movie/${movie.id}`)}
    >
      {/* Poster */}
      <div className="aspect-[2/3] bg-zinc-800 relative">
        <img
          src={img(movie.poster_path)}
          alt={movie.title}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        {!movie.poster_path && (
          <div className="absolute inset-0 flex items-center justify-center bg-zinc-800">
            <span className="text-zinc-500 text-xs text-center px-2">{movie.title}</span>
          </div>
        )}
      </div>

      {/* Hover overlay */}
      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent flex flex-col justify-end p-3 rounded"
          >
            {/* Expanded card with backdrop for larger screens */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => { e.stopPropagation(); router.push(`/movie/${movie.id}`); }}
                  className="bg-white rounded-full p-1.5 hover:bg-gray-200 transition"
                >
                  <Play size={14} fill="black" className="text-black" />
                </button>
                <button
                  onClick={handleWatchlist}
                  className="border border-white/50 rounded-full p-1.5 hover:border-white transition"
                >
                  {inList
                    ? <Check size={14} className="text-white" />
                    : <Plus size={14} className="text-white" />}
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); router.push(`/movie/${movie.id}`); }}
                  className="border border-white/50 rounded-full p-1.5 hover:border-white transition ml-auto"
                >
                  <ChevronDown size={14} className="text-white" />
                </button>
              </div>

              <p className="text-white font-semibold text-xs line-clamp-1">{movie.title}</p>

              <div className="flex items-center gap-2 text-[11px]">
                <span className="text-green-400 font-bold flex items-center gap-0.5">
                  <Star size={10} fill="currentColor" />
                  {rating}
                </span>
                {year && <span className="text-gray-400">{year}</span>}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
