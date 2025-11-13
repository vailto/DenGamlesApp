'use client';

import { Outcome } from '@/lib/types';

interface ValueBadgesProps {
  diff: Partial<Record<Outcome, number>>;
}

export default function ValueBadges({ diff }: ValueBadgesProps) {
  const outcomes: Outcome[] = ['1', 'X', '2'];

  return (
    <div className="flex gap-1">
      {outcomes.map(outcome => {
        const diffValue = diff?.[outcome];
        if (diffValue === undefined) return null;

        const isValue = diffValue > 0;
        const displayValue = (diffValue * 100).toFixed(1);

        return (
          <span
            key={outcome}
            className={`px-2 py-1 rounded text-xs font-medium ${
              isValue
                ? 'bg-green-100 text-green-800 border border-green-300'
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            {outcome}: {displayValue > 0 ? '+' : ''}{displayValue}%
          </span>
        );
      })}
    </div>
  );
}
