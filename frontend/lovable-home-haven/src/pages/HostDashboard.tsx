import { useState } from "react";
import { CheckCircle2, ClipboardCheck, Home, Loader2, Search, XCircle } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import DetailTable from "@/components/DetailTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { api, type BookingRecord, type StayRecord } from "@/lib/api";

const statusStyles: Record<string, string> = {
  CONFIRMED: "bg-emerald-100 text-emerald-700",
  PENDING_HOST: "bg-amber-100 text-amber-700",
  REJECTED: "bg-rose-100 text-rose-700",
  FAILED_PAYMENT: "bg-rose-100 text-rose-700",
  EXPIRED: "bg-rose-100 text-rose-700",
};

const HostDashboard = () => {
  const [bookingId, setBookingId] = useState("");
  const [booking, setBooking] = useState<BookingRecord | null>(null);
  const [bookingError, setBookingError] = useState("");
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingActionMessage, setBookingActionMessage] = useState("");
  const [bookingActionLoading, setBookingActionLoading] = useState(false);

  const [inspectionStayId, setInspectionStayId] = useState("");
  const [condition, setCondition] = useState<"GOOD" | "BAD">("GOOD");
  const [notes, setNotes] = useState("");
  const [inspectionMessage, setInspectionMessage] = useState("");
  const [inspectionLoading, setInspectionLoading] = useState(false);

  const [stayId, setStayId] = useState("");
  const [stay, setStay] = useState<StayRecord | null>(null);
  const [stayError, setStayError] = useState("");
  const [stayLoading, setStayLoading] = useState(false);

  const loadBooking = async () => {
    setBookingLoading(true);
    setBookingError("");
    try {
      const result = await api.getBooking(bookingId.trim());
      setBooking(result);
    } catch (error) {
      setBooking(null);
      setBookingError(error instanceof Error ? error.message : "Unable to load booking.");
    } finally {
      setBookingLoading(false);
    }
  };

  const handleBookingAction = async (action: "approve" | "reject") => {
    setBookingActionLoading(true);
    setBookingActionMessage("");
    try {
      const result = action === "approve"
        ? await api.approveBooking(bookingId.trim())
        : await api.rejectBooking(bookingId.trim());
      setBookingActionMessage(`${action === "approve" ? "Approved" : "Rejected"} — ${result.status}`);
      await loadBooking();
    } catch (error) {
      setBookingActionMessage(error instanceof Error ? error.message : "Unable to update booking.");
    } finally {
      setBookingActionLoading(false);
    }
  };

  const submitInspection = async () => {
    setInspectionLoading(true);
    setInspectionMessage("");
    try {
      const result = await api.resolveDeposit(inspectionStayId.trim(), condition, notes.trim());
      setInspectionMessage(`Action: ${result.action} · Deposit status: ${result.depositStatus}`);
    } catch (error) {
      setInspectionMessage(error instanceof Error ? error.message : "Unable to resolve deposit.");
    } finally {
      setInspectionLoading(false);
    }
  };

  const loadStay = async () => {
    setStayLoading(true);
    setStayError("");
    try {
      const result = await api.getStay(stayId.trim());
      setStay(result);
    } catch (error) {
      setStay(null);
      setStayError(error instanceof Error ? error.message : "Unable to load stay.");
    } finally {
      setStayLoading(false);
    }
  };

  const bookingStatus = booking?.status?.toUpperCase() || "";
  const bookingStatusClass = statusStyles[bookingStatus] || "bg-secondary text-secondary-foreground";

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="container flex-1 py-8">
        <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="font-heading text-3xl font-bold">Host workspace</h1>
            <p className="mt-2 max-w-2xl text-muted-foreground">
              The legacy host workflow has been migrated into the React app, so booking approvals,
              stay lookup, and deposit resolution continue to work after removing the old static HTML files.
            </p>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-3">
          <section className="rounded-2xl border border-border bg-card p-6 shadow-sm xl:col-span-2">
            <div className="mb-4 flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5 text-primary" />
              <h2 className="font-heading text-xl font-semibold">Manage booking request</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
              <div>
                <Label htmlFor="bookingId">Booking ID</Label>
                <Input id="bookingId" value={bookingId} onChange={(e) => setBookingId(e.target.value)} placeholder="Paste booking ID here" className="mt-2" />
              </div>
              <Button onClick={loadBooking} disabled={!bookingId.trim() || bookingLoading}>
                {bookingLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading</> : <><Search className="mr-2 h-4 w-4" /> Load booking</>}
              </Button>
            </div>

            {bookingError && <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{bookingError}</div>}

            {booking && (
              <div className="mt-6 space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${bookingStatusClass}`}>{bookingStatus}</span>
                  {bookingStatus === "PENDING_HOST" && (
                    <div className="flex flex-wrap gap-3">
                      <Button onClick={() => handleBookingAction("approve")} disabled={bookingActionLoading}>
                        <CheckCircle2 className="mr-2 h-4 w-4" /> Approve
                      </Button>
                      <Button variant="destructive" onClick={() => handleBookingAction("reject")} disabled={bookingActionLoading}>
                        <XCircle className="mr-2 h-4 w-4" /> Reject
                      </Button>
                    </div>
                  )}
                </div>

                {bookingActionMessage && (
                  <div className="rounded-xl border border-border bg-secondary/60 p-4 text-sm text-muted-foreground">
                    {bookingActionLoading ? "Updating booking..." : bookingActionMessage}
                  </div>
                )}

                <DetailTable
                  fields={[
                    ["bookingId", booking.bookingId],
                    ["guestId", booking.guestId],
                    ["hostId", booking.hostId],
                    ["listingId", booking.listingId],
                    ["checkInDate", booking.checkInDate],
                    ["checkOutDate", booking.checkOutDate],
                    ["bookingMode", booking.bookingMode],
                    ["status", booking.status],
                    ["paymentDueAt", booking.paymentDueAt || "—"],
                  ]}
                />
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <Home className="h-5 w-5 text-primary" />
              <h2 className="font-heading text-xl font-semibold">Submit inspection</h2>
            </div>
            <div className="space-y-4">
              <div>
                <Label htmlFor="inspectionStayId">Stay ID</Label>
                <Input id="inspectionStayId" value={inspectionStayId} onChange={(e) => setInspectionStayId(e.target.value)} placeholder="Paste stay ID here" className="mt-2" />
              </div>
              <div>
                <Label htmlFor="condition">Condition</Label>
                <select id="condition" value={condition} onChange={(e) => setCondition(e.target.value as "GOOD" | "BAD")} className="mt-2 h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                  <option value="GOOD">GOOD — Release deposit</option>
                  <option value="BAD">BAD — Capture deposit</option>
                </select>
              </div>
              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Describe the property condition..." className="mt-2 min-h-28" />
              </div>
              <Button className="w-full" onClick={submitInspection} disabled={!inspectionStayId.trim() || inspectionLoading}>
                {inspectionLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting</> : "Submit inspection"}
              </Button>
              {inspectionMessage && (
                <div className="rounded-xl border border-border bg-secondary/60 p-4 text-sm text-muted-foreground">{inspectionMessage}</div>
              )}
            </div>
          </section>
        </div>

        <section className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Search className="h-5 w-5 text-primary" />
            <h2 className="font-heading text-xl font-semibold">View stay details</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
            <div>
              <Label htmlFor="stayLookup">Stay ID</Label>
              <Input id="stayLookup" value={stayId} onChange={(e) => setStayId(e.target.value)} placeholder="Paste stay ID here" className="mt-2" />
            </div>
            <Button onClick={loadStay} disabled={!stayId.trim() || stayLoading}>
              {stayLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading</> : "Load stay"}
            </Button>
          </div>

          {stayError && <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{stayError}</div>}

          {stay && (
            <div className="mt-6">
              <DetailTable
                fields={[
                  ["stayId", stay.stayId],
                  ["bookingId", stay.bookingId],
                  ["guestId", stay.guestId],
                  ["hostId", stay.hostId],
                  ["listingId", stay.listingId],
                  ["checkInDate", stay.checkInDate],
                  ["checkOutDate", stay.checkOutDate],
                  ["depositAmount", stay.depositAmount != null ? `$${stay.depositAmount}` : "—"],
                  ["depositStatus", stay.depositStatus || "—"],
                  ["checkoutTime", stay.checkoutTime || "—"],
                ]}
              />
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default HostDashboard;
