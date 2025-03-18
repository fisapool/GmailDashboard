import { useState } from "react";
import { useActivities } from "@/hooks/useActivities";
import { useAccounts } from "@/hooks/useAccounts";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Check, 
  Mail, 
  AlertTriangle, 
  PlusCircle, 
  Clock,
  UserCircle,
  RefreshCw,
  X,
  SearchIcon
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { ActivityLog } from "@shared/schema";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

export default function Activity() {
  const { activities, isLoading } = useActivities();
  const { accounts } = useAccounts();
  const [filters, setFilters] = useState({
    type: "all",
    accountId: "all",
    status: "all",
    search: "",
  });
  
  // Helper function to get icon and color based on activity type
  const getActivityIcon = (activity: ActivityLog): { icon: React.ReactNode; color: string; bgColor: string } => {
    // Default
    let result = { 
      icon: <Check className="h-4 w-4" />, 
      color: "text-green-500", 
      bgColor: "bg-green-50"
    };
    
    // Based on type
    if (activity.type.includes('verification')) {
      result = { 
        icon: <RefreshCw className="h-4 w-4" />, 
        color: "text-green-500", 
        bgColor: "bg-green-50" 
      };
    } else if (activity.type.includes('email')) {
      result = { 
        icon: <Mail className="h-4 w-4" />, 
        color: "text-primary", 
        bgColor: "bg-blue-50" 
      };
    } else if (activity.type.includes('auth_failed')) {
      result = { 
        icon: <X className="h-4 w-4" />, 
        color: "text-red-500", 
        bgColor: "bg-red-50" 
      };
    } else if (activity.type.includes('account_added')) {
      result = { 
        icon: <PlusCircle className="h-4 w-4" />, 
        color: "text-primary", 
        bgColor: "bg-blue-50" 
      };
    } else if (activity.type.includes('task')) {
      result = { 
        icon: <Clock className="h-4 w-4" />, 
        color: "text-yellow-500", 
        bgColor: "bg-yellow-50" 
      };
    }
    
    // Override based on status
    if (activity.status === 'error') {
      result = { 
        icon: <AlertTriangle className="h-4 w-4" />, 
        color: "text-red-500", 
        bgColor: "bg-red-50" 
      };
    } else if (activity.status === 'warning') {
      result = { 
        icon: <AlertTriangle className="h-4 w-4" />, 
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
    return format(date, 'MMM d, yyyy h:mm a');
  };
  
  // Get account name by ID
  const getAccountName = (accountId: number | null | undefined) => {
    if (!accountId) return "System";
    const account = accounts.find(acc => acc.id === accountId);
    return account ? account.email : `Account #${accountId}`;
  };
  
  // Filter activities based on current filters
  const filteredActivities = activities.filter(activity => {
    if (filters.type !== "all") {
      if (filters.type === "account" && !activity.type.includes('account')) {
        return false;
      }
      if (filters.type === "verification" && !activity.type.includes('verification')) {
        return false;
      }
      if (filters.type === "task" && !activity.type.includes('task')) {
        return false;
      }
      if (filters.type === "email" && !activity.type.includes('email')) {
        return false;
      }
    }
    
    if (filters.accountId !== "all") {
      const accountId = parseInt(filters.accountId);
      if (activity.accountId !== accountId) {
        return false;
      }
    }
    
    if (filters.status !== "all" && activity.status !== filters.status) {
      return false;
    }
    
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const message = activity.message?.toLowerCase() || "";
      const accountName = getAccountName(activity.accountId).toLowerCase();
      return message.includes(searchLower) || accountName.includes(searchLower);
    }
    
    return true;
  });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-medium text-gray-800">Activity Log</h1>
        <p className="text-gray-600">View a log of all activities performed on your Gmail accounts</p>
      </div>
      
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search activities..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="h-10"
              />
            </div>
            <div className="flex flex-wrap gap-4">
              <Select
                value={filters.type}
                onValueChange={(value) => setFilters({ ...filters, type: value })}
              >
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Activity Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Activities</SelectItem>
                  <SelectItem value="account">Account Management</SelectItem>
                  <SelectItem value="verification">Verification</SelectItem>
                  <SelectItem value="task">Scheduled Tasks</SelectItem>
                  <SelectItem value="email">Email Activities</SelectItem>
                </SelectContent>
              </Select>
              
              <Select
                value={filters.accountId}
                onValueChange={(value) => setFilters({ ...filters, accountId: value })}
              >
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Account" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Accounts</SelectItem>
                  {accounts.map((account) => (
                    <SelectItem key={account.id} value={account.id.toString()}>
                      {account.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select
                value={filters.status}
                onValueChange={(value) => setFilters({ ...filters, status: value })}
              >
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="success">Success</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-6">
          {isLoading ? (
            <div className="space-y-6">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex space-x-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredActivities.length === 0 ? (
            <div className="text-center py-8">
              <SearchIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium">No Activities Found</h3>
              <p className="text-gray-500 mt-2">
                {activities.length === 0 
                  ? "No activities have been recorded yet."
                  : "No activities match your current filters."}
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {filteredActivities.map((activity) => {
                const { icon, color, bgColor } = getActivityIcon(activity);
                
                return (
                  <div key={activity.id} className="flex">
                    <div className={cn("p-2 rounded-full mr-4 self-start", bgColor)}>
                      <div className={color}>{icon}</div>
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                        <div>
                          <p className="text-sm font-medium">{activity.message}</p>
                          <div className="flex items-center mt-1">
                            <UserCircle className="h-3 w-3 text-gray-400 mr-1" />
                            <p className="text-xs text-gray-600">
                              {getAccountName(activity.accountId)}
                            </p>
                          </div>
                        </div>
                        
                        <div className="mt-2 md:mt-0 flex items-center">
                          <p className="text-xs text-gray-500">
                            {formatTimestamp(activity.createdAt)}
                          </p>
                          <Badge 
                            variant="outline" 
                            className={cn(
                              "ml-2",
                              activity.status === "success" && "bg-green-50 text-green-500",
                              activity.status === "error" && "bg-red-50 text-red-500",
                              activity.status === "warning" && "bg-yellow-50 text-yellow-500"
                            )}
                          >
                            {activity.status}
                          </Badge>
                        </div>
                      </div>
                      
                      {activity.details && (
                        <div className="mt-2 text-xs text-gray-600 bg-gray-50 p-2 rounded">
                          <pre className="whitespace-pre-wrap font-sans">
                            {JSON.stringify(activity.details, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
