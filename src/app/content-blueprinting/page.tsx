import { Suspense } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { ContentBlueprintingClient } from '@/components/content-blueprinting/ContentBlueprintingClient';

export default function ContentBlueprintingPage() {
  return (
    <>
      <PageHeader
        title="AI-Assisted Content Blueprinting"
        description="Generate skeleton drafts, SEO briefs, and outlines from topic inputs."
      />
      <Suspense fallback={
        <div className="flex items-center justify-center p-8">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      }>
        <ContentBlueprintingClient />
      </Suspense>
    </>
  );
}
