import type { LucideProps } from '../ui/icons';
import type { ForwardRefExoticComponent, RefAttributes } from 'react';

type LucideIcon = ForwardRefExoticComponent<
  Omit<LucideProps, 'ref'> & RefAttributes<SVGSVGElement>
>;

interface StatsCardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  iconColor?: string;
}

export default function StatsCard({
  title,
  value,
  icon: Icon,
  iconColor = 'text-sky-600 dark:text-sky-400',
}: StatsCardProps) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 hover:shadow-md transition-shadow duration-300">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-body-sm font-medium text-slate-500 dark:text-slate-400 mb-1">
            {title}
          </p>
          <p className="text-display-sm font-bold text-slate-900 dark:text-white">
            {value.toLocaleString()}
          </p>
        </div>
        <div className={`p-3 rounded-full bg-slate-100 dark:bg-slate-700 ${iconColor}`}>
          <Icon className="w-8 h-8" />
        </div>
      </div>
    </div>
  );
}
