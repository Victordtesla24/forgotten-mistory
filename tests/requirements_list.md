# Functional Requirements

1.  **Preloader**
    *   Displays a loading counter starting at 0 and ending at 100.
    *   The preloader container (`.preloader`) hides (height becomes 0) after the loading sequence completes.

2.  **Navigation**
    *   Displays the logo "VICTOR.".
    *   "Menu" button opens a full-screen overlay (`.nav-overlay`).
    *   Navigation links (Home, About, Experience, Work, Contact) are present.
    *   Clicking a navigation link closes the menu overlay.

3.  **Hero Section**
    *   Displays "Hello, I'm Victor" with a reveal animation.
    *   Displays subtitle "Creative Developer & Tech Enthusiast".
    *   Contains functional links to GitHub, YouTube, and a "Let's Talk" (Contact) anchor.
    *   Avatar placeholder is visible.

4.  **About Section**
    *   Section exists with ID `about`.
    *   Displays "About Me" title.
    *   Contains biographical text.

5.  **Experience Section**
    *   Section exists with ID `experience`.
    *   Displays "Experience" title.
    *   Contains a timeline with at least 3 entries (Senior Developer, Full Stack Engineer, Junior Developer).

6.  **Work Section**
    *   Section exists with ID `work`.
    *   Displays "Selected Work" title.
    *   Contains project cards with titles (e.g., "GitHub Portfolio").

7.  **Contact Section**
    *   Section exists with ID `contact`.
    *   Displays "Have an idea?" title.
    *   Contains a `mailto` link for `contact@victor.com`.
    *   Contains social media links (GitHub, YouTube, LinkedIn).

8.  **Visual Design & Interactivity**
    *   Custom cursor (dot and outline) follows mouse movement.
    *   Cursor outline scales when hovering over links.
    *   Background color is dark (`rgb(10, 10, 10)` or similar).
    *   Fonts `Playfair Display` and `Inter` are used.
