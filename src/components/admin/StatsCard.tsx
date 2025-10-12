import type { LucideProps } from '../ui/icons';
import type { ForwardRefExoticComponent, RefAttributes } from 'react';

type LucideIcon = ForwardRefExoticComponent<Omit<LucideProps, 'ref'> & RefAttributes<SVGSVGElement>>;

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
    <div className='bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-lg shadow-lg border border-sky-200 dark:border-sky-700 p-6 hover:shadow-xl transition-shadow duration-300'>
      <div className='flex items-center justify-between'>
        <div>
          <p className='text-body-sm font-medium text-sky-600 dark:text-sky-400 mb-1'>
            {title}
          </p>
          <p className='text-display-sm font-bold text-sky-900 dark:text-sky-100'>
            {value.toLocaleString()}
          </p>
        </div>
        <div
          className={`p-3 rounded-full bg-sky-100 dark:bg-sky-900/50 ${iconColor}`}
        >
          <Icon className='w-8 h-8' />
        </div>
      </div>
    </div>
  );
}
