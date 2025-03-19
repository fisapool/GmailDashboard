
import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';

async function setupGoogleProject() {
  // This requires manual authentication first time
  const auth = new google.auth.GoogleAuth({
    scopes: ['https://www.googleapis.com/auth/cloud-platform']
  });

  const cloudresourcemanager = google.cloudresourcemanager('v1');
  const servicemanagement = google.servicemanagement('v1');

  try {
    // Create a new project
    const projectResponse = await cloudresourcemanager.projects.create({
      requestBody: {
        projectId: `gmail-automation-${Date.now()}`,
        name: 'Gmail Automation Project'
      }
    });

    const projectId = projectResponse.data.projectId;
    console.log(`Created project: ${projectId}`);

    // Enable Gmail API
    await servicemanagement.services.enable({
      name: `projects/${projectId}/services/gmail.googleapis.com`
    });
    console.log('Enabled Gmail API');

    // Create OAuth credentials
    const oauth2 = google.oauth2('v2');
    const credential = await oauth2.new({
      web: {
        redirect_uris: [`https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co/api/oauth/callback`],
        javascript_origins: [`https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`]
      }
    });

    // Save credentials to Replit Secrets
    // Note: This part requires the Replit API token
    const response = await fetch('/__repl/secrets/new', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        secrets: {
          GOOGLE_CLIENT_ID: credential.data.web.client_id,
          GOOGLE_CLIENT_SECRET: credential.data.web.client_secret
        }
      })
    });

    console.log('Credentials saved to Replit Secrets');
  } catch (error) {
    console.error('Error:', error);
  }
}

setupGoogleProject();
