import { listenContent } from './listen';

export type ListenRouteId = 'neutral' | 'engage' | 'email' | 'phone' | 'linkedin' | 'github';

export interface ListenRouteVisual {
  id: ListenRouteId;
  href: string;
  label: string;
  currentRoute: string;
}

export const neutralListenRoute = {
  id: 'neutral',
  label: 'No route selected',
  currentRoute: 'Resonance neutral — focus or hover a real contact route.',
} as const;

export const listenRouteVisuals: readonly ListenRouteVisual[] = [
  {
    id: 'engage',
    href: listenContent.engage.href,
    label: listenContent.engage.label,
    currentRoute: 'Current route: engagement enquiry mailto.',
  },
  {
    id: 'email',
    href: listenContent.channels[0].href,
    label: listenContent.channels[0].label,
    currentRoute: 'Current route: email address.',
  },
  {
    id: 'phone',
    href: listenContent.channels[1].href,
    label: listenContent.channels[1].label,
    currentRoute: 'Current route: phone link.',
  },
  {
    id: 'linkedin',
    href: listenContent.channels[2].href,
    label: listenContent.channels[2].label,
    currentRoute: 'Current route: LinkedIn profile.',
  },
  {
    id: 'github',
    href: listenContent.channels[3].href,
    label: listenContent.channels[3].label,
    currentRoute: 'Current route: GitHub profile.',
  },
] as const;

export function visualForHref(href: string): ListenRouteVisual | undefined {
  return listenRouteVisuals.find((route) => route.href === href);
}
