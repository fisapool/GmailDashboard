import { Card, CardContent } from "@/components/ui/card";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { PlusCircle, UserCircle, Edit, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { GmailAccount } from "@shared/schema";
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
import { useState } from "react";
import { useTasks } from "@/hooks/useTasks";

interface AccountsOverviewTableProps {
  accounts: GmailAccount[];
  onEdit: (account: GmailAccount) => void;
  onDelete: (accountId: number) => void;
}

export default function AccountsOverviewTable({ 
  accounts, 
  onEdit, 
  onDelete 
}: AccountsOverviewTableProps) {
  const [accountToDelete, setAccountToDelete] = useState<GmailAccount | null>(null);
  const { tasks } = useTasks();
  
  // Get task count for an account
  const getTaskCount = (accountId: number) => {
    return tasks.filter(task => task.accountId === accountId).length;
  };

  // Status badge component
  const StatusBadge = ({ status }: { status: string }) => {
    let bgColor = "bg-green-50";
    let textColor = "text-green-500";
    let label = "Active";
    
    if (status === "error") {
      bgColor = "bg-red-50";
      textColor = "text-red-500";
      label = "Error";
    } else if (status === "warning") {
      bgColor = "bg-yellow-50";
      textColor = "text-yellow-500";
      label = "Warning";
    } else if (status === "pending") {
      bgColor = "bg-gray-50";
      textColor = "text-gray-500";
      label = "Pending";
    }
    
    return (
      <span className={`px-2 inline-flex text-xs leading-5 font-medium rounded-full ${bgColor} ${textColor}`}>
        {label}
      </span>
    );
  };

  return (
    <>
      <Card className="overflow-hidden">
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium">Accounts Overview</h2>
            <Link href="/accounts">
              <Button className="inline-flex items-center gap-1">
                <PlusCircle className="h-4 w-4" />
                Add Account
              </Button>
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Check
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Scheduled Tasks
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {accounts.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                      No accounts found. <Link href="/accounts"><a className="text-primary">Add an account</a></Link>
                    </td>
                  </tr>
                ) : (
                  accounts.slice(0, 5).map((account) => (
                    <tr key={account.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <UserCircle className="text-primary h-5 w-5 mr-2" />
                          <div>
                            <div className="text-sm font-medium text-gray-800">{account.email}</div>
                            <div className="text-xs text-gray-500">{account.name || "Gmail Account"}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge status={account.status} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {account.lastCheck ? format(new Date(account.lastCheck), 'MMM d, h:mm a') : 'Never'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {getTaskCount(account.id)} Tasks
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button 
                          className="text-primary hover:text-primary-hover mr-3"
                          onClick={() => onEdit(account)}
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button 
                          className="text-red-500 hover:text-red-600"
                          onClick={() => setAccountToDelete(account)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Delete confirmation dialog */}
      <AlertDialog 
        open={!!accountToDelete} 
        onOpenChange={(open) => !open && setAccountToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the Gmail account "{accountToDelete?.email}" 
              and all associated tasks and activities. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              className="bg-red-500 hover:bg-red-600"
              onClick={() => {
                if (accountToDelete) {
                  onDelete(accountToDelete.id);
                  setAccountToDelete(null);
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
