import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { GmailAccount } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export function useAccounts() {
  const { toast } = useToast();

  // Get all accounts
  const { 
    data: accounts = [], 
    isLoading,
    isError,
    error,
    refetch
  } = useQuery<GmailAccount[]>({
    queryKey: ['/api/accounts'],
  });

  // Add account mutation
  const addAccount = useMutation({
    mutationFn: (accountData: { 
      email: string; 
      name?: string; 
      authType: 'oauth' | 'password'; 
      credentials: string;
    }) => apiRequest('POST', '/api/accounts', accountData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/accounts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard'] });
      toast({
        title: "Account added",
        description: "Gmail account has been added successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to add account",
        description: error.message || "An error occurred while adding the account",
        variant: "destructive",
      });
    }
  });

  // Delete account mutation
  const deleteAccount = useMutation({
    mutationFn: (accountId: number) => apiRequest('DELETE', `/api/accounts/${accountId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/accounts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard'] });
      toast({
        title: "Account deleted",
        description: "Gmail account has been deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete account",
        description: error.message || "An error occurred while deleting the account",
        variant: "destructive",
      });
    }
  });

  // Verify account mutation
  const verifyAccount = useMutation({
    mutationFn: (accountId: number) => apiRequest('POST', `/api/accounts/${accountId}/verify`),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['/api/accounts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard'] });
      res.json().then((data) => {
        toast({
          title: data.verified ? "Verification successful" : "Verification failed",
          description: data.message,
          variant: data.verified ? "default" : "destructive",
        });
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Verification failed",
        description: error.message || "An error occurred during verification",
        variant: "destructive",
      });
    }
  });

  // Verify all accounts mutation
  const verifyAllAccounts = useMutation({
    mutationFn: () => apiRequest('POST', '/api/accounts/verify-all'),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['/api/accounts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard'] });
      res.json().then((data) => {
        toast({
          title: "Verification completed",
          description: `Successfully verified ${data.successCount} of ${data.totalCount} accounts`,
          variant: data.successCount === data.totalCount ? "default" : "destructive",
        });
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Verification failed",
        description: error.message || "An error occurred during verification",
        variant: "destructive",
      });
    }
  });

  // Get OAuth URL
  const getOAuthUrl = async (): Promise<string> => {
    try {
      const res = await fetch('/api/oauth/url', {
        credentials: 'include'
      });
      
      if (!res.ok) {
        throw new Error('Failed to get OAuth URL');
      }
      
      const data = await res.json();
      return data.url;
    } catch (error) {
      toast({
        title: "Failed to get OAuth URL",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
      return '';
    }
  };

  return {
    accounts,
    isLoading,
    isError,
    error,
    refetch,
    addAccount,
    deleteAccount,
    verifyAccount,
    verifyAllAccounts,
    getOAuthUrl
  };
}
