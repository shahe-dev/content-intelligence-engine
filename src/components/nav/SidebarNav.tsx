'use client';

import {
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarContent,
  SidebarFooter,
} from '@/components/ui/sidebar';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Home,
  Newspaper,
  Target,
  FileText,
  Calendar,
  BarChart2,
  Settings,
  LifeBuoy,
  Building2,
  Building,
  Mail,
  LogOut,
} from 'lucide-react';
import { Logo } from '@/components/Logo';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Separator } from '../ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';


// This is an SVG for the Slack icon as lucide-react does not have one.
const SlackIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
        <path d="M12.9 5.2a1.6 1.6 0 0 1-1.8 1.8A1.6 1.6 0 0 1 9.3 5.2a1.6 1.6 0 0 1 1.8-1.8 1.6 1.6 0 0 1 1.8 1.8Z"/>
        <path d="m7 9.3 1.8-1.8a1.6 1.6 0 0 1 2.3 2.3L9.3 11.6A1.6 1.6 0 0 1 7 9.3Z"/>
        <path d="M18.8 12.9a1.6 1.6 0 0 1-1.8 1.8 1.6 1.6 0 0 1-1.8-1.8 1.6 1.6 0 0 1 1.8-1.8 1.6 1.6 0 0 1 1.8 1.8Z"/>
        <path d="M9.3 17a1.8 1.8 0 0 1-2.3 2.3l-1.8-1.8a1.6 1.6 0 1 1 2.3-2.3l1.8 1.8Z"/>
        <path d="M5.2 11.1a1.6 1.6 0 0 1 1.8-1.8 1.6 1.6 0 0 1 1.8 1.8 1.6 1.6 0 0 1-1.8 1.8A1.6 1.6 0 0 1 5.2 11.1Z"/>
        <path d="M11.6 14.7a1.8 1.8 0 0 1 2.3-2.3l1.8 1.8a1.6 1.6 0 1 1-2.3 2.3Z"/>
        <path d="M11.1 18.8a1.6 1.6 0 0 1 1.8-1.8 1.6 1.6 0 0 1 1.8 1.8 1.6 1.6 0 0 1-1.8 1.8 1.6 1.6 0 0 1-1.8-1.8Z"/>
        <path d="m17 7-1.8 1.8a1.6 1.6 0 1 1-2.3-2.3L14.7 5a1.8 1.8 0 0 1 2.3 2.3Z"/>
    </svg>
);


const navItems = [
  { href: '/', label: 'Dashboard', icon: Home },
  { href: '/market-intelligence-optimized', label: 'Market Intelligence (Fast)', icon: Newspaper, badge: 'NEW' },
  { href: '/competitive-watch', label: 'Competitive Watch', icon: Building },
  { href: '/editorial-plan', label: 'Editorial Plan Engine', icon: Calendar },
  { href: '/content-blueprinting', label: 'Content Blueprinting', icon: FileText },
  { href: '/seo-analysis', label: 'SEO Analysis', icon: Target, isComingSoon: true },
  { href: '/performance', label: 'Performance', icon: BarChart2, isComingSoon: true },
];

export function SidebarNav() {
  const pathname = usePathname();
  const { user, signOut } = useAuth();

  return (
    <>
      <SidebarHeader className="p-4">
        <Logo className="w-full" />
      </SidebarHeader>
      <SidebarContent className="p-2">
        <SidebarMenu>
          {navItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                asChild
                isActive={pathname === item.href}
                className="justify-start"
              >
                <Link href={item.href}>
                  <item.icon className="mr-2 h-4 w-4" />
                  {item.label}
                  {item.isComingSoon && <sup className="text-xs ml-1 text-muted-foreground">Coming Soon</sup>}
                  {item.badge && <sup className="text-xs ml-1 text-green-600 font-semibold">{item.badge}</sup>}
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <Separator className="my-2" />
      <SidebarFooter>
         <Dialog>
            <SidebarMenu>
                <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === '/settings'} className="justify-start">
                    <Link href="/settings">
                        <Settings className="mr-2 h-4 w-4" />
                        Settings
                    </Link>
                </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                <DialogTrigger asChild>
                    <SidebarMenuButton className="justify-start">
                        <LifeBuoy className="mr-2 h-4 w-4" />
                        Support
                    </SidebarMenuButton>
                </DialogTrigger>
                </SidebarMenuItem>
            </SidebarMenu>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Contact Support</DialogTitle>
                    <DialogDescription>
                        Need help? Choose your preferred method to get in touch with our team.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-1 gap-4 py-4 md:grid-cols-2">
                    <Button asChild variant="outline">
                        <a href="mailto:support@your-domain.com?subject=Support%20Request">
                            <Mail className="mr-2 h-4 w-4" />
                            Email Support
                        </a>
                    </Button>
                     <Button asChild variant="outline">
                        <a href="https://slack.com/app_redirect?team=YOUR_TEAM_ID&channel=YOUR_USER_ID" target="_blank" rel="noopener noreferrer">
                           <SlackIcon className="mr-2 h-4 w-4" />
                           Message on Slack
                        </a>
                    </Button>
                </div>
            </DialogContent>
         </Dialog>
         <div className="flex items-center justify-between p-2">
            <div className='flex items-center gap-3'>
              <Avatar className="h-9 w-9">
                <AvatarImage src={user?.photoURL || ''} alt="User Avatar" />
                <AvatarFallback>{user?.displayName?.charAt(0) || 'U'}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium">{user?.displayName || 'User'}</p>
                <p className="text-xs text-muted-foreground">{user?.email || ''}</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={signOut} aria-label="Sign out">
              <LogOut className="h-4 w-4" />
            </Button>
         </div>
      </SidebarFooter>
    </>
  );
}
