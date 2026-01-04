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
      {/* Circle */}
      <circle cx="12" cy="12" r="10" />
      {/* Triangle inscribed in circle - points touch the circle */}
      <path d="M12 2.5 L21.2 17.5 L2.8 17.5 Z" />
    </svg>
  );
};
