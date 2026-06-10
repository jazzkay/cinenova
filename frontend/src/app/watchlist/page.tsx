"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Bookmark } from "lucide-react";
import { api } from "@/lib/api";
import { Navbar } from "@/components/Navbar";
import { MovieCard } from "@/components/MovieCard";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthStore } from "@/store/useAuthStore";
import { useWatchlistStore } from "@/store/useWatchlistStore";

export default function WatchlistPage() {
  const { user, token } = useAuthStore();
  const { hydrate } = useWatchlistStore();
  const router = useRouter();

  useEffect(() => {
    if (!token) router.replace("/auth/login");
  }, [token, router]);

  const { data, isLoading } = useQuery({
    queryKey: ["watchlist"],
    queryFn: () => api.get("/users/me/watchlist").then((r) => r.data),
    enabled: !!token,
  });

  useEffect(() => {
    if (data) hydrate(data.map((w: { movie_id: number }) => w.movie_id));
  }, [data, hydrate]);

  return (
    <div className="min-h-screen bg-[#141414] pb-20">
      <Navbar />
      <div className="pt-28 px-6 md:px-12">
        <h1 className="text-3xl font-black text-white mb-2">My List</h1>
        <p className="text-gray-400 text-sm mb-8">Movies and shows you&apos;ve saved</p>

        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="aspect-[2/3] rounded bg-zinc-800" />
            ))}
          </div>
        ) : data?.length > 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4"
          >
            {data.map((item: { movie_id: number }) => (
              <MovieCard
                key={item.movie_id}
                movie={{ id: item.movie_id, title: "", poster_path: null, vote_average: 0 }}
                size="lg"
              />
            ))}
          </motion.div>
        ) : (
          <div className="text-center py-24">
            <Bookmark size={48} className="mx-auto text-gray-700 mb-4" />
            <p className="text-gray-400 text-lg">Your list is empty</p>
            <p className="text-gray-600 text-sm mt-2">
              Click the + button on any movie to add it here
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
