import { useNavigate } from 'react-router';
import { useAuth } from '../contexts/AuthContext';

interface NavbarDropdownProps {
  isLoggedIn: boolean;
  onOpenAuth: (tab: 'login' | 'signup') => void;
  onOpenAuthForHost?: () => void;
  onClose: () => void;
}

export function NavbarDropdown({ isLoggedIn, onOpenAuth, onOpenAuthForHost, onClose }: NavbarDropdownProps) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleItemClick = (action: string) => {
    onClose();
    
    switch (action) {
      case 'login':
      case 'signup':
        onOpenAuth(action);
        break;
      case 'myTrips':
        navigate('/my-trips');
        break;
      case 'becomeHost':
        if (!isLoggedIn) {
          onOpenAuthForHost?.();
        }
        break;
      case 'logout':
        logout();
        navigate('/');
        break;
      default:
        break;
    }
  };

  if (isLoggedIn && user) {
    const isHost = user.role === 'host';

    return (
      <div className="absolute top-full right-0 mt-2 w-64 bg-white border border-[#EBEBEB] rounded-xl shadow-xl z-50 py-2">
        <div className="px-4 py-3 text-[#FF385C] font-bold border-b border-[#EBEBEB]">
          Hi, {user.name.split(' ')[0]} 👋 <span className="text-[10px] bg-[#FFF5F7] px-2 py-0.5 rounded ml-2 uppercase font-semibold">{user.role}</span>
        </div>
        
        {!isHost ? (
          <>
            <button
              onClick={() => handleItemClick('myTrips')}
              className="w-full text-left px-4 py-3 hover:bg-[#FFF5F7] transition-colors text-[#222222] font-medium"
            >
              My Trips
            </button>
            <div className="border-t border-[#EBEBEB]" />
          </>
        ) : (
          <>
            <button onClick={() => { navigate('/host/dashboard'); onClose(); }} className="w-full text-left px-4 py-3 hover:bg-[#FFF5F7] transition-colors text-[#222222] font-medium">Dashboard</button>
            <button onClick={() => { navigate('/host/active-listings'); onClose(); }} className="w-full text-left px-4 py-3 hover:bg-[#FFF5F7] transition-colors text-[#222222] font-medium">Active Listings</button>
            <button onClick={() => { navigate('/host/upcoming-guests'); onClose(); }} className="w-full text-left px-4 py-3 hover:bg-[#FFF5F7] transition-colors text-[#222222] font-medium">Upcoming Guests</button>
            <button onClick={() => { navigate('/host/active-stays'); onClose(); }} className="w-full text-left px-4 py-3 hover:bg-[#FFF5F7] transition-colors text-[#222222] font-medium">Active Stays</button>
            <button onClick={() => { navigate('/host/past-stays'); onClose(); }} className="w-full text-left px-4 py-3 hover:bg-[#FFF5F7] transition-colors text-[#222222] font-medium">Past Stays</button>
            <button onClick={() => { navigate('/host/rejected-bookings'); onClose(); }} className="w-full text-left px-4 py-3 hover:bg-[#FFF5F7] transition-colors text-[#222222] font-medium">Rejected Bookings</button>
            <div className="border-t border-[#EBEBEB] my-1" />
          </>
        )}

        <button
          onClick={() => handleItemClick('logout')}
          className="w-full text-left px-4 py-3 hover:bg-[#FFF5F7] transition-colors text-[#222222] font-medium"
        >
          Log out
        </button>
      </div>
    );
  }

  return (
    <div className="absolute top-full right-0 mt-2 w-56 bg-white border border-[#EBEBEB] rounded-xl shadow-xl z-50 py-2">
      <button
        onClick={() => handleItemClick('login')}
        className="w-full text-left px-4 py-3 hover:bg-[#FFF5F7] transition-colors text-[#222222] font-medium"
      >
        Log in
      </button>
      <button
        onClick={() => handleItemClick('signup')}
        className="w-full text-left px-4 py-3 hover:bg-[#FFF5F7] transition-colors text-[#222222] font-medium"
      >
        Sign up
      </button>
      <div className="border-t border-[#EBEBEB] my-2" />
      <button
        onClick={() => handleItemClick('becomeHost')}
        className="w-full text-left px-4 py-3 hover:bg-[#FFF5F7] transition-colors text-[#222222] font-medium"
      >
        Become a host
      </button>
    </div>
  );
}