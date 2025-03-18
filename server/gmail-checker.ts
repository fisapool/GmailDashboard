
import * as dns from 'dns';
import * as net from 'net';
import * as nodemailer from 'nodemailer';
import { promisify } from 'util';

const resolveMx = promisify(dns.resolveMx);

export async function checkGmailStatus(email: string, testEmail: string): Promise<'healthy' | 'locked' | 'unknown'> {
  try {
    const domain = email.split('@')[1];
    const records = await resolveMx(domain);
    
    if (!records || records.length === 0) {
      return 'unknown';
    }

    const mxRecord = records[0].exchange;
    
    // Create a test connection
    const transporter = nodemailer.createTransport({
      host: mxRecord,
      port: 25,
      secure: false,
      tls: {
        rejectUnauthorized: false
      }
    });

    try {
      await transporter.verify();
      return 'healthy';
    } catch (error) {
      return 'locked';
    }
  } catch (error) {
    console.error(`Error checking email ${email}:`, error);
    return 'unknown';
  }
}

export async function verifyAllAccounts(accounts: Array<{ email: string }>) {
  const results: Record<string, string> = {};
  
  for (const account of accounts) {
    const status = await checkGmailStatus(account.email, 'test@example.com');
    results[account.email] = status;
  }
  
  return results;
}
