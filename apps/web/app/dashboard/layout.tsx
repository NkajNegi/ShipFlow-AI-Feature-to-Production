import Link from "next/link";
import { ReactNode } from "react";
import { auth } from "@repo/api";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { getTRPCServer } from "@/trpc/server";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session) {
    redirect("/login");
  }

  const trpc = await getTRPCServer();
  const workspaces = await trpc.workspace.getUserWorkspaces();
  const defaultWorkspaceId = workspaces.length > 0 ? workspaces[0].id : null;
  return (
    <div className="flex h-screen bg-background text-foreground flex-col md:flex-row overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r border-border bg-card">
        <div className="h-14 flex items-center px-4 border-b border-border">
          <span className="font-bold text-primary text-lg">ShipFlow AI</span>
        </div>
        <nav className="flex-1 px-2 py-4 space-y-2">
          {defaultWorkspaceId ? (
            <Link href={`/dashboard/${defaultWorkspaceId}/projects`} className="block px-3 py-2 rounded-md text-sm font-medium hover:bg-muted hover:text-primary transition-colors">
              Projects
            </Link>
          ) : (
            <div className="block px-3 py-2 rounded-md text-sm font-medium text-muted-foreground opacity-50 cursor-not-allowed">
              Projects
            </div>
          )}
          {defaultWorkspaceId && (
            <Link href={`/dashboard/${defaultWorkspaceId}/board`} className="block px-3 py-2 rounded-md text-sm font-medium text-primary bg-primary/10">
              Kanban Board
            </Link>
          )}
          <Link href="/dashboard/settings" className="block px-3 py-2 rounded-md text-sm font-medium hover:bg-muted hover:text-primary transition-colors">
            Settings
          </Link>
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto pb-16 md:pb-0">
        {/* Mobile Header */}
        <header className="md:hidden h-14 flex items-center justify-between px-4 border-b border-border bg-card">
          <span className="font-bold text-primary text-lg">ShipFlow AI</span>
          <div className="w-8 h-8 rounded-full bg-muted"></div>
        </header>
        
        {children}
      </main>

      {/* Mobile Bottom Navigation (BottomSheet alternative for MVP) */}
      <nav className="md:hidden fixed bottom-0 w-full h-16 border-t border-border bg-card flex items-center justify-around z-50">
        {defaultWorkspaceId ? (
          <Link href={`/dashboard/${defaultWorkspaceId}/projects`} className="flex flex-col items-center justify-center w-full h-full text-muted-foreground hover:text-primary">
            <span className="text-xs font-medium mt-1">Projects</span>
          </Link>
        ) : (
          <div className="flex flex-col items-center justify-center w-full h-full text-muted-foreground opacity-50 cursor-not-allowed">
            <span className="text-xs font-medium mt-1">Projects</span>
          </div>
        )}
        {defaultWorkspaceId ? (
          <Link href={`/dashboard/${defaultWorkspaceId}/board`} className="flex flex-col items-center justify-center w-full h-full text-primary">
            <span className="text-xs font-medium mt-1">Board</span>
          </Link>
        ) : (
          <div className="flex flex-col items-center justify-center w-full h-full text-muted-foreground opacity-50 cursor-not-allowed">
            <span className="text-xs font-medium mt-1">Board</span>
          </div>
        )}
        <Link href="/dashboard/settings" className="flex flex-col items-center justify-center w-full h-full text-muted-foreground hover:text-primary">
          <span className="text-xs font-medium mt-1">Settings</span>
        </Link>
      </nav>
    </div>
  );
}
