import { Button } from "@/components/ui/button";
import { Plus, ArrowRight, Github } from "lucide-react";

export default function Home() {
  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-up">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-text-primary">Welcome back, Minesh</h1>
        <p className="text-text-tertiary">Here&apos;s what&apos;s happening with your projects today.</p>
      </header>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Assigned to me', value: '12', color: 'accent' },
          { label: 'Overdue', value: '3', color: 'red-500' },
          { label: 'Due this week', value: '8', color: 'blue-500' },
        ].map((stat) => (
          <div key={stat.label} className="bg-bg-surface border border-border-subtle p-5 rounded-lg hover:border-border-default transition-colors group cursor-pointer">
            <span className="text-[10px] font-bold uppercase tracking-widest text-text-tertiary">{stat.label}</span>
            <div className="flex items-end justify-between mt-1">
              <span className={`text-3xl font-bold text-${stat.color === 'accent' ? 'accent' : stat.color}`}>{stat.value}</span>
              <ArrowRight size={16} className="text-text-tertiary group-hover:text-text-primary transform group-hover:translate-x-1 transition-all" />
            </div>
          </div>
        ))}
      </div>

      {/* Empty State / Initial View */}
      <div className="bg-bg-surface border border-dashed border-border-default rounded-xl h-64 flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 bg-bg-elevated rounded-full flex items-center justify-center text-text-tertiary">
          <Plus size={24} />
        </div>
        <div className="text-center">
          <h3 className="text-sm font-semibold text-text-primary">No active issues found</h3>
          <p className="text-xs text-text-tertiary mt-1">Start by creating your first issue or importing from GitHub.</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm">
            <Plus size={14} className="mr-2" />
            Create Issue
          </Button>
          <Button variant="secondary" size="sm">
            <Github size={14} className="mr-2" />
            Import
          </Button>
        </div>
      </div>
    </div>
  );
}
