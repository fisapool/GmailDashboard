import { useState } from "react";
import { useTasks } from "@/hooks/useTasks";
import { useAccounts } from "@/hooks/useAccounts";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  PlusCircle, 
  Play, 
  Trash2, 
  Edit,
  Mail, 
  CheckCircle, 
  Clock, 
  Inbox, 
  Trash,
  CalendarClock,
  Calendar,
  CalendarDays,
  CalendarRange,
  AlertCircle
} from "lucide-react";
import TaskScheduleModal from "@/components/modals/TaskScheduleModal";
import { format } from "date-fns";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { ScheduledTask } from "@shared/schema";

export default function Tasks() {
  const { tasks, isLoading, executeTask, deleteTask } = useTasks();
  const { accounts } = useAccounts();
  const [isScheduleTaskOpen, setIsScheduleTaskOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<number | null>(null);
  const [filters, setFilters] = useState({
    taskType: "all",
    accountId: "all",
    status: "all",
    search: "",
  });
  
  // Get account name by ID
  const getAccountName = (accountId: number | null) => {
    if (!accountId) return "All Accounts";
    const account = accounts.find(acc => acc.id === accountId);
    return account ? account.email : `Account #${accountId}`;
  };
  
  // Get task type icon
  const getTaskTypeIcon = (type: string) => {
    switch (type) {
      case "sendEmail":
        return <Mail className="h-4 w-4 mr-2" />;
      case "checkInbox":
        return <Inbox className="h-4 w-4 mr-2" />;
      case "verifyStatus":
        return <CheckCircle className="h-4 w-4 mr-2" />;
      case "cleanUp":
        return <Trash className="h-4 w-4 mr-2" />;
      default:
        return <Clock className="h-4 w-4 mr-2" />;
    }
  };
  
  // Get schedule type icon
  const getScheduleTypeIcon = (type: string) => {
    switch (type) {
      case "once":
        return <Calendar className="h-4 w-4 mr-2" />;
      case "daily":
        return <CalendarClock className="h-4 w-4 mr-2" />;
      case "weekly":
        return <CalendarDays className="h-4 w-4 mr-2" />;
      case "monthly":
        return <CalendarRange className="h-4 w-4 mr-2" />;
      default:
        return <Calendar className="h-4 w-4 mr-2" />;
    }
  };
  
  // Handle execute task
  const handleExecuteTask = async (taskId: number) => {
    try {
      await executeTask.mutateAsync(taskId);
    } catch (error) {
      console.error("Error executing task:", error);
    }
  };
  
  // Handle delete task
  const handleDeleteTask = async (taskId: number) => {
    try {
      await deleteTask.mutateAsync(taskId);
      setTaskToDelete(null);
    } catch (error) {
      console.error("Error deleting task:", error);
    }
  };
  
  // Filter tasks based on current filters
  const filteredTasks = tasks.filter(task => {
    if (filters.taskType !== "all" && task.taskType !== filters.taskType) {
      return false;
    }
    
    if (filters.accountId !== "all") {
      const accountId = parseInt(filters.accountId);
      if (task.accountId !== accountId && task.accountId !== null) {
        return false;
      }
    }
    
    if (filters.status !== "all" && task.status !== filters.status) {
      return false;
    }
    
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const accountName = getAccountName(task.accountId).toLowerCase();
      const taskType = task.taskType.toLowerCase();
      return accountName.includes(searchLower) || taskType.includes(searchLower);
    }
    
    return true;
  });
  
  // Format schedule configuration
  const formatScheduleConfig = (task: ScheduledTask) => {
    const config = task.scheduleConfig as any;
    
    if (task.scheduleType === "once") {
      if (config.date && config.time) {
        return `${config.date} at ${config.time}`;
      }
      return "One time";
    } else if (task.scheduleType === "daily") {
      return `Daily at ${config.time || '00:00'}`;
    } else if (task.scheduleType === "weekly") {
      const days = config.days?.join(", ") || '';
      return `Weekly on ${days} at ${config.time || '00:00'}`;
    } else if (task.scheduleType === "monthly") {
      return `Monthly on day ${config.dayOfMonth || '1'} at ${config.time || '00:00'}`;
    }
    
    return "Custom schedule";
  };
  
  // Task status badge
  const TaskStatusBadge = ({ status }: { status: string }) => {
    if (status === "completed") {
      return <Badge variant="outline" className="bg-green-50 text-green-500">Completed</Badge>;
    } else if (status === "error") {
      return <Badge variant="outline" className="bg-red-50 text-red-500">Error</Badge>;
    } else if (status === "running") {
      return <Badge variant="outline" className="bg-blue-50 text-blue-500">Running</Badge>;
    } else {
      return <Badge variant="outline" className="bg-gray-50 text-gray-500">Pending</Badge>;
    }
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-2xl font-medium text-gray-800">Scheduled Tasks</h1>
          <p className="text-gray-600">Schedule automated activities for your Gmail accounts</p>
        </div>
        <Button 
          onClick={() => setIsScheduleTaskOpen(true)} 
          className="mt-4 md:mt-0"
        >
          <PlusCircle className="h-4 w-4 mr-2" />
          Schedule Task
        </Button>
      </div>
      
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search tasks..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              />
            </div>
            <div className="flex gap-4">
              <Select
                value={filters.taskType}
                onValueChange={(value) => setFilters({ ...filters, taskType: value })}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Task Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Task Types</SelectItem>
                  <SelectItem value="verifyStatus">Verify Status</SelectItem>
                  <SelectItem value="sendEmail">Send Email</SelectItem>
                  <SelectItem value="checkInbox">Check Inbox</SelectItem>
                  <SelectItem value="cleanUp">Clean Up</SelectItem>
                </SelectContent>
              </Select>
              
              <Select
                value={filters.accountId}
                onValueChange={(value) => setFilters({ ...filters, accountId: value })}
              >
                <SelectTrigger className="w-[180px]">
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
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="running">Running</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {isLoading ? (
        <Card>
          <CardContent className="p-0">
            <div className="p-6">
              <Skeleton className="h-10 w-full mb-4" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full mt-4" />
              <Skeleton className="h-20 w-full mt-4" />
            </div>
          </CardContent>
        </Card>
      ) : filteredTasks.length === 0 ? (
        <Card className="text-center p-8">
          <CardContent className="pt-6">
            <Clock className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium">No Scheduled Tasks</h3>
            <p className="text-gray-500 mt-2">
              {tasks.length === 0 
                ? "You haven't scheduled any tasks yet. Schedule a task to automate your Gmail accounts."
                : "No tasks match your current filters."}
            </p>
            {tasks.length === 0 && (
              <Button 
                onClick={() => setIsScheduleTaskOpen(true)} 
                className="mt-6"
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                Schedule a Task
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Task Type</TableHead>
                  <TableHead>Account</TableHead>
                  <TableHead>Schedule</TableHead>
                  <TableHead>Next Run</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTasks.map((task) => (
                  <TableRow key={task.id}>
                    <TableCell>
                      <div className="flex items-center">
                        {getTaskTypeIcon(task.taskType)}
                        <span className="capitalize">{task.taskType.replace(/([A-Z])/g, ' $1').trim()}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getAccountName(task.accountId)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        {getScheduleTypeIcon(task.scheduleType)}
                        <span>{formatScheduleConfig(task)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {task.nextRun ? format(new Date(task.nextRun), 'MMM d, h:mm a') : 'Not scheduled'}
                    </TableCell>
                    <TableCell>
                      <TaskStatusBadge status={task.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleExecuteTask(task.id)}
                          disabled={executeTask.isPending}
                          title="Run Now"
                        >
                          <Play className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="destructive"
                          onClick={() => setTaskToDelete(task.id)}
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
      
      <TaskScheduleModal 
        open={isScheduleTaskOpen} 
        onOpenChange={setIsScheduleTaskOpen} 
      />
      
      <AlertDialog 
        open={taskToDelete !== null} 
        onOpenChange={(open) => !open && setTaskToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this scheduled task. 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              className="bg-destructive text-destructive-foreground"
              onClick={() => taskToDelete && handleDeleteTask(taskToDelete)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
