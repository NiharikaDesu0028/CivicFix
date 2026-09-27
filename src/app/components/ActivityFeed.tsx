import React from 'react';
import { CheckCircle2, UserCheck, Wrench, Clock, PlusCircle } from 'lucide-react';

const activities = [
  {
    id: 'act-001',
    type: 'resolved',
    title: 'Complaint #CF-2609 resolved',
    detail: 'Pothole on 5th Cross, Koramangala',
    time: '2 hours ago',
    icon: CheckCircle2,
    iconColor: 'text-success',
    iconBg: 'bg-success/10',
  },
  {
    id: 'act-002',
    type: 'assigned',
    title: 'Officer assigned to #CF-2614',
    detail: 'Broken streetlight on 80 Feet Road',
    time: '5 hours ago',
    icon: UserCheck,
    iconColor: 'text-info',
    iconBg: 'bg-info/10',
  },
  {
    id: 'act-003',
    type: 'inprogress',
    title: '#CF-2611 marked In Progress',
    detail: 'Blocked drain near Jyoti Nivas College',
    time: 'Yesterday, 3:15 PM',
    icon: Wrench,
    iconColor: 'text-warning',
    iconBg: 'bg-warning/10',
  },
  {
    id: 'act-004',
    type: 'received',
    title: 'New complaint received',
    detail: 'Water leakage on 12th Main, HSR Layout',
    time: 'Yesterday, 11:40 AM',
    icon: PlusCircle,
    iconColor: 'text-primary',
    iconBg: 'bg-primary/10',
  },
  {
    id: 'act-005',
    type: 'pending',
    title: '#CF-2607 awaiting review',
    detail: 'Garbage accumulation on 17th Cross',
    time: '3 days ago',
    icon: Clock,
    iconColor: 'text-muted-foreground',
    iconBg: 'bg-muted',
  },
];

export default function ActivityFeed() {
  return (
    <div className="bg-card rounded-2xl border border-border shadow-card p-5 h-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-foreground">Recent Activity</h2>
        <span className="text-xs text-muted-foreground">Last 7 days</span>
      </div>

      <div className="space-y-1">
        {activities?.map((act, index) => {
          const Icon = act?.icon;
          return (
            <div key={act?.id} className="relative">
              <div className="flex gap-3 py-2.5">
                <div className="relative shrink-0">
                  <div
                    className={`w-8 h-8 rounded-xl ${act?.iconBg} flex items-center justify-center`}
                  >
                    <Icon size={15} className={act?.iconColor} />
                  </div>
                  {index < activities?.length - 1 && (
                    <div className="absolute top-8 left-1/2 w-px h-3 bg-border -translate-x-1/2" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground leading-tight">{act?.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">{act?.detail}</p>
                  <p className="text-xs text-muted-foreground mt-1 opacity-70">{act?.time}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
