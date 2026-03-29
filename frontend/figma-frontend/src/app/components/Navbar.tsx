import { Search, Globe, Menu } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router';
import { useState, useRef, useEffect } from 'react';
import { NavbarDropdown } from './NavbarDropdown';
import { useAuth } from '../contexts/AuthContext';

interface NavbarProps {
  onOpenAuth?: (tab: 'login' | 'signup') => void;
  onOpenAuthForHost?: () => void;
}

export function Navbar({ onOpenAuth, onOpenAuthForHost }: NavbarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { isLoggedIn, user } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isHostPage = location.pathname.includes('/host/');

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleHostToggle = () => {
    if (!isLoggedIn) {
      // Trigger auth modal with host notice
      onOpenAuthForHost?.();
    }
  };

  const handleLogoClick = () => {
    navigate('/');
    // Reset would be handled by the parent component
  };

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-[#EBEBEB]">
      <div className="max-w-[1440px] mx-auto px-6 lg:px-20 py-4">
        <div className="flex items-center justify-between gap-8">
          {/* Logo */}
          <button 
            onClick={handleLogoClick}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <div className="w-8 h-8 bg-[#FF385C] rounded-lg flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M10 2L3 8V18H8V13H12V18H17V8L10 2Z" fill="white"/>
              </svg>
            </div>
            <span className="text-[#FF385C] font-bold text-xl">SecondHome</span>
          </button>

          {/* Right Menu */}
          <div className="flex items-center gap-4">
            {!isLoggedIn && (
              <button 
                onClick={handleHostToggle}
                className="hidden md:block text-sm font-semibold text-[#222222] hover:bg-[#FFF5F7] px-4 py-2 rounded-full transition-colors"
              >
                Become a host
              </button>
            )}
            
            <div className="relative">
              <button 
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
                className="p-2 hover:bg-[#FFF5F7] rounded-full transition-colors"
              >
                <Globe className="w-4 h-4 text-[#222222]" />
              </button>
              {showTooltip && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-3 py-2 bg-[#222222] text-white text-xs rounded-lg whitespace-nowrap">
                  Language: English
                </div>
              )}
            </div>
            
            <div className="relative" ref={dropdownRef}>
              <button 
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center gap-3 border border-[#EBEBEB] rounded-full py-1.5 px-3 hover:shadow-md transition-shadow"
              >
                <Menu className="w-4 h-4 text-[#222222]" />
                {isLoggedIn && user ? (
                  <div className="w-7 h-7 bg-[#FF385C] rounded-full flex items-center justify-center text-white text-xs font-semibold">
                    {user.initials}
                  </div>
                ) : (
                  <div className="w-7 h-7 bg-[#717171] rounded-full flex items-center justify-center text-white text-sm">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                      <path d="M8 8a3 3 0 100-6 3 3 0 000 6zm0 1c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                    </svg>
                  </div>
                )}
              </button>
              
              {showDropdown && (
                <NavbarDropdown
                  isLoggedIn={isLoggedIn}
                  onOpenAuth={(tab) => {
                    setShowDropdown(false);
                    onOpenAuth?.(tab);
                  }}
                  onOpenAuthForHost={onOpenAuthForHost}
                  onClose={() => setShowDropdown(false)}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}