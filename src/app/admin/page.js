import Admin from '@/components/Admin';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Admin — The Book',
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return <Admin />;
}
