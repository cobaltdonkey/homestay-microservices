import { useState, useEffect } from "react";
import { Search } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SearchBar from "@/components/SearchBar";
import ListingCard from "@/components/ListingCard";
import ListingCardSkeleton from "@/components/ListingCardSkeleton";
import { api, type Listing } from "@/data/mockData";

const HomePage = () => {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    api.searchListings({}).then((data) => {
      setListings(data);
      setLoading(false);
    });
  }, []);

  const handleSearch = async (filters: { destination: string; checkIn?: Date; checkOut?: Date; guests: number }) => {
    setLoading(true);
    setSearched(true);
    const data = await api.searchListings({
      destination: filters.destination,
      checkIn: filters.checkIn?.toISOString(),
      checkOut: filters.checkOut?.toISOString(),
      guests: filters.guests,
    });
    setListings(data);
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden bg-secondary px-4 pb-10 pt-16 md:pb-16 md:pt-24">
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
          backgroundSize: '24px 24px',
        }} />
        <div className="container relative text-center">
          <h1 className="font-heading text-3xl font-extrabold tracking-tight text-foreground md:text-5xl lg:text-6xl">
            Find your next <span className="text-primary">perfect stay</span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground md:text-lg">
            Discover handpicked homes, villas, and unique spaces around the world.
            Trusted by thousands of travelers.
          </p>
          <div className="mt-8">
            <SearchBar onSearch={handleSearch} />
          </div>
        </div>
      </section>

      {/* Listings */}
      <main className="container flex-1 py-10">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="font-heading text-xl font-bold text-foreground">
            {searched ? "Search results" : "Popular stays"}
          </h2>
          {!loading && (
            <span className="text-sm text-muted-foreground">
              {listings.length} place{listings.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <ListingCardSkeleton key={i} />
            ))}
          </div>
        ) : listings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Search className="h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-4 font-heading text-lg font-semibold text-foreground">No stays found</h3>
            <p className="mt-1 text-sm text-muted-foreground">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {listings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default HomePage;
