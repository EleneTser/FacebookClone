// src/components/auth/SignupView.tsx
import React, { useEffect, useState } from 'react';
import Meta_logo from '../../assets/Icons/Meta-Logo.png';
import { FieldError, InfoDot, Footer } from './AuthSharedComponents';
import { motion } from 'framer-motion';

const MESSAGES = {
  firstName: "What's your first name?",
  lastName: "What's your last name?",
  nameInvalid: "It looks like you entered a mobile number or email. Please enter your name.",
  birthday: 'Select your birthday. You can change who can see this later.',
  ageRestriction: "We couldn't create your account. We couldn't sign you up for Facebook.",
  gender: 'Please choose a gender. You can change who can see this later.',
  pronoun: 'Please select your pronoun.',
  contact: 'Please enter a valid email address.',
  password: 'Enter a combination of at least six numbers, letters and punctuation marks (like ! and &).',
};

export type SignupErrors = {
  firstName?: string;
  lastName?: string;
  birthday?: string;
  age?: string;
  gender?: string;
  pronoun?: string;
  contact?: string;
  password?: string;
};

export interface SignupData {
  firstName: string;
  lastName: string;
  displayName: string; // Added to pass combined First & Last name
  birthMonth: string;
  birthDay: string;
  birthYear: string;
  gender: string;
  pronoun?: string;
  customGender?: string;
  contact: string;
  pass: string;
}

interface SignupViewProps {
  onBack: () => void;
  onSignup: (data: SignupData) => Promise<void>;
  loading: boolean;
  error: string;
}

interface CustomInputProps {
  id: string;
  label: string;
  type?: string;
  value: string;
  onChange: (val: string) => void;
  error?: string;
  showClear?: boolean;
  rightElement?: React.ReactNode;
}

const CustomInput: React.FC<CustomInputProps> = ({
  id,
  label,
  type = 'text',
  value,
  onChange,
  error,
  showClear = true,
  rightElement,
}) => (
  <div className="relative w-full">
    <div
      className={`relative flex items-center rounded-2xl border bg-white px-3 py-3 transition hover:border-black focus-within:border-black ${
        error ? 'border-red-500 text-red-500' : 'border-[#ccd0d5] text-[#1c1e21]'
      }`}
    >
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={label}
        className={`w-full bg-transparent text-[15px] outline-none ${
          error ? 'text-red-500 placeholder-red-400' : 'text-[#1c1e21] placeholder-[#8a8d91]'
        }`}
      />
      <div className="flex items-center gap-2 pl-2">
        {showClear && value && (
          <button
            type="button"
            onClick={() => onChange('')}
            className="text-black hover:opacity-70 font-normal text-lg leading-none bg-transparent border-none p-0 cursor-pointer"
            aria-label="Clear"
          >
            &#x2715;
          </button>
        )}
        {rightElement}
      </div>
    </div>
    {error && <FieldError message={error} />}
  </div>
);

