// src/components/common/LoadingIndicator.tsx

import styles from './LoadingIndicator.module.css';

export default function LoadingIndicator() {
  return (
    // Este div exterior centra el loader en la pantalla
    <div className={styles.loaderContainer}>
      <div className={styles.loadingBar}>
          <div className={styles.blueBar}></div>
      </div>
    </div>
  );
}