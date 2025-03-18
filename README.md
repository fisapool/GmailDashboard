
# Gmail Account Manager Dashboard

A comprehensive web application for managing multiple Gmail accounts with features for OAuth authentication, SMTP verification, and automated task scheduling.

## Features

- **Account Management**: Add and manage multiple Gmail accounts
- **OAuth Integration**: Secure Google OAuth2 authentication
- **SMTP Verification**: Real-time account health monitoring
- **Task Automation**: Schedule automated maintenance tasks
- **Activity Tracking**: Monitor account activities and status changes
- **Secure Storage**: Encrypted token storage and session management

## Tech Stack

- Frontend: React + TypeScript + Tailwind CSS
- Backend: Node.js + Express
- Authentication: Google OAuth2
- Database: File-based secure storage
- Task Scheduling: Built-in scheduler

## Getting Started

1. Clone the project in Replit
2. Install dependencies:
```bash
npm install
```
3. Start the development server:
```bash
npm run dev
```

The application will be available at your Replit URL.

## Environment Setup

Configure the following environment variables in Replit Secrets:
- `GOOGLE_CLIENT_ID`: Your Google OAuth client ID
- `GOOGLE_CLIENT_SECRET`: Your Google OAuth client secret
- `SESSION_SECRET`: Secret for session encryption

## Structure

- `/client`: React frontend application
- `/server`: Express backend services
- `/shared`: Shared TypeScript types and schemas
- `/sessions`: Secure session storage

## Security

- OAuth2 tokens are encrypted before storage
- Session-based authentication
- Secure credential management
- HTTPS enforcement in production

## License

All rights reserved.
