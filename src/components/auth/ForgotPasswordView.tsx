// src/components/auth/ForgotPasswordView.tsx
import React, { useState, useEffect } from 'react';
import { Footer } from './AuthSharedComponents';
import { motion } from 'framer-motion';

interface ForgotPasswordProps {
  onBack: () => void;
  onSubmitReset: (contact: string) => Promise<void>;
  loading: boolean;
  error: string;
}

export const ForgotPasswordView: React.FC<ForgotPasswordProps> = ({
  onBack,
  onSubmitReset,
  loading,
  error,
}) => {
  const [resetContact, setResetContact] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const [emptyFieldError, setEmptyFieldError] = useState(false);

  const [bgColor, setBgColor] = useState('#eaf4fc');

  useEffect(() => {
    setBgColor('#eaf4fc');
    const t = setTimeout(() => setBgColor('#ffffff'), 80);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const styleEl = document.createElement('style');
    styleEl.innerHTML = `
      input:focus {
        border-color: black !important;
        box-shadow: none !important;
        outline: none !important;
      }
      input:hover {
        border-color: black !important;
      }
    `;
    document.head.appendChild(styleEl);
    return () => {
      document.head.removeChild(styleEl);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmptyFieldError(false);

    if (!resetContact.trim()) {
      setEmptyFieldError(true);
      return;
    }

    try {
      await onSubmitReset(resetContact);
      setResetSent(true);
    } catch {
      // onSubmitReset already set the error message via props; stay on this screen.
    }
  };

  return (
    <div
      style={{ backgroundColor: bgColor, transition: 'background-color 1.6s ease-in-out' }}
      className="min-h-screen flex flex-col text-[#1c1e21]"
    >
      <div className="mx-auto max-w-[500px] px-6 pt-12 pb-6 w-full">
        <button onClick={onBack} className="mb-4 text-2xl text-[#1c1e21] bg-transparent border-none p-0 cursor-pointer" aria-label="Back">
          &#8249;
        </button>

        {!resetSent ? (
          <>
            <h1 className="text-[24px] font-semibold mb-2">Find your account</h1>
            <p className="text-[15px] text-[#606770] mb-5">
              Please enter your email address or mobile number to search for your account.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <input
                  id="resetContact"
                  type="text"
                  value={resetContact}
                  onChange={(val) => {
                    setResetContact(val.target.value);
                    setEmptyFieldError(false);
                  }}
                  placeholder="Email or mobile number"
                  className="w-full rounded-2xl border border-[#ccd0d5] bg-white px-3 py-3 text-[15px] outline-none transition hover:border-black focus:border-black"
                />
              </div>

              {emptyFieldError && (
                <div className="flex items-center gap-2 px-1 text-[12px] text-red-600">
                  <span className="flex items-center justify-center w-4 h-4 border border-red-600 rounded-full text-red-600 font-bold text-[10px] shrink-0">
                    !
                  </span>
                  <span>Please enter your email or mobile number.</span>
                </div>
              )}

              {error && !emptyFieldError && (
                <div className="flex items-center gap-2 px-1 text-[12px] text-red-600">
                  <span className="flex items-center justify-center w-4 h-4 border border-red-600 rounded-full text-red-600 font-bold text-[10px] shrink-0">
                    !
                  </span>
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-full bg-[#1877f2] py-2.5 text-[16px] font-bold text-white transition hover:bg-[#166fe5] disabled:opacity-60 h-10 flex items-center justify-center cursor-pointer"
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
                  'Continue'
                )}
              </button>
            </form>
          </>
        ) : (
          <div className="mt-4">
            <h1 className="text-[24px] font-semibold mb-2">Check your email</h1>
            <p className="text-[15px] text-[#606770] mb-6">
              We sent a password reset link to <span className="font-semibold">{resetContact}</span>. Follow the
              instructions there to choose a new password.
            </p>
            <button
              onClick={onBack}
              className="w-full rounded-full bg-[#1877f2] py-2.5 text-[16px] font-bold text-white transition hover:bg-[#166fe5] cursor-pointer"
            >
              Back to login
            </button>
          </div>
        )}
      </div>

      <div className="mt-12">
        <Footer />
      </div>
    </div>
  );
};