export interface NavItem {
  /** The id of the page section the link scrolls to. */
  id: string;
  label: string;
}

/** The anchors in the header and the mobile menu, in page order. */
export const navItems: readonly NavItem[] = [
  { id: 'experience', label: 'Experience' },
  { id: 'work', label: 'Work' },
  { id: 'capabilities', label: 'Capabilities' },
  { id: 'about', label: 'About' },
  { id: 'contact', label: 'Contact' },
];
