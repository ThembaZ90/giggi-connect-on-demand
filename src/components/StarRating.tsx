import React from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StarRatingProps {
  rating: number;
  onRatingChange?: (rating: number) => void;
  readonly?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const StarRating: React.FC<StarRatingProps> = ({
  rating,
  onRatingChange,
  readonly = false,
  size = 'md',
  className
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  const handleStarClick = (starRating: number) => {
    if (!readonly && onRatingChange) {
      onRatingChange(starRating);
    }
  };

  return (
    <div className={cn("flex items-center gap-1", className)}>
      {[1, 2, 3, 4, 5].map((starValue) => (
        <button
          key={starValue}
          type="button"
          onClick={() => handleStarClick(starValue)}
          disabled={readonly}
          className={cn(
            "transition-colors duration-200",
            readonly ? "cursor-default" : "cursor-pointer hover:scale-110",
            sizeClasses[size]
          )}
        >
          <Star
            className={cn(
              "transition-colors",
              starValue <= rating
                ? "fill-yellow-400 text-yellow-400"
                : "text-muted-foreground"
            )}
          />
        </button>
      ))}
      {rating > 0 && (
        <span className="ml-2 text-sm text-muted-foreground">
          ({rating.toFixed(1)})
        </span>
      )}
    </div>
  );
};