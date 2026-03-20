import { useEffect, useState } from "react";
import { Search, MapPin, Calendar, Users, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface SearchBarProps {
  initialDestination?: string;
  onSearch: (filters: {
    destination: string;
    checkIn?: Date;
    checkOut?: Date;
    guests: number;
    maxPrice?: number;
    bookingMode?: "ANY" | "INSTANT" | "REQUEST";
  }) => void;
}

const SearchBar = ({ onSearch, initialDestination = "Singapore" }: SearchBarProps) => {
  const [destination, setDestination] = useState(initialDestination);
  const [checkIn, setCheckIn] = useState<Date>();
  const [checkOut, setCheckOut] = useState<Date>();
  const [guests, setGuests] = useState(1);
  const [maxPrice, setMaxPrice] = useState(300);
  const [bookingMode, setBookingMode] = useState<"ANY" | "INSTANT" | "REQUEST">("ANY");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    setDestination(initialDestination);
  }, [initialDestination]);

  const handleSearch = () => {
    onSearch({ destination, checkIn, checkOut, guests, maxPrice, bookingMode });
  };

  return (
    <div className="w-full">
      <div className="mx-auto flex max-w-4xl flex-col gap-3 rounded-2xl border border-border bg-card p-3 shadow-lg md:flex-row md:items-center md:gap-0 md:rounded-full md:p-2">
        <div className="flex flex-1 items-center gap-2 rounded-full px-4 py-2 transition-colors hover:bg-secondary md:border-r md:border-border">
          <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" />
          <Input
            placeholder="Where to?"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            className="border-0 bg-transparent p-0 shadow-none placeholder:text-muted-foreground focus-visible:ring-0"
          />
        </div>

        <Popover>
          <PopoverTrigger asChild>
            <button className="flex items-center gap-2 rounded-full px-4 py-2 text-left text-sm transition-colors hover:bg-secondary md:border-r md:border-border">
              <Calendar className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className={cn(!checkIn && "text-muted-foreground")}>
                {checkIn ? format(checkIn, "MMM d") : "Check-in"}
              </span>
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <CalendarComponent
              mode="single"
              selected={checkIn}
              onSelect={setCheckIn}
              disabled={(date) => date < new Date()}
              initialFocus
              className="pointer-events-auto p-3"
            />
          </PopoverContent>
        </Popover>

        <Popover>
          <PopoverTrigger asChild>
            <button className="flex items-center gap-2 rounded-full px-4 py-2 text-left text-sm transition-colors hover:bg-secondary md:border-r md:border-border">
              <Calendar className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className={cn(!checkOut && "text-muted-foreground")}>
                {checkOut ? format(checkOut, "MMM d") : "Check-out"}
              </span>
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <CalendarComponent
              mode="single"
              selected={checkOut}
              onSelect={setCheckOut}
              disabled={(date) => date < (checkIn || new Date())}
              initialFocus
              className="pointer-events-auto p-3"
            />
          </PopoverContent>
        </Popover>

        <div className="flex items-center gap-2 rounded-full px-4 py-2 transition-colors hover:bg-secondary">
          <Users className="h-4 w-4 shrink-0 text-muted-foreground" />
          <select
            value={guests}
            onChange={(e) => setGuests(Number(e.target.value))}
            className="bg-transparent text-sm text-foreground outline-none"
          >
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <option key={n} value={n}>{n} guest{n > 1 ? "s" : ""}</option>
            ))}
          </select>
        </div>

        <Button onClick={handleSearch} size="icon" className="h-10 w-10 shrink-0 rounded-full md:h-10 md:w-10">
          <Search className="h-4 w-4" />
        </Button>
      </div>

      <div className="mx-auto mt-3 flex max-w-4xl justify-center">
        <Button
          variant="ghost"
          size="sm"
          className="gap-2 text-muted-foreground"
          onClick={() => setShowFilters(!showFilters)}
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          {showFilters ? "Hide filters" : "More filters"}
        </Button>
      </div>

      {showFilters && (
        <div className="mx-auto mt-2 grid max-w-4xl gap-4 rounded-xl border border-border bg-card p-4 md:grid-cols-2">
          <div>
            <label className="text-sm font-medium text-foreground">Max nightly price</label>
            <Input
              type="number"
              min="0"
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value) || 0)}
              className="mt-2"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-foreground">Booking mode</label>
            <select
              value={bookingMode}
              onChange={(e) => setBookingMode(e.target.value as "ANY" | "INSTANT" | "REQUEST")}
              className="mt-2 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="ANY">All stays</option>
              <option value="INSTANT">Instant Book</option>
              <option value="REQUEST">Request to Book</option>
            </select>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchBar;
