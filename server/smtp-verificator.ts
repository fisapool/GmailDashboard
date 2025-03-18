import nodemailer from 'nodemailer';
import { decrypt } from './auth';
import { storage } from './storage';
import { GmailAccount } from '@shared/schema';

// Verify Gmail account via SMTP
export async function verifyAccountViaSMTP(account: GmailAccount): Promise<{
  isValid: boolean;
  status: 'active' | 'error' | 'warning';
  message: string;
}> {
  try {
    const credentials = account.credentials as any;
    
    let auth;
    if (account.authType === 'oauth') {
      // For OAuth authentication
      const tokens = JSON.parse(decrypt(credentials));
      auth = {
        type: 'OAuth2',
        user: account.email,
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token
      };
    } else {
      // For App Password authentication
      auth = {
        user: account.email,
        pass: decrypt(credentials)
      };
    }

    // Create a transporter
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth
    });

    // Verify the connection
    await transporter.verify();
    
    // Update account status in storage
    await storage.updateAccount(account.id, { 
      status: 'active',
      lastCheck: new Date() 
    });
    
    // Add activity log
    await storage.createActivityLog({
      userId: account.userId,
      accountId: account.id,
      type: 'verification',
      status: 'success',
      message: 'SMTP verification completed',
      details: { verified: true, timestamp: new Date() }
    });

    return {
      isValid: true,
      status: 'active',
      message: 'SMTP verification successful'
    };
  } catch (error) {
    console.error('SMTP verification error:', error);
    
    // Determine error type and set appropriate status
    let status: 'error' | 'warning' = 'error';
    let message = 'Authentication failed';
    
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    if (errorMessage.includes('quota') || errorMessage.includes('rate')) {
      status = 'warning';
      message = 'Rate limit or quota exceeded';
    }
    
    // Update account status in storage
    await storage.updateAccount(account.id, { 
      status,
      lastCheck: new Date() 
    });
    
    // Add activity log
    await storage.createActivityLog({
      userId: account.userId,
      accountId: account.id,
      type: 'verification',
      status: 'error',
      message,
      details: { 
        verified: false, 
        error: errorMessage,
        timestamp: new Date() 
      }
    });

    return {
      isValid: false,
      status,
      message
    };
  }
}

// Batch verify all accounts for a user
export async function verifyAllUserAccounts(userId: number): Promise<{
  totalCount: number;
  successCount: number;
  results: Array<{
    accountId: number;
    email: string;
    status: 'active' | 'error' | 'warning';
    message: string;
  }>;
}> {
  const accounts = await storage.getAccountsByUserId(userId);
  const results = [];
  let successCount = 0;
  
  for (const account of accounts) {
    const result = await verifyAccountViaSMTP(account);
    
    if (result.isValid) {
      successCount++;
    }
    
    results.push({
      accountId: account.id,
      email: account.email,
      status: result.status,
      message: result.message
    });
  }
  
  return {
    totalCount: accounts.length,
    successCount,
    results
  };
}
