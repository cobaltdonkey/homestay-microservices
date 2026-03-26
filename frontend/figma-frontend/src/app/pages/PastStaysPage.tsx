import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Navbar } from '../components/Navbar';
import { StatusBadge } from '../components/StatusBadge';
import { InspectionReportModal } from '../components/InspectionReportModal';
import { ArrowLeft, Calendar, Users, FileText, Clock } from 'lucide-react';

interface PastStay {
  id: string;
  bookingId: string;
  guestName: string;
  guestAvatar: string;
  listingTitle: string;
  listingImage: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  total: number;
  depositAmount: number;
  inspectionStatus: 'pending' | 'approved' | 'deducted';
  depositRefunded?: number;
  depositDeducted?: number;
  inspectionExpiresIn?: { hours: number; minutes: number; seconds: number };
}

const initialPastStays: PastStay[] = [
  {
    id: '1',
    bookingId: 'BKG-20240001',
    guestName: 'Rachel Wong',
    guestAvatar: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=100&q=80',
    listingTitle: 'Modern Loft in Bugis',
    listingImage: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&q=80',
    checkIn: '10 Mar 2026',
    checkOut: '13 Mar 2026',
    guests: 2,
    total: 1050,
    depositAmount: 500,
    inspectionStatus: 'pending',
    inspectionExpiresIn: { hours: 47, minutes: 32, seconds: 15 },
  },
  {
    id: '2',
    bookingId: 'BKG-20230045',
    guestName: 'James Tan',
    guestAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80',
    listingTitle: 'Luxury Villa in East Coast',
    listingImage: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400&q=80',
    checkIn: '1 Mar 2026',
    checkOut: '5 Mar 2026',
    guests: 4,
    total: 3560,
    depositAmount: 1000,
    inspectionStatus: 'approved',
    depositRefunded: 1000,
  },
  {
    id: '3',
    bookingId: 'BKG-20230042',
    guestName: 'Sarah Lee',
    guestAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&q=80',
    listingTitle: 'Cozy Apartment in Tiong Bahru',
    listingImage: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400&q=80',
    checkIn: '25 Feb 2026',
    checkOut: '28 Feb 2026',
    guests: 2,
    total: 840,
    depositAmount: 500,
    inspectionStatus: 'deducted',
    depositDeducted: 150,
    depositRefunded: 350,
  },
];

export function PastStaysPage() {
  const navigate = useNavigate();
  const [showInspectionModal, setShowInspectionModal] = useState(false);
  const [selectedStay, setSelectedStay] = useState<PastStay | null>(null);
  const [pastStays, setPastStays] = useState<PastStay[]>(initialPastStays);

  // Real-time countdown for pending inspections (48-hour window)
  useEffect(() => {
    const timer = setInterval(() => {
      setPastStays(prev => 
        prev.map(stay => {
          if (stay.inspectionStatus === 'pending' && stay.inspectionExpiresIn) {
            const { hours, minutes, seconds } = stay.inspectionExpiresIn;
            
            // Check if expired - auto refund
            if (hours === 0 && minutes === 0 && seconds === 0) {
              alert(`Inspection window expired for ${stay.bookingId}. Deposit of SGD ${stay.depositAmount} has been automatically refunded to ${stay.guestName}.`);
              return {
                ...stay,
                inspectionStatus: 'approved' as const,
                depositRefunded: stay.depositAmount,
                inspectionExpiresIn: undefined,
              };
            }
            
            // Count down
            if (seconds > 0) {
              return {
                ...stay,
                inspectionExpiresIn: { ...stay.inspectionExpiresIn, seconds: seconds - 1 }
              };
            } else if (minutes > 0) {
              return {
                ...stay,
                inspectionExpiresIn: { hours, minutes: minutes - 1, seconds: 59 }
              };
            } else if (hours > 0) {
              return {
                ...stay,
                inspectionExpiresIn: { hours: hours - 1, minutes: 59, seconds: 59 }
              };
            }
          }
          
          return stay;
        })
      );
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleInspectionClick = (stay: PastStay) => {
    setSelectedStay(stay);
    setShowInspectionModal(true);
  };

  const formatCountdown = (time: { hours: number; minutes: number; seconds: number }) => {
    const h = String(time.hours).padStart(2, '0');
    const m = String(time.minutes).padStart(2, '0');
    const s = String(time.seconds).padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

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

        {/* Page Heading */}
        <h1 className="text-3xl font-semibold text-[#222222] mb-8">Past Stays</h1>

        {/* Past Stays List */}
        <div className="space-y-6">
          {pastStays.map((stay) => (
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
                  />
                </div>

                {/* Content */}
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <img 
                          src={stay.guestAvatar} 
                          alt={stay.guestName}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                        <div>
                          <h3 className="text-lg font-semibold text-[#222222]">
                            {stay.guestName}
                          </h3>
                          <p className="text-sm text-[#717171]">{stay.bookingId}</p>
                        </div>
                      </div>
                      <h4 className="text-base font-medium text-[#717171]">
                        {stay.listingTitle}
                      </h4>
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
                        <div className="text-[#222222] font-medium">{stay.guests} guests</div>
                        <div className="text-xs">Party size</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-[#717171]">
                      <div>
                        <div className="text-[#222222] font-medium">SGD {stay.depositAmount}</div>
                        <div className="text-xs">Deposit held</div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    {stay.inspectionStatus === 'pending' ? (
                      <>
                        <div className="flex items-center gap-4">
                          <div className="text-sm text-[#717171]">
                            <span className="font-semibold text-[#FF385C]">Action required:</span> Submit inspection report
                          </div>
                          {stay.inspectionExpiresIn && (
                            <div className="flex items-center gap-2 px-3 py-1 bg-[#FFF5F7] border border-[#FF385C] rounded-full">
                              <Clock className="w-4 h-4 text-[#FF385C]" />
                              <span className="text-sm font-semibold text-[#FF385C] font-mono">
                                {formatCountdown(stay.inspectionExpiresIn)}
                              </span>
                            </div>
                          )}
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
                      <div className="flex items-center justify-between w-full">
                        <div className="text-sm text-green-600">
                          <span className="font-semibold">✓ Inspection completed</span>
                        </div>
                        <div className="text-right">
                          {stay.depositRefunded && stay.depositDeducted ? (
                            <div className="text-sm">
                              <span className="text-[#FF385C] font-semibold">
                                SGD {stay.depositDeducted} deducted
                              </span>
                              <span className="text-[#717171] mx-2">•</span>
                              <span className="text-green-600 font-semibold">
                                SGD {stay.depositRefunded} refunded
                              </span>
                            </div>
                          ) : stay.depositRefunded ? (
                            <div className="text-sm">
                              <span className="text-green-600 font-semibold">
                                SGD {stay.depositRefunded} refunded
                              </span>
                            </div>
                          ) : null}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {pastStays.length === 0 && (
            <div className="text-center py-12 text-[#717171]">
              <p className="text-lg">No past stays</p>
              <p className="text-sm mt-2">Completed bookings will appear here</p>
            </div>
          )}
        </div>
      </div>

      {/* Inspection Report Modal */}
      {showInspectionModal && selectedStay && (
        <InspectionReportModal
          stay={{
            id: selectedStay.id,
            bookingId: selectedStay.bookingId,
            guestName: selectedStay.guestName,
            listingTitle: selectedStay.listingTitle,
            checkOut: selectedStay.checkOut,
            depositAmount: selectedStay.depositAmount,
          }}
          onClose={() => {
            setShowInspectionModal(false);
            setSelectedStay(null);
          }}
        />
      )}
    </div>
  );
}
