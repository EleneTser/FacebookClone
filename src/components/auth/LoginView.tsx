import React, { useState } from 'react';
import Facebook_logo from '../../assets/Icons/Facebook-Logosu.png';
import Image from '../../assets/signinimage.webp';
import Meta_logo from '../../assets/Icons/Meta-Logo.png';
import { Footer } from './AuthSharedComponents';
import { motion } from 'framer-motion';

interface LoginViewProps {
  onLogin: (email: string, pass: string) => Promise<void>;
  onGoToSignup: () => void;
  onGoToForgot: () => void;
  loading: boolean;
  error: string;
}

export const LoginView: React.FC<LoginViewProps> = ({
  onLogin,
  onGoToSignup,
  onGoToForgot,
  loading,
  error,
}) => {
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [emptyFieldError, setEmptyFieldError] = useState(false);
  const [passwordOnlyError, setPasswordOnlyError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setEmptyFieldError(false);
    setPasswordOnlyError(false);

    if (!loginEmail.trim() && !loginPassword.trim()) {
      setEmptyFieldError(true);
      return;
    }

    if (loginEmail.trim() && !loginPassword.trim()) {
      setPasswordOnlyError(true);
      return;
    }

    onLogin(loginEmail, loginPassword);
  };

  const isGenericAuthError = error && !emptyFieldError && !passwordOnlyError;

  return (
    <div className="min-h-screen flex flex-col justify-between">
      <div className="flex min-[1022px]:hidden flex-col items-center pt-8 pb-4">
        <img src={Facebook_logo} alt="Facebook logo" className="w-[56px] h-[56px] object-contain" />
      </div>

      <div className="min-[1022px]:hidden border-t-2 border-[#ddd]" />

      <main className="flex-1 flex flex-col md:flex-row min-h-0">
        <section className="hidden min-[1022px]:flex min-[1022px]:flex-col min-[1022px]:w-[65%] relative min-[1022px]:min-h-[700px] border-r-2 border-[#ddd]">
          <div className="absolute top-[30px] left-[30px]">
            <img src={Facebook_logo} alt="Facebook logo" className="w-[100px] h-[100px] object-contain" />
          </div>

          <div className="absolute top-1/2 left-1/2 -translate-x-[40%] -translate-y-1/2 flex items-center justify-center">
            <img src={Image} alt="Facebook" className="w-full max-w-[500px] lg:max-w-[900px] h-auto block" />
          </div>

          <div className="absolute left-[30px] bottom-[35px]">
            <h1 className="m-0 text-[46px] leading-[1.05] font-bold text-[#050505]">
              Explore the <br />
              things <span className="text-[#1877f2]">you</span> <br />
              <span className="text-[#1877f2]">love</span>.
            </h1>
          </div>
        </section>

        <section className="w-full min-[1022px]:w-[35%] flex items-center justify-center py-10 px-6 min-[1022px]:py-0 min-[1022px]:px-6">
          <form onSubmit={handleSubmit} className="w-full max-w-[380px] flex flex-col gap-[8px]">
            <p className="m-0 mb-2 text-base font-semibold">Log into Facebook</p>

            {(isGenericAuthError || error) && !emptyFieldError && !passwordOnlyError && (
              <div className="flex items-start gap-2.5 p-3 mb-1 border border-[#ccd0d5] rounded-lg bg-white text-[13px] text-[#1c1e21]">
                <span className="flex items-center justify-center w-4 h-4 border border-red-600 rounded-full text-red-600 font-serif italic font-bold text-[11px] shrink-0 mt-0.5">
                  i
                </span>
                <div>
                  <span>The login information you entered is incorrect. </span>
                  <button
                    type="button"
                    onClick={onGoToForgot}
                    className="bg-transparent border-none p-0 text-[#1877f2] hover:underline cursor-pointer inline font-normal text-[13px]"
                  >
                    Find your account and log in.
                  </button>
                </div>
              </div>
            )}

            <div className="relative w-full">
              <input
                id="email"
                type="text"
                placeholder=" "
                value={loginEmail}
                onChange={(e) => {
                  setLoginEmail(e.target.value);
                  setEmptyFieldError(false);
                }}
                className="peer w-full h-12 pt-[15px] px-[14px] pb-[5px] border border-[#ccc] rounded-2xl outline-none text-[13px] bg-white transition-colors duration-150 ease-in-out focus:border-[#050505]"
              />
              <label
                htmlFor="email"
                className="absolute left-[14px] top-1/2 -translate-y-1/2 text-[#65676b] text-[13px] pointer-events-none transition-all duration-150 ease-in-out peer-focus:top-2 peer-focus:translate-y-0 peer-focus:text-[11px] peer-[:not(:placeholder-shown)]:top-2 peer-[:not(:placeholder-shown)]:translate-y-0 peer-[:not(:placeholder-shown)]:text-[11px]"
              >
                Email or mobile number
              </label>
            </div>

            {emptyFieldError && (
              <div className="flex items-start gap-2 px-1 text-[12px] text-[#1c1e21]">
                <span className="flex items-center justify-center w-4 h-4 border border-red-600 rounded-full text-red-600 font-bold text-[10px] shrink-0 mt-0.5">
                  !
                </span>
                <div>
                  <span>The email or mobile number you entered isn’t connected to an account. </span>
                  <button
                    type="button"
                    onClick={onGoToForgot}
                    className="bg-transparent border-none p-0 text-[#1877f2] hover:underline cursor-pointer inline font-normal text-[12px]"
                  >
                    Find your account and log in.
                  </button>
                </div>
              </div>
            )}

            <div className="relative w-full mt-1">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder=" "
                value={loginPassword}
                onChange={(e) => {
                  setLoginPassword(e.target.value);
                  setPasswordOnlyError(false);
                }}
                className="peer w-full h-12 pt-[15px] pl-[14px] pr-10 border border-[#ccc] rounded-2xl outline-none text-[13px] bg-white transition-colors duration-150 ease-in-out focus:border-[#050505]"
              />
              <label
                htmlFor="password"
                className="absolute left-[14px] top-1/2 -translate-y-1/2 text-[#65676b] text-[13px] pointer-events-none transition-all duration-150 ease-in-out peer-focus:top-2 peer-focus:translate-y-0 peer-focus:text-[11px] peer-[:not(:placeholder-shown)]:top-2 peer-[:not(:placeholder-shown)]:translate-y-0 peer-[:not(:placeholder-shown)]:text-[11px]"
              >
                Password
              </label>

              {loginPassword && (
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-black focus:outline-none bg-transparent border-none cursor-pointer flex items-center"
                  aria-label="Toggle password visibility"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {showPassword ? 'visibility' : 'visibility_off'}
                  </span>
                </button>
              )}
            </div>

            {passwordOnlyError && (
              <div className="flex items-center gap-2 px-1 text-[12px] text-red-600">
                <span className="flex items-center justify-center w-4 h-4 border border-red-600 rounded-full text-red-600 font-bold text-[10px] shrink-0">
                  !
                </span>
                <span>The password you entered is incorrect</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-10 mt-[6px] border-none rounded-full bg-[#0866ff] text-white text-[13px] font-bold cursor-pointer transition-colors duration-150 ease-in-out hover:bg-[#0757d6] disabled:opacity-60 flex items-center justify-center"
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
                'Log in'
              )}
            </button>

            <button
              type="button"
              onClick={onGoToForgot}
              className="border-none bg-transparent text-[#050505] text-[13px] cursor-pointer mt-[2px] p-2 rounded-md transition-all duration-150 ease-in-out hover:bg-[#f0f0f0] hover:rounded-full"
            >
              Forgot password?
            </button>

            <button
              type="button"
              onClick={onGoToSignup}
              className="w-full h-10 mt-[25px] border border-[#0866ff] rounded-full bg-white text-[#0866ff] text-[13px] cursor-pointer transition-colors duration-150 ease-in-out hover:bg-[#f0f0f0]"
            >
              Create new account
            </button>

            <div className="flex justify-center mt-2">
              <img src={Meta_logo} alt="Meta logo" className="w-[70px] h-auto" />
            </div>
          </form>
        </section>
      </main>

      <Footer />
    </div>
  );
};