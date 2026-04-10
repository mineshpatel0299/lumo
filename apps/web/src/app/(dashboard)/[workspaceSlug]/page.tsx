import { KanbanBoard } from "@/components/kanban/kanban-board";

interface WorkspacePageProps {
  params: Promise<{ workspaceSlug: string }>
}

export default async function WorkspacePage({ params }: WorkspacePageProps) {
  const { workspaceSlug } = await params

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-8">
        <div>
           <h1 className="text-2xl font-bold text-text-primary tracking-tight">Board</h1>
           <p className="text-text-tertiary text-sm mt-1">Manage and track your team&apos;s tasks.</p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Filters, View Switcher etc */}
          <div className="flex bg-bg-surface border border-border-subtle rounded-lg p-1">
             <button className="px-3 py-1.5 text-xs font-semibold bg-bg-elevated text-text-primary rounded-md shadow-sm">Board</button>
             <button className="px-3 py-1.5 text-xs font-semibold text-text-tertiary hover:text-text-primary transition-colors">List</button>
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0">
        <KanbanBoard workspaceSlug={workspaceSlug} />
      </div>
    </div>
  );
}
