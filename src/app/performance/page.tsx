import { PageHeader } from '@/components/PageHeader';

export default function PerformancePage() {
  return (
    <>
      <PageHeader
        title="Performance & Authority"
        description="Track content performance, authority signals, and LLM visibility."
      />
      <div className="flex items-center justify-center h-96 border-dashed border-2 rounded-lg">
        <p className="text-muted-foreground">Performance dashboard coming soon.</p>
      </div>
    </>
  );
}
