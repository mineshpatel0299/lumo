import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { CursorRenderer } from "@/components/realtime/cursor-renderer";
import { WorkspaceProvider } from "@/components/providers/workspace-provider";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <WorkspaceProvider>
      <div className="flex h-screen overflow-hidden">
        <CursorRenderer />
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <Topbar />
          <main className="flex-1 overflow-y-auto p-6">
            {children}
          </main>
        </div>
      </div>
    </WorkspaceProvider>
  );
}
