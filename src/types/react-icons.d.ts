/**
 * Type override for react-icons to fix React 19 JSX compatibility.
 *
 * react-icons' IconType returns ReactNode, but React 19's @types/react
 * requires JSX components to return ReactElement | null.
 * This augmentation narrows the return type so all Lu* icons (and others)
 * are valid JSX components.
 */
import type { SVGAttributes } from 'react';

declare module 'react-icons/lib' {
  export interface IconBaseProps extends SVGAttributes<SVGElement> {
    children?: React.ReactNode;
    size?: string | number;
    color?: string;
    title?: string;
  }

  export type IconType = (props: IconBaseProps) => React.JSX.Element;
}
