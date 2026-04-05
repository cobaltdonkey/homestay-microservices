import { useState } from 'react';
import { X, CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react';

// ─── Props interface — matches what PastStaysPage passes ─────────────────────
interface PastStayProps {
  stayId: string;          // UUID from stay_db (stay_id)
  hostId: string;          // UUID of the logged-in host
  bookingId: string;
  guestName: string;
  listingTitle: string;
  checkOut: string;        // formatted display string
  depositAmount: number;   // SGD float
}

interface InspectionReportModalProps {
  stay: PastStayProps;
  onClose: () => void;
  onSuccess?: (result: { status: 'RELEASED' | 'CAPTURED'; reason: string; inspectionId: string }) => void;
}

type InspectionOutcome = 'no_damage' | 'damage_found' | null;

// ─── Helper: map outcome to API condition_result ──────────────────────────────
function toConditionResult(outcome: InspectionOutcome): 'GOOD' | 'BAD' {
  return outcome === 'no_damage' ? 'GOOD' : 'BAD';
}

export function InspectionReportModal({ stay, onClose, onSuccess }: InspectionReportModalProps) {
  const [hasDamage, setHasDamage] = useState<boolean | null>(null);
  const [damageDescription, setDamageDescription] = useState('');
  const [outcome, setOutcome] = useState<InspectionOutcome>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [apiResult, setApiResult] = useState<{ status: string; reason: string; inspectionId: string } | null>(null);

  const handleSubmit = async () => {
    if (hasDamage === null) return;

    const chosenOutcome: InspectionOutcome = hasDamage ? 'damage_found' : 'no_damage';
    const conditionResult = toConditionResult(chosenOutcome);

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const res = await fetch('/deposit-resolutions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stay_id: stay.stayId,
          host_id: stay.hostId,
          condition_result: conditionResult,
          notes: damageDescription || '',
        }),
      });

      let body: any = {};
      try { body = await res.json(); } catch { /* ignore parse error */ }

      if (!res.ok || body.code >= 400) {
        const msg = body.message || `Unexpected error (HTTP ${res.status})`;
        setSubmitError(msg);
        setIsSubmitting(false);
        return;
      }

      // Success
      const data = body.data ?? {};
      const result = {
        status: data.status as 'RELEASED' | 'CAPTURED',
        reason: data.reason ?? '',
        inspectionId: data.inspection_id ?? '',
      };
      setApiResult(result);
      setOutcome(chosenOutcome);
      if (onSuccess) onSuccess(result);
    } catch (err: any) {
      setSubmitError(err.message ?? 'Network error — please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Outcome: No Damage ────────────────────────────────────────────────────
  if (outcome === 'no_damage') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="absolute inset-0 bg-black/50" onClick={onClose} />
        <div className="relative bg-white rounded-2xl w-full max-w-[500px] shadow-2xl p-6 text-center">
          <button onClick={onClose} className="absolute top-4 right-4 p-2 hover:bg-[#F7F7F7] rounded-full transition-colors">
            <X className="w-5 h-5 text-[#222222]" />
          </button>

          <div className="w-20 h-20 bg-[#ECFDF5] rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-12 h-12 text-[#10B981]" />
          </div>
          <h2 className="text-2xl font-semibold text-[#222222] mb-2">No Damage Reported</h2>
          <p className="text-[#717171] mb-1">
            Deposit of <span className="font-semibold text-[#222222]">SGD {stay.depositAmount.toFixed(2)}</span> will be refunded to the guest.
          </p>
          {apiResult?.inspectionId && (
            <p className="text-xs text-[#AAAAAA] mb-6">Inspection ID: {apiResult.inspectionId}</p>
          )}
          <button
            onClick={onClose}
            className="w-full bg-[#FF385C] hover:bg-[#E31C5F] text-white font-semibold py-3 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  // ─── Outcome: Damage Found ─────────────────────────────────────────────────
  if (outcome === 'damage_found') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="absolute inset-0 bg-black/50" onClick={onClose} />
        <div className="relative bg-white rounded-2xl w-full max-w-[500px] shadow-2xl p-6 text-center">
          <button onClick={onClose} className="absolute top-4 right-4 p-2 hover:bg-[#F7F7F7] rounded-full transition-colors">
            <X className="w-5 h-5 text-[#222222]" />
          </button>

          <div className="w-20 h-20 bg-[#FEF2F2] rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-12 h-12 text-[#DC2626]" />
          </div>
          <h2 className="text-2xl font-semibold text-[#222222] mb-2">Damage Reported</h2>
          <p className="text-[#717171] mb-1">
            Deposit of <span className="font-semibold text-[#222222]">SGD {stay.depositAmount.toFixed(2)}</span> has been captured.
          </p>
          {apiResult?.inspectionId && (
            <p className="text-xs text-[#AAAAAA] mb-6">Inspection ID: {apiResult.inspectionId}</p>
          )}
          <button
            onClick={onClose}
            className="w-full bg-[#FF385C] hover:bg-[#E31C5F] text-white font-semibold py-3 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  // ─── Outcome: Auto‑released placeholder (not reachable from this modal) ─────
  // (only shown in PastStaysPage for HELD stays past 48hrs — kept for display parity)

  // ─── Main inspection form ──────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div className="relative bg-white rounded-2xl w-full max-w-[600px] max-h-[90vh] overflow-y-auto shadow-2xl">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 hover:bg-[#F7F7F7] rounded-full transition-colors z-10">
          <X className="w-5 h-5 text-[#222222]" />
        </button>

        <div className="p-6">
          <h2 className="text-2xl font-semibold text-[#222222] mb-6">Submit Inspection Report</h2>

          {/* Stay Summary */}
          <div className="bg-[#F7F7F7] rounded-lg p-4 mb-6">
            <div className="font-semibold text-[#222222] mb-1">{stay.guestName}</div>
            <div className="text-sm text-[#717171] mb-3">{stay.bookingId}</div>
            <div className="border-t border-[#EBEBEB] pt-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-[#717171]">Listing</span>
                <span className="font-semibold text-[#222222]">{stay.listingTitle}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#717171]">Check-out</span>
                <span className="font-semibold text-[#222222]">{stay.checkOut}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#717171]">Security deposit</span>
                <span className="font-semibold text-[#222222]">SGD {stay.depositAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Damage Toggle */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-[#222222] mb-3">
              Property Condition
            </label>
            <div className="flex gap-3">
              <button
                onClick={() => setHasDamage(false)}
                className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-colors border-2 ${
                  hasDamage === false
                    ? 'bg-[#ECFDF5] border-[#10B981] text-[#10B981]'
                    : 'border-[#EBEBEB] text-[#717171] hover:border-[#222222]'
                }`}
              >
                ✓ No damage
              </button>
              <button
                onClick={() => setHasDamage(true)}
                className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-colors border-2 ${
                  hasDamage === true
                    ? 'bg-[#FEF2F2] border-[#DC2626] text-[#DC2626]'
                    : 'border-[#EBEBEB] text-[#717171] hover:border-[#222222]'
                }`}
              >
                ✕ Damage found
              </button>
            </div>
          </div>

          {/* Damage Description (only if damage selected) */}
          {hasDamage === true && (
            <div className="mb-6">
              <label className="block text-sm font-semibold text-[#222222] mb-2">
                Damage Description <span className="font-normal text-[#717171]">(optional)</span>
              </label>
              <textarea
                value={damageDescription}
                onChange={(e) => setDamageDescription(e.target.value)}
                placeholder="Describe the damage found..."
                rows={4}
                className="w-full px-4 py-3 border border-[#EBEBEB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF385C] resize-none"
              />
            </div>
          )}

          {/* Error Message */}
          {submitError && (
            <div className="mb-4 flex items-start gap-3 bg-[#FEF2F2] border border-[#DC2626] rounded-lg p-4">
              <AlertCircle className="w-5 h-5 text-[#DC2626] flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-[#DC2626]">Submission failed</p>
                <p className="text-sm text-[#DC2626]">{submitError}</p>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={hasDamage === null || isSubmitting}
            className="w-full bg-[#FF385C] hover:bg-[#E31C5F] text-white font-semibold py-3 rounded-lg transition-colors disabled:bg-[#EBEBEB] disabled:text-[#717171] disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Submitting…
              </>
            ) : (
              'Submit Report'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
