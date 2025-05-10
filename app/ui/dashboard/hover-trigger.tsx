'use client';

interface HoverTriggerProps {
  onHover: () => void;
}

// Component that creates a thin strip at the left side of the screen
// that triggers the sidebar when hovered
export default function HoverTrigger({ onHover }: HoverTriggerProps) {
  return (
    <div 
      className="fixed top-0 left-0 w-3 h-full z-40 cursor-pointer hover:bg-gray-200 hover:bg-opacity-20"
      onMouseEnter={onHover}
      aria-label="Open sidebar"
    />
  );
}
