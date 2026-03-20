import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Calendar, Check, ChevronLeft, CreditCard, Loader2, MapPin, Shield, Users, Zap } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { api, type BookingDraft } from "@/lib/api";
import { cn } from "@/lib/utils";
import { saveStoredTrip } from "@/lib/tripStorage";

interface BookingState extends BookingDraft {}

type Step = "details" | "guest-info" | "payment" | "confirmation";

const BookingPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as BookingState | null;

  const [step, setStep] = useState<Step>("details");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [guestInfo, setGuestInfo] = useState({ name: "", email: "", phone: "" });
  const [bookingResult, setBookingResult] = useState<{ bookingId: string; status: "confirmed" | "pending" | "cancelled" | "completed" } | null>(null);

  if (!state?.listing || !state.checkIn || !state.checkOut) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <div className="container flex flex-1 items-center justify-center py-20 text-center">
          <div>
            <h2 className="font-heading text-xl font-bold">No booking details</h2>
            <p className="mt-2 text-muted-foreground">Please choose dates and guests from a listing before booking.</p>
            <Link to="/"><Button className="mt-4">Browse listings</Button></Link>
          </div>
        </div>
      </div>
    );
  }

  const { listing, checkIn, checkOut, guests, nights, subtotal, serviceFee, cleaningFee, total } = state;

  const steps: { key: Step; label: string; number: number }[] = [
    { key: "details", label: "Trip details", number: 1 },
    { key: "guest-info", label: "Guest info", number: 2 },
    { key: "payment", label: "Payment", number: 3 },
    { key: "confirmation", label: "Confirmed", number: 4 },
  ];

  const currentStepIndex = steps.findIndex((s) => s.key === step);

  const handleConfirmBooking = async () => {
    setLoading(true);
    setError("");

    try {
      const result = await api.createBooking(state, guestInfo);
      saveStoredTrip({
        bookingId: result.bookingId,
        listingId: listing.listingId,
        listingTitle: listing.title,
        listingImage: listing.coverImage,
        location: listing.location,
        checkInDate: checkIn,
        checkOutDate: checkOut,
        guests,
        totalPrice: total,
        status: result.status,
        createdAt: new Date().toISOString(),
      });
      setBookingResult(result);
      setStep("confirmation");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to complete booking.");
    } finally {
      setLoading(false);
    }
  };

  const confirmationTitle = bookingResult?.status === "confirmed" ? "Booking confirmed!" : "Request submitted!";
  const confirmationBody = bookingResult?.status === "confirmed"
    ? "Your reservation has been confirmed by the booking service."
    : "Your booking request has been created and is waiting for host approval.";

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="container flex-1 py-8">
        {step !== "confirmation" && (
          <button
            onClick={() => {
              if (step === "details") navigate(-1);
              else setStep(steps[currentStepIndex - 1].key);
            }}
            className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4" /> Back
          </button>
        )}

        <div className="mb-8 flex items-center justify-center gap-2">
          {steps.map((s, i) => (
            <div key={s.key} className="flex items-center gap-2">
              <div className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition-colors",
                i <= currentStepIndex ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
              )}>
                {i < currentStepIndex ? <Check className="h-4 w-4" /> : s.number}
              </div>
              <span className={cn("hidden text-xs font-medium sm:inline", i <= currentStepIndex ? "text-foreground" : "text-muted-foreground")}>
                {s.label}
              </span>
              {i < steps.length - 1 && <div className={cn("h-px w-8 transition-colors", i < currentStepIndex ? "bg-primary" : "bg-border")} />}
            </div>
          ))}
        </div>

        <div className="mx-auto grid max-w-4xl gap-8 lg:grid-cols-5">
          <div className="lg:col-span-3">
            {step === "details" && (
              <div className="animate-fade-in space-y-6">
                <h2 className="font-heading text-xl font-bold">Confirm your trip details</h2>
                <div className="space-y-3 rounded-xl border border-border p-4">
                  <div className="flex items-center gap-3">
                    <img src={listing.coverImage} alt={listing.title} className="h-16 w-16 rounded-lg object-cover" />
                    <div>
                      <h3 className="font-heading text-sm font-semibold">{listing.title}</h3>
                      <p className="flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="h-3 w-3" />{listing.location}</p>
                    </div>
                  </div>
                  <Separator />
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-muted-foreground" /><div><p className="text-xs text-muted-foreground">Check-in</p><p className="font-medium">{format(new Date(checkIn), "MMM d, yyyy")}</p></div></div>
                    <div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-muted-foreground" /><div><p className="text-xs text-muted-foreground">Check-out</p><p className="font-medium">{format(new Date(checkOut), "MMM d, yyyy")}</p></div></div>
                  </div>
                  <div className="flex items-center gap-2 text-sm"><Users className="h-4 w-4 text-muted-foreground" /><span>{guests} guest{guests > 1 ? "s" : ""}</span></div>
                </div>
                <Button className="w-full py-6" size="lg" onClick={() => setStep("guest-info")}>Continue</Button>
              </div>
            )}

            {step === "guest-info" && (
              <div className="animate-fade-in space-y-6">
                <h2 className="font-heading text-xl font-bold">Guest information</h2>
                <p className="text-sm text-muted-foreground">We create and reuse a guest profile behind the scenes, so travelers never need to paste a guest ID manually.</p>
                <div className="space-y-4">
                  <div><Label htmlFor="name">Full name</Label><Input id="name" placeholder="John Doe" value={guestInfo.name} onChange={(e) => setGuestInfo({ ...guestInfo, name: e.target.value })} className="mt-1" /></div>
                  <div><Label htmlFor="email">Email</Label><Input id="email" type="email" placeholder="john@example.com" value={guestInfo.email} onChange={(e) => setGuestInfo({ ...guestInfo, email: e.target.value })} className="mt-1" /></div>
                  <div><Label htmlFor="phone">Phone number</Label><Input id="phone" type="tel" placeholder="+1 (555) 000-0000" value={guestInfo.phone} onChange={(e) => setGuestInfo({ ...guestInfo, phone: e.target.value })} className="mt-1" /></div>
                </div>
                <Button className="w-full py-6" size="lg" disabled={!guestInfo.name || !guestInfo.email || !guestInfo.phone} onClick={() => setStep("payment")}>Continue to payment</Button>
              </div>
            )}

            {step === "payment" && (
              <div className="animate-fade-in space-y-6">
                <h2 className="font-heading text-xl font-bold">Payment</h2>
                <div className="space-y-4 rounded-xl border border-border p-4">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-muted-foreground" />
                    <span className="text-sm font-medium">Checkout experience</span>
                  </div>
                  <Input placeholder="Card number" className="font-mono" />
                  <div className="grid grid-cols-2 gap-3">
                    <Input placeholder="MM / YY" />
                    <Input placeholder="CVC" />
                  </div>
                  <p className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Shield className="h-3 w-3" />
                    The visual checkout is polished, while the backend currently uses the demo payment method token `pm_card_visa`.
                  </p>
                </div>
                {error && <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">{error}</div>}
                <Button className="w-full py-6" size="lg" onClick={handleConfirmBooking} disabled={loading}>
                  {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...</> : `Confirm & Pay $${total}`}
                </Button>
              </div>
            )}

            {step === "confirmation" && bookingResult && (
              <div className="animate-fade-in space-y-6 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
                  {bookingResult.status === "confirmed" ? (
                    <Check className="h-8 w-8 text-success" />
                  ) : (
                    <Zap className="h-8 w-8 text-warning" />
                  )}
                </div>
                <h2 className="font-heading text-2xl font-bold">{confirmationTitle}</h2>
                <p className="text-muted-foreground">{confirmationBody}</p>
                <div className="mx-auto max-w-sm space-y-2 rounded-xl border border-border bg-secondary/50 p-4 text-left text-sm">
                  <p><span className="text-muted-foreground">Booking ID:</span> <span className="font-mono font-medium">{bookingResult.bookingId}</span></p>
                  <p><span className="text-muted-foreground">Property:</span> <span className="font-medium">{listing.title}</span></p>
                  <p><span className="text-muted-foreground">Dates:</span> <span className="font-medium">{format(new Date(checkIn), "MMM d")} – {format(new Date(checkOut), "MMM d, yyyy")}</span></p>
                  <p><span className="text-muted-foreground">Total:</span> <span className="font-medium">${total}</span></p>
                </div>
                <div className="flex justify-center gap-3">
                  <Link to="/trips"><Button>View my trips</Button></Link>
                  <Link to="/"><Button variant="outline">Browse more stays</Button></Link>
                </div>
              </div>
            )}
          </div>

          {step !== "confirmation" && (
            <div className="hidden lg:col-span-2 lg:block">
              <div className="sticky top-24 space-y-4 rounded-xl border border-border bg-card p-5">
                <div className="flex items-center gap-3">
                  <img src={listing.coverImage} alt={listing.title} className="h-14 w-14 rounded-lg object-cover" />
                  <div>
                    <h4 className="line-clamp-1 text-sm font-semibold">{listing.title}</h4>
                    <p className="text-xs text-muted-foreground">{listing.location}</p>
                  </div>
                </div>
                <Separator />
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">${listing.price} × {nights} nights</span><span>${subtotal}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Cleaning fee</span><span>${cleaningFee}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Service fee</span><span>${serviceFee}</span></div>
                </div>
                <Separator />
                <div className="flex justify-between font-heading font-semibold"><span>Total</span><span>${total}</span></div>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default BookingPage;
