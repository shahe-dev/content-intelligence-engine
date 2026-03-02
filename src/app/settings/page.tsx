import { PageHeader } from '@/components/PageHeader';
import { SettingsClient } from '@/components/settings/SettingsClient';

export default function SettingsPage() {
  return (
    <>
      <PageHeader
        title="Settings"
        description="Manage application settings, data sources, and competitors."
      />
      <SettingsClient />
    </>
  );
}
