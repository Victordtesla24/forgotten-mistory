'use client';

import dynamic from 'next/dynamic';

import styles from './HeroBackdrop.module.css';
import { VisualStage } from './VisualStage';

/** The shader and its library load only when the stage allows it, after first paint. */
const HeroField = dynamic(() => import('./HeroField'), { ssr: false });

/** The field behind the hero: a gradient poster, then the shader once the page is idle. */
export function HeroBackdrop() {
  return <VisualStage visual={HeroField} posterClassName={styles.poster} />;
}
