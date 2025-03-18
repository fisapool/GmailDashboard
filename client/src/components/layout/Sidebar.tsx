import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  UserCircle, 
  Clock,
  History, 
  Settings,
  CheckCircle,
  Server,
  AlertTriangle,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Separator } from "@/components/ui/separator";

interface SidebarProps {
  open: boolean;
}

export default function Sidebar({ open }: SidebarProps) {
  const [location] = useLocation();

  // Get system status info
  const { data: status } = useQuery({
    queryKey: ['/api/dashboard'],
    queryFn: () => 
      fetch('/api/dashboard', { credentials: 'include' })
        .then(res => {
          if (!res.ok) throw new Error('Failed to fetch system status');
          return res.json();
        }),
    refetchInterval: 60000, // Refetch every minute
  });

  const isActive = (path: string) => {
    return location === path;
  };
  
  // Navigation items
  const navItems = [
    {
      name: 'Dashboard',
      path: '/',
      icon: <LayoutDashboard className="h-5 w-5 mr-3" />,
    },
    {
      name: 'Accounts',
      path: '/accounts',
      icon: <UserCircle className="h-5 w-5 mr-3" />,
    },
    {
      name: 'Scheduled Tasks',
      path: '/tasks',
      icon: <Clock className="h-5 w-5 mr-3" />,
    },
    {
      name: 'Activity Log',
      path: '/activity',
      icon: <History className="h-5 w-5 mr-3" />,
    },
    {
      name: 'Settings',
      path: '/settings',
      icon: <Settings className="h-5 w-5 mr-3" />,
    },
  ];

  return (
    <aside 
      className={cn(
        "w-64 bg-white shadow-sm overflow-y-auto transition-all duration-300 ease-in-out",
        open ? "block" : "hidden lg:block"
      )}
    >
      <nav className="p-4">
        <ul>
          {navItems.map((item) => (
            <li key={item.path} className="mb-1">
              <Link href={item.path}>
                <a 
                  className={cn(
                    "flex items-center px-4 py-3 rounded-lg",
                    isActive(item.path)
                      ? "bg-blue-50 text-primary font-medium"
                      : "text-gray-600 hover:bg-gray-100"
                  )}
                >
                  {item.icon}
                  {item.name}
                </a>
              </Link>
            </li>
          ))}
        </ul>
        
        <Separator className="my-6" />
        
        <div>
          <div className="px-4 py-2">
            <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider">System Status</h3>
          </div>
          
          <div className="px-4 py-2">
            <div className="flex items-center">
              <span className="w-2 h-2 rounded-full bg-green-500 mr-2"></span>
              <span className="text-sm text-gray-600">Server: Online</span>
            </div>
          </div>
          
          <div className="px-4 py-2">
            <div className="flex items-center">
              <span className="w-2 h-2 rounded-full bg-green-500 mr-2"></span>
              <span className="text-sm text-gray-600">Google API: Connected</span>
            </div>
          </div>
          
          <div className="px-4 py-2">
            <div className="flex items-center">
              <span className="w-2 h-2 rounded-full bg-green-500 mr-2"></span>
              <span className="text-sm text-gray-600">
                Scheduler: {status?.scheduledTasks || 0} Task(s)
              </span>
            </div>
          </div>
        </div>
      </nav>
    </aside>
  );
}
