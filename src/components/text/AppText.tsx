import React from 'react';
import { COLORS, FONT_SIZE, FONT_WIDTH } from '@/constants/Constants';

// Semantic variants — each maps to an element + Tailwind classes.
// Add new variants here and they propagate everywhere AppText is used.
export type AppTextVariant =
  | 'h1'       // Page title
  | 'h2'       // Section heading
  | 'h3'       // Card / sub-section heading
  | 'subtitle' // Supporting descriptive text below a heading
  | 'body'     // General body copy
  | 'caption'  // Small helper / meta text
  | 'label'    // Form labels, stat card titles
  | 'brand'    // Sidebar business name
  | 'value';   // Large numeric / stat display

const VARIANT_CLASSES: Record<AppTextVariant, string> = {
  h1:       'text-2xl font-bold text-slate-800 dark:text-slate-100',
  h2:       'text-lg font-semibold text-slate-800 dark:text-slate-100',
  h3:       'text-base font-semibold text-slate-800 dark:text-slate-100',
  subtitle: 'text-sm text-slate-600 dark:text-slate-400',
  body:     'text-sm text-slate-700 dark:text-slate-300',
  caption:  'text-xs text-slate-500 dark:text-slate-400',
  label:    'text-sm font-medium text-slate-500 dark:text-slate-400',
  brand:    'text-xl font-bold tracking-tight truncate',
  value:    'text-2xl font-semibold text-slate-800 dark:text-slate-100 tabular-nums',
};

const VARIANT_ELEMENTS: Record<AppTextVariant, keyof React.JSX.IntrinsicElements> = {
  h1:       'h1',
  h2:       'h2',
  h3:       'h3',
  subtitle: 'p',
  body:     'p',
  caption:  'span',
  label:    'p',
  brand:    'span',
  value:    'p',
};

// Legacy size/color/weight props kept for backward compatibility.
type LegacySize   = 'extraSmall' | 'small' | 'medium' | 'large' | 'extraLarge';
type LegacyColor  = 'primary' | 'secondary' | 'background' | 'lightGrey' | 'Grey' | 'text' | 'white' | 'black' | 'transparent';
type LegacyWeight = 'medium' | 'large' | 'extraLarge';

interface AppTextProps {
  /** Semantic variant — drives element type and Tailwind classes. */
  variant?: AppTextVariant;
  /** Convenience prop for plain string content. */
  text?: string;
  /** Rich / mixed content (links, icons, etc.). Takes priority over `text`. */
  children?: React.ReactNode;
  /** Override the rendered HTML element regardless of variant. */
  as?: keyof React.JSX.IntrinsicElements;
  /** Extra Tailwind classes merged on top of variant classes. */
  className?: string;
  onClick?: () => void;
  // Legacy props — used only when no `variant` is provided.
  size?: LegacySize;
  color?: LegacyColor;
  weight?: LegacyWeight;
  align?: 'left' | 'center' | 'right';
}

const AppText: React.FC<AppTextProps> = ({
  variant,
  text,
  children,
  as,
  className = '',
  onClick,
  // legacy
  size,
  color = 'black',
  weight,
  align,
}) => {
  const content = children ?? text;

  if (variant) {
    const Tag = (as ?? VARIANT_ELEMENTS[variant]) as React.ElementType;
    return (
      <Tag
        className={`${VARIANT_CLASSES[variant]} ${className}`.trim()}
        onClick={onClick}
      >
        {content}
      </Tag>
    );
  }

  // Legacy path: render a <p> with inline styles when no variant is given.
  const Tag = (as ?? 'p') as React.ElementType;
  return (
    <Tag
      style={{
        fontFamily: 'Poppins',
        fontSize: size ? FONT_SIZE[size] : undefined,
        color: COLORS[color],
        fontWeight: weight ? FONT_WIDTH[weight] : undefined,
        textAlign: align,
      }}
      className={className}
      onClick={onClick}
    >
      {content}
    </Tag>
  );
};

export default AppText;
