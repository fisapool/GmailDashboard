import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "./context/AuthContext";
import Header from "./components/layout/Header";
import Sidebar from "./components/layout/Sidebar";
import Dashboard from "./pages/Dashboard";
import Accounts from "./pages/Accounts";
import Tasks from "./pages/Tasks";
import Activity from "./pages/Activity";
import Settings from "./pages/Settings";
import AuthPage from "./pages/auth-page";
import NotFound from "@/pages/not-found";
import { useState } from "react";
import { ProtectedRoute } from "./lib/protected-route";

// Layout component to wrap authenticated pages
function AppLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex flex-col h-screen">
      <Header onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar open={sidebarOpen} />
        <main className="flex-1 overflow-y-auto bg-gray-50 p-4 lg:p-6">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

function DashboardPage() {
  return (
    <AppLayout>
      <Dashboard />
    </AppLayout>
  );
}

function AccountsPage() {
  return (
    <AppLayout>
      <Accounts />
    </AppLayout>
  );
}

function TasksPage() {
  return (
    <AppLayout>
      <Tasks />
    </AppLayout>
  );
}

function ActivityPage() {
  return (
    <AppLayout>
      <Activity />
    </AppLayout>
  );
}

function SettingsPage() {
  return (
    <AppLayout>
      <Settings />
    </AppLayout>
  );
}

function Router() {
  return (
    <Switch>
      <ProtectedRoute path="/" component={DashboardPage} />
      <ProtectedRoute path="/accounts" component={AccountsPage} />
      <ProtectedRoute path="/tasks" component={TasksPage} />
      <ProtectedRoute path="/activity" component={ActivityPage} />
      <ProtectedRoute path="/settings" component={SettingsPage} />
      <Route path="/auth" component={AuthPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
