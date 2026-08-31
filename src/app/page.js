import { Suspense } from 'react';
import Book from '@/components/Book';

// Le contenu du livre change en continu : pas de pré-génération statique.
export const dynamic = 'force-dynamic';

export default function Home() {
  return (
    <Suspense fallback={<div className="scene"><div className="loading">…</div></div>}>
      <Book />
    </Suspense>
  );
}
