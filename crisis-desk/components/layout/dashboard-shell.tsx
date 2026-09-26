"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useTheme } from "next-themes";
import {
  AlertCircle,
  Bell,
  CalendarDays,
  ChevronDown,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Settings,
  ShieldCheck,
  Sun,
  Users,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { useAuthGuard } from "@/lib/hooks/use-auth-guard";
import { useAuth } from "@/lib/firebase/auth-context";
import { USER_ROLES } from "@/constants";
import { PageLoader } from "@/components/shared/loading-spinner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface DashboardShellProps {
  children: React.ReactNode;
}

const navigation = [
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { label: "Incidents", href: "/incidents", icon: AlertCircle },
  { label: "Team", href: "/team", icon: Users },
  { label: "Settings", href: "/settings", icon: Settings },
];

function getInitials(displayName: string) {
  return displayName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const { userProfile, signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success("Signed out successfully");
    } catch {
      toast.error("Sign out failed. Please try again.");
    }
  };

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-border bg-sidebar text-sidebar-foreground">
      <div className="flex h-20 items-center gap-3 border-b border-sidebar-border px-6">
        <div className="flex size-9 items-center justify-center rounded-xl bg-red-700 text-white shadow-sm">
          <ShieldCheck className="size-5" strokeWidth={2.2} />
        </div>
        <div>
          <p className="font-semibold tracking-tight">Crisis Desk</p>
          <p className="text-[11px] text-sidebar-foreground/55">Event command center</p>
        </div>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-6" aria-label="Main navigation">
        <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-sidebar-foreground/45">Workspace</p>
        {navigation.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href} onClick={onNavigate} className={cn("flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors", isActive ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm" : "text-sidebar-foreground/65 hover:bg-sidebar-accent/70 hover:text-sidebar-foreground")}>
                 <Icon className="size-[18px]" strokeWidth={isActive ? 2.2 : 1.8} aria-hidden="true" />
              {item.label}
            </Link>
          );
        })}
        <div className="mt-8 rounded-xl border border-sidebar-border bg-sidebar-accent/50 p-4">
          <div className="mb-3 flex items-center gap-2 text-xs font-semibold"><CalendarDays className="size-4 text-red-700 dark:text-red-400" />Current event</div>
          <p className="text-sm font-medium">No event selected</p>
          <p className="mt-1 text-xs leading-relaxed text-sidebar-foreground/55">Choose an event to start coordinating your response team.</p>
        </div>
      </nav>
      <div className="border-t border-sidebar-border p-3">
        <DropdownMenu>
          <DropdownMenuTrigger className="flex w-full items-center gap-3 rounded-lg p-2 text-left transition-colors hover:bg-sidebar-accent">
            <Avatar size="sm" className="bg-red-100 dark:bg-red-950"><AvatarImage src={userProfile?.photoURL ?? undefined} alt="" /><AvatarFallback className="bg-red-100 font-semibold text-red-800 dark:bg-red-950 dark:text-red-200">{userProfile ? getInitials(userProfile.displayName) : "CD"}</AvatarFallback></Avatar>
            <span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium">{userProfile?.displayName}</span><span className="block truncate text-xs text-sidebar-foreground/55">{userProfile ? USER_ROLES[userProfile.role] : "Team member"}</span></span>
            <ChevronDown className="size-4 text-sidebar-foreground/45" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" side="top" className="w-56">
            <DropdownMenuLabel className="font-normal"><p className="font-medium">{userProfile?.displayName}</p><p className="truncate text-xs text-muted-foreground">{userProfile?.email}</p><p className="text-xs text-muted-foreground">{userProfile?.phone ?? "No phone contact"}</p></DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push("/settings")}><Settings />Account settings</DropdownMenuItem>
            <DropdownMenuItem onClick={handleSignOut} variant="destructive"><LogOut />Sign out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  );
}

export function DashboardShell({ children }: DashboardShellProps) {
  const { userProfile, loading } = useAuthGuard();
  const { signOut } = useAuth();
  const { resolvedTheme, setTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const router = useRouter();

  if (loading) return <PageLoader />;
  if (!userProfile) return null;

  const toggleTheme = () => setTheme(resolvedTheme === "dark" ? "light" : "dark");
  const handleSignOut = async () => {
    try { await signOut(); toast.success("Signed out successfully"); } catch { toast.error("Sign out failed. Please try again."); }
  };

  return (
    <div className="min-h-screen bg-muted/35">
      <div className="fixed inset-y-0 left-0 z-40 hidden lg:flex"><Sidebar /></div>
      {mobileOpen && <div className="fixed inset-0 z-50 lg:hidden"><button aria-label="Close navigation" className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" onClick={() => setMobileOpen(false)} /><div className="relative h-full w-[min(82vw,20rem)] shadow-2xl"><Button variant="ghost" size="icon" className="absolute right-2 top-6 z-10 text-sidebar-foreground hover:bg-sidebar-accent" onClick={() => setMobileOpen(false)} aria-label="Close navigation"><X /></Button><Sidebar onNavigate={() => setMobileOpen(false)} /></div></div>}
      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-border/80 bg-background/90 px-4 backdrop-blur-md sm:px-6 lg:px-8">
          <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-2 focus:z-50 focus:rounded-md focus:bg-background focus:px-3 focus:py-2 focus:text-sm focus:shadow-md">Skip to content</a>
          <div className="flex items-center gap-3"><Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Open navigation"><Menu /></Button><div><p className="text-xs font-medium text-muted-foreground">Live operations</p><h1 className="text-base font-semibold tracking-tight sm:text-lg">Good morning, {userProfile.displayName.split(" ")[0]}</h1></div></div>
          <div className="flex items-center gap-1 sm:gap-2"><Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle color theme"><Sun className="size-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" /><Moon className="absolute size-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" /></Button><Button variant="ghost" size="icon" aria-label="Notifications"><Bell className="size-4" /></Button><Button variant="outline" size="sm" className="ml-1 hidden gap-2 sm:flex" onClick={() => router.push("/incidents")}><ClipboardList className="size-4" />View incidents</Button><Button variant="ghost" size="icon" className="sm:hidden" onClick={handleSignOut} aria-label="Sign out"><LogOut className="size-4" /></Button></div>
        </header>
        <main id="main-content" className="mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">{children}</main>
      </div>
    </div>
  );
}