import { useState, useEffect } from 'react';

/**
 * Strips common honorifics and titles to retrieve the true first letter of a name.
 * Examples:
 *  - "Adv. Mahesh Gour" -> "M"
 *  - "Advocate Priya Sharma" -> "P"
 *  - "Dr. Rahul Verma" -> "R"
 *  - "Dr Rahul Verma" -> "R"
 *  - "Mr. Amit Jain" -> "A"
 *  - "Mrs. Sunita Rao" -> "S"
 *  - "Ms. Deepa" -> "D"
 *  - "Shri Rajesh Gupta" -> "R"
 *  - "Smt. Anita" -> "A"
 *  - "Prof. K. Sharma" -> "K"
 *  - "" or null -> "?"
 */
export const getInitial = (name) => {
  if (!name || typeof name !== 'string') return '?';

  let cleaned = name.trim();
  if (!cleaned) return '?';

  // Iteratively strip known titles/prefixes (case-insensitive, with optional dot followed by space)
  const prefixRegex = /^(?:advocate|adv|dr|doctor|mr|mrs|ms|shri|shree|smt|prof|professor)\.?\s+/i;
  while (prefixRegex.test(cleaned)) {
    cleaned = cleaned.replace(prefixRegex, '').trim();
  }

  // Strip leading punctuation or quotes
  cleaned = cleaned.replace(/^[^a-zA-Z0-9]+/, '');

  if (!cleaned) return '?';
  return cleaned.charAt(0).toUpperCase();
};

// Curated solid palette with high contrast against white text (contrast ratio > 4.5:1)
const AVATAR_PALETTE = [
  '#0f3a69', // Deep Royal Blue
  '#854d0e', // Deep Warm Amber
  '#166534', // Deep Emerald
  '#991b1b', // Deep Crimson
  '#5b21b6', // Deep Purple
  '#0e7490', // Deep Cyan / Teal
  '#9a3412', // Deep Rust Orange
  '#374151', // Deep Slate Gray
  '#831843', // Deep Rose
  '#1e3a8a'  // Dark Navy Blue
];

/**
 * Deterministically picks a color from the palette based on the person's name,
 * ensuring the same person always gets the same color.
 */
export const getAvatarColor = (name) => {
  if (!name || typeof name !== 'string') return '#0f3a69';
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % AVATAR_PALETTE.length;
  return AVATAR_PALETTE[index];
};

/**
 * Reusable Avatar Component
 * - If src is valid and loads successfully, displays image.
 * - If src is missing, empty, null, or fails to load (onError), displays fallback circle with first letter.
 */
export default function Avatar({
  name = '',
  src = '',
  size = 40,
  className = '',
  alt = '',
  style = {}
}) {
  const [hasError, setHasError] = useState(false);

  // Reset error state if image src changes
  useEffect(() => {
    setHasError(false);
  }, [src]);

  // Check if src is an empty placeholder or invalid
  const hasValidSrc = Boolean(
    src &&
    typeof src === 'string' &&
    src.trim() !== '' &&
    !src.trim().startsWith('?') &&
    !hasError
  );

  const initial = getInitial(name);
  const bgColor = getAvatarColor(name);
  const fontSize = Math.max(12, Math.round(size * 0.42));

  if (!hasValidSrc) {
    return (
      <div
        className={`avatar-circle-fallback ${className}`}
        style={{
          width: size,
          height: size,
          minWidth: size,
          minHeight: size,
          borderRadius: '50%',
          backgroundColor: bgColor,
          color: '#ffffff',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 700,
          fontSize: `${fontSize}px`,
          userSelect: 'none',
          flexShrink: 0,
          textTransform: 'uppercase',
          border: '1.5px solid rgba(197, 168, 128, 0.4)',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
          ...style
        }}
        title={name || 'User Avatar'}
        aria-label={name || 'User Avatar'}
      >
        {initial}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt || name || 'Avatar'}
      onError={() => setHasError(true)}
      className={`avatar-circle-img ${className}`}
      style={{
        width: size,
        height: size,
        minWidth: size,
        minHeight: size,
        borderRadius: '50%',
        objectFit: 'cover',
        flexShrink: 0,
        border: '1.5px solid rgba(197, 168, 128, 0.4)',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
        ...style
      }}
    />
  );
}
