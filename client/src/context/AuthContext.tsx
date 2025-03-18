import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useQuery, useMutation, QueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

// Define User type
interface User {
  id: number;
  username: string;
  email: string;
  name?: string;
}

// Define AuthContext type
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string, email: string, name?: string) => Promise<void>;
  logout: () => Promise<void>;
}

// Create context with initial null value
const AuthContext = createContext<AuthContextType | null>(null);

// Custom fetch wrapper for API requests
async function fetchApi(url: string, options?: RequestInit) {
  const response = await fetch(url, {
    ...options,
    credentials: "include",
    headers: {
      ...options?.headers,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || response.statusText);
  }

  return response;
}

// Provider component
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const { toast } = useToast();

  // User query
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["currentUser"],
    queryFn: async () => {
      try {
        const response = await fetch("/api/auth/me", {
          credentials: "include",
        });
        
        if (response.status === 401) {
          return null;
        }
        
        if (!response.ok) {
          throw new Error("Failed to fetch user data");
        }
        
        return await response.json();
      } catch (error) {
        console.error("Error fetching user:", error);
        return null;
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: false,
  });

  // Update user state when data changes
  useEffect(() => {
    setUser(data || null);
  }, [data]);

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (credentials: { username: string; password: string }) => {
      const response = await fetchApi("/api/auth/login", {
        method: "POST",
        body: JSON.stringify(credentials),
      });
      return response.json();
    },
    onSuccess: (userData) => {
      setUser(userData);
      toast({
        title: "Login successful",
        description: `Welcome back, ${userData.username}!`,
      });
      // Refetch user data to update context
      refetch();
    },
    onError: (error: Error) => {
      toast({
        title: "Login failed",
        description: error.message || "Invalid username or password",
        variant: "destructive",
      });
    },
  });

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: async (userData: { username: string; password: string; email: string; name?: string }) => {
      const response = await fetchApi("/api/auth/register", {
        method: "POST",
        body: JSON.stringify(userData),
      });
      return response.json();
    },
    onSuccess: (userData) => {
      setUser(userData);
      toast({
        title: "Registration successful",
        description: `Welcome, ${userData.username}!`,
      });
      // Refetch user data to update context
      refetch();
    },
    onError: (error: Error) => {
      toast({
        title: "Registration failed",
        description: error.message || "Could not create account",
        variant: "destructive",
      });
    },
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      await fetchApi("/api/auth/logout", {
        method: "POST",
      });
    },
    onSuccess: () => {
      setUser(null);
      toast({
        title: "Logged out",
        description: "You have been successfully logged out",
      });
      // Refetch user data to update context
      refetch();
    },
    onError: (error: Error) => {
      toast({
        title: "Logout failed",
        description: error.message || "An error occurred while logging out",
        variant: "destructive",
      });
    },
  });

  // Login function
  const login = async (username: string, password: string) => {
    await loginMutation.mutateAsync({ username, password });
  };

  // Register function
  const register = async (username: string, password: string, email: string, name?: string) => {
    await registerMutation.mutateAsync({ username, password, email, name });
  };

  // Logout function
  const logout = async () => {
    await logoutMutation.mutateAsync();
  };

  // Context value
  const contextValue: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook to use the auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
