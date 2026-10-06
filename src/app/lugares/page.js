import React, { Suspense } from 'react';
import Navbar from '@/components/ui/Navbar';
import LugaresExplorer from '@/components/lugares/LugaresExplorer';
import PlaceCardSkeleton from '@/components/lugares/PlaceCardSkeleton';
import styles from '@/components/lugares/lugares.module.css';

export const metadata = {
  title: 'Lugares de Nicaragua | Plataforma Atlan',
  description: 'Descubre los mejores lugares turísticos, comiderías, restaurantes, playas, hoteles y experiencias auténticas en todos los departamentos de Nicaragua.',
  openGraph: {
    title: 'Lugares de Nicaragua | Plataforma Atlan',
    description: 'Explora destinos auténticos y negocios locales en Nicaragua.',
    type: 'website',
  },
};

function LugaresLoading() {
  return (
    <div className={styles.pageContainer}>
      <header className={styles.heroSection}>
        <div className={styles.heroBadge}>
          <span>🇳🇮</span>
          <span>Descubre Nicaragua</span>
        </div>
        <h1 className={styles.heroTitle}>Lugares de Nicaragua</h1>
        <p className={styles.heroSubtitle}>
          Cargando los mejores destinos y negocios turísticos...
        </p>
      </header>
      <main className={styles.placesGrid}>
        {Array.from({ length: 12 }).map((_, idx) => (
          <PlaceCardSkeleton key={`page-skeleton-${idx}`} />
        ))}
      </main>
    </div>
  );
}

export default function LugaresPage() {
  return (
    <>
      <Navbar activePage="lugares" />
      <Suspense fallback={<LugaresLoading />}>
        <LugaresExplorer />
      </Suspense>
    </>
  );
}