export const SignupView: React.FC<SignupViewProps> = ({ onBack, onSignup, loading, error }) => {
  const [bgColor, setBgColor] = useState('#eaf4fc');
  const bgStyle: React.CSSProperties = {
    backgroundColor: bgColor,
    transition: 'background-color 1.6s ease-in-out',
  };

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [birthMonth, setBirthMonth] = useState('');
  const [birthDay, setBirthDay] = useState('');
  const [birthYear, setBirthYear] = useState('');
  const [gender, setGender] = useState('');
  const [pronoun, setPronoun] = useState('');
  const [customGender, setCustomGender] = useState('');
  const [signupContact, setSignupContact] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [signupErrors, setSignupErrors] = useState<SignupErrors>({});

  useEffect(() => {
    setBgColor('#eaf4fc');
    const t = setTimeout(() => setBgColor('#ffffff'), 80);
    return () => clearTimeout(t);
  }, []);

  const isValidName = (name: string): boolean => {
    const trimmed = name.trim();
    if (!trimmed) return false;
    const hasNumbersOrSymbols = /[\d@#$%^&*_+=\[\]{};:'",<>?\\/]/.test(trimmed);
    return !hasNumbersOrSymbols;
  };

  const calculateAge = (m: string, d: string, y: string): number => {
    if (!m || !d || !y) return 18;
    const birthDate = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const getPasswordError = (pw: string): string | undefined => {
    const missing: string[] = [];
    if (pw.length < 6) {
      missing.push('at least 6 characters');
    }
    const hasUpper = /[A-Z]/.test(pw);
    const hasLower = /[a-z]/.test(pw);
    const hasNumber = /[0-9]/.test(pw);
    const hasSymbol = /[^A-Za-z0-9]/.test(pw);

    if (!hasUpper) missing.push('an uppercase letter');
    if (!hasLower) missing.push('a lowercase letter');
    if (!hasNumber) missing.push('a number');
    if (!hasSymbol) missing.push('a special character');

    if (pw.length < 6 || !hasUpper || !hasLower || !hasNumber || !hasSymbol) {
      return `Password must contain ${missing.join(', ')}.`;
    }
    return undefined;
  };

  const isContactValid = (contact: string) => {
    const email = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phone = /^[+]?[\d\s()-]{7,}$/;
    return email.test(contact) || phone.test(contact);
  };

  const validateSignup = (): boolean => {
    const errs: SignupErrors = {};
    if (!firstName.trim()) {
      errs.firstName = MESSAGES.firstName;
    } else if (!isValidName(firstName)) {
      errs.firstName = MESSAGES.nameInvalid;
    }

    if (!lastName.trim()) {
      errs.lastName = MESSAGES.lastName;
    } else if (!isValidName(lastName)) {
      errs.lastName = MESSAGES.nameInvalid;
    }

    if (!birthMonth || !birthDay || !birthYear) {
      errs.birthday = MESSAGES.birthday;
    } else {
      const age = calculateAge(birthMonth, birthDay, birthYear);
      if (age < 13) {
        errs.age = MESSAGES.ageRestriction;
      }
    }

    if (!gender) {
      errs.gender = MESSAGES.gender;
    } else if (gender === 'custom' && !pronoun) {
      errs.pronoun = MESSAGES.pronoun;
    }

    if (!signupContact.trim()) {
      errs.contact = MESSAGES.contact;
    } else if (!isContactValid(signupContact)) {
      errs.contact = MESSAGES.contact;
    }
    
    const pwError = getPasswordError(signupPassword);
    if (pwError) errs.password = pwError;

    setSignupErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateSignup()) return;

    // Combine first name and last name into a single display name
    const fullName = `${firstName.trim()} ${lastName.trim()}`;

    onSignup({
      firstName,
      lastName,
      displayName: fullName,
      birthMonth,
      birthDay,
      birthYear,
      gender,
      pronoun: gender === 'custom' ? pronoun : undefined,
      customGender: gender === 'custom' ? customGender : undefined,
      contact: signupContact,
      pass: signupPassword,
    });
  };

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const years = Array.from({ length: 110 }, (_, i) => new Date().getFullYear() - i);

  const selectClasses = (hasError?: boolean, hasValue?: boolean) =>
    `w-full rounded-2xl border bg-white px-3 py-3 text-[15px] outline-none shadow-none transition hover:border-black focus:outline-none focus:ring-0 focus:border-black ${
      hasError ? 'text-red-500 border-red-500' : hasValue ? 'text-[#1c1e21] border-[#ccd0d5]' : 'text-[#606770] border-[#ccd0d5]'
    }`;

  return (
    <div style={bgStyle} className="min-h-screen flex flex-col text-[#1c1e21]">
      <div className="mx-auto max-w-[500px] px-6 pt-8 pb-16 w-full">
        <button onClick={onBack} className="mb-4 text-2xl text-[#1c1e21] bg-transparent border-none p-0 cursor-pointer" aria-label="Back">
          &#8249;
        </button>
        <img src={Meta_logo} alt="Meta" className="mb-4 h-9" />
        <h1 className="text-[28px] font-semibold">Get started on Facebook</h1>
        <p className="mt-2 text-[15px] text-[#606770]">
          Create an account to connect with friends, family and communities of people who share your interests.
        </p>

        {signupErrors.age && (
          <div className="mt-4 flex items-start gap-3 rounded-2xl border border-[#ccd0d5] bg-white p-4 shadow-sm">
            <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border border-red-500 text-red-500 font-normal text-xs">
              i
            </div>
            <div className="text-[14px] text-[#1c1e21] font-normal leading-snug">
              <p>We couldn't create your account.</p>
              <p className="mt-0.5">We couldn't sign you up for Facebook.</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-3">
          <div>
            <label className="mb-1 block text-[15px] font-semibold">Name</label>
            <div className="flex gap-3">
              <CustomInput
                id="firstName"
                label="First name"
                value={firstName}
                onChange={(v) => {
                  setFirstName(v);
                  if (signupErrors.firstName) setSignupErrors((s) => ({ ...s, firstName: undefined }));
                }}
                error={signupErrors.firstName}
              />
              <CustomInput
                id="lastName"
                label="Last name"
                value={lastName}
                onChange={(v) => {
                  setLastName(v);
                  if (signupErrors.lastName) setSignupErrors((s) => ({ ...s, lastName: undefined }));
                }}
                error={signupErrors.lastName}
              />
            </div>
          </div>

          <div>
            <label className="mb-1 flex items-center text-[15px] font-semibold">
              Birthday <span className="font-light ml-1"><InfoDot title={MESSAGES.birthday} /></span>
            </label>
            <div className="flex gap-3">
              <select
                value={birthMonth}
                onChange={(e) => {
                  setBirthMonth(e.target.value);
                  if (signupErrors.birthday) setSignupErrors((s) => ({ ...s, birthday: undefined }));
                  if (signupErrors.age) setSignupErrors((s) => ({ ...s, age: undefined }));
                }}
                className={selectClasses(!!signupErrors.birthday, !!birthMonth)}
              >
                <option value="" className="text-[#606770]">Month</option>
                {months.map((m, i) => (
                  <option key={m} value={i + 1} className="text-[#1c1e21]">{m}</option>
                ))}
              </select>
              <select
                value={birthDay}
                onChange={(e) => {
                  setBirthDay(e.target.value);
                  if (signupErrors.birthday) setSignupErrors((s) => ({ ...s, birthday: undefined }));
                  if (signupErrors.age) setSignupErrors((s) => ({ ...s, age: undefined }));
                }}
                className={selectClasses(!!signupErrors.birthday, !!birthDay)}
              >
                <option value="" className="text-[#606770]">Day</option>
                {days.map((d) => (
                  <option key={d} value={d} className="text-[#1c1e21]">{d}</option>
                ))}
              </select>
              <select
                value={birthYear}
                onChange={(e) => {
                  setBirthYear(e.target.value);
                  if (signupErrors.birthday) setSignupErrors((s) => ({ ...s, birthday: undefined }));
                  if (signupErrors.age) setSignupErrors((s) => ({ ...s, age: undefined }));
                }}
                className={selectClasses(!!signupErrors.birthday, !!birthYear)}
              >
                <option value="" className="text-[#606770]">Year</option>
                {years.map((y) => (
                  <option key={y} value={y} className="text-[#1c1e21]">{y}</option>
                ))}
              </select>
            </div>
            {signupErrors.birthday && <FieldError message={signupErrors.birthday} />}
          </div>

          <div>
            <label className="mb-1 flex items-center text-[15px] font-semibold">
              Gender <span className="font-light ml-1"><InfoDot title={MESSAGES.gender} /></span>
            </label>
            <select
              value={gender}
              onChange={(e) => {
                setGender(e.target.value);
                if (signupErrors.gender) setSignupErrors((s) => ({ ...s, gender: undefined }));
                if (e.target.value !== 'custom') {
                  setPronoun('');
                  setCustomGender('');
                  if (signupErrors.pronoun) setSignupErrors((s) => ({ ...s, pronoun: undefined }));
                }
              }}
              className={selectClasses(!!signupErrors.gender, !!gender)}
            >
              <option value="" className="text-[#606770]">Select your gender</option>
              <option value="female" className="text-[#1c1e21]">Female</option>
              <option value="male" className="text-[#1c1e21]">Male</option>
              <option value="custom" className="text-[#1c1e21]">Custom</option>
            </select>
            {signupErrors.gender && <FieldError message={signupErrors.gender} />}
          </div>

          {gender === 'custom' && (
            <div className="space-y-3 pt-1">
              <div>
                <label className="mb-1 block text-[15px] font-semibold">Custom</label>
                <select
                  value={pronoun}
                  onChange={(e) => {
                    setPronoun(e.target.value);
                    if (signupErrors.pronoun) setSignupErrors((s) => ({ ...s, pronoun: undefined }));
                  }}
                  className={selectClasses(!!signupErrors.pronoun, !!pronoun)}
                >
                  <option value="" className="text-[#606770]">Select your pronoun</option>
                  <option value="she" className="text-[#1c1e21]">Wish her a happy birthday!</option>
                  <option value="he" className="text-[#1c1e21]">Wish him a happy birthday!</option>
                  <option value="they" className="text-[#1c1e21]">Wish them a happy birthday!</option>
                </select>
                {signupErrors.pronoun && <FieldError message={signupErrors.pronoun} />}
                <p className="mt-1 text-[12px] text-[#606770]">Your pronoun is visible to everyone</p>
              </div>

              <CustomInput
                id="customGender"
                label="Gender (optional)"
                value={customGender}
                onChange={(v) => setCustomGender(v)}
              />
            </div>
          )}

          <div>
            <label className="mb-1 block text-[15px] font-semibold">Mobile number or email</label>
            <CustomInput
              id="signupContact"
              label="Mobile number or email"
              value={signupContact}
              onChange={(v) => {
                setSignupContact(v);
                if (signupErrors.contact) setSignupErrors((s) => ({ ...s, contact: undefined }));
              }}
              error={signupErrors.contact}
            />
            <p className="mt-2 text-[13px] text-[#606770]">
              You may receive notifications from us.{' '}
              <a href="#" className="font-bold text-[#1877f2] hover:underline">Learn why we ask for your contact information.</a>
            </p>
          </div>

          <div>
            <label className="mb-1 block text-[15px] font-semibold">Password</label>
            <CustomInput
              id="signupPassword"
              type={showPassword ? 'text' : 'password'}
              label="Password"
              value={signupPassword}
              onChange={(v) => {
                setSignupPassword(v);
                if (signupErrors.password) setSignupErrors((s) => ({ ...s, password: undefined }));
              }}
              error={signupErrors.password}
              showClear={false}
              rightElement={
                signupPassword ? (
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-gray-500 hover:text-black focus:outline-none px-1 bg-transparent border-none cursor-pointer flex items-center"
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? (
                      <span className="material-symbols-outlined text-[20px]">
                        visibility
                      </span>
                    ) : (
                      <span className="material-symbols-outlined text-[20px]">
                        visibility_off
                      </span>
                    )}
                  </button>
                ) : null
              }
            />
          </div>

          <p className="text-[11px] text-[#777] leading-4">
            People who use our service may have uploaded your contact information to Facebook.{' '}
            <a href="#" className="text-[#1877f2] hover:underline">Learn more.</a>
          </p>

          <p className="text-[11px] text-[#777] leading-4">
            By tapping Submit, you agree to create an account and to Facebook's{' '}
            <a href="#" className="text-[#1877f2] hover:underline">Terms</a>,{' '}
            <a href="#" className="text-[#1877f2] hover:underline">Privacy Policy</a> and{' '}
            <a href="#" className="text-[#1877f2] hover:underline">Cookies Policy</a>.
          </p>

          <p className="text-[11px] text-[#777] leading-4">
            The <a href="#" className="text-[#1877f2] hover:underline">Privacy Policy</a> describes the ways we can use the information we collect when you create an account. For example, we use this information to provide, personalize and improve our products, including ads.
          </p>

          {error && <p className="text-[13px] text-red-600">{error}</p>}

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
              'Submit'
            )}
          </button>

          <button
            type="button"
            onClick={onBack}
            className="w-full rounded-full bg-[#e4e6eb] py-2.5 text-[15px] font-semibold text-[#1c1e21] transition hover:bg-[#d8dadf] cursor-pointer"
          >
            I already have an account
          </button>
        </form>
      </div>
      <Footer />
    </div>
  );
};