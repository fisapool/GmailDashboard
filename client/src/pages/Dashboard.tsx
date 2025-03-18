import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAccounts } from "@/hooks/useAccounts";
import { useActivities } from "@/hooks/useActivities";
import StatusCard from "@/components/dashboard/StatusCard";
import AccountHealthChart from "@/components/dashboard/AccountHealthChart";
import RecentActivityList from "@/components/dashboard/RecentActivityList";
import AccountsOverviewTable from "@/components/dashboard/AccountsOverviewTable";
import AddAccountModal from "@/components/modals/AddAccountModal";
import { UserCircle, CheckCircle, AlertTriangle, Clock } from "lucide-react";
import { format, subDays } from "date-fns";

// Generate health chart data for the last 7 days
const generateHealthChartData = (accounts: any[]) => {
  // Get current date and data for the past 7 days
  const data = [];
  for (let i = 6; i >= 0; i--) {
    const date = subDays(new Date(), i);
    const dateStr = format(date, "EEE");
    
    // For simplicity, we're using the current account status
    // In a real app, you would have historical data
    const total = accounts.length;
    const active = accounts.filter(a => a.status === "active").length;
    const warning = accounts.filter(a => a.status === "warning").length;
    const error = accounts.filter(a => a.status === "error").length;
    
    data.push({
      date: dateStr,
      active,
      warning,
      error,
      total
    });
  }
  
  return data;
};

export default function Dashboard() {
  const { accounts, deleteAccount } = useAccounts();
  const { activities } = useActivities(10);
  const [isAddAccountOpen, setIsAddAccountOpen] = useState(false);
  const [healthChartData, setHealthChartData] = useState<any[]>([]);
  
  // Fetch dashboard stats
  const { data: dashboardStats } = useQuery({
    queryKey: ['/api/dashboard'],
  });
  
  // Update health chart data when accounts change
  useEffect(() => {
    if (accounts.length > 0) {
      setHealthChartData(generateHealthChartData(accounts));
    }
  }, [accounts]);
  
  // Handler for edit account
  const handleEditAccount = (account: any) => {
    // This would typically open an edit modal
    // For this implementation, we'll just redirect to the accounts page
    window.location.href = "/accounts";
  };
  
  // Handler for delete account
  const handleDeleteAccount = async (accountId: number) => {
    try {
      await deleteAccount.mutateAsync(accountId);
    } catch (error) {
      console.error("Error deleting account:", error);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-medium text-gray-800">Dashboard</h1>
        <p className="text-gray-600">Overview of your Gmail accounts and scheduled activities</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatusCard 
          title="Total Accounts" 
          value={dashboardStats?.totalAccounts || accounts.length || 0} 
          icon={UserCircle} 
          color="primary" 
        />
        <StatusCard 
          title="Active Accounts" 
          value={dashboardStats?.activeAccounts || accounts.filter(a => a.status === "active").length || 0} 
          icon={CheckCircle} 
          color="success" 
        />
        <StatusCard 
          title="Issues Detected" 
          value={(dashboardStats?.errorAccounts || accounts.filter(a => a.status === "error").length || 0) + 
                 (dashboardStats?.warningAccounts || accounts.filter(a => a.status === "warning").length || 0)} 
          icon={AlertTriangle} 
          color="error" 
        />
        <StatusCard 
          title="Scheduled Tasks" 
          value={dashboardStats?.scheduledTasks || 0} 
          icon={Clock} 
          color="warning" 
        />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <AccountHealthChart data={healthChartData} />
        <RecentActivityList activities={activities} />
      </div>
      
      <AccountsOverviewTable 
        accounts={accounts} 
        onEdit={handleEditAccount} 
        onDelete={handleDeleteAccount} 
      />
      
      <AddAccountModal 
        open={isAddAccountOpen} 
        onOpenChange={setIsAddAccountOpen} 
      />
    </div>
  );
}
