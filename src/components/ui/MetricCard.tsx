import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface MetricCardProps {
  label: string;
  value: string | number;
  subValue?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  isHero?: boolean;
}

const variantClasses: Record<string, string> = {
  default: 'bg-card border-border',
  success: 'bg-success-bg border-green-200',
  warning: 'bg-warning-bg border-orange-200',
  danger: 'bg-danger-bg border-red-200',
  info: 'bg-info-bg border-blue-200',
};

export default function MetricCard({
  label,
  value,
  subValue,
  trend,
  trendValue,
  icon: Icon,
  iconColor,
  iconBg,
  variant = 'default',
  isHero = false,
}: MetricCardProps) {
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendColor =
    trend === 'up' ? 'text-success' : trend === 'down' ? 'text-danger' : 'text-muted-foreground';

  return (
    <div
      className={`rounded-2xl border shadow-card p-5 ${variantClasses[variant]} ${
        isHero ? 'col-span-2' : ''
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center`}>
          <Icon size={20} className={iconColor} />
        </div>
        {trend && trendValue && (
          <div className={`flex items-center gap-1 text-xs font-semibold ${trendColor}`}>
            <TrendIcon size={13} />
            {trendValue}
          </div>
        )}
      </div>
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
        {label}
      </p>
      <p className={`font-bold text-foreground font-tabular ${isHero ? 'text-4xl' : 'text-2xl'}`}>
        {value}
      </p>
      {subValue && <p className="text-xs text-muted-foreground mt-1">{subValue}</p>}
    </div>
  );
}
