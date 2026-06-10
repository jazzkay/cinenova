"use client";

import { useRef } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { MovieCard } from "@/components/MovieCard";
import { Skeleton } from "@/components/ui/skeleton";

interface Movie {
  id: number;
  title: string;
  poster_path: string | null;
  backdrop_path?: string | null;
  vote_average: number;
  release_date?: string;
}

interface MovieRowProps {
  title: string;
  movies: Movie[];
  loading?: boolean;
  size?: "sm" | "md" | "lg";
}

export function MovieRow({ title, movies, loading, size = "md" }: MovieRowProps) {
  const rowRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: "left" | "right") => {
    if (!rowRef.current) return;
    const amount = rowRef.current.clientWidth * 0.75;
    rowRef.current.scrollBy({ left: dir === "right" ? amount : -amount, behavior: "smooth" });
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.5 }}
      className="mb-10"
    >
      <h2 className="text-white text-xl font-bold mb-3 px-4 md:px-12">{title}</h2>

      <div className="relative group">
        {/* Left arrow */}
        <button
          onClick={() => scroll("left")}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-black/60 hover:bg-black/80 text-white p-2 h-full opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <ChevronLeft size={24} />
        </button>

        {/* Row */}
        <div
          ref={rowRef}
          className="flex gap-2 overflow-x-auto no-scrollbar px-4 md:px-12 pb-4"
        >
          {loading
            ? Array.from({ length: 8 }).map((_, i) => (
                <Skeleton
                  key={i}
                  className={`flex-shrink-0 aspect-[2/3] rounded bg-zinc-800 ${
                    size === "sm" ? "w-32 md:w-36" : size === "lg" ? "w-48 md:w-56" : "w-40 md:w-48"
                  }`}
                />
              ))
            : movies.map((movie) => (
                <MovieCard key={movie.id} movie={movie} size={size} />
              ))}
        </div>

        {/* Right arrow */}
        <button
          onClick={() => scroll("right")}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-black/60 hover:bg-black/80 text-white p-2 h-full opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <ChevronRight size={24} />
        </button>
      </div>
    </motion.section>
  );
}
