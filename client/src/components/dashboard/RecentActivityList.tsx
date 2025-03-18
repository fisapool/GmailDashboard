import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import { format, formatDistanceToNow } from "date-fns";
import { 
  Check, 
  Mail, 
  AlertTriangle, 
  PlusCircle, 
  LucideIcon
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ActivityLog } from "@shared/schema";

interface RecentActivityListProps {
  activities: ActivityLog[];
}

export default function RecentActivityList({ activities }: RecentActivityListProps) {
  // Helper function to get icon and color based on activity type
  const getActivityIcon = (activity: ActivityLog): { icon: LucideIcon; color: string; bgColor: string } => {
    // Default
    let result = { 
      icon: Check, 
      color: "text-green-500", 
      bgColor: "bg-green-50"
    };
    
    // Based on type
    if (activity.type.includes('verification')) {
      result = { 
        icon: Check, 
        color: "text-green-500", 
        bgColor: "bg-green-50" 
      };
    } else if (activity.type.includes('email')) {
      result = { 
        icon: Mail, 
        color: "text-primary", 
        bgColor: "bg-blue-50" 
      };
    } else if (activity.type.includes('auth_failed')) {
      result = { 
        icon: AlertTriangle, 
        color: "text-red-500", 
        bgColor: "bg-red-50" 
      };
    } else if (activity.type.includes('account_added')) {
      result = { 
        icon: PlusCircle, 
        color: "text-primary", 
        bgColor: "bg-blue-50" 
      };
    }
    
    // Override based on status
    if (activity.status === 'error') {
      result = { 
        icon: AlertTriangle, 
        color: "text-red-500", 
        bgColor: "bg-red-50" 
      };
    } else if (activity.status === 'warning') {
      result = { 
        icon: AlertTriangle, 
        color: "text-yellow-500", 
        bgColor: "bg-yellow-50" 
      };
    }
    
    return result;
  };
  
  // Format timestamp
  const formatTimestamp = (timestamp: Date) => {
    const date = new Date(timestamp);
    const now = new Date();
    
    // If it's today, show time
    if (date.toDateString() === now.toDateString()) {
      return `Today, ${format(date, 'h:mm a')}`;
    }
    
    // If it's yesterday, show "Yesterday"
    if (date.toDateString() === new Date(now.setDate(now.getDate() - 1)).toDateString()) {
      return `Yesterday, ${format(date, 'h:mm a')}`;
    }
    
    // If it's within the last week, show relative time
    if (date > new Date(now.setDate(now.getDate() - 7))) {
      return formatDistanceToNow(date, { addSuffix: true });
    }
    
    // Otherwise, show date
    return format(date, 'MMM d, yyyy');
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-medium">Recent Activity</CardTitle>
        <Link href="/activity">
          <a className="text-primary text-sm hover:text-primary-hover">View all</a>
        </Link>
      </CardHeader>
      <CardContent className="pt-0">
        <ul className="space-y-4">
          {activities.length === 0 ? (
            <li className="text-gray-500 text-sm py-4 text-center">No recent activity</li>
          ) : (
            activities.map((activity) => {
              const { icon: Icon, color, bgColor } = getActivityIcon(activity);
              
              return (
                <li 
                  key={activity.id} 
                  className="border-b border-gray-200 pb-3 last:border-0"
                >
                  <div className="flex items-start">
                    <div className={cn("p-2 rounded-full mr-3", bgColor)}>
                      <Icon className={cn("h-4 w-4", color)} />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{activity.message}</p>
                      {activity.accountId && (
                        <p className="text-xs text-gray-600">
                          {(activity.details as any)?.email || `Account #${activity.accountId}`}
                        </p>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        {formatTimestamp(activity.createdAt)}
                      </p>
                    </div>
                  </div>
                </li>
              );
            })
          )}
        </ul>
      </CardContent>
    </Card>
  );
}
