"use client";

interface FlagBadgeProps {
  flags: string[];
}

export default function FlagBadge({ flags }: FlagBadgeProps) {
  if (!flags || flags.length === 0) {
    return null;
  }

  const getFlagCategory = (flag: string): 'good' | 'warning' | 'neutral' => {
    // Check for exact matches first
    const exactMatches: Record<string, 'good' | 'warning' | 'neutral'> = {
      'High short + Low float': 'warning',
      'Has reverse split history': 'neutral',
      'Cash runway < 12mo (est.)': 'warning',
    };
    
    if (exactMatches[flag]) {
      return exactMatches[flag];
    }
    
    // Pattern-based matching for dynamic flags
    if (flag.includes('Share buybacks') || flag.includes('buybacks')) {
      return 'good';
    }
    if (flag.includes('dilution')) {
      return 'warning';
    }
    if (flag.includes('insider buying') || flag.includes('cluster buying') || flag.includes('Executive buying')) {
      return 'good';
    }
    if (flag.includes('insider selling')) {
      return 'warning';
    }
    
    return 'neutral';
  };

  const getFlagColor = (flag: string): string => {
    const category = getFlagCategory(flag);

    switch (category) {
      case 'good':
        return "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-300 dark:border-green-700";
      case 'warning':
        return "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-red-300 dark:border-red-700";
      case 'neutral':
      default:
        return "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 border-gray-300 dark:border-gray-600";
    }
  };

  return (
    <div className="flex flex-wrap gap-1">
      {flags.map((flag, idx) => (
        <span
          key={idx}
          className={`px-2 py-1 text-xs font-medium rounded border ${getFlagColor(flag)}`}
        >
          {flag}
        </span>
      ))}
    </div>
  );
}

