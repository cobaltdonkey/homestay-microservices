import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SearchBar from "@/components/SearchBar";
import ListingCard from "@/components/ListingCard";
import ListingCardSkeleton from "@/components/ListingCardSkeleton";
import { api, type Listing } from "@/lib/api";
import { format } from "date-fns";

const DEFAULT_DESTINATION = "Singapore";

const HomePage = () => {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState<string>("");
  const [lastDestination, setLastDestination] = useState(DEFAULT_DESTINATION);

  const runSearch = async ({
    destination,
    checkIn,
    checkOut,
    guests,
    maxPrice,
    bookingMode,
  }: {
    destination: string;
    checkIn?: Date;
    checkOut?: Date;
    guests: number;
    maxPrice?: number;
    bookingMode?: "ANY" | "INSTANT" | "REQUEST";
  }) => {
    setLoading(true);
    setError("");
    setSearched(true);
    setLastDestination(destination);

    try {
      const data = await api.searchListings({
        destination,
        checkIn: checkIn ? format(checkIn, "yyyy-MM-dd") : undefined,
        checkOut: checkOut ? format(checkOut, "yyyy-MM-dd") : undefined,
        guests,
        maxPrice,
        bookingMode,
      });
      setListings(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load listings.");
      setListings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runSearch({ destination: DEFAULT_DESTINATION, guests: 1, maxPrice: 350, bookingMode: "ANY" });
  }, []);

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <section className="relative overflow-hidden bg-secondary px-4 pb-10 pt-16 md:pb-16 md:pt-24">
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: "radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)",
          backgroundSize: "24px 24px",
        }} />
        <div className="container relative text-center">
          <h1 className="font-heading text-3xl font-extrabold tracking-tight text-foreground md:text-5xl lg:text-6xl">
            Discover stays without chasing <span className="text-primary">internal IDs</span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground md:text-lg">
            The guest experience now sits on top of your live microservices stack. Search by destination,
            explore polished listing cards, and move from discovery to reservation naturally.
          </p>
          <div className="mt-8">
            <SearchBar initialDestination={DEFAULT_DESTINATION} onSearch={runSearch} />
          </div>
        </div>
      </section>

      <main className="container flex-1 py-10">
        <div className="mb-6 flex items-center justify-between gap-3">
          <div>
            <h2 className="font-heading text-xl font-bold text-foreground">
              {searched ? `Stays in ${lastDestination}` : "Popular stays"}
            </h2>
            <p className="text-sm text-muted-foreground">
              Connected to the search, availability, and booking services through Kong.
            </p>
          </div>
          {!loading && !error && (
            <span className="text-sm text-muted-foreground">
              {listings.length} place{listings.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        {error ? (
          <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-6 text-sm text-destructive">
            {error}
          </div>
        ) : loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <ListingCardSkeleton key={i} />
            ))}
          </div>
        ) : listings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Search className="h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-4 font-heading text-lg font-semibold text-foreground">No stays found</h3>
            <p className="mt-1 text-sm text-muted-foreground">Try adjusting your destination, dates, or filters.</p>
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
