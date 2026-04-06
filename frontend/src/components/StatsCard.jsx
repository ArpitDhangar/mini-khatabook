/**
 * Generic statistics card for the dashboard.
 * @prop {string} label   - Card title
 * @prop {string|number} value - Main metric
 * @prop {string} subLabel - Secondary text below value
 * @prop {string} color   - Tailwind color class for the icon bg (e.g. "bg-blue-100")
 * @prop {string} icon    - Emoji or character for the icon
 */
export default function StatsCard({ label, value, subLabel, color = 'bg-blue-100', icon }) {
  return (
    <div className="card flex items-center gap-2 sm:gap-4 p-3 sm:p-4">
      <div className={`${color} rounded-full p-2 sm:p-3 text-lg sm:text-2xl shrink-0`}>{icon}</div>
      <div className="min-w-0">
        <p className="text-[10px] sm:text-xs text-gray-500 font-medium uppercase tracking-wide truncate">{label}</p>
        <p className="text-base sm:text-2xl font-bold text-gray-900 leading-tight truncate">{value}</p>
        {subLabel && <p className="text-[10px] sm:text-xs text-gray-400 mt-0.5 truncate">{subLabel}</p>}
      </div>
    </div>
  );
}
