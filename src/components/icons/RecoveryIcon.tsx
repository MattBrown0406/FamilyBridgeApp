import { SVGProps } from 'react';

interface RecoveryIconProps extends SVGProps<SVGSVGElement> {
  size?: number;
}

export const RecoveryIcon = ({ size = 24, className, ...props }: RecoveryIconProps) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      {/* Bridge arch */}
      <path d="M3 18 C3 12, 12 6, 12 6 C12 6, 21 12, 21 18" />
      {/* Bridge deck */}
      <line x1="2" y1="18" x2="22" y2="18" />
      {/* Left pillar */}
      <line x1="6" y1="18" x2="6" y2="21" />
      {/* Right pillar */}
      <line x1="18" y1="18" x2="18" y2="21" />
      {/* Center support */}
      <line x1="12" y1="6" x2="12" y2="18" />
    </svg>
  );
};
