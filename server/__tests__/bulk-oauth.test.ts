
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { BulkOAuthManager } from '../bulk-oauth';
import { google } from 'googleapis';

jest.mock('googleapis');

describe('BulkOAuthManager', () => {
  let bulkManager: BulkOAuthManager;

  beforeEach(() => {
    bulkManager = new BulkOAuthManager();
  });

  describe('createBulkCredentials', () => {
    it('should create multiple credentials successfully', async () => {
      const mockCredential = {
        clientId: 'test-client',
        clientSecret: 'test-secret'
      };

      (google.iam as jest.Mock).mockReturnValue({
        projects: {
          serviceAccounts: {
            create: jest.fn().mockResolvedValue({ data: mockCredential })
          }
        }
      });

      const config = {
        projectId: 'test-project',
        clientName: 'test-client',
        redirectUris: ['http://localhost:3000/callback'],
        count: 3
      };

      const result = await bulkManager.createBulkCredentials(config);
      expect(result).toHaveLength(3);
      expect(result[0]).toEqual(mockCredential);
    });

    it('should handle errors during credential creation', async () => {
      (google.iam as jest.Mock).mockReturnValue({
        projects: {
          serviceAccounts: {
            create: jest.fn().mockRejectedValue(new Error('API Error'))
          }
        }
      });

      const config = {
        projectId: 'test-project',
        clientName: 'test-client',
        redirectUris: ['http://localhost:3000/callback'],
        count: 2
      };

      const result = await bulkManager.createBulkCredentials(config);
      expect(result).toHaveLength(0);
    });
  });

  describe('verifyCredentials', () => {
    it('should verify credentials successfully', async () => {
      const mockCredentials = [
        { clientId: 'test1', clientSecret: 'secret1' },
        { clientId: 'test2', clientSecret: 'secret2' }
      ];

      const result = await bulkManager.verifyCredentials(mockCredentials);
      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('status');
    });
  });
});
