"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Navbar } from "@/components/Navbar";
import { HeroBanner } from "@/components/HeroBanner";
import { MovieRow } from "@/components/MovieRow";
import { useAuthStore } from "@/store/useAuthStore";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const { user, fetchMe, token } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (token && !user) fetchMe();
  }, [token, user, fetchMe]);

  useEffect(() => {
    if (!token) router.replace("/");
  }, [token, router]);

  const { data: trending, isLoading: trendingLoading } = useQuery({
    queryKey: ["trending"],
    queryFn: () => api.get("/movies/trending").then((r) => r.data),
  });

  const { data: popular, isLoading: popularLoading } = useQuery({
    queryKey: ["popular"],
    queryFn: () => api.get("/movies/popular").then((r) => r.data),
  });

  const { data: topRated, isLoading: topRatedLoading } = useQuery({
    queryKey: ["top-rated"],
    queryFn: () => api.get("/movies/top-rated").then((r) => r.data),
  });

  const { data: action, isLoading: actionLoading } = useQuery({
    queryKey: ["genre-action"],
    queryFn: () => api.get("/movies/genre/action").then((r) => r.data),
  });

  const { data: horror, isLoading: horrorLoading } = useQuery({
    queryKey: ["genre-horror"],
    queryFn: () => api.get("/movies/genre/horror").then((r) => r.data),
  });

  const { data: bollywood, isLoading: bollywoodLoading } = useQuery({
    queryKey: ["bollywood"],
    queryFn: () => api.get("/movies/genre/drama?language=hindi").then((r) => r.data),
  });

  const { data: telugu, isLoading: teluguLoading } = useQuery({
    queryKey: ["telugu"],
    queryFn: () => api.get("/movies/genre/action?language=telugu").then((r) => r.data),
  });

  const { data: korean, isLoading: koreanLoading } = useQuery({
    queryKey: ["korean"],
    queryFn: () => api.get("/movies/genre/thriller?language=korean").then((r) => r.data),
  });

  const { data: recommendations, isLoading: recLoading } = useQuery({
    queryKey: ["recommendations"],
    queryFn: () => api.get("/recommendations/").then((r) => r.data),
    enabled: !!user,
  });

  if (!token) return null;

  return (
    <div className="min-h-screen bg-[#141414]">
      <Navbar />
      <HeroBanner />

      <div className="pb-20 -mt-16 relative z-10">
        {user && recommendations?.length > 0 && (
          <MovieRow
            title="Recommended For You"
            movies={recommendations.map((r: { tmdb_id: number; title: string; poster_path: string; vote_average: number }) => ({
              id: r.tmdb_id,
              title: r.title,
              poster_path: r.poster_path,
              vote_average: r.vote_average,
            }))}
            loading={recLoading}
          />
        )}

        <MovieRow title="Trending Now" movies={trending?.results || []} loading={trendingLoading} />
        <MovieRow title="Popular on CineNova" movies={popular?.results || []} loading={popularLoading} />
        <MovieRow title="Top Rated" movies={topRated?.results || []} loading={topRatedLoading} />
        <MovieRow title="Action & Adventure" movies={action?.results || []} loading={actionLoading} />
        <MovieRow title="Horror" movies={horror?.results || []} loading={horrorLoading} />
        <MovieRow title="Bollywood" movies={bollywood?.results || []} loading={bollywoodLoading} />
        <MovieRow title="Telugu Cinema" movies={telugu?.results || []} loading={teluguLoading} />
        <MovieRow title="Korean Cinema" movies={korean?.results || []} loading={koreanLoading} />
      </div>
    </div>
  );
}
