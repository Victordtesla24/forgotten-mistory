'use client';

import dynamic from 'next/dynamic';

const MiniVicBot = dynamic(() => import('../MiniVicBot'), { ssr: false });

export default function MiniVicBotWrapper() {
  return <MiniVicBot />;
}
