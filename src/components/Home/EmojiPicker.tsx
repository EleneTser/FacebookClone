// src/components/home/EmojiPicker.tsx
import React, { useEffect, useRef } from 'react';

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
  onClose: () => void;
  className?: string;
}

// A compact, dependency-free emoji set. Grouped loosely so the grid
// doesn't feel random.
const EMOJI_GROUPS: { label: string; emojis: string[] }[] = [
  {
    label: 'Smileys',
    emojis: ['😀', '😁', '😂', '🤣', '😊', '😍', '😘', '😜', '🤔', '😎', '🥳', '😇', '🙂', '😢', '😭', '😡', '😱', '🥺'],
  },
  {
    label: 'Gestures',
    emojis: ['👍', '👎', '👏', '🙌', '🙏', '💪', '🤝', '✌️', '🤞', '👋'],
  },
  {
    label: 'Hearts',
    emojis: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '💕', '💯', '🔥'],
  },
  {
    label: 'Other',
    emojis: ['🎉', '🎂', '🎁', '⭐', '☀️', '🌙', '⚽', '🍕', '☕', '🐶', '🐱', '📸'],
  },
];

export const EmojiPicker: React.FC<EmojiPickerProps> = ({ onSelect, onClose, className }) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className={`absolute z-50 w-64 max-h-72 overflow-y-auto rounded-xl bg-white shadow-2xl border border-gray-200 p-3 ${className || ''}`}
    >
      {EMOJI_GROUPS.map((group) => (
        <div key={group.label} className="mb-2">
          <p className="text-[11px] font-semibold text-gray-400 uppercase mb-1">{group.label}</p>
          <div className="grid grid-cols-8 gap-1">
            {group.emojis.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => onSelect(emoji)}
                className="text-xl leading-none rounded-md hover:bg-gray-100 p-1 cursor-pointer transition"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default EmojiPicker;