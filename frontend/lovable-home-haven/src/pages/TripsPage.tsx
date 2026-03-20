import { useEffect, useState } from "react";
import { Loader2, Map, Search } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import TripCard from "@/components/TripCard";
import DetailTable from "@/components/DetailTable";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api, type Booking, type BookingRecord } from "@/lib/api";
import { cn } from "@/lib/utils";
import { getStoredTrips, replaceStoredTrips } from "@/lib/tripStorage";

type TabKey = "upcoming" | "pending" | "completed" | "cancelled" | "all";

const TripsPage = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>("all");
  const [lookupId, setLookupId] = useState("");
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState("");
  const [lookupBooking, setLookupBooking] = useState<BookingRecord | null>(null);

  useEffect(() => {
    const loadTrips = async () => {
      setLoading(true);
      const stored = getStoredTrips();

      if (!stored.length) {
        setBookings([]);
        setLoading(false);
        return;
      }

      const refreshedTrips = await Promise.all(stored.map(async (trip) => {
        try {
          const booking = await api.getBooking(trip.bookingId);
          const listing = await api.getListingDetails(booking.listingId);
          return {
            ...trip,
            listingTitle: listing.title,
            listingImage: listing.coverImage,
            location: listing.location,
            totalPrice: trip.totalPrice || listing.price,
            status: api.toTrip(booking, listing).status,
          };
        } catch {
          return trip;
        }
      }));

      replaceStoredTrips(refreshedTrips);
      setBookings(refreshedTrips.map((trip) => ({
        id: trip.bookingId,
        bookingId: trip.bookingId,
        listingId: trip.listingId,
        listingTitle: trip.listingTitle,
        listingImage: trip.listingImage,
        location: trip.location,
        checkIn: trip.checkInDate,
        checkOut: trip.checkOutDate,
        guests: trip.guests,
        totalPrice: trip.totalPrice,
        status: trip.status,
        createdAt: trip.createdAt,
      })));
      setLoading(false);
    };

    loadTrips();
  }, []);

  const runLookup = async () => {
    setLookupLoading(true);
    setLookupError("");
    try {
      const booking = await api.getBooking(lookupId.trim());
      setLookupBooking(booking);
    } catch (error) {
      setLookupBooking(null);
      setLookupError(error instanceof Error ? error.message : "Unable to load booking.");
    } finally {
      setLookupLoading(false);
    }
  };

  const tabs: { key: TabKey; label: string }[] = [
    { key: "all", label: "All" },
    { key: "upcoming", label: "Upcoming" },
    { key: "pending", label: "Pending" },
    { key: "completed", label: "Completed" },
    { key: "cancelled", label: "Cancelled" },
  ];

  const filtered = activeTab === "all" ? bookings : bookings.filter((booking) => {
    if (activeTab === "upcoming") return booking.status === "confirmed";
    return booking.status === activeTab;
  });

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="container flex-1 py-8">
        <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
          <section>
            <h1 className="font-heading text-2xl font-bold text-foreground md:text-3xl">My Trips</h1>
            <p className="mt-1 text-muted-foreground">Reservations created in this browser are stored locally and refreshed from the booking service.</p>

            <div className="mt-6 flex gap-2 overflow-x-auto">
              {tabs.map((tab) => (
                <Button
                  key={tab.key}
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "shrink-0 rounded-full",
                    activeTab === tab.key && "bg-foreground text-background hover:bg-foreground/90 hover:text-background"
                  )}
                  onClick={() => setActiveTab(tab.key)}
                >
                  {tab.label}
                </Button>
              ))}
            </div>

            <div className="mt-6 space-y-4">
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-32 w-full rounded-xl" />
                ))
              ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <Map className="h-12 w-12 text-muted-foreground/50" />
                  <h3 className="mt-4 font-heading text-lg font-semibold">No trips found</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {activeTab === "all" ? "Reserve a stay to start building your trip history." : `No ${activeTab} trips.`}
                  </p>
                </div>
              ) : (
                filtered.map((booking) => <TripCard key={booking.bookingId} booking={booking} />)
              )}
            </div>
          </section>

          <aside className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <Search className="h-5 w-5 text-primary" />
              <h2 className="font-heading text-xl font-semibold">Lookup booking</h2>
            </div>
            <p className="mb-4 text-sm text-muted-foreground">Preserves the legacy booking-status lookup flow even after removing the old static guest page.</p>
            <div className="space-y-4">
              <div>
                <Label htmlFor="lookupId">Booking ID</Label>
                <Input id="lookupId" value={lookupId} onChange={(e) => setLookupId(e.target.value)} placeholder="Paste booking ID here" className="mt-2" />
              </div>
              <Button className="w-full" onClick={runLookup} disabled={!lookupId.trim() || lookupLoading}>
                {lookupLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Looking up</> : "Lookup booking"}
              </Button>
              {lookupError && <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{lookupError}</div>}
              {lookupBooking && (
                <DetailTable
                  fields={[
                    ["bookingId", lookupBooking.bookingId],
                    ["guestId", lookupBooking.guestId],
                    ["hostId", lookupBooking.hostId],
                    ["listingId", lookupBooking.listingId],
                    ["checkInDate", lookupBooking.checkInDate],
                    ["checkOutDate", lookupBooking.checkOutDate],
                    ["bookingMode", lookupBooking.bookingMode],
                    ["status", lookupBooking.status],
                    ["paymentDueAt", lookupBooking.paymentDueAt || "—"],
                  ]}
                />
              )}
            </div>
          </aside>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default TripsPage;
