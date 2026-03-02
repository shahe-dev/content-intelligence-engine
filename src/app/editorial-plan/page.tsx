import { PageHeader } from '@/components/PageHeader';
import { EditorialPlanClient } from '@/components/editorial-plan/EditorialPlanClient';

export default function EditorialPlanPage() {
  return (
    <>
      <PageHeader
        title="AI-Powered Editorial Plan Engine"
        description="Generate a prioritized weekly content plan based on market trends and competitor activity."
      />
      <EditorialPlanClient />
    </>
  );
}
