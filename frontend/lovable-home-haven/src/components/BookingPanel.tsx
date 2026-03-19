import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, Users, Zap, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { format, differenceInDays } from "date-fns";
import type { Listing } from "@/data/mockData";

interface BookingPanelProps {
  listing: Listing;
}

const BookingPanel = ({ listing }: BookingPanelProps) => {
  const navigate = useNavigate();
  const [checkIn, setCheckIn] = useState<Date>();
  const [checkOut, setCheckOut] = useState<Date>();
  const [guests, setGuests] = useState(1);

  const nights = checkIn && checkOut ? differenceInDays(checkOut, checkIn) : 0;
  const subtotal = nights * listing.price;
  const serviceFee = Math.round(subtotal * 0.12);
  const cleaningFee = nights > 0 ? 65 : 0;
  const total = subtotal + serviceFee + cleaningFee;

  const handleReserve = () => {
    navigate(`/booking/${listing.id}`, {
      state: {
        listing,
        checkIn: checkIn?.toISOString(),
        checkOut: checkOut?.toISOString(),
        guests,
        nights,
        subtotal,
        serviceFee,
        cleaningFee,
        total,
      },
    });
  };

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-lg">
      <div className="flex items-baseline gap-1">
        <span className="font-heading text-2xl font-bold text-foreground">${listing.price}</span>
        <span className="text-muted-foreground">/ night</span>
      </div>

      <div className="mt-4 overflow-hidden rounded-lg border border-border">
        {/* Date selectors */}
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
              <CalendarComponent mode="single" selected={checkIn} onSelect={setCheckIn} disabled={(d) => d < new Date()} initialFocus className="p-3 pointer-events-auto" />
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
              <CalendarComponent mode="single" selected={checkOut} onSelect={setCheckOut} disabled={(d) => d < (checkIn || new Date())} initialFocus className="p-3 pointer-events-auto" />
            </PopoverContent>
          </Popover>
        </div>

        {/* Guests */}
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

      <Button
        onClick={handleReserve}
        disabled={!checkIn || !checkOut}
        className="mt-4 w-full rounded-lg py-6 text-base font-semibold"
        size="lg"
      >
        {listing.instantBook ? (
          <><Zap className="mr-2 h-4 w-4" /> Reserve</>
        ) : (
          "Request to Book"
        )}
      </Button>

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
    </div>
  );
};

export default BookingPanel;
