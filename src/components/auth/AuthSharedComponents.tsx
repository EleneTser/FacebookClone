import React from 'react';

export const InfoDot: React.FC<{ title: string }> = ({ title }) => (
  <span
    title={title}
    className="ml-1.5 inline-flex h-[16px] w-[16px] shrink-0 cursor-default select-none items-center justify-center rounded-full border-2 border-[#1c1e21] align-middle text-[10px] font-bold leading-none text-[#1c1e21]"
  >
    ?
  </span>
);

export const FieldError: React.FC<{ message: string }> = ({ message }) => (
  <p className="mt-1 flex items-center gap-1 text-[12px] leading-4 text-red-600">
    <span className="inline-flex h-[13px] w-[13px] shrink-0 items-center justify-center rounded-full border border-red-600 text-[9px] font-bold leading-none">
      !
    </span>
    {message}
  </p>
);

export const FloatingField: React.FC<{
  id: string;
  type?: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  className?: string;
  labelClassName?: string;
}> = ({ id, type = 'text', label, value, onChange, error, className = '', labelClassName = '' }) => (
  <div className="w-full">
    <div className="relative w-full">
      <input
        id={id}
        type={type}
        placeholder=" "
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`peer w-full h-12 pt-[15px] px-[14px] pb-[5px] border rounded-2xl outline-none text-[15px] bg-white transition-colors duration-150 ease-in-out focus:ring-1 ${
          error
            ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
            : 'border-[#ccd0d5] focus:border-[#1877f2] focus:ring-[#1877f2]'
        } ${className}`}
      />
      <label
        htmlFor={id}
        className={`absolute left-[14px] top-1/2 -translate-y-1/2 text-[#65676b] text-[15px] pointer-events-none transition-all duration-150 ease-in-out peer-focus:top-2 peer-focus:translate-y-0 peer-focus:text-[11px] peer-[:not(:placeholder-shown)]:top-2 peer-[:not(:placeholder-shown)]:translate-y-0 peer-[:not(:placeholder-shown)]:text-[11px] ${labelClassName}`}
      >
        {label}
      </label>
    </div>
    {error && <FieldError message={error} />}
  </div>
);

const langLinks = [
  'English (US)', 'ქართული', 'Русский', 'Türkçe', 'Deutsch', 'Azərbaycan dili', 'العربية', 'More languages...',
];
const footerCol1 = [
  'Sign Up', 'Log In', 'Messenger', 'Facebook Lite', 'Video', 'Meta Pay', 'Meta Store',
  'Meta Quest', 'Ray-Ban Meta', 'Meta AI', 'Instagram', 'Threads', 'Privacy Policy',
];
const footerCol2 = [
  'Privacy Center', 'About', 'Create ad', 'Create Page', 'Developers', 'Careers',
  'Cookies', 'Ad choices', 'Terms', 'Help', 'Contact Uploading & Non-Users',
];

export const Footer: React.FC = () => (
  <footer className="flex min-h-[125px] border-t-2 border-[#ddd] py-5 px-6 min-[1022px]:pl-[27%] flex-col justify-center gap-[10px]">
    <div className="flex flex-wrap gap-[14px] text-[11px] text-[#65676b]">
      {langLinks.map((l) => (
        <span key={l} className="cursor-pointer hover:underline">{l}</span>
      ))}
    </div>
    <div className="flex flex-wrap gap-[14px] text-[11px] text-[#65676b]">
      {footerCol1.map((l) => (
        <span key={l} className="cursor-pointer hover:underline">{l}</span>
      ))}
    </div>
    <div className="flex flex-wrap gap-[14px] text-[11px] text-[#65676b]">
      {footerCol2.map((l) => (
        <span key={l} className="cursor-pointer hover:underline">{l}</span>
      ))}
    </div>
  </footer>
);