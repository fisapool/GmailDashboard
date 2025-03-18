import express, { type Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertGmailAccountSchema, insertScheduledTaskSchema } from "@shared/schema";
import { hashPassword, verifyPassword, isAuthenticated, sessionMiddleware, encrypt, decrypt } from "./auth";
import { getAuthUrl, getTokensFromCode, getUserInfo, encryptTokens, verifyTokens, sendTestEmail } from "./google-oauth";
import { verifyAccountViaSMTP, verifyAllUserAccounts } from "./smtp-verificator";
import { scheduleTask, cancelTask, rescheduleTask, initializeScheduler, executeTask } from "./task-scheduler";
import { z } from "zod";
import { ZodError } from "zod-validation-error";

export async function registerRoutes(app: Express): Promise<Server> {
  // Configure session
  app.use(sessionMiddleware);

  // API routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { username, password, email, name } = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already taken" });
      }
      
      // Hash password
      const hashedPassword = await hashPassword(password);
      
      // Create user
      const user = await storage.createUser({
        username,
        password: hashedPassword,
        email,
        name
      });
      
      // Set session
      req.session.userId = user.id;
      
      // Save session before responding
      req.session.save(err => {
        if (err) {
          console.error("Session save error:", err);
          return res.status(500).json({ message: "Registration failed due to session error" });
        }
        
        res.status(201).json({
          id: user.id,
          username: user.username,
          email: user.email,
          name: user.name
        });
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      res.status(500).json({ message: "Registration failed" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      // Find user
      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ message: "Invalid username or password" });
      }
      
      // Verify password
      const isValid = await verifyPassword(password, user.password);
      if (!isValid) {
        return res.status(401).json({ message: "Invalid username or password" });
      }
      
      // Set session
      req.session.userId = user.id;
      
      // Save session before responding
      req.session.save(err => {
        if (err) {
          console.error("Session save error:", err);
          return res.status(500).json({ message: "Login failed due to session error" });
        }
        
        res.json({
          id: user.id,
          username: user.username,
          email: user.email,
          name: user.name
        });
      });
    } catch (error) {
      res.status(500).json({ message: "Login failed" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/auth/me", isAuthenticated, async (req, res) => {
    try {
      const userId = req.session.userId;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json({
        id: user.id,
        username: user.username,
        email: user.email,
        name: user.name
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Gmail account routes
  app.get("/api/accounts", isAuthenticated, async (req, res) => {
    try {
      const userId = req.session.userId;
      const accounts = await storage.getAccountsByUserId(userId);
      
      // Remove sensitive credentials from response
      const sanitizedAccounts = accounts.map(account => {
        const { credentials, ...rest } = account;
        return rest;
      });
      
      res.json(sanitizedAccounts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch accounts" });
    }
  });

  app.post("/api/accounts", isAuthenticated, async (req, res) => {
    try {
      const userId = req.session.userId;
      
      const { email, name, authType, credentials } = insertGmailAccountSchema.parse(req.body);
      
      // Encrypt credentials
      let encryptedCredentials;
      if (authType === 'oauth') {
        // For OAuth, credentials should be a token object
        encryptedCredentials = encryptTokens(credentials);
      } else {
        // For password, credentials should be a string
        encryptedCredentials = encrypt(credentials);
      }
      
      // Create account
      const account = await storage.createAccount({
        userId,
        email,
        name,
        authType,
        credentials: encryptedCredentials,
        status: 'pending'
      });
      
      // Try to verify the account immediately
      try {
        await verifyAccountViaSMTP(account);
      } catch (e) {
        // Allow account creation even if verification fails
        console.error("Initial verification failed:", e);
      }
      
      // Log the activity
      await storage.createActivityLog({
        userId,
        accountId: account.id,
        type: 'account_added',
        status: 'success',
        message: 'New account added',
        details: { 
          email: account.email,
          name: account.name,
          timestamp: new Date()
        }
      });
      
      // Remove sensitive credentials from response
      const { credentials: _, ...result } = account;
      
      res.status(201).json(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to add account" });
    }
  });

  app.get("/api/accounts/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = req.session.userId;
      const accountId = parseInt(req.params.id);
      
      const account = await storage.getAccount(accountId);
      
      if (!account) {
        return res.status(404).json({ message: "Account not found" });
      }
      
      if (account.userId !== userId) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      // Remove sensitive credentials from response
      const { credentials, ...result } = account;
      
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch account" });
    }
  });

  app.delete("/api/accounts/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = req.session.userId;
      const accountId = parseInt(req.params.id);
      
      const account = await storage.getAccount(accountId);
      
      if (!account) {
        return res.status(404).json({ message: "Account not found" });
      }
      
      if (account.userId !== userId) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      // Delete all associated tasks first
      const tasks = await storage.getTasksByAccountId(accountId);
      for (const task of tasks) {
        await cancelTask(task.id);
        await storage.deleteTask(task.id);
      }
      
      // Delete the account
      await storage.deleteAccount(accountId);
      
      // Log the activity
      await storage.createActivityLog({
        userId,
        type: 'account_deleted',
        status: 'success',
        message: 'Account deleted',
        details: { 
          email: account.email,
          name: account.name,
          timestamp: new Date()
        }
      });
      
      res.json({ message: "Account deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete account" });
    }
  });

  app.post("/api/accounts/:id/verify", isAuthenticated, async (req, res) => {
    try {
      const userId = req.session.userId;
      const accountId = parseInt(req.params.id);
      
      const account = await storage.getAccount(accountId);
      
      if (!account) {
        return res.status(404).json({ message: "Account not found" });
      }
      
      if (account.userId !== userId) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      // Verify account
      const result = await verifyAccountViaSMTP(account);
      
      res.json({
        accountId,
        email: account.email,
        status: result.status,
        message: result.message,
        verified: result.isValid
      });
    } catch (error) {
      res.status(500).json({ message: "Verification failed" });
    }
  });

  app.post("/api/accounts/verify-all", isAuthenticated, async (req, res) => {
    try {
      const userId = req.session.userId;
      
      // Verify all accounts
      const result = await verifyAllUserAccounts(userId);
      
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: "Verification failed" });
    }
  });

  // Google OAuth routes
  app.get("/api/oauth/url", isAuthenticated, (req, res) => {
    try {
      const userId = req.session.userId;
      const state = Buffer.from(JSON.stringify({ userId })).toString('base64');
      const url = getAuthUrl(state);
      res.json({ url });
    } catch (error) {
      res.status(500).json({ message: "Failed to generate OAuth URL" });
    }
  });

  app.get("/api/oauth/callback", async (req, res) => {
    try {
      const { code, state } = req.query;
      
      if (!code || !state) {
        return res.status(400).json({ message: "Missing code or state" });
      }
      
      // Parse state to get user ID
      const { userId } = JSON.parse(Buffer.from(state as string, 'base64').toString());
      
      if (!userId) {
        return res.status(400).json({ message: "Invalid state" });
      }
      
      // Exchange code for tokens
      const tokens = await getTokensFromCode(code as string);
      
      // Get user info from Gmail
      const { email, name } = await getUserInfo(tokens);
      
      // Encrypt tokens
      const encryptedTokens = encryptTokens(tokens);
      
      // Create or update account
      const existingAccounts = await storage.getAccountsByUserId(userId);
      const existingAccount = existingAccounts.find(acc => acc.email === email);
      
      let account;
      if (existingAccount) {
        // Update existing account
        account = await storage.updateAccount(existingAccount.id, {
          authType: 'oauth',
          credentials: encryptedTokens,
          status: 'pending',
          name: existingAccount.name || name
        });
      } else {
        // Create new account
        account = await storage.createAccount({
          userId,
          email,
          name,
          authType: 'oauth',
          credentials: encryptedTokens,
          status: 'pending'
        });
      }
      
      // Try to verify the account immediately
      try {
        await verifyAccountViaSMTP(account);
      } catch (e) {
        // Continue even if verification fails
        console.error("Initial verification failed:", e);
      }
      
      // Log the activity
      await storage.createActivityLog({
        userId,
        accountId: account.id,
        type: 'oauth_completed',
        status: 'success',
        message: 'Google OAuth completed',
        details: { 
          email: account.email,
          name: account.name,
          timestamp: new Date()
        }
      });
      
      // Redirect to frontend
      res.redirect(`/?accountAdded=${encodeURIComponent(email)}`);
    } catch (error) {
      console.error("OAuth callback error:", error);
      res.redirect('/?error=oauth_failed');
    }
  });

  // Scheduled tasks routes
  app.get("/api/tasks", isAuthenticated, async (req, res) => {
    try {
      const userId = req.session.userId;
      const tasks = await storage.getTasksByUserId(userId);
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch tasks" });
    }
  });

  app.post("/api/tasks", isAuthenticated, async (req, res) => {
    try {
      const userId = req.session.userId;
      
      const taskData = insertScheduledTaskSchema.parse(req.body);
      
      // If accountId is specified, verify that the account belongs to the user
      if (taskData.accountId) {
        const account = await storage.getAccount(taskData.accountId);
        if (!account || account.userId !== userId) {
          return res.status(403).json({ message: "Unauthorized to use this account" });
        }
      }
      
      // Create task
      const task = await storage.createTask({
        ...taskData,
        userId
      });
      
      // Schedule the task
      const scheduled = scheduleTask(task);
      
      if (!scheduled) {
        return res.status(500).json({ message: "Failed to schedule task" });
      }
      
      // Log the activity
      await storage.createActivityLog({
        userId,
        accountId: task.accountId,
        type: 'task_scheduled',
        status: 'success',
        message: `Task "${task.taskType}" scheduled`,
        details: { 
          taskId: task.id,
          taskType: task.taskType,
          scheduleType: task.scheduleType,
          timestamp: new Date()
        }
      });
      
      res.status(201).json(task);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create task" });
    }
  });

  app.get("/api/tasks/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = req.session.userId;
      const taskId = parseInt(req.params.id);
      
      const task = await storage.getTask(taskId);
      
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      if (task.userId !== userId) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      res.json(task);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch task" });
    }
  });

  app.put("/api/tasks/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = req.session.userId;
      const taskId = parseInt(req.params.id);
      
      const task = await storage.getTask(taskId);
      
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      if (task.userId !== userId) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      // Update task
      const updatedTask = await storage.updateTask(taskId, req.body);
      
      // Reschedule task
      await rescheduleTask(taskId);
      
      res.json(updatedTask);
    } catch (error) {
      res.status(500).json({ message: "Failed to update task" });
    }
  });

  app.delete("/api/tasks/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = req.session.userId;
      const taskId = parseInt(req.params.id);
      
      const task = await storage.getTask(taskId);
      
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      if (task.userId !== userId) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      // Cancel the scheduled job
      cancelTask(taskId);
      
      // Delete the task
      await storage.deleteTask(taskId);
      
      // Log the activity
      await storage.createActivityLog({
        userId,
        accountId: task.accountId,
        type: 'task_deleted',
        status: 'success',
        message: `Task "${task.taskType}" deleted`,
        details: { 
          taskId: task.id,
          taskType: task.taskType,
          timestamp: new Date()
        }
      });
      
      res.json({ message: "Task deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete task" });
    }
  });

  app.post("/api/tasks/:id/execute", isAuthenticated, async (req, res) => {
    try {
      const userId = req.session.userId;
      const taskId = parseInt(req.params.id);
      
      const task = await storage.getTask(taskId);
      
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      if (task.userId !== userId) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      // Execute task manually
      executeTask(task);
      
      res.json({ message: "Task execution started" });
    } catch (error) {
      res.status(500).json({ message: "Failed to execute task" });
    }
  });

  // Activity logs routes
  app.get("/api/activities", isAuthenticated, async (req, res) => {
    try {
      const userId = req.session.userId;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      
      const activities = await storage.getActivityLogsByUserId(userId, limit);
      res.json(activities);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch activities" });
    }
  });

  app.get("/api/accounts/:id/activities", isAuthenticated, async (req, res) => {
    try {
      const userId = req.session.userId;
      const accountId = parseInt(req.params.id);
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      
      const account = await storage.getAccount(accountId);
      
      if (!account) {
        return res.status(404).json({ message: "Account not found" });
      }
      
      if (account.userId !== userId) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      const activities = await storage.getActivityLogsByAccountId(accountId, limit);
      res.json(activities);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch activities" });
    }
  });

  // Dashboard statistics
  app.get("/api/dashboard", isAuthenticated, async (req, res) => {
    try {
      const userId = req.session.userId;
      
      // Get all accounts
      const accounts = await storage.getAccountsByUserId(userId);
      
      // Get all tasks
      const tasks = await storage.getTasksByUserId(userId);
      
      // Get recent activities
      const activities = await storage.getActivityLogsByUserId(userId, 10);
      
      // Calculate statistics
      const stats = {
        totalAccounts: accounts.length,
        activeAccounts: accounts.filter(acc => acc.status === 'active').length,
        warningAccounts: accounts.filter(acc => acc.status === 'warning').length,
        errorAccounts: accounts.filter(acc => acc.status === 'error').length,
        pendingAccounts: accounts.filter(acc => acc.status === 'pending').length,
        scheduledTasks: tasks.length,
        recentActivities: activities
      };
      
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch dashboard data" });
    }
  });

  // Initialize scheduler
  initializeScheduler();
  
  const httpServer = createServer(app);
  return httpServer;
}
