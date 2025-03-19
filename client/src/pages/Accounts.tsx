import { useState } from "react";
import { useAccounts } from "@/hooks/useAccounts";
import { useTasks } from "@/hooks/useTasks";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { PlusCircle, RefreshCw, Trash2, CheckCircle, AlertTriangle, Clock, Mail, Key } from "lucide-react";
import AddAccountModal from "@/components/modals/AddAccountModal";
import TaskScheduleModal from "@/components/modals/TaskScheduleModal";
import { format } from "date-fns";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

// Placeholder for BulkOAuthModal component
const BulkOAuthModal = ({ open, onOpenChange }) => {
  return (
    <div>
      {/* Replace with actual Bulk OAuth Modal implementation */}
      <p>Bulk OAuth Modal - Implementation needed</p>
    </div>
  );
};


export default function Accounts() {
  const { accounts, isLoading, verifyAccount, verifyAllAccounts, deleteAccount } = useAccounts();
  const { tasks } = useTasks();
  const [isAddAccountOpen, setIsAddAccountOpen] = useState(false);
  const [isScheduleTaskOpen, setIsScheduleTaskOpen] = useState(false);
  const [accountToDelete, setAccountToDelete] = useState<number | null>(null);
  const [accountForTask, setAccountForTask] = useState<number | null>(null);
  const [isVerifyingAll, setIsVerifyingAll] = useState(false);
  const [isBulkOAuthOpen, setIsBulkOAuthOpen] = useState(false);


  // Get count of tasks for an account
  const getTaskCount = (accountId: number) => {
    return tasks.filter(task => task.accountId === accountId).length;
  };

  // Handle verify all accounts
  const handleVerifyAllAccounts = async () => {
    try {
      setIsVerifyingAll(true);
      await verifyAllAccounts.mutateAsync();
    } catch (error) {
      console.error("Error verifying accounts:", error);
    } finally {
      setIsVerifyingAll(false);
    }
  };

  // Handle verify single account
  const handleVerifyAccount = async (accountId: number) => {
    try {
      await verifyAccount.mutateAsync(accountId);
    } catch (error) {
      console.error("Error verifying account:", error);
    }
  };

  // Handle delete account
  const handleDeleteAccount = async (accountId: number) => {
    try {
      await deleteAccount.mutateAsync(accountId);
      setAccountToDelete(null);
    } catch (error) {
      console.error("Error deleting account:", error);
    }
  };

  // Handle schedule task for a specific account
  const handleScheduleTask = (accountId: number) => {
    setAccountForTask(accountId);
    setIsScheduleTaskOpen(true);
  };

  // Status badge component
  const StatusBadge = ({ status }: { status: string }) => {
    if (status === "active") {
      return <Badge variant="outline" className="bg-green-50 text-green-500">Active</Badge>;
    } else if (status === "error") {
      return <Badge variant="outline" className="bg-red-50 text-red-500">Error</Badge>;
    } else if (status === "warning") {
      return <Badge variant="outline" className="bg-yellow-50 text-yellow-500">Warning</Badge>;
    } else {
      return <Badge variant="outline" className="bg-gray-50 text-gray-500">Pending</Badge>;
    }
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-2xl font-medium text-gray-800">Gmail Accounts</h1>
          <p className="text-gray-600">Manage your connected Gmail accounts and verify their status</p>
        </div>
        <div className="flex space-x-3 mt-4 md:mt-0">
          <Button 
            variant="outline" 
            onClick={handleVerifyAllAccounts}
            disabled={isVerifyingAll || accounts.length === 0}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Verify All
          </Button>
          <div className="flex gap-2">
            <Button onClick={() => setIsBulkOAuthOpen(true)} variant="outline">
              <Key className="h-4 w-4 mr-2" />
              Bulk OAuth
            </Button>
            <Button onClick={() => setIsAddAccountOpen(true)}>
              <PlusCircle className="h-4 w-4 mr-2" />
              Add Account
            </Button>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              </CardContent>
              <CardFooter>
                <Skeleton className="h-10 w-full" />
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : accounts.length === 0 ? (
        <Card className="text-center p-8">
          <CardContent className="pt-6">
            <Mail className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium">No Gmail Accounts</h3>
            <p className="text-gray-500 mt-2">
              You haven't added any Gmail accounts yet. Add an account to get started.
            </p>
            <Button 
              onClick={() => setIsAddAccountOpen(true)} 
              className="mt-6"
            >
              <PlusCircle className="h-4 w-4 mr-2" />
              Add Gmail Account
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {accounts.map((account) => (
            <Card key={account.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{account.email}</CardTitle>
                    <CardDescription>{account.name || "Gmail Account"}</CardDescription>
                  </div>
                  <StatusBadge status={account.status} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="text-sm text-gray-500">Last Verified</div>
                    <div className="text-gray-700">
                      {account.lastCheck ? format(new Date(account.lastCheck), 'MMM d, yyyy h:mm a') : 'Never'}
                    </div>
                  </div>

                  <div>
                    <div className="text-sm text-gray-500">Authentication Type</div>
                    <div className="text-gray-700 capitalize">{account.authType}</div>
                  </div>

                  <div>
                    <div className="text-sm text-gray-500">Scheduled Tasks</div>
                    <div className="text-gray-700">{getTaskCount(account.id)} tasks</div>
                  </div>
                </div>
              </CardContent>
              <Separator />
              <CardFooter className="flex justify-between pt-4">
                <div className="flex space-x-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleVerifyAccount(account.id)}
                    disabled={verifyAccount.isPending}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Verify
                  </Button>
                  <Button 
                    size="sm" 
                    onClick={() => handleScheduleTask(account.id)}
                  >
                    <Clock className="h-4 w-4 mr-2" />
                    Schedule
                  </Button>
                </div>
                <Button 
                  size="sm" 
                  variant="destructive"
                  onClick={() => setAccountToDelete(account.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      <AddAccountModal 
        open={isAddAccountOpen} 
        onOpenChange={setIsAddAccountOpen} 
      />

      <TaskScheduleModal 
        open={isScheduleTaskOpen} 
        onOpenChange={setIsScheduleTaskOpen} 
      />

      <BulkOAuthModal open={isBulkOAuthOpen} onOpenChange={setIsBulkOAuthOpen} />

      <AlertDialog 
        open={accountToDelete !== null} 
        onOpenChange={(open) => !open && setAccountToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the Gmail account and all associated tasks and activities. 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              className="bg-destructive text-destructive-foreground"
              onClick={() => accountToDelete && handleDeleteAccount(accountToDelete)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}