import { Eye, EyeOff } from 'lucide-react';
import { forwardRef, useState } from 'react';

interface PasswordInputProps {
  label: string;
  error?: string;
  placeholder?: string;
}

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ label, error, placeholder = '********', ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);

    return (
      <div>
        <label className="block text-sm font-medium text-gray-600">
          {label}
        </label>
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            ref={ref}
            placeholder={placeholder}
            className="mt-1 w-full rounded-md border bg-[#F2F3FF] p-2 pr-10 placeholder:text-xs placeholder:text-[#525F76] focus:border-[#03390F] focus:ring-[#03390F] focus:outline-none"
            {...props}
          />
          <button
            className="absolute top-1/2 right-2 flex -translate-y-1/2 cursor-pointer items-center justify-center p-1 text-gray-500 hover:text-gray-700"
            onClick={() => setShowPassword(!showPassword)}
            type="button"
          >
            {showPassword ? (
              <EyeOff className="h-5 w-5" />
            ) : (
              <Eye className="h-5 w-5" />
            )}
          </button>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    );
  }
);

PasswordInput.displayName = 'PasswordInput';
