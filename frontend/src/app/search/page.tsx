"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { api } from "@/lib/api";
import { Navbar } from "@/components/Navbar";
import { MovieCard } from "@/components/MovieCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Search } from "lucide-react";
import { useRouter } from "next/navigation";

function SearchResults() {
  const searchParams = useSearchParams();
  const q = searchParams.get("q") || "";
  const router = useRouter();
  const [input, setInput] = useState(q);

  useEffect(() => { setInput(q); }, [q]);

  const { data, isLoading } = useQuery({
    queryKey: ["search", q],
    queryFn: () => api.get(`/movies/search?q=${encodeURIComponent(q)}`).then((r) => r.data),
    enabled: !!q,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) router.push(`/search?q=${encodeURIComponent(input.trim())}`);
  };

  return (
    <div className="min-h-screen bg-[#141414] pb-20">
      <Navbar />
      <div className="pt-28 px-6 md:px-12">
        {/* Search bar */}
        <form onSubmit={handleSearch} className="flex gap-3 max-w-xl mb-10">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Search movies, shows, people..."
              className="w-full bg-white/10 border border-white/20 text-white rounded-lg pl-10 pr-4 py-3 outline-none focus:border-red-500 transition placeholder:text-gray-500"
            />
          </div>
          <button
            type="submit"
            className="bg-red-600 hover:bg-red-700 text-white font-semibold px-6 py-3 rounded-lg transition text-sm"
          >
            Search
          </button>
        </form>

        {q && (
          <h2 className="text-gray-400 text-sm mb-6">
            {isLoading ? "Searching..." : `${data?.total_results || 0} results for "${q}"`}
          </h2>
        )}

        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <Skeleton key={i} className="aspect-[2/3] rounded bg-zinc-800" />
            ))}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4"
          >
            {(data?.results || []).map((movie: { id: number; title: string; poster_path: string; vote_average: number; release_date: string }) => (
              <MovieCard key={movie.id} movie={movie} size="lg" />
            ))}
          </motion.div>
        )}

        {!isLoading && q && data?.results?.length === 0 && (
          <div className="text-center py-20">
            <p className="text-gray-400 text-lg">No results found for &ldquo;{q}&rdquo;</p>
            <p className="text-gray-600 text-sm mt-2">Try a different search term</p>
          </div>
        )}

        {!q && (
          <div className="text-center py-20">
            <Search size={48} className="mx-auto text-gray-700 mb-4" />
            <p className="text-gray-400">Search for any movie or show</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense>
      <SearchResults />
    </Suspense>
  );
}
