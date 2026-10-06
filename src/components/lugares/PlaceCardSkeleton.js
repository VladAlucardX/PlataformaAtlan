import React from 'react';
import styles from './lugares.module.css';

export default function PlaceCardSkeleton() {
  return (
    <div className={styles.skeletonCard} aria-hidden="true">
      <div className={styles.skeletonMedia}>
        <div className={styles.skeletonShimmer} />
      </div>
      <div className={styles.skeletonContent}>
        <div className={styles.skeletonLine} style={{ width: '40%', height: '16px' }}>
          <div className={styles.skeletonShimmer} />
        </div>
        <div className={styles.skeletonLine} style={{ width: '85%', height: '22px' }}>
          <div className={styles.skeletonShimmer} />
        </div>
        <div className={styles.skeletonLine} style={{ width: '95%', height: '14px' }}>
          <div className={styles.skeletonShimmer} />
        </div>
        <div className={styles.skeletonLine} style={{ width: '60%', height: '14px' }}>
          <div className={styles.skeletonShimmer} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <div className={styles.skeletonLine} style={{ width: '25%', height: '16px' }}>
            <div className={styles.skeletonShimmer} />
          </div>
          <div className={styles.skeletonLine} style={{ width: '35%', height: '28px', borderRadius: '10px' }}>
            <div className={styles.skeletonShimmer} />
          </div>
        </div>
      </div>
    </div>
  );
}
