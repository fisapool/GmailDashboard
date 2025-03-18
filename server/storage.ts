import { 
  users, type User, type InsertUser,
  gmailAccounts, type GmailAccount, type InsertGmailAccount,
  scheduledTasks, type ScheduledTask, type InsertScheduledTask,
  activityLogs, type ActivityLog, type InsertActivityLog
} from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Gmail account operations
  getAccount(id: number): Promise<GmailAccount | undefined>;
  getAccountsByUserId(userId: number): Promise<GmailAccount[]>;
  createAccount(account: InsertGmailAccount & { userId: number }): Promise<GmailAccount>;
  updateAccount(id: number, data: Partial<GmailAccount>): Promise<GmailAccount | undefined>;
  deleteAccount(id: number): Promise<boolean>;
  
  // Scheduled task operations
  getTask(id: number): Promise<ScheduledTask | undefined>;
  getTasksByUserId(userId: number): Promise<ScheduledTask[]>;
  getTasksByAccountId(accountId: number): Promise<ScheduledTask[]>;
  createTask(task: InsertScheduledTask & { userId: number }): Promise<ScheduledTask>;
  updateTask(id: number, data: Partial<ScheduledTask>): Promise<ScheduledTask | undefined>;
  deleteTask(id: number): Promise<boolean>;
  
  // Activity log operations
  getActivityLog(id: number): Promise<ActivityLog | undefined>;
  getActivityLogsByUserId(userId: number, limit?: number): Promise<ActivityLog[]>;
  getActivityLogsByAccountId(accountId: number, limit?: number): Promise<ActivityLog[]>;
  createActivityLog(log: InsertActivityLog): Promise<ActivityLog>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private gmailAccounts: Map<number, GmailAccount>;
  private scheduledTasks: Map<number, ScheduledTask>;
  private activityLogs: Map<number, ActivityLog>;
  
  private userIdCounter: number;
  private accountIdCounter: number;
  private taskIdCounter: number;
  private logIdCounter: number;

  constructor() {
    this.users = new Map();
    this.gmailAccounts = new Map();
    this.scheduledTasks = new Map();
    this.activityLogs = new Map();
    
    this.userIdCounter = 1;
    this.accountIdCounter = 1;
    this.taskIdCounter = 1;
    this.logIdCounter = 1;
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const now = new Date();
    const user: User = { ...insertUser, id, createdAt: now };
    this.users.set(id, user);
    return user;
  }

  // Gmail account operations
  async getAccount(id: number): Promise<GmailAccount | undefined> {
    return this.gmailAccounts.get(id);
  }

  async getAccountsByUserId(userId: number): Promise<GmailAccount[]> {
    return Array.from(this.gmailAccounts.values()).filter(
      (account) => account.userId === userId,
    );
  }

  async createAccount(account: InsertGmailAccount & { userId: number }): Promise<GmailAccount> {
    const id = this.accountIdCounter++;
    const now = new Date();
    const newAccount: GmailAccount = { 
      ...account, 
      id, 
      lastCheck: null,
      createdAt: now 
    };
    this.gmailAccounts.set(id, newAccount);
    return newAccount;
  }

  async updateAccount(id: number, data: Partial<GmailAccount>): Promise<GmailAccount | undefined> {
    const account = this.gmailAccounts.get(id);
    if (!account) return undefined;
    
    const updatedAccount = { ...account, ...data };
    this.gmailAccounts.set(id, updatedAccount);
    return updatedAccount;
  }

  async deleteAccount(id: number): Promise<boolean> {
    return this.gmailAccounts.delete(id);
  }

  // Scheduled task operations
  async getTask(id: number): Promise<ScheduledTask | undefined> {
    return this.scheduledTasks.get(id);
  }

  async getTasksByUserId(userId: number): Promise<ScheduledTask[]> {
    return Array.from(this.scheduledTasks.values()).filter(
      (task) => task.userId === userId,
    );
  }

  async getTasksByAccountId(accountId: number): Promise<ScheduledTask[]> {
    return Array.from(this.scheduledTasks.values()).filter(
      (task) => task.accountId === accountId,
    );
  }

  async createTask(task: InsertScheduledTask & { userId: number }): Promise<ScheduledTask> {
    const id = this.taskIdCounter++;
    const now = new Date();
    const newTask: ScheduledTask = { 
      ...task, 
      id, 
      lastRun: null,
      status: "pending",
      createdAt: now 
    };
    this.scheduledTasks.set(id, newTask);
    return newTask;
  }

  async updateTask(id: number, data: Partial<ScheduledTask>): Promise<ScheduledTask | undefined> {
    const task = this.scheduledTasks.get(id);
    if (!task) return undefined;
    
    const updatedTask = { ...task, ...data };
    this.scheduledTasks.set(id, updatedTask);
    return updatedTask;
  }

  async deleteTask(id: number): Promise<boolean> {
    return this.scheduledTasks.delete(id);
  }

  // Activity log operations
  async getActivityLog(id: number): Promise<ActivityLog | undefined> {
    return this.activityLogs.get(id);
  }

  async getActivityLogsByUserId(userId: number, limit?: number): Promise<ActivityLog[]> {
    const logs = Array.from(this.activityLogs.values())
      .filter((log) => log.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    
    return limit ? logs.slice(0, limit) : logs;
  }

  async getActivityLogsByAccountId(accountId: number, limit?: number): Promise<ActivityLog[]> {
    const logs = Array.from(this.activityLogs.values())
      .filter((log) => log.accountId === accountId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    
    return limit ? logs.slice(0, limit) : logs;
  }

  async createActivityLog(log: InsertActivityLog): Promise<ActivityLog> {
    const id = this.logIdCounter++;
    const now = new Date();
    const newLog: ActivityLog = { ...log, id, createdAt: now };
    this.activityLogs.set(id, newLog);
    return newLog;
  }
}

export const storage = new MemStorage();
