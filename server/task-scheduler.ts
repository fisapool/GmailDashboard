import schedule from 'node-schedule';
import { storage } from './storage';
import { ScheduledTask } from '@shared/schema';
import { verifyAccountViaSMTP } from './smtp-verificator';
import { decrypt } from './auth';
import { google } from 'googleapis';

// Store active jobs
const activeJobs = new Map<number, schedule.Job>();

// Initialize the scheduler
export async function initializeScheduler() {
  // Get all tasks
  const tasks = Array.from((storage as any).scheduledTasks.values());
  
  // Schedule each task
  for (const task of tasks) {
    scheduleTask(task);
  }
  
  console.log(`Initialized scheduler with ${tasks.length} tasks`);
}

// Schedule a task
export function scheduleTask(task: ScheduledTask): boolean {
  try {
    // Calculate next run time
    const nextRun = calculateNextRun(task);
    
    if (!nextRun) {
      console.error(`Could not calculate next run for task ${task.id}`);
      return false;
    }
    
    // Update task with next run time
    storage.updateTask(task.id, { nextRun });
    
    // Create the job
    const job = schedule.scheduleJob(nextRun, async function() {
      // Execute the task
      await executeTask(task);
      
      // If recurring, schedule next run
      if (task.scheduleType !== 'once') {
        const updatedTask = await storage.getTask(task.id);
        if (updatedTask) {
          scheduleTask(updatedTask);
        }
      }
    });
    
    // Store the job reference
    activeJobs.set(task.id, job);
    
    return true;
  } catch (error) {
    console.error(`Error scheduling task ${task.id}:`, error);
    return false;
  }
}

// Execute a task
export async function executeTask(task: ScheduledTask) {
  try {
    // Update task status to running
    await storage.updateTask(task.id, { 
      status: 'running',
      lastRun: new Date()
    });
    
    // Get accounts to run the task on
    let accounts = [];
    if (task.accountId) {
      const account = await storage.getAccount(task.accountId);
      if (account) accounts = [account];
    } else {
      accounts = await storage.getAccountsByUserId(task.userId);
    }
    
    // Execute task for each account
    for (const account of accounts) {
      try {
        let success = false;
        let message = '';
        
        switch (task.taskType) {
          case 'verifyStatus':
            const result = await verifyAccountViaSMTP(account);
            success = result.isValid;
            message = result.message;
            break;
            
          case 'sendEmail':
            // Implementation depends on the specific requirements
            // This is a placeholder
            message = 'Email sending not implemented yet';
            break;
            
          case 'checkInbox':
            // Implementation depends on the specific requirements
            // This is a placeholder
            message = 'Inbox checking not implemented yet';
            break;
            
          case 'cleanUp':
            // Implementation depends on the specific requirements
            // This is a placeholder
            message = 'Cleanup not implemented yet';
            break;
            
          default:
            message = `Unknown task type: ${task.taskType}`;
            break;
        }
        
        // Log activity
        await storage.createActivityLog({
          userId: task.userId,
          accountId: account.id,
          type: `task_${task.taskType}`,
          status: success ? 'success' : 'error',
          message,
          details: {
            taskId: task.id,
            timestamp: new Date()
          }
        });
        
      } catch (error) {
        // Log error
        await storage.createActivityLog({
          userId: task.userId,
          accountId: account.id,
          type: `task_${task.taskType}`,
          status: 'error',
          message: 'Task execution failed',
          details: {
            taskId: task.id,
            error: error instanceof Error ? error.message : String(error),
            timestamp: new Date()
          }
        });
      }
    }
    
    // Update task status to completed
    await storage.updateTask(task.id, { status: 'completed' });
    
  } catch (error) {
    console.error(`Error executing task ${task.id}:`, error);
    
    // Update task status to error
    await storage.updateTask(task.id, { 
      status: 'error',
      lastRun: new Date()
    });
  }
}

// Calculate next run time based on schedule configuration
function calculateNextRun(task: ScheduledTask): Date | null {
  const config = task.scheduleConfig as any;
  
  switch (task.scheduleType) {
    case 'once':
      // For one-time tasks, use the specified date and time
      if (config.date && config.time) {
        const [year, month, day] = config.date.split('-').map(Number);
        const [hour, minute] = config.time.split(':').map(Number);
        return new Date(year, month - 1, day, hour, minute);
      }
      return null;
      
    case 'daily':
      // For daily tasks, use the specified time for the next day
      if (config.time) {
        const [hour, minute] = config.time.split(':').map(Number);
        const date = new Date();
        date.setDate(date.getDate() + 1);
        date.setHours(hour, minute, 0, 0);
        return date;
      }
      return null;
      
    case 'weekly':
      // For weekly tasks, find the next occurrence of the specified day(s)
      if (config.days && config.days.length > 0 && config.time) {
        const [hour, minute] = config.time.split(':').map(Number);
        const date = new Date();
        const currentDay = date.getDay(); // 0 = Sunday, 1 = Monday, ...
        
        // Convert day names to numbers
        const dayMap: Record<string, number> = { 
          sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6 
        };
        const scheduledDays = config.days.map((day: string) => dayMap[day]);
        
        // Find the next day that is scheduled
        let daysToAdd = 7;
        for (const day of scheduledDays) {
          const diff = (day - currentDay + 7) % 7;
          if (diff > 0 && diff < daysToAdd) {
            daysToAdd = diff;
          }
        }
        
        date.setDate(date.getDate() + daysToAdd);
        date.setHours(hour, minute, 0, 0);
        return date;
      }
      return null;
      
    case 'monthly':
      // For monthly tasks, use the specified day of month and time
      if (config.dayOfMonth && config.time) {
        const [hour, minute] = config.time.split(':').map(Number);
        const date = new Date();
        date.setMonth(date.getMonth() + 1);
        date.setDate(Math.min(parseInt(config.dayOfMonth), getDaysInMonth(date.getFullYear(), date.getMonth())));
        date.setHours(hour, minute, 0, 0);
        return date;
      }
      return null;
      
    default:
      return null;
  }
}

// Helper function to get days in a month
function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

// Cancel a scheduled task
export function cancelTask(taskId: number): boolean {
  const job = activeJobs.get(taskId);
  if (job) {
    job.cancel();
    activeJobs.delete(taskId);
    return true;
  }
  return false;
}

// Reschedule a task (after it's been updated)
export async function rescheduleTask(taskId: number): Promise<boolean> {
  // Cancel existing job
  cancelTask(taskId);
  
  // Get updated task
  const task = await storage.getTask(taskId);
  if (!task) return false;
  
  // Schedule new job
  return scheduleTask(task);
}
