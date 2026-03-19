import { Home } from "lucide-react";

const Footer = () => (
  <footer className="border-t border-border bg-card py-8">
    <div className="container">
      <div className="flex flex-col items-center gap-4 md:flex-row md:justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary">
            <Home className="h-3 w-3 text-primary-foreground" />
          </div>
          <span className="font-heading text-sm font-semibold text-foreground">StayVista</span>
        </div>
        <p className="text-xs text-muted-foreground">© 2026 StayVista. Enterprise homestay platform. All rights reserved.</p>
      </div>
    </div>
  </footer>
);

export default Footer;
