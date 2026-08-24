import React, { useState } from 'react';
import { auth } from '../firebase';
import Facebook_logo from '../assets/Facebook-Logosu.png';
import Image from '../assets/signinimage.webp';
import Meta_logo from '../assets/Meta-Logo.png';

import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  sendEmailVerification,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';

type View = 'login' | 'signup' | 'forgot' | 'verify';

export const Auth: React.FC = () => {
  const [view, setView] = useState<View>('login');

  // Login states
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Signup states
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [birthMonth, setBirthMonth] = useState('');
  const [birthDay, setBirthDay] = useState('');
  const [birthYear, setBirthYear] = useState('');
  const [gender, setGender] = useState('');
  const [signupContact, setSignupContact] = useState('');
  const [signupPassword, setSignupPassword] = useState('');

  // Forgot password states
  const [resetContact, setResetContact] = useState('');
  const [resetSent, setResetSent] = useState(false);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Email verification states
  const [pendingEmail, setPendingEmail] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  React.useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  const resetAllFieldsToLogin = () => {
    setError('');
    setView('login');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { user } = await signInWithEmailAndPassword(auth, loginEmail, loginPassword);
      if (!user.emailVerified) {
        setPendingEmail(user.email ?? loginEmail);
        setView('verify');
        return;
      }
      // user is verified — your app's post-login navigation goes here
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { user } = await createUserWithEmailAndPassword(auth, signupContact, signupPassword);
      await sendEmailVerification(user);
      setPendingEmail(signupContact);
      setResendCooldown(60);
      setView('verify');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!auth.currentUser || resendCooldown > 0) return;
    setError('');
    setLoading(true);
    try {
      await sendEmailVerification(auth.currentUser);
      setResendCooldown(60);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckVerified = async () => {
    if (!auth.currentUser) {
      setView('login');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await auth.currentUser.reload();
      if (auth.currentUser.emailVerified) {
        // verified — your app's post-login navigation goes here
      } else {
        setError("Still not verified — check your inbox (and spam folder), then try again.");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, resetContact);
      setResetSent(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ];
  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const years = Array.from({ length: 110 }, (_, i) => new Date().getFullYear() - i);

  const langLinks = [
    'English (US)', 'Русский', 'ქართული', 'Türkçe', 'Deutsch', 'Azərbaycan dili', 'العربية', 'More languages…',
  ];
  const footerCol1 = [
    'Sign Up', 'Log In', 'Messenger', 'Facebook Lite', 'Video', 'Meta Pay', 'Meta Store',
    'Meta Quest', 'Ray-Ban Meta', 'Meta AI', 'Instagram', 'Threads', 'Privacy Policy',
  ];
  const footerCol2 = [
    'Privacy Center', 'About', 'Create ad', 'Create Page', 'Developers', 'Careers',
    'Cookies', 'Ad choices', 'Terms', 'Help', 'Contact Uploading & Non-Users',
  ];

  const Footer = () => (
    <footer className="mx-auto mt-10 max-w-[1000px] border-t border-[#dadde1] px-6 pt-4 text-[13px] text-[#737373]">
      <div className="flex flex-wrap gap-x-4 gap-y-2">
        {langLinks.map((l) => (
          <span key={l} className="cursor-pointer hover:underline">{l}</span>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2">
        {footerCol1.map((l) => (
          <span key={l} className="cursor-pointer hover:underline">{l}</span>
        ))}
      </div>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2">
        {footerCol2.map((l) => (
          <span key={l} className="cursor-pointer hover:underline">{l}</span>
        ))}
      </div>
    </footer>
  );

  /** Top-right close ("X") button used on the signup and forgot-password screens
   *  to let people bail out back to the login screen at any point. */
  const CloseButton = () => (
    <button
      type="button"
      onClick={resetAllFieldsToLogin}
      aria-label="Close"
      className="fixed right-5 top-5 flex h-9 w-9 items-center justify-center rounded-full text-[#606770] transition hover:bg-[#f2f3f5]"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <line x1="4" y1="4" x2="20" y2="20" />
        <line x1="20" y1="4" x2="4" y2="20" />
      </svg>
    </button>
  );

  // ---------- SIGNUP VIEW ----------
  if (view === 'signup') {
    return (
      <div className="min-h-screen bg-white">
        <CloseButton />
        <div className="mx-auto max-w-[500px] px-6 py-8 font-sans text-[#1c1e21]">
          <button
            onClick={() => setView('login')}
            className="mb-4 text-2xl text-[#1c1e21]"
            aria-label="Back"
          >
            &#8249;
          </button>
          <img src={Meta_logo} alt="Meta" className="mb-4 h-6" />
          <h1 className="text-[28px] font-bold">Get started on Facebook</h1>
          <p className="mt-2 text-[15px] text-[#606770]">
            Create an account to connect with friends, family and communities of people who share your interests.
          </p>

          <form onSubmit={handleSignup} className="mt-6 space-y-5">
            <div>
              <label className="mb-2 block text-[15px] font-semibold">Name</label>
              <div className="flex gap-3">
                <input
                  type="text"
                  placeholder="First name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-1/2 rounded-md border border-[#ccd0d5] px-3 py-3 text-[15px] placeholder-[#8a8d91] focus:border-[#1877f2] focus:outline-none focus:ring-1 focus:ring-[#1877f2]"
                />
                <input
                  type="text"
                  placeholder="Last name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-1/2 rounded-md border border-[#ccd0d5] px-3 py-3 text-[15px] placeholder-[#8a8d91] focus:border-[#1877f2] focus:outline-none focus:ring-1 focus:ring-[#1877f2]"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 flex items-center gap-1 text-[15px] font-semibold">
                Birthday
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#e4e6eb] text-[11px] text-[#606770]">?</span>
              </label>
              <div className="flex gap-3">
                <select
                  value={birthMonth}
                  onChange={(e) => setBirthMonth(e.target.value)}
                  className="w-1/3 rounded-md border border-[#ccd0d5] px-3 py-3 text-[15px] text-[#606770] focus:border-[#1877f2] focus:outline-none focus:ring-1 focus:ring-[#1877f2]"
                >
                  <option value="">Month</option>
                  {months.map((m, i) => (
                    <option key={m} value={i + 1}>{m}</option>
                  ))}
                </select>
                <select
                  value={birthDay}
                  onChange={(e) => setBirthDay(e.target.value)}
                  className="w-1/3 rounded-md border border-[#ccd0d5] px-3 py-3 text-[15px] text-[#606770] focus:border-[#1877f2] focus:outline-none focus:ring-1 focus:ring-[#1877f2]"
                >
                  <option value="">Day</option>
                  {days.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
                <select
                  value={birthYear}
                  onChange={(e) => setBirthYear(e.target.value)}
                  className="w-1/3 rounded-md border border-[#ccd0d5] px-3 py-3 text-[15px] text-[#606770] focus:border-[#1877f2] focus:outline-none focus:ring-1 focus:ring-[#1877f2]"
                >
                  <option value="">Year</option>
                  {years.map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="mb-2 flex items-center gap-1 text-[15px] font-semibold">
                Gender
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#e4e6eb] text-[11px] text-[#606770]">?</span>
              </label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full rounded-md border border-[#ccd0d5] px-3 py-3 text-[15px] text-[#606770] focus:border-[#1877f2] focus:outline-none focus:ring-1 focus:ring-[#1877f2]"
              >
                <option value="">Select your gender</option>
                <option value="female">Female</option>
                <option value="male">Male</option>
                <option value="custom">Custom</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-[15px] font-semibold">Mobile number or email</label>
              <input
                type="text"
                placeholder="Mobile number or email"
                value={signupContact}
                onChange={(e) => setSignupContact(e.target.value)}
                className="w-full rounded-md border border-[#ccd0d5] px-3 py-3 text-[15px] placeholder-[#8a8d91] focus:border-[#1877f2] focus:outline-none focus:ring-1 focus:ring-[#1877f2]"
              />
              <p className="mt-2 text-[13px] text-[#606770]">
                You may receive notifications from us.{' '}
                <a href="#" className="text-[#1877f2] hover:underline">Learn why we ask for your contact information</a>
              </p>
            </div>

            <div>
              <label className="mb-2 block text-[15px] font-semibold">Password</label>
              <input
                type="password"
                placeholder="Password"
                value={signupPassword}
                onChange={(e) => setSignupPassword(e.target.value)}
                className="w-full rounded-md border border-[#ccd0d5] px-3 py-3 text-[15px] placeholder-[#8a8d91] focus:border-[#1877f2] focus:outline-none focus:ring-1 focus:ring-[#1877f2]"
              />
            </div>

            <p className="text-[12px] leading-5 text-[#606770]">
              People who use our service may have uploaded your contact information to Facebook.{' '}
              <a href="#" className="text-[#1877f2] hover:underline">Learn more.</a>
            </p>
            <p className="text-[12px] leading-5 text-[#606770]">
              By tapping Submit, you agree to create an account and to Facebook's{' '}
              <a href="#" className="text-[#1877f2] hover:underline">Terms</a>,{' '}
              <a href="#" className="text-[#1877f2] hover:underline">Privacy Policy</a> and{' '}
              <a href="#" className="text-[#1877f2] hover:underline">Cookies Policy</a>.
            </p>
            <p className="text-[12px] leading-5 text-[#606770]">
              The <a href="#" className="text-[#1877f2] hover:underline">Privacy Policy</a> describes the ways we
              can use the information we collect when you create an account. For example, we use this information
              to provide, personalize and improve our products, including ads.
            </p>

            {error && <p className="text-[13px] text-red-600">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-md bg-[#1877f2] py-3 text-[17px] font-bold text-white transition hover:bg-[#166fe5] disabled:opacity-60"
            >
              {loading ? 'Submitting…' : 'Submit'}
            </button>

            <button
              type="button"
              onClick={() => setView('login')}
              className="w-full rounded-md bg-[#e4e6eb] py-3 text-[15px] font-semibold text-[#1c1e21] transition hover:bg-[#d8dadf]"
            >
              I already have an account
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ---------- FORGOT PASSWORD VIEW ----------
  if (view === 'forgot') {
    return (
      <div className="min-h-screen bg-white">
        <CloseButton />
        <div className="mx-auto max-w-[500px] px-6 py-8 font-sans text-[#1c1e21]">
          <button
            onClick={() => { setView('login'); setResetSent(false); setError(''); }}
            className="mb-4 text-2xl text-[#1c1e21]"
            aria-label="Back"
          >
            &#8249;
          </button>

          {!resetSent ? (
            <>
              <h1 className="text-[24px] font-bold">Find your account</h1>
              <p className="mt-2 text-[15px] text-[#606770]">Enter your mobile number or email.</p>

              <form onSubmit={handleForgotPassword} className="mt-6 space-y-4">
                <input
                  type="text"
                  placeholder="Mobile number or email"
                  value={resetContact}
                  onChange={(e) => setResetContact(e.target.value)}
                  className="w-full rounded-md border border-[#ccd0d5] px-3 py-3 text-[15px] placeholder-[#8a8d91] focus:border-[#1877f2] focus:outline-none focus:ring-1 focus:ring-[#1877f2]"
                />

                {error && <p className="text-[13px] text-red-600">{error}</p>}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-md bg-[#1877f2] py-3 text-[17px] font-bold text-white transition hover:bg-[#166fe5] disabled:opacity-60"
                >
                  {loading ? 'Searching…' : 'Continue'}
                </button>

                <button
                  type="button"
                  onClick={resetAllFieldsToLogin}
                  className="w-full rounded-md bg-[#e4e6eb] py-3 text-[15px] font-semibold text-[#1c1e21] transition hover:bg-[#d8dadf]"
                >
                  Cancel
                </button>
              </form>
            </>
          ) : (
            <div className="mt-6">
              <h1 className="text-[24px] font-bold">Check your email</h1>
              <p className="mt-2 text-[15px] text-[#606770]">
                We sent a password reset link to <span className="font-semibold">{resetContact}</span>. Follow the
                instructions there to choose a new password.
              </p>
              <button
                onClick={resetAllFieldsToLogin}
                className="mt-6 w-full rounded-md bg-[#1877f2] py-3 text-[17px] font-bold text-white transition hover:bg-[#166fe5]"
              >
                Back to login
              </button>
            </div>
          )}

          <Footer />
        </div>
      </div>
    );
  }

  // ---------- VERIFY EMAIL VIEW ----------
  if (view === 'verify') {
    return (
      <div className="min-h-screen bg-white">
        <CloseButton />
        <div className="mx-auto max-w-[500px] px-6 py-8 font-sans text-[#1c1e21]">
          <img src={Meta_logo} alt="Meta" className="mb-4 h-6" />
          <h1 className="text-[24px] font-bold">Confirm your email</h1>
          <p className="mt-2 text-[15px] text-[#606770]">
            We sent a confirmation link to <span className="font-semibold">{pendingEmail}</span>. Open it on this
            device or browser to activate your account, then come back here.
          </p>

          {error && <p className="mt-4 text-[13px] text-red-600">{error}</p>}

          <button
            onClick={handleCheckVerified}
            disabled={loading}
            className="mt-6 w-full rounded-md bg-[#1877f2] py-3 text-[17px] font-bold text-white transition hover:bg-[#166fe5] disabled:opacity-60"
          >
            {loading ? 'Checking…' : "I've confirmed my email"}
          </button>

          <button
            onClick={handleResendVerification}
            disabled={resendCooldown > 0 || loading}
            className="mt-3 w-full rounded-md border border-[#ccd0d5] py-3 text-[15px] font-semibold text-[#1c1e21] transition hover:bg-[#f2f3f5] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {resendCooldown > 0 ? `Resend email (${resendCooldown}s)` : 'Resend email'}
          </button>

          <button
            onClick={async () => {
              await signOut(auth);
              setView('login');
            }}
            className="mx-auto mt-6 block text-[14px] text-[#1877f2] hover:underline"
          >
            Use a different account
          </button>
        </div>
      </div>
    );
  }

  // ---------- LOGIN VIEW ----------
  return (
    <div className="min-h-screen bg-white font-sans text-[#1c1e21]">
      <div className="mx-auto grid max-w-[980px] grid-cols-1 gap-10 px-6 pb-6 pt-10 lg:grid-cols-[1fr_396px] lg:gap-0">
        {/* Left: brand + hero */}
        <div className="lg:pr-14">
          <img src={Facebook_logo} alt="Facebook" className="h-[54px] w-auto" />

          <h1 className="mt-10 max-w-[520px] text-[52px] font-bold leading-[1.15] tracking-tight text-[#1c1e21] lg:text-[60px]">
            Explore the things{' '}
            <span className="text-[#1877f2]">you love</span>.
          </h1>

          <img src={Image} alt="" className="mt-6 w-full max-w-[560px]" />
        </div>

        {/* Divider (desktop only) */}
        <div className="hidden lg:block lg:border-l lg:border-[#dadde1] lg:pl-10">
          <div className="lg:sticky lg:top-10 mx-auto w-full max-w-[396px]">
            <h2 className="text-[17px] font-bold">Log into Facebook</h2>

            <form onSubmit={handleLogin} className="mt-4 flex flex-col gap-3">
              <input
                type="text"
                placeholder="Email or mobile number"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                className="w-full rounded-md border border-[#dddfe2] px-4 py-[13px] text-[17px] placeholder-[#8a8d91] focus:border-[#1877f2] focus:outline-none focus:ring-1 focus:ring-[#1877f2]"
              />
              <input
                type="password"
                placeholder="Password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className="w-full rounded-md border border-[#dddfe2] px-4 py-[13px] text-[17px] placeholder-[#8a8d91] focus:border-[#1877f2] focus:outline-none focus:ring-1 focus:ring-[#1877f2]"
              />

              {error && <p className="text-[13px] text-red-600">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-md bg-[#1877f2] py-[10px] text-[20px] font-bold text-white transition hover:bg-[#166fe5] disabled:opacity-60"
              >
                {loading ? 'Logging in…' : 'Log in'}
              </button>

              <button
                type="button"
                onClick={() => setView('forgot')}
                className="mx-auto text-[14px] text-[#1877f2] hover:underline"
              >
                Forgot password?
              </button>

              <hr className="my-2 border-t border-[#dadde1]" />

              <button
                type="button"
                onClick={() => setView('signup')}
                className="mx-auto rounded-md bg-[#42b72a] px-4 py-[12px] text-[17px] font-bold text-white transition hover:bg-[#36a420]"
              >
                Create new account
              </button>
            </form>

            <img src={Meta_logo} alt="Meta" className="mx-auto mt-9 h-5 opacity-90" />
          </div>
        </div>

        {/* Mobile-only login form (stacks below hero under lg breakpoint) */}
        <div className="w-full lg:hidden">
          <h2 className="text-[17px] font-bold">Log into Facebook</h2>
          <form onSubmit={handleLogin} className="mt-4 flex flex-col gap-3">
            <input
              type="text"
              placeholder="Email or mobile number"
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
              className="w-full rounded-md border border-[#dddfe2] px-4 py-[13px] text-[17px] placeholder-[#8a8d91] focus:border-[#1877f2] focus:outline-none focus:ring-1 focus:ring-[#1877f2]"
            />
            <input
              type="password"
              placeholder="Password"
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              className="w-full rounded-md border border-[#dddfe2] px-4 py-[13px] text-[17px] placeholder-[#8a8d91] focus:border-[#1877f2] focus:outline-none focus:ring-1 focus:ring-[#1877f2]"
            />

            {error && <p className="text-[13px] text-red-600">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-md bg-[#1877f2] py-[10px] text-[20px] font-bold text-white transition hover:bg-[#166fe5] disabled:opacity-60"
            >
              {loading ? 'Logging in…' : 'Log in'}
            </button>

            <button
              type="button"
              onClick={() => setView('forgot')}
              className="mx-auto text-[14px] text-[#1877f2] hover:underline"
            >
              Forgot password?
            </button>

            <hr className="my-2 border-t border-[#dadde1]" />

            <button
              type="button"
              onClick={() => setView('signup')}
              className="mx-auto rounded-md bg-[#42b72a] px-4 py-[12px] text-[17px] font-bold text-white transition hover:bg-[#36a420]"
            >
              Create new account
            </button>
          </form>
          <img src={Meta_logo} alt="Meta" className="mx-auto mt-9 h-5 opacity-90" />
        </div>
      </div>

      <Footer />
    </div>
  );
};