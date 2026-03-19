import { Link } from "react-router-dom";
import { Star, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Listing } from "@/lib/api";

interface ListingCardProps {
  listing: Listing;
}

const ListingCard = ({ listing }: ListingCardProps) => {
  return (
    <Link to={`/listing/${listing.id}`} className="group block">
      <div className="overflow-hidden rounded-xl transition-shadow duration-300 hover:shadow-lg">
        <div className="relative aspect-[4/3] overflow-hidden">
          <img
            src={listing.coverImage}
            alt={listing.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
          <div className="absolute left-3 top-3">
            {listing.instantBook ? (
              <Badge className="gap-1 bg-primary text-primary-foreground shadow-md">
                <Zap className="h-3 w-3" />
                Instant Book
              </Badge>
            ) : (
              <Badge variant="secondary" className="shadow-md">
                Request to Book
              </Badge>
            )}
          </div>
        </div>

        <div className="p-3">
          <div className="flex items-start justify-between gap-2">
            <h3 className="line-clamp-1 font-heading text-sm font-semibold leading-tight text-foreground">
              {listing.title}
            </h3>
            <div className="flex shrink-0 items-center gap-1 text-sm">
              <Star className="h-3.5 w-3.5 fill-foreground text-foreground" />
              <span className="font-medium">{listing.rating}</span>
            </div>
          </div>
          <p className="mt-0.5 text-sm text-muted-foreground">{listing.location}</p>
          <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">{listing.summary}</p>
          <p className="mt-2 text-sm">
            <span className="font-semibold text-foreground">${listing.price}</span>
            <span className="text-muted-foreground"> / night</span>
          </p>
        </div>
      </div>
    </Link>
  );
};

export default ListingCard;
