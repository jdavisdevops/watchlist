"use client";

interface FlagBadgeProps {
  flags: string[];
}

export default function FlagBadge({ flags }: FlagBadgeProps) {
  if (!flags || flags.length === 0) {
    return null;
  }

  const getFlagColor = (flag: string): string => {
    if (flag.includes("High short + Low float")) {
      return "bg-yellow-100 text-yellow-800 border-yellow-300";
    }
    if (flag.includes("reverse split")) {
      return "bg-orange-100 text-orange-800 border-orange-300";
    }
    if (flag.includes("Cash runway")) {
      return "bg-red-100 text-red-800 border-red-300";
    }
    if (flag.includes("dilution")) {
      return "bg-blue-100 text-blue-800 border-blue-300";
    }
    return "bg-gray-100 text-gray-800 border-gray-300";
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

