// src/components/icons/GridIcon.tsx
interface IconProps {
  className?: string;
  color?: string;
}

export const GridIcon = ({ className = "", color = "currentColor" }: IconProps) => (
  <svg 
    className={className}
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect 
      x="3" y="3" width="7" height="7" rx="1.5" 
      stroke={color} 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
    <rect 
      x="14" y="3" width="7" height="7" rx="1.5" 
      stroke={color} 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
    <rect 
      x="14" y="14" width="7" height="7" rx="1.5" 
      stroke={color} 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
    <rect 
      x="3" y="14" width="7" height="7" rx="1.5" 
      stroke={color} 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
  </svg>
);
