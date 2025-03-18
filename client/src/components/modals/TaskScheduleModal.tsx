import { useState, useEffect } from "react";
import { useAccounts } from "@/hooks/useAccounts";
import { useTasks } from "@/hooks/useTasks";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { format } from "date-fns";

interface TaskScheduleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Form schema
const taskSchema = z.object({
  taskType: z.enum(["sendEmail", "checkInbox", "verifyStatus", "cleanUp"]),
  accountId: z.string(),
  scheduleType: z.enum(["once", "daily", "weekly", "monthly"]),
  scheduleDate: z.string().optional(),
  scheduleTime: z.string().optional(),
  dayOfMonth: z.string().optional(),
  days: z.array(z.string()).optional(),
});

const daysOfWeek = [
  { value: "sun", label: "Sunday" },
  { value: "mon", label: "Monday" },
  { value: "tue", label: "Tuesday" },
  { value: "wed", label: "Wednesday" },
  { value: "thu", label: "Thursday" },
  { value: "fri", label: "Friday" },
  { value: "sat", label: "Saturday" },
];

export default function TaskScheduleModal({ open, onOpenChange }: TaskScheduleModalProps) {
  const { accounts } = useAccounts();
  const { addTask } = useTasks();
  const [isLoading, setIsLoading] = useState(false);
  
  // Form
  const form = useForm<z.infer<typeof taskSchema>>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      taskType: "verifyStatus",
      accountId: "all",
      scheduleType: "once",
      scheduleDate: format(new Date(), "yyyy-MM-dd"),
      scheduleTime: "12:00",
      days: [],
    },
  });
  
  // Watch scheduleType to show/hide relevant fields
  const scheduleType = form.watch("scheduleType");
  
  // Reset form when dialog opens/closes
  useEffect(() => {
    if (!open) {
      form.reset({
        taskType: "verifyStatus",
        accountId: "all",
        scheduleType: "once",
        scheduleDate: format(new Date(), "yyyy-MM-dd"),
        scheduleTime: "12:00",
        days: [],
      });
    }
  }, [open, form]);
  
  // Handle form submission
  const onSubmit = async (values: z.infer<typeof taskSchema>) => {
    try {
      setIsLoading(true);
      
      // Prepare schedule config based on schedule type
      let scheduleConfig: any = {};
      let nextRun: Date | undefined;
      
      if (values.scheduleType === "once") {
        if (!values.scheduleDate || !values.scheduleTime) {
          return;
        }
        
        scheduleConfig = {
          date: values.scheduleDate,
          time: values.scheduleTime,
        };
        
        // Set next run date
        const [year, month, day] = values.scheduleDate.split("-").map(Number);
        const [hour, minute] = values.scheduleTime.split(":").map(Number);
        nextRun = new Date(year, month - 1, day, hour, minute);
      } else if (values.scheduleType === "daily") {
        scheduleConfig = {
          time: values.scheduleTime,
        };
      } else if (values.scheduleType === "weekly") {
        if (!values.days || values.days.length === 0) {
          form.setError("days", {
            type: "manual",
            message: "Please select at least one day",
          });
          return;
        }
        
        scheduleConfig = {
          time: values.scheduleTime,
          days: values.days,
        };
      } else if (values.scheduleType === "monthly") {
        if (!values.dayOfMonth) {
          return;
        }
        
        scheduleConfig = {
          time: values.scheduleTime,
          dayOfMonth: values.dayOfMonth,
        };
      }
      
      // Prepare task data
      const taskData = {
        taskType: values.taskType,
        accountId: values.accountId === "all" ? undefined : parseInt(values.accountId),
        scheduleType: values.scheduleType,
        scheduleConfig,
        nextRun,
      };
      
      // Create task
      await addTask.mutateAsync(taskData);
      
      // Close modal
      onOpenChange(false);
    } catch (error) {
      console.error("Error scheduling task:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Schedule Task</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="taskType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Task Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a task type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="verifyStatus">Verify Account Status</SelectItem>
                      <SelectItem value="sendEmail">Send Email</SelectItem>
                      <SelectItem value="checkInbox">Check Inbox</SelectItem>
                      <SelectItem value="cleanUp">Clean Up Inbox</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="accountId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Select Account</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an account" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="all">All Active Accounts</SelectItem>
                      {accounts.map((account) => (
                        <SelectItem key={account.id} value={account.id.toString()}>
                          {account.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="scheduleType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Schedule Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select schedule type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="once">Run Once</SelectItem>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {scheduleType === "once" && (
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="scheduleDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="scheduleTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Time</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}
            
            {scheduleType !== "once" && (
              <FormField
                control={form.control}
                name="scheduleTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Time</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            
            {scheduleType === "weekly" && (
              <FormField
                control={form.control}
                name="days"
                render={() => (
                  <FormItem>
                    <div className="mb-4">
                      <FormLabel className="text-base">Days of Week</FormLabel>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {daysOfWeek.map((day) => (
                        <FormField
                          key={day.value}
                          control={form.control}
                          name="days"
                          render={({ field }) => {
                            return (
                              <div className="flex items-center space-x-2">
                                <Checkbox
                                  checked={field.value?.includes(day.value)}
                                  onCheckedChange={(checked) => {
                                    return checked
                                      ? field.onChange([...field.value || [], day.value])
                                      : field.onChange(
                                          field.value?.filter(
                                            (value) => value !== day.value
                                          )
                                        );
                                  }}
                                  id={`day-${day.value}`}
                                />
                                <label
                                  htmlFor={`day-${day.value}`}
                                  className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                  {day.label.substring(0, 3)}
                                </label>
                              </div>
                            );
                          }}
                        />
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            
            {scheduleType === "monthly" && (
              <FormField
                control={form.control}
                name="dayOfMonth"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Day of Month</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select day of month" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Array.from({ length: 31 }, (_, i) => (
                          <SelectItem key={i + 1} value={(i + 1).toString()}>
                            {i + 1}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            
            <DialogFooter className="pt-4">
              <DialogClose asChild>
                <Button type="button" variant="outline">Cancel</Button>
              </DialogClose>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Scheduling..." : "Schedule Task"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
