import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { ScheduledTask } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export function useTasks() {
  const { toast } = useToast();
  
  // Get all tasks
  const { 
    data: tasks = [], 
    isLoading,
    isError,
    error,
    refetch
  } = useQuery<ScheduledTask[]>({
    queryKey: ['/api/tasks'],
  });

  // Add task mutation
  const addTask = useMutation({
    mutationFn: (taskData: { 
      accountId?: number; 
      taskType: string; 
      scheduleType: string; 
      scheduleConfig: any;
      nextRun?: Date;
    }) => apiRequest('POST', '/api/tasks', taskData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard'] });
      toast({
        title: "Task scheduled",
        description: "Task has been scheduled successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to schedule task",
        description: error.message || "An error occurred while scheduling the task",
        variant: "destructive",
      });
    }
  });

  // Update task mutation
  const updateTask = useMutation({
    mutationFn: ({ 
      taskId, 
      taskData 
    }: { 
      taskId: number; 
      taskData: Partial<ScheduledTask>;
    }) => apiRequest('PUT', `/api/tasks/${taskId}`, taskData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard'] });
      toast({
        title: "Task updated",
        description: "Task has been updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update task",
        description: error.message || "An error occurred while updating the task",
        variant: "destructive",
      });
    }
  });

  // Delete task mutation
  const deleteTask = useMutation({
    mutationFn: (taskId: number) => apiRequest('DELETE', `/api/tasks/${taskId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard'] });
      toast({
        title: "Task deleted",
        description: "Task has been deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete task",
        description: error.message || "An error occurred while deleting the task",
        variant: "destructive",
      });
    }
  });

  // Execute task mutation
  const executeTask = useMutation({
    mutationFn: (taskId: number) => apiRequest('POST', `/api/tasks/${taskId}/execute`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      queryClient.invalidateQueries({ queryKey: ['/api/activities'] });
      toast({
        title: "Task execution started",
        description: "Task is now running in the background",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to execute task",
        description: error.message || "An error occurred while executing the task",
        variant: "destructive",
      });
    }
  });

  return {
    tasks,
    isLoading,
    isError,
    error,
    refetch,
    addTask,
    updateTask,
    deleteTask,
    executeTask
  };
}
