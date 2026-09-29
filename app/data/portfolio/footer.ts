/**
 * Footer-only provenance and disclosure copy.
 *
 * The legal line and links stay in the component so their markup remains exactly
 * as shipped; this module supplies the additional typed facts the footer prints
 * beneath it.
 */
export const footerContent = {
  cv: {
    label: 'CV PDF',
    md5Label: 'CV MD5',
    href: '/docs/Vik_Resume_Final.pdf',
  },
  build: {
    label: 'Build',
    unstampedLabel: 'Build not stamped',
  },
  syntheticDisclosure:
    'Synthetic media: The assistant’s face is a model-generated likeness built from Vikram Deshpande’s own photograph, and its greeting is his own voice, cloned. Both are his; neither is a recording of him.',
} as const;
