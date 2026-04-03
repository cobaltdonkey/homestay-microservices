import { useState } from 'react';
import { X, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router';

interface AuthModalProps {
  initialTab?: 'login' | 'signup';
  onClose: () => void;
  onSuccess?: () => void;
  onAuthSuccess?: () => void;
  showHostNotice?: boolean;
}

export function AuthModal({ initialTab = 'login', onClose, onSuccess, onAuthSuccess, showHostNotice = false }: AuthModalProps) {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>(initialTab);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isHost, setIsHost] = useState(showHostNotice);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    let result;
    if (activeTab === 'login') {
      result = await login(formData.email, formData.password);
    } else {
      result = await login(
        formData.email,
        formData.password,
        formData.firstName,
        formData.lastName,
        formData.phone ? `+65${formData.phone}` : undefined,
        isHost ? 'host' : 'guest'
      );
    }
    
    if (result?.success) {
      if (onSuccess) onSuccess();
      if (onAuthSuccess) onAuthSuccess();
      onClose();
      
      if (result.role === 'host') {
        navigate('/host/dashboard');
      } else {
        navigate('/');
      }
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop - blur effect */}
      <div className="absolute inset-0 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-xl w-full max-w-md mx-4 shadow-2xl">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-[#F7F7F7] rounded-full transition-colors"
        >
          <X className="w-5 h-5 text-[#222222]" />
        </button>

        {/* Host Notice (if needed) */}
        {showHostNotice && (
          <div className="bg-[#FFF5F7] px-6 py-4 rounded-t-xl">
            <p className="text-sm text-[#FF385C] font-medium">
              You need an account to list your property on SecondHome
            </p>
          </div>
        )}

        {/* Tabs */}
        <div className="flex border-b border-[#EBEBEB] px-6 pt-6">
          <button
            onClick={() => setActiveTab('login')}
            className={`flex-1 pb-4 text-base font-semibold transition-colors relative ${
              activeTab === 'login' ? 'text-[#222222]' : 'text-[#717171]'
            }`}
          >
            Log in
            {activeTab === 'login' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#FF385C]" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('signup')}
            className={`flex-1 pb-4 text-base font-semibold transition-colors relative ${
              activeTab === 'signup' ? 'text-[#222222]' : 'text-[#717171]'
            }`}
          >
            Sign up
            {activeTab === 'signup' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#FF385C]" />
            )}
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          {activeTab === 'login' ? (
            <>
              {/* Login Tab */}
              <h2 className="text-2xl font-semibold text-[#222222] mb-6">
                Welcome back to SecondHome
              </h2>

              {/* Email */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-[#222222] mb-2">
                  Email address
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="w-full px-4 py-3 border border-[#EBEBEB] rounded-lg focus:outline-none focus:border-[#222222]"
                  placeholder="Enter your email"
                  required
                />
              </div>

              {/* Password */}
              <div className="mb-2">
                <label className="block text-sm font-medium text-[#222222] mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    className="w-full px-4 py-3 border border-[#EBEBEB] rounded-lg focus:outline-none focus:border-[#222222] pr-12"
                    placeholder="Enter your password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#717171] hover:text-[#222222]"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Forgot Password */}
              <div className="mb-6 text-right">
                <button type="button" className="text-sm text-[#FF385C] hover:underline font-medium">
                  Forgot password?
                </button>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full bg-[#FF385C] hover:bg-[#E31C5F] text-white font-semibold py-3 rounded-lg transition-colors mb-4"
              >
                Log in
              </button>

              {/* Footer */}
              <p className="text-center text-sm text-[#717171]">
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => setActiveTab('signup')}
                  className="text-[#FF385C] hover:underline font-semibold"
                >
                  Sign up →
                </button>
              </p>
            </>
          ) : (
            <>
              {/* Signup Tab */}
              <h2 className="text-2xl font-semibold text-[#222222] mb-6">
                Join SecondHome
              </h2>

              {/* First Name + Last Name */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-[#222222] mb-2">
                    First name
                  </label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    className="w-full px-4 py-3 border border-[#EBEBEB] rounded-lg focus:outline-none focus:border-[#222222]"
                    placeholder="First name"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#222222] mb-2">
                    Last name
                  </label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    className="w-full px-4 py-3 border border-[#EBEBEB] rounded-lg focus:outline-none focus:border-[#222222]"
                    placeholder="Last name"
                    required
                  />
                </div>
              </div>

              {/* Email */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-[#222222] mb-2">
                  Email address
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="w-full px-4 py-3 border border-[#EBEBEB] rounded-lg focus:outline-none focus:border-[#222222]"
                  placeholder="Enter your email"
                  required
                />
              </div>

              {/* Phone */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-[#222222] mb-2">
                  Phone number
                </label>
                <div className="flex gap-2">
                  <div className="w-20 px-4 py-3 border border-[#EBEBEB] rounded-lg bg-[#F7F7F7] flex items-center justify-center text-[#717171] font-medium">
                    +65
                  </div>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="flex-1 px-4 py-3 border border-[#EBEBEB] rounded-lg focus:outline-none focus:border-[#222222]"
                    placeholder="Enter your number"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-[#222222] mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    className="w-full px-4 py-3 border border-[#EBEBEB] rounded-lg focus:outline-none focus:border-[#222222] pr-12"
                    placeholder="Create a password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#717171] hover:text-[#222222]"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-[#222222] mb-2">
                  Confirm password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    className="w-full px-4 py-3 border border-[#EBEBEB] rounded-lg focus:outline-none focus:border-[#222222] pr-12"
                    placeholder="Confirm your password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#717171] hover:text-[#222222]"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Host Toggle */}
              <div className="mb-6 flex items-center">
                <input
                  type="checkbox"
                  id="isHost"
                  checked={isHost}
                  onChange={(e) => setIsHost(e.target.checked)}
                  className="w-5 h-5 text-[#FF385C] border-2 border-[#EBEBEB] rounded focus:ring-[#FF385C] focus:ring-2 cursor-pointer"
                />
                <label htmlFor="isHost" className="ml-3 text-sm font-medium text-[#222222] cursor-pointer">
                  I want to list and host properties on SecondHome
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full bg-[#FF385C] hover:bg-[#E31C5F] text-white font-semibold py-3 rounded-lg transition-colors mb-4"
              >
                Create Account
              </button>

              {/* Footer */}
              <p className="text-center text-sm text-[#717171]">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => setActiveTab('login')}
                  className="text-[#FF385C] hover:underline font-semibold"
                >
                  Log in →
                </button>
              </p>
            </>
          )}
        </form>
      </div>
    </div>
  );
}