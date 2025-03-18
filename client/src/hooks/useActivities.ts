import { useQuery } from "@tanstack/react-query";
import { ActivityLog } from "@shared/schema";

export function useActivities(limit?: number) {
  // Get all activities
  const { 
    data: activities = [], 
    isLoading,
    isError,
    error,
    refetch
  } = useQuery<ActivityLog[]>({
    queryKey: ['/api/activities', limit ? `?limit=${limit}` : ''],
  });

  return {
    activities,
    isLoading,
    isError,
    error,
    refetch
  };
}

export function useAccountActivities(accountId: number, limit?: number) {
  // Get activities for a specific account
  const { 
    data: activities = [], 
    isLoading,
    isError,
    error,
    refetch
  } = useQuery<ActivityLog[]>({
    queryKey: [`/api/accounts/${accountId}/activities`, limit ? `?limit=${limit}` : ''],
    enabled: !!accountId,
  });

  return {
    activities,
    isLoading,
    isError,
    error,
    refetch
  };
}
