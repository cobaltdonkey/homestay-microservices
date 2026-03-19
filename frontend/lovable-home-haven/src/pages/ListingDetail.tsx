import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Star, MapPin, Users, BedDouble, Bath, Wifi, ChevronLeft, Zap, Shield, Award } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ImageGallery from "@/components/ImageGallery";
import BookingPanel from "@/components/BookingPanel";
import { api, type Listing } from "@/data/mockData";

const ListingDetailPage = () => {
  const { id } = useParams();
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      api.getListingDetails(id).then((data) => {
        setListing(data);
        setLoading(false);
      });
    }
  }, [id]);

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <div className="container py-8">
          <Skeleton className="h-8 w-64 mb-4" />
          <Skeleton className="h-[420px] w-full rounded-2xl" />
          <div className="mt-8 grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-4">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
            <Skeleton className="h-96 w-full rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <div className="container flex flex-1 items-center justify-center py-20 text-center">
          <div>
            <h2 className="font-heading text-xl font-bold">Listing not found</h2>
            <p className="mt-2 text-muted-foreground">This property may no longer be available.</p>
            <Link to="/"><Button className="mt-4">Back to search</Button></Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="container py-6">
        {/* Back */}
        <Link to="/" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ChevronLeft className="h-4 w-4" /> Back to search
        </Link>

        {/* Title */}
        <div className="mb-4">
          <h1 className="font-heading text-2xl font-bold text-foreground md:text-3xl">{listing.title}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-foreground text-foreground" />
              <span className="font-medium text-foreground">{listing.rating}</span>
              <span>({listing.reviewCount} reviews)</span>
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="h-4 w-4" /> {listing.location}
            </span>
            {listing.instantBook && (
              <Badge className="gap-1 bg-primary text-primary-foreground">
                <Zap className="h-3 w-3" /> Instant Book
              </Badge>
            )}
          </div>
        </div>

        {/* Gallery */}
        <ImageGallery images={listing.images} title={listing.title} />

        {/* Content grid */}
        <div className="mt-8 grid gap-8 lg:grid-cols-3">
          {/* Left column */}
          <div className="lg:col-span-2 space-y-8">
            {/* Host + specs */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-heading text-lg font-semibold">
                  {listing.propertyType} hosted by {listing.hostName}
                </h2>
                <p className="mt-1 flex flex-wrap gap-2 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" />{listing.maxGuests} guests</span>
                  <span>·</span>
                  <span className="flex items-center gap-1"><BedDouble className="h-3.5 w-3.5" />{listing.bedrooms} bedroom{listing.bedrooms > 1 ? "s" : ""}</span>
                  <span>·</span>
                  <span>{listing.beds} bed{listing.beds > 1 ? "s" : ""}</span>
                  <span>·</span>
                  <span className="flex items-center gap-1"><Bath className="h-3.5 w-3.5" />{listing.bathrooms} bath{listing.bathrooms > 1 ? "s" : ""}</span>
                </p>
              </div>
              <img src={listing.hostAvatar} alt={listing.hostName} className="h-12 w-12 rounded-full object-cover ring-2 ring-border" />
            </div>

            {/* Highlights */}
            <div className="flex flex-col gap-3">
              <div className="flex items-start gap-3">
                <Award className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <div>
                  <p className="text-sm font-medium text-foreground">Superhost · Hosting since {listing.hostSince}</p>
                  <p className="text-xs text-muted-foreground">{listing.hostResponseRate}% response rate</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Shield className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <div>
                  <p className="text-sm font-medium text-foreground">Every booking includes protection</p>
                  <p className="text-xs text-muted-foreground">Free cancellation, secure payment, 24/7 support</p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Description */}
            <div>
              <h3 className="font-heading text-base font-semibold text-foreground">About this place</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{listing.description}</p>
            </div>

            <Separator />

            {/* Sleeping arrangements */}
            <div>
              <h3 className="font-heading text-base font-semibold text-foreground">Sleeping arrangements</h3>
              <div className="mt-3 flex gap-3 overflow-x-auto">
                {listing.sleepingArrangements.map((room, i) => (
                  <div key={i} className="shrink-0 rounded-lg border border-border p-4 text-center">
                    <BedDouble className="mx-auto h-6 w-6 text-muted-foreground" />
                    <p className="mt-2 text-sm font-medium text-foreground">{room.room}</p>
                    <p className="text-xs text-muted-foreground">{room.beds}</p>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Amenities */}
            <div>
              <h3 className="font-heading text-base font-semibold text-foreground">Amenities</h3>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {listing.amenities.map((amenity) => (
                  <div key={amenity} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Wifi className="h-4 w-4 shrink-0" />
                    {amenity}
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* House rules */}
            <div>
              <h3 className="font-heading text-base font-semibold text-foreground">House rules</h3>
              <ul className="mt-3 space-y-1.5">
                {listing.houseRules.map((rule) => (
                  <li key={rule} className="text-sm text-muted-foreground">• {rule}</li>
                ))}
              </ul>
            </div>

            <Separator />

            {/* Cancellation */}
            <div>
              <h3 className="font-heading text-base font-semibold text-foreground">Cancellation policy</h3>
              <p className="mt-2 text-sm text-muted-foreground">{listing.cancellationPolicy}</p>
            </div>

            <Separator />

            {/* Reviews */}
            <div>
              <h3 className="font-heading text-base font-semibold text-foreground">
                Reviews ({listing.reviewCount})
              </h3>
              <div className="mt-4 space-y-4">
                {listing.reviews.map((review) => (
                  <div key={review.id} className="rounded-lg border border-border p-4">
                    <div className="flex items-center gap-3">
                      <img src={review.avatar} alt={review.author} className="h-8 w-8 rounded-full object-cover" />
                      <div>
                        <p className="text-sm font-medium text-foreground">{review.author}</p>
                        <p className="text-xs text-muted-foreground">{review.date}</p>
                      </div>
                      <div className="ml-auto flex items-center gap-1">
                        <Star className="h-3.5 w-3.5 fill-foreground text-foreground" />
                        <span className="text-sm font-medium">{review.rating}</span>
                      </div>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">{review.comment}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right column - Booking panel (sticky on desktop) */}
          <div className="hidden lg:block">
            <div className="sticky top-24">
              <BookingPanel listing={listing} />
            </div>
          </div>
        </div>
      </main>

      {/* Mobile booking CTA */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card p-4 lg:hidden">
        <div className="flex items-center justify-between">
          <div>
            <span className="font-heading text-lg font-bold">${listing.price}</span>
            <span className="text-sm text-muted-foreground"> / night</span>
          </div>
          <Button
            size="lg"
            className="rounded-lg px-6"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            {listing.instantBook ? "Reserve" : "Request to Book"}
          </Button>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default ListingDetailPage;
