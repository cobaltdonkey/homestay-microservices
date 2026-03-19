import { useState } from "react";
import { Search, MapPin, Calendar, Users, SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface SearchBarProps {
  onSearch: (filters: {
    destination: string;
    checkIn?: Date;
    checkOut?: Date;
    guests: number;
  }) => void;
}

const SearchBar = ({ onSearch }: SearchBarProps) => {
  const [destination, setDestination] = useState("");
  const [checkIn, setCheckIn] = useState<Date>();
  const [checkOut, setCheckOut] = useState<Date>();
  const [guests, setGuests] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  const handleSearch = () => {
    onSearch({ destination, checkIn, checkOut, guests });
  };

  return (
    <div className="w-full">
      <div className="mx-auto flex max-w-4xl flex-col gap-3 rounded-2xl border border-border bg-card p-3 shadow-lg md:flex-row md:items-center md:gap-0 md:rounded-full md:p-2">
        {/* Destination */}
        <div className="flex flex-1 items-center gap-2 rounded-full px-4 py-2 transition-colors hover:bg-secondary md:border-r md:border-border">
          <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" />
          <Input
            placeholder="Where to?"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            className="border-0 bg-transparent p-0 shadow-none placeholder:text-muted-foreground focus-visible:ring-0"
          />
        </div>

        {/* Check-in */}
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
              className="p-3 pointer-events-auto"
            />
          </PopoverContent>
        </Popover>

        {/* Check-out */}
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
              className="p-3 pointer-events-auto"
            />
          </PopoverContent>
        </Popover>

        {/* Guests */}
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

        {/* Search button */}
        <Button onClick={handleSearch} size="icon" className="h-10 w-10 shrink-0 rounded-full md:h-10 md:w-10">
          <Search className="h-4 w-4" />
        </Button>
      </div>

      {/* Filter toggle */}
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

      {/* Expanded filters */}
      {showFilters && (
        <div className="mx-auto mt-2 max-w-4xl animate-fade-in rounded-xl border border-border bg-card p-4">
          <div className="flex flex-wrap gap-2">
            {["Apartment", "Villa", "Cabin", "Studio", "Townhouse", "Penthouse"].map((type) => (
              <Button key={type} variant="outline" size="sm" className="rounded-full text-xs">
                {type}
              </Button>
            ))}
            <Button variant="outline" size="sm" className="rounded-full text-xs gap-1">
              ⚡ Instant Book
            </Button>
            <Button variant="outline" size="sm" className="rounded-full text-xs">
              4+ Stars
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchBar;
