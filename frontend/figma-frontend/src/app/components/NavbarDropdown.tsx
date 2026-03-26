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
        if (isLoggedIn) {
          navigate('/host/dashboard', { state: { fromDropdown: true } });
        } else {
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
    return (
      <div className="absolute top-full right-0 mt-2 w-56 bg-white border border-[#EBEBEB] rounded-xl shadow-xl z-50 py-2">
        <div className="px-4 py-3 text-[#FF385C] font-bold">
          Hi, {user.name.split(' ')[0]} 👋
        </div>
        <div className="border-t border-[#EBEBEB]" />
        <button
          onClick={() => handleItemClick('myTrips')}
          className="w-full text-left px-4 py-3 hover:bg-[#FFF5F7] transition-colors text-[#222222] font-medium"
        >
          My Trips
        </button>
        <div className="border-t border-[#EBEBEB]" />
        <button
          onClick={() => handleItemClick('becomeHost')}
          className="w-full text-left px-4 py-3 hover:bg-[#FFF5F7] transition-colors text-[#222222] font-medium"
        >
          Become a host
        </button>
        <div className="border-t border-[#EBEBEB]" />
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