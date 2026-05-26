import { ChevronLeft, ChevronRight } from 'lucide-react';

interface SlickArrowProps {
  direction: 'prev' | 'next';
  onClick?: () => void;
}

export default function SlickArrow({ direction, onClick }: SlickArrowProps) {
  return (
    <button
      onClick={onClick}
      className={`absolute top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-all flex items-center justify-center ${
        direction === 'prev' ? '-left-5' : '-right-5'
      }`}
      aria-label={direction === 'prev' ? 'Previous' : 'Next'}
    >
      {direction === 'prev' ? (
        <ChevronLeft className="w-6 h-6" />
      ) : (
        <ChevronRight className="w-6 h-6" />
      )}
    </button>
  );
}
