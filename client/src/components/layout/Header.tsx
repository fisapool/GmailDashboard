import { useAuth } from "@/context/AuthContext";
import { useState } from "react";
import { 
  Mail, 
  Menu, 
  Bell, 
  ChevronDown, 
  LogOut, 
  Settings, 
  User
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link } from "wouter";

interface HeaderProps {
  onMenuToggle: () => void;
}

export default function Header({ onMenuToggle }: HeaderProps) {
  const { user, logout } = useAuth();
  const [pendingNotifications] = useState(true);

  // Get user initials for avatar
  const getUserInitials = () => {
    if (!user) return "?";
    if (user.name) {
      return user.name.split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .substring(0, 2);
    }
    return user.username.substring(0, 2).toUpperCase();
  };

  return (
    <header className="bg-white shadow-sm z-10">
      <div className="flex justify-between items-center px-4 py-2">
        <div className="flex items-center">
          <button 
            onClick={onMenuToggle}
            className="lg:hidden mr-4 text-gray-600 hover:bg-gray-100 p-2 rounded-full"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex items-center">
            <Mail className="text-primary h-6 w-6 mr-2" />
            <h1 className="text-xl font-medium text-gray-800">Gmail Account Manager</h1>
          </div>
        </div>
        <div className="flex items-center">
          <div className="mr-4 relative">
            <button className="p-2 rounded-full hover:bg-gray-100">
              <Bell className="h-5 w-5 text-gray-600" />
              {pendingNotifications && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              )}
            </button>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center focus:outline-none">
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white">
                  <span>{getUserInitials()}</span>
                </div>
                <ChevronDown className="h-4 w-4 text-gray-600 ml-1" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Link href="/settings">
                  <div className="flex items-center">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </div>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => logout()}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
