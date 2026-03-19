import { Calendar, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import type { Booking } from "@/lib/api";

interface TripCardProps {
  booking: Booking;
}

const statusConfig = {
  confirmed: { label: "Confirmed", className: "bg-success text-success-foreground" },
  pending: { label: "Pending Approval", className: "bg-warning text-warning-foreground" },
  completed: { label: "Completed", className: "bg-secondary text-secondary-foreground" },
  cancelled: { label: "Cancelled", className: "bg-destructive text-destructive-foreground" },
};

const TripCard = ({ booking }: TripCardProps) => {
  const status = statusConfig[booking.status];

  return (
    <div className="group overflow-hidden rounded-xl border border-border bg-card transition-shadow hover:shadow-md">
      <div className="flex flex-col sm:flex-row">
        <div className="relative aspect-video w-full overflow-hidden sm:aspect-square sm:w-48">
          <img
            src={booking.listingImage}
            alt={booking.listingTitle}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute left-2 top-2">
            <Badge className={cn("shadow-sm", status.className)}>{status.label}</Badge>
          </div>
        </div>
        <div className="flex flex-1 flex-col justify-between p-4">
          <div>
            <h3 className="font-heading text-base font-semibold text-foreground">{booking.listingTitle}</h3>
            <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" />
              {booking.location}
            </p>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {format(new Date(booking.checkIn), "MMM d")} – {format(new Date(booking.checkOut), "MMM d, yyyy")}
            </span>
            <span>{booking.guests} guest{booking.guests > 1 ? "s" : ""}</span>
            <span className="ml-auto font-heading font-semibold text-foreground">${booking.totalPrice}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TripCard;
