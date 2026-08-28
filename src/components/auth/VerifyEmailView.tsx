// src/components/auth/VerifyEmailView.tsx
import React, { useState } from 'react';
import Meta_logo from '../../assets/Icons/Meta-Logo.png';
import { Footer } from './AuthSharedComponents';
import { motion } from 'framer-motion';

interface VerifyEmailViewProps {
  contact: string;
  onBack: () => void;
  onResend: () => Promise<void>;
  loading: boolean;
  error?: string;
}

export const VerifyEmailView: React.FC<VerifyEmailViewProps> = ({
  contact,
  onBack,
  onResend,
  loading,
  error,
}) => {
  const [showResendMessage, setShowResendMessage] = useState(false);

  const handleResendClick = async () => {
    setShowResendMessage(false);
    await onResend();
    setShowResendMessage(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-white text-[#1c1e21]">
      <div className="max-w-[500px] mx-auto w-full px-6 pt-8 pb-6">
        <button onClick={onBack} className="mb-4 text-2xl font-bold cursor-pointer bg-transparent border-none p-0">
          &#8249;
        </button>

        <img src={Meta_logo} alt="Meta" className="h-9 mb-4" />

        <h1 className="text-[28px] font-semibold">Confirm your email address</h1>
        <p className="mt-2 text-[15px] text-[#606770]">
          We sent an email to <b>{contact}</b> with a link to activate your account. Open the link to finish setting up your Facebook account.
        </p>

        <div className="mt-6">
          {error ? <p className="text-red-600 text-sm">{error}</p> : null}
          {showResendMessage ? (
            <p className="text-green-600 text-sm">A new verification email has been sent.</p>
          ) : null}

          <button
            onClick={handleResendClick}
            disabled={loading}
            className="w-full bg-[#1877f2] text-white rounded-full py-2.5 mt-4 font-bold h-10 flex items-center justify-center cursor-pointer transition hover:bg-[#166fe5] disabled:opacity-60"
          >
            {loading ? (
              <motion.div
                className="spinner"
                style={{
                  width: '20px',
                  height: '20px',
                  border: '3px solid rgba(255, 255, 255, 0.3)',
                  borderTop: '3px solid #ffffff',
                  borderRadius: '50%',
                }}
                animate={{ rotate: 360 }}
                transition={{
                  duration: 0.8,
                  repeat: Infinity,
                  ease: 'linear',
                }}
              />
            ) : (
              'Resend Email'
            )}
          </button>

          <div className="text-center mt-4">
            <button onClick={onBack} className="text-sm text-[#606770] underline cursor-pointer bg-transparent border-none p-0">
              Back to signup / Update contact info
            </button>
          </div>
        </div>
      </div>

      <div className="mt-12">
        <Footer />
      </div>
    </div>
  );
};