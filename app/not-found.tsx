'use client';

export default function NotFound() {
  return (
    <html>
      <body className="bg-black text-white min-h-screen flex items-center justify-center">
        <div className="text-center space-y-2">
          <p className="text-sm uppercase tracking-[0.3em] text-neutral-400">Signal Lost</p>
          <h1 className="text-3xl font-semibold">404 — Page not found</h1>
          <p className="text-neutral-400">This route drifted beyond the warp corridor.</p>
        </div>
      </body>
    </html>
  );
}
