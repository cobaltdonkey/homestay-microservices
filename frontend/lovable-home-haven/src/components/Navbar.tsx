import { Link, useLocation } from "react-router-dom";
import { Home, Search, Map, User, Menu, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getStoredGuestProfile } from "@/lib/tripStorage";

const Navbar = () => {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const profile = getStoredGuestProfile();

  const links = [
    { to: "/", label: "Explore", icon: Search },
    { to: "/trips", label: "Trips", icon: Map },
    { to: "/host", label: "Host tools", icon: Building2 },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-xl">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Home className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-heading text-lg font-bold text-foreground">Home Haven</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {links.map((link) => {
            const isActive = location.pathname === link.to;
            return (
              <Link key={link.to} to={link.to}>
                <Button variant="ghost" size="sm" className={cn("gap-2 font-medium", isActive && "bg-secondary text-foreground")}>
                  <link.icon className="h-4 w-4" />
                  {link.label}
                </Button>
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Button variant="outline" size="sm" className="gap-2 rounded-full">
            <User className="h-4 w-4" />
            <span>{profile?.name || "Guest checkout"}</span>
          </Button>
        </div>

        <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {mobileOpen && (
        <div className="animate-fade-in border-t border-border bg-card p-4 md:hidden">
          <nav className="flex flex-col gap-2">
            {links.map((link) => {
              const isActive = location.pathname === link.to;
              return (
                <Link key={link.to} to={link.to} onClick={() => setMobileOpen(false)}>
                  <Button variant="ghost" className={cn("w-full justify-start gap-3", isActive && "bg-secondary")}>
                    <link.icon className="h-4 w-4" />
                    {link.label}
                  </Button>
                </Link>
              );
            })}
          </nav>
        </div>
      )}
    </header>
  );
};

export default Navbar;
