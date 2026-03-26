import { useState } from 'react';
import { X, Upload, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface ActiveStay {
  id: string;
  bookingId: string;
  guestName: string;
  guestAvatar: string;
  listingTitle: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  depositStatus: 'held' | 'released' | 'captured';
}

interface InspectionReportModalProps {
  stay: ActiveStay;
  onClose: () => void;
}

type InspectionOutcome = 'no_damage' | 'damage_found' | 'auto_released' | null;

export function InspectionReportModal({ stay, onClose }: InspectionReportModalProps) {
  const [hasDamage, setHasDamage] = useState<boolean | null>(null);
  const [damageDescription, setDamageDescription] = useState('');
  const [outcome, setOutcome] = useState<InspectionOutcome>(null);

  const handleSubmit = () => {
    if (hasDamage === false) {
      setOutcome('no_damage');
    } else if (hasDamage === true) {
      setOutcome('damage_found');
    }
  };

  // If outcome is shown, display the result screen
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
          <h2 className="text-2xl font-semibold text-[#222222] mb-3">No Damage Reported</h2>
          <p className="text-[#717171] mb-6">Deposit of SGD 200 will be released to guest</p>
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
          <h2 className="text-2xl font-semibold text-[#222222] mb-3">Damage Reported</h2>
          <p className="text-[#717171] mb-6">Deposit of SGD 200 will be captured</p>
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

  if (outcome === 'auto_released') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="absolute inset-0 bg-black/50" onClick={onClose} />
        <div className="relative bg-white rounded-2xl w-full max-w-[500px] shadow-2xl p-6 text-center">
          <button onClick={onClose} className="absolute top-4 right-4 p-2 hover:bg-[#F7F7F7] rounded-full transition-colors">
            <X className="w-5 h-5 text-[#222222]" />
          </button>
          
          <div className="w-20 h-20 bg-[#FFF9E6] rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-12 h-12 text-[#F59E0B]" />
          </div>
          <h2 className="text-2xl font-semibold text-[#222222] mb-3">Deposit Auto-Released</h2>
          <p className="text-[#717171] mb-6">
            No report submitted within 48 hours — deposit has been automatically released
          </p>
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

  // Main inspection form
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
            <div className="flex items-center gap-3 mb-3">
              <img src={stay.guestAvatar} alt={stay.guestName} className="w-12 h-12 rounded-full object-cover" />
              <div>
                <div className="font-semibold text-[#222222]">{stay.guestName}</div>
                <div className="text-sm text-[#717171]">{stay.bookingId}</div>
              </div>
            </div>
            <div className="border-t border-[#EBEBEB] pt-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-[#717171]">Listing</span>
                <span className="font-semibold text-[#222222]">{stay.listingTitle}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#717171]">Check-out</span>
                <span className="font-semibold text-[#222222]">{stay.checkOut}</span>
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

          {/* Damage Details (only show if damage selected) */}
          {hasDamage === true && (
            <>
              <div className="mb-4">
                <label className="block text-sm font-semibold text-[#222222] mb-2">
                  Damage Description
                </label>
                <textarea
                  value={damageDescription}
                  onChange={(e) => setDamageDescription(e.target.value)}
                  placeholder="Describe the damage found..."
                  rows={4}
                  className="w-full px-4 py-3 border border-[#EBEBEB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF385C] resize-none"
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-semibold text-[#222222] mb-2">
                  Upload Photos
                </label>
                <div className="border-2 border-dashed border-[#EBEBEB] rounded-lg p-8 text-center hover:border-[#FF385C] transition-colors cursor-pointer">
                  <Upload className="w-8 h-8 text-[#717171] mx-auto mb-2" />
                  <p className="text-sm text-[#717171]">Click to upload photos of the damage</p>
                </div>
              </div>
            </>
          )}

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={hasDamage === null}
            className="w-full bg-[#FF385C] hover:bg-[#E31C5F] text-white font-semibold py-3 rounded-lg transition-colors disabled:bg-[#EBEBEB] disabled:text-[#717171] disabled:cursor-not-allowed"
          >
            Submit Report
          </button>
        </div>
      </div>
    </div>
  );
}
