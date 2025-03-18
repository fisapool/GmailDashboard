import { google } from 'googleapis';
import { encrypt, decrypt } from './auth';

// Set up OAuth2 client
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID || '',
  process.env.GOOGLE_CLIENT_SECRET || '',
  process.env.GOOGLE_REDIRECT_URI || 'https://' + process.env.REPL_SLUG + '.' + process.env.REPL_OWNER + '.repl.co/api/oauth/callback'
);

// Generate authorization URL
export function getAuthUrl(state?: string): string {
  const scopes = [
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/gmail.send',
    'https://www.googleapis.com/auth/gmail.compose',
    'https://www.googleapis.com/auth/gmail.modify'
  ];

  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent',
    state
  });
}

// Exchange code for tokens
export async function getTokensFromCode(code: string): Promise<any> {
  const { tokens } = await oauth2Client.getToken(code);
  return tokens;
}

// Get user info
export async function getUserInfo(tokens: any): Promise<{ email: string, name?: string }> {
  oauth2Client.setCredentials(tokens);
  const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
  
  // Get user profile
  const profile = await gmail.users.getProfile({ userId: 'me' });
  
  return {
    email: profile.data.emailAddress || '',
    name: profile.data.emailAddress ? profile.data.emailAddress.split('@')[0] : undefined
  };
}

// Verify token is valid
export async function verifyTokens(tokens: any): Promise<boolean> {
  try {
    oauth2Client.setCredentials(tokens);
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
    await gmail.users.getProfile({ userId: 'me' });
    return true;
  } catch (error) {
    return false;
  }
}

// Refresh tokens if needed
export async function refreshTokens(tokens: any): Promise<any> {
  if (!tokens.refresh_token) {
    throw new Error('No refresh token available');
  }

  oauth2Client.setCredentials({
    refresh_token: tokens.refresh_token
  });

  try {
    const { credentials } = await oauth2Client.refreshAccessToken();
    return {
      ...tokens,
      access_token: credentials.access_token,
      expiry_date: credentials.expiry_date
    };
  } catch (error) {
    throw new Error('Failed to refresh token');
  }
}

// Encrypt tokens for storage
export function encryptTokens(tokens: any): string {
  return encrypt(JSON.stringify(tokens));
}

// Decrypt tokens from storage
export function decryptTokens(encryptedTokens: string): any {
  return JSON.parse(decrypt(encryptedTokens));
}

// Send a test email to verify account
export async function sendTestEmail(tokens: any, to: string): Promise<boolean> {
  try {
    oauth2Client.setCredentials(tokens);
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
    
    const subject = 'Gmail Account Verification';
    const message = 'This is a test email to verify your Gmail account is working properly.';
    
    // Create the email
    const email = [
      'From: me',
      `To: ${to}`,
      'Content-Type: text/plain; charset=utf-8',
      'MIME-Version: 1.0',
      `Subject: ${subject}`,
      '',
      message
    ].join('\r\n');
    
    // Encode the email
    const encodedEmail = Buffer.from(email).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    
    // Send the email
    await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedEmail
      }
    });
    
    return true;
  } catch (error) {
    console.error('Error sending test email:', error);
    return false;
  }
}
