
import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { storage } from './storage';

interface BulkCredentialConfig {
  projectId: string;
  clientName: string;
  redirectUris: string[];
  count: number;
}

export class BulkOAuthManager {
  private oauth2Client: OAuth2Client;

  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );
  }

  async createBulkCredentials(config: BulkCredentialConfig) {
    const credentials = [];
    
    for (let i = 0; i < config.count; i++) {
      try {
        const credential = await this.createSingleCredential({
          ...config,
          clientName: `${config.clientName}-${i + 1}`
        });
        credentials.push(credential);
      } catch (error) {
        console.error(`Failed to create credential ${i + 1}:`, error);
      }
    }

    return credentials;
  }

  private async createSingleCredential(config: Omit<BulkCredentialConfig, 'count'>) {
    const iam = google.iam('v1');
    
    const request = {
      parent: `projects/${config.projectId}`,
      body: {
        oauth2ClientId: {
          clientId: config.clientName,
          redirectUris: config.redirectUris
        }
      }
    };

    const response = await iam.projects.serviceAccounts.create(request);
    return response.data;
  }

  async verifyCredentials(credentials: any[]) {
    const results = [];
    
    for (const cred of credentials) {
      try {
        this.oauth2Client.setCredentials(cred);
        await this.oauth2Client.getAccessToken();
        results.push({ id: cred.clientId, status: 'valid' });
      } catch (error) {
        results.push({ id: cred.clientId, status: 'invalid', error });
      }
    }

    return results;
  }
}
