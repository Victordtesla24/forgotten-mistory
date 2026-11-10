'use client';

import { MessageCircle } from 'lucide-react';

import { openAssistant } from '@/components/site/openAssistant';
import { Button } from '@/components/ui/Button';

/** The floating launcher. It asks the assistant panel to open through the page-wide event. */
export default function Assistant() {
  return (
    <Button
      size="lg"
      onClick={openAssistant}
      className="fixed right-[max(1rem,env(safe-area-inset-right))] bottom-[max(1rem,env(safe-area-inset-bottom))] z-50 rounded-full px-5 shadow-float"
    >
      <MessageCircle aria-hidden="true" className="size-5" />
      Ask Mini Vic
    </Button>
  );
}
