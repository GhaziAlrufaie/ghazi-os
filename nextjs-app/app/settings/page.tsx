// /settings — صفحة الإعدادات
// Server Component: يجلب البيانات من Supabase ويمررها لـ SettingsClient
import { getWhatsappSettings, getTeamContacts, getDailyMessages } from '@/lib/settings-actions';
import { getEmployees } from '@/lib/team-actions';
import { getBrands } from '@/lib/brands-actions';
import SettingsClient from '@/components/settings/SettingsClient';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const [whatsapp, contacts, messages, employees, brands] = await Promise.all([
    getWhatsappSettings().catch(() => null),
    getTeamContacts().catch(() => []),
    getDailyMessages().catch(() => []),
    getEmployees().catch(() => []),
    getBrands().catch(() => []),
  ]);

  return (
    <SettingsClient
      whatsapp={whatsapp}
      contacts={contacts}
      messages={messages}
      employees={employees}
      brands={brands}
    />
  );
}
