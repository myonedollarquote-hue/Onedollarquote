import { Suspense } from 'react';
import Writer from '@/components/Writer';

export const dynamic = 'force-dynamic';

export default function WritePage() {
  return (
    <Suspense fallback={<div className="writer"><h1>Chargement…</h1></div>}>
      <Writer />
    </Suspense>
  );
}
