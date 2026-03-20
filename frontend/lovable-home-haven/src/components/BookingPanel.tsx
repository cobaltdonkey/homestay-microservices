import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, Info, Loader2, Users, Zap } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { api, type Listing } from "@/lib/api";

interface BookingPanelProps {
  listing: Listing;
}

const BookingPanel = ({ listing }: BookingPanelProps) => {
  const navigate = useNavigate();
  const [checkIn, setCheckIn] = useState<Date>();
  const [checkOut, setCheckOut] = useState<Date>();
  const [guests, setGuests] = useState(1);
  const [availabilityMessage, setAvailabilityMessage] = useState<string>("");
  const [checkingAvailability, setCheckingAvailability] = useState(false);

  const nights = checkIn && checkOut ? differenceInDays(checkOut, checkIn) : 0;
  const subtotal = nights * listing.price;
  const serviceFee = Math.round(subtotal * 0.12);
  const cleaningFee = nights > 0 ? 45 : 0;
  const total = subtotal + serviceFee + cleaningFee;

  const formattedCheckIn = checkIn ? format(checkIn, "yyyy-MM-dd") : "";
  const formattedCheckOut = checkOut ? format(checkOut, "yyyy-MM-dd") : "";

  const handleReserve = () => {
    navigate(`/booking/${listing.id}`, {
      state: {
        listing,
        checkIn: formattedCheckIn,
        checkOut: formattedCheckOut,
        guests,
        nights,
        subtotal,
        serviceFee,
        cleaningFee,
        total,
      },
    });
  };

  const handleCheckAvailability = async () => {
    if (!formattedCheckIn || !formattedCheckOut) return;

    setCheckingAvailability(true);
    setAvailabilityMessage("");
    try {
      const result = await api.checkAvailability(listing.listingId, formattedCheckIn, formattedCheckOut);
      setAvailabilityMessage(
        result.available
          ? "Available for your selected dates."
          : "This stay is unavailable for the selected dates."
      );
    } catch (error) {
      setAvailabilityMessage(error instanceof Error ? error.message : "Unable to verify availability.");
    } finally {
      setCheckingAvailability(false);
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-lg">
      <div className="flex items-baseline gap-1">
        <span className="font-heading text-2xl font-bold text-foreground">${listing.price}</span>
        <span className="text-muted-foreground">/ night</span>
      </div>

      <div className="mt-4 overflow-hidden rounded-lg border border-border">
        <div className="grid grid-cols-2 divide-x divide-border">
          <Popover>
            <PopoverTrigger asChild>
              <button className="p-3 text-left transition-colors hover:bg-secondary">
                <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Check-in</div>
                <div className={cn("mt-0.5 text-sm", !checkIn && "text-muted-foreground")}>
                  {checkIn ? format(checkIn, "MMM d, yyyy") : "Add date"}
                </div>
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarComponent mode="single" selected={checkIn} onSelect={setCheckIn} disabled={(date) => date < new Date()} initialFocus className="pointer-events-auto p-3" />
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger asChild>
              <button className="p-3 text-left transition-colors hover:bg-secondary">
                <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Check-out</div>
                <div className={cn("mt-0.5 text-sm", !checkOut && "text-muted-foreground")}>
                  {checkOut ? format(checkOut, "MMM d, yyyy") : "Add date"}
                </div>
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarComponent mode="single" selected={checkOut} onSelect={setCheckOut} disabled={(date) => date < (checkIn || new Date())} initialFocus className="pointer-events-auto p-3" />
            </PopoverContent>
          </Popover>
        </div>

        <div className="border-t border-border p-3">
          <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Guests</div>
          <div className="mt-0.5 flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <select
              value={guests}
              onChange={(e) => setGuests(Number(e.target.value))}
              className="bg-transparent text-sm text-foreground outline-none"
            >
              {Array.from({ length: listing.maxGuests }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>{n} guest{n > 1 ? "s" : ""}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-3">
        <Button
          variant="outline"
          onClick={handleCheckAvailability}
          disabled={!checkIn || !checkOut || checkingAvailability}
          className="rounded-lg"
        >
          {checkingAvailability ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Checking...</> : "Check availability"}
        </Button>

        <Button
          onClick={handleReserve}
          disabled={!checkIn || !checkOut}
          className="rounded-lg py-6 text-base font-semibold"
          size="lg"
        >
          {listing.instantBook ? (
            <><Zap className="mr-2 h-4 w-4" /> Reserve</>
          ) : (
            "Request to Book"
          )}
        </Button>
      </div>

      {availabilityMessage && (
        <p className="mt-3 text-sm text-muted-foreground">{availabilityMessage}</p>
      )}

      {!listing.instantBook && (
        <p className="mt-2 flex items-center justify-center gap-1 text-xs text-muted-foreground">
          <Info className="h-3 w-3" />
          Host approval may be required
        </p>
      )}

      {nights > 0 && (
        <div className="mt-4 space-y-3">
          <Separator />
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">${listing.price} × {nights} night{nights > 1 ? "s" : ""}</span>
            <span className="text-foreground">${subtotal}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Cleaning fee</span>
            <span className="text-foreground">${cleaningFee}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Service fee</span>
            <span className="text-foreground">${serviceFee}</span>
          </div>
          <Separator />
          <div className="flex justify-between font-heading font-semibold">
            <span>Total</span>
            <span>${total}</span>
          </div>
        </div>
      )}

      <div className="mt-4 flex items-center gap-2 rounded-lg bg-secondary/80 p-3 text-xs text-muted-foreground">
        <Calendar className="h-3.5 w-3.5 shrink-0" />
        Availability, booking, and pricing are connected to the live homestay backend through Kong.
      </div>
    </div>
  );
};

export default BookingPanel;
