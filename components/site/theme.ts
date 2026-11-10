/** localStorage key holding the reader's choice: 'light' or 'dark'. Absent means follow the system. */
export const THEME_KEY = 'theme';

/**
 * Runs in <head> before first paint so the stored theme is applied without a
 * flash. Storage can throw (private windows, blocked site data), in which case
 * the system preference stands.
 */
export const themeInitScript = `(function(){try{var t=localStorage.getItem('${THEME_KEY}');if(t==='light'||t==='dark'){document.documentElement.dataset.theme=t;}}catch(e){}})();`;
