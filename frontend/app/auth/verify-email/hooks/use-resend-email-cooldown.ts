import { useState, useEffect } from 'react';
import { useResendEmail } from '@/app/auth/verify-email/hooks/use-resend-email';

export const useResendEmailCooldown = () => {
  const [cooldownTime, setCooldownTime] = useState(120);
  const [isOnCooldown, setIsOnCooldown] = useState(true);
  const { resendVerificationEmail, isLoading } = useResendEmail();

  useEffect(() => {
    if (cooldownTime > 0) {
      const timer = setTimeout(() => {
        setCooldownTime(cooldownTime - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      setIsOnCooldown(false);
    }
  }, [cooldownTime]);

  const handleResendEmail = async () => {
    if (!isOnCooldown && !isLoading) {
      await resendVerificationEmail();
      setCooldownTime(120);
      setIsOnCooldown(true);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return {
    handleResendEmail,
    isOnCooldown,
    isLoading,
    cooldownTime: formatTime(cooldownTime),
    isDisabled: isOnCooldown || isLoading,
  };
};
