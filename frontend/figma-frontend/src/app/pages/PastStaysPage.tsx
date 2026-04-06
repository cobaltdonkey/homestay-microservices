import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { Navbar } from '../components/Navbar';
import { StatusBadge } from '../components/StatusBadge';
import { InspectionReportModal } from '../components/InspectionReportModal';
import { ArrowLeft, Calendar, Users, FileText, Clock, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

// ─── Types ────────────────────────────────────────────────────────────────────

interface PastStay {
  /** stay_id UUID from stay_db */
  id: string;
  bookingId: string;
  guestId: string;
  hostId: string;
  listingId: string;
  guestName: string;
  listingTitle: string;
  listingImage: string;
  checkIn: string;
  checkOut: string;
  checkoutTime: string | null;  // ISO string from stay_db.checkout_time
  guests: number;
  total: number;
  depositAmount: number;
  depositStatus: 'HELD' | 'RELEASED' | 'CAPTURED' | 'RESOLVED';
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&q=80';
const FALLBACK_AVATAR = 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=100&q=80';

/**
 * Returns the milliseconds remaining in the 48-hour inspection window from
 * checkout_time. Negative = window has already closed.
 */
function msUntilDeadline(checkoutTime: string | null): number {
  if (!checkoutTime) return -1;
  const checkoutMs = new Date(checkoutTime).getTime();
  const deadlineMs = checkoutMs + 48 * 60 * 60 * 1000;
  return deadlineMs - Date.now();
}

function msToHMS(ms: number): { hours: number; minutes: number; seconds: number } {
  const totalSecs = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSecs / 3600);
  const minutes = Math.floor((totalSecs % 3600) / 60);
  const seconds = totalSecs % 60;
  return { hours, minutes, seconds };
}

function formatCountdown(hms: { hours: number; minutes: number; seconds: number }): string {
  const h = String(hms.hours).padStart(2, '0');
  const m = String(hms.minutes).padStart(2, '0');
  const s = String(hms.seconds).padStart(2, '0');
  return `${h}:${m}:${s}`;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

/** Show the first 8 chars of the UUID as a short booking reference */
function shortRef(id: string): string {
  return `#${id.replace(/-/g, '').slice(0, 8).toUpperCase()}`;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function PastStaysPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [pastStays, setPastStays] = useState<PastStay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // The stay currently selected for inspection
  const [selectedStay, setSelectedStay] = useState<PastStay | null>(null);
  const [showModal, setShowModal] = useState(false);

  // Per‑stay countdown tick (ms remaining keyed by stay id)
  const [countdowns, setCountdowns] = useState<Record<string, number>>({});

  // ── Fetch stays + enrich ───────────────────────────────────────────────────
  const fetchPastStays = useCallback(async () => {
    if (!user?.userId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Fetch only past stays for this host
      const staysRes = await fetch(`/stays?hostId=${user.userId}&status=PAST`);
      if (!staysRes.ok) throw new Error('Failed to fetch stays');
      const staysJson = await staysRes.json();
      if (staysJson.code !== 200 || !Array.isArray(staysJson.data)) {
        throw new Error(staysJson.message || 'No stays data');
      }

      // 2. Data is already filtered by the backend
      const rawStays: any[] = staysJson.data;

      // 3. Enrich each stay in parallel (listing title, guest name)
      const enriched: PastStay[] = await Promise.all(
        rawStays.map(async (s: any) => {
          // Listing details
          let listingTitle = s.listingId ?? 'Listing';
          let listingImage = FALLBACK_IMAGE;
          try {
            const lr = await fetch(`/listings/${s.listingId}`);
            if (lr.ok) {
              const lj = await lr.json();
              const ld = lj.data ?? lj;
              listingTitle = ld.title ?? ld.name ?? listingTitle;
              listingImage = ld.imageUrl ?? ld.image_url ?? ld.images?.[0] ?? FALLBACK_IMAGE;
            }
          } catch { /* use fallback */ }

          // Guest name
          let guestName = 'Guest';
          try {
            const gr = await fetch(`/users/${s.guestId}/profile`);
            if (gr.ok) {
              const gj = await gr.json();
              guestName = gj.data?.name ?? gj.data?.email ?? guestName;
            }
          } catch { /* use fallback */ }

          return {
            id: s.stayId,
            bookingId: s.bookingId,
            guestId: s.guestId,
            hostId: s.hostId ?? user.userId,
            listingId: s.listingId,
            guestName,
            listingTitle,
            listingImage,
            checkIn: s.checkInDate ? formatDate(s.checkInDate) : '',
            checkOut: s.checkOutDate ? formatDate(s.checkOutDate) : '',
            checkoutTime: s.checkoutTime ?? null,
            guests: 1,      // stay_db doesn't store guest count directly; default to 1
            total: 0,       // similarly not on stay — shows 0 for now
            depositAmount: typeof s.depositAmount === 'number' ? s.depositAmount : Number(s.depositAmount ?? 0),
            depositStatus: s.depositStatus ?? 'HELD',
          } satisfies PastStay;
        })
      );

      // Sort most-recent checkout first
      enriched.sort((a, b) => {
        const at = a.checkoutTime ? new Date(a.checkoutTime).getTime() : 0;
        const bt = b.checkoutTime ? new Date(b.checkoutTime).getTime() : 0;
        return bt - at;
      });

      setPastStays(enriched);

      // Initialise countdowns for all HELD stays
      const initial: Record<string, number> = {};
      enriched.forEach(stay => {
        if (stay.depositStatus === 'HELD') {
          initial[stay.id] = msUntilDeadline(stay.checkoutTime);
        }
      });
      setCountdowns(initial);
    } catch (err: any) {
      console.error('PastStaysPage fetch error:', err);
      setError(err.message ?? 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [user?.userId]);

  useEffect(() => {
    fetchPastStays();
  }, [fetchPastStays]);

  // ── Live countdown ticker ──────────────────────────────────────────────────
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdowns(prev => {
        const next: Record<string, number> = {};
        for (const [id, ms] of Object.entries(prev)) {
          next[id] = ms - 1000;
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleInspectionClick = (stay: PastStay) => {
    setSelectedStay(stay);
    setShowModal(true);
  };

  const handleModalClose = () => {
    setShowModal(false);
    setSelectedStay(null);
  };

  const handleModalSuccess = (
    stayId: string,
    result: { status: 'RELEASED' | 'CAPTURED'; reason: string; inspectionId: string }
  ) => {
    // Optimistically update the local state so the row reflects the new status
    setPastStays(prev =>
      prev.map(s =>
        s.id === stayId
          ? { ...s, depositStatus: result.status }
          : s
      )
    );
    // Remove from countdowns since it's no longer HELD
    setCountdowns(prev => {
      const next = { ...prev };
      delete next[stayId];
      return next;
    });
  };

  // ── Derived display helpers ────────────────────────────────────────────────
  const inspectionWindowOpen = (stay: PastStay): boolean => {
    if (stay.depositStatus !== 'HELD') return false;
    return (countdowns[stay.id] ?? -1) > 0;
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <div className="max-w-[1440px] mx-auto px-6 lg:px-20 py-8">
        {/* Back Arrow */}
        <button
          onClick={() => navigate('/host/dashboard')}
          className="flex items-center gap-2 text-[#222222] hover:text-[#717171] mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-semibold">Back to dashboard</span>
        </button>

        <h1 className="text-3xl font-semibold text-[#222222] mb-8">Past Stays</h1>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-[#FF385C] animate-spin mr-3" />
            <span className="text-[#717171]">Loading past stays…</span>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="flex items-start gap-3 bg-[#FEF2F2] border border-[#DC2626] rounded-xl p-5 mb-6">
            <AlertCircle className="w-5 h-5 text-[#DC2626] flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-[#DC2626]">Could not load past stays</p>
              <p className="text-sm text-[#DC2626]">{error}</p>
            </div>
          </div>
        )}

        {/* Stays List */}
        {!loading && !error && (
          <div className="space-y-6">
            {pastStays.map((stay) => {
              const msLeft = countdowns[stay.id] ?? -1;
              const windowOpen = inspectionWindowOpen(stay);
              const hms = msToHMS(msLeft);

              return (
                <div
                  key={stay.id}
                  className="border border-[#EBEBEB] rounded-xl p-6"
                >
                  <div className="flex gap-6">
                    {/* Listing Image */}
                    <div className="w-48 h-36 flex-shrink-0 rounded-lg overflow-hidden">
                      <img
                        src={stay.listingImage}
                        alt={stay.listingTitle}
                        className="w-full h-full object-cover"
                        onError={(e) => { (e.currentTarget as HTMLImageElement).src = FALLBACK_IMAGE; }}
                      />
                    </div>

                    {/* Content */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <img
                              src={FALLBACK_AVATAR}
                              alt={stay.guestName}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                            <div>
                              <h3 className="text-lg font-semibold text-[#222222]">{stay.guestName}</h3>
                              <p className="text-sm text-[#717171]">Booking {shortRef(stay.bookingId)}</p>
                            </div>
                          </div>
                          <h4 className="text-base font-medium text-[#717171]">{stay.listingTitle}</h4>
                        </div>
                        <StatusBadge status="COMPLETED" />
                      </div>

                      <div className="grid grid-cols-4 gap-4 mb-4">
                        <div className="flex items-center gap-2 text-sm text-[#717171]">
                          <Calendar className="w-4 h-4" />
                          <div>
                            <div className="text-[#222222] font-medium">{stay.checkIn}</div>
                            <div className="text-xs">Check-in</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-sm text-[#717171]">
                          <Calendar className="w-4 h-4" />
                          <div>
                            <div className="text-[#222222] font-medium">{stay.checkOut}</div>
                            <div className="text-xs">Check-out</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-sm text-[#717171]">
                          <Users className="w-4 h-4" />
                          <div>
                            <div className="text-[#222222] font-medium">{stay.guests} guest{stay.guests !== 1 ? 's' : ''}</div>
                            <div className="text-xs">Party size</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-sm text-[#717171]">
                          <div>
                            <div className="text-[#222222] font-medium">SGD {stay.depositAmount.toFixed(2)}</div>
                            <div className="text-xs">Deposit held</div>
                          </div>
                        </div>
                      </div>

                      {/* Bottom row: action or outcome */}
                      <div className="flex items-center justify-between">
                        {stay.depositStatus === 'HELD' ? (
                          <>
                            {windowOpen ? (
                              /* Inspection window is open — show button + countdown */
                              <>
                                <div className="flex items-center gap-4">
                                  <div className="text-sm text-[#717171]">
                                    <span className="font-semibold text-[#FF385C]">Action required:</span> Submit inspection report
                                  </div>
                                  <div className="flex items-center gap-2 px-3 py-1 bg-[#FFF5F7] border border-[#FF385C] rounded-full">
                                    <Clock className="w-4 h-4 text-[#FF385C]" />
                                    <span className="text-sm font-semibold text-[#FF385C] font-mono">
                                      {formatCountdown(hms)}
                                    </span>
                                  </div>
                                </div>
                                <button
                                  onClick={() => handleInspectionClick(stay)}
                                  className="flex items-center gap-2 px-4 py-2 bg-[#FF385C] text-white rounded-lg hover:bg-[#E31C5F] transition-colors"
                                >
                                  <FileText className="w-4 h-4" />
                                  <span className="font-semibold">Submit inspection</span>
                                </button>
                              </>
                            ) : (
                              /* Window has closed; deposit-expirer will auto-release */
                              <div className="w-full text-sm text-[#717171]">
                                <span className="font-semibold text-[#F59E0B]">⏰ Inspection window expired</span>
                                <span className="ml-2">— deposit will be automatically released</span>
                              </div>
                            )}
                          </>
                        ) : (
                          /* Deposit already resolved */
                          <div className="flex items-center justify-between w-full">
                            <div className="text-sm text-green-600">
                              <span className="font-semibold">✓ Inspection completed</span>
                            </div>
                            <div className="text-right">
                              {stay.depositStatus === 'RELEASED' && (
                                <div className="text-sm">
                                  <span className="text-green-600 font-semibold">
                                    SGD {stay.depositAmount.toFixed(2)} refunded
                                  </span>
                                </div>
                              )}
                              {stay.depositStatus === 'CAPTURED' && (
                                <div className="text-sm">
                                  <span className="text-[#FF385C] font-semibold">
                                    SGD {stay.depositAmount.toFixed(2)} captured (damage)
                                  </span>
                                </div>
                              )}
                              {stay.depositStatus === 'RESOLVED' && (
                                <div className="text-sm text-[#717171]">Resolved</div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {pastStays.length === 0 && (
              <div className="text-center py-12 text-[#717171]">
                <p className="text-lg">No past stays</p>
                <p className="text-sm mt-2">Completed stays will appear here once the check-out date has passed.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Inspection Report Modal */}
      {showModal && selectedStay && (
        <InspectionReportModal
          stay={{
            stayId: selectedStay.id,
            hostId: selectedStay.hostId,
            bookingId: selectedStay.bookingId,
            guestName: selectedStay.guestName,
            listingTitle: selectedStay.listingTitle,
            checkOut: selectedStay.checkOut,
            depositAmount: selectedStay.depositAmount,
          }}
          onClose={handleModalClose}
          onSuccess={(result) => {
            if (selectedStay) {
              handleModalSuccess(selectedStay.id, result);
            }
            handleModalClose();
          }}
        />
      )}
    </div>
  );
}
