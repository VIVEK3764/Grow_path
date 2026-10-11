"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <section className="empty-state">
      <h1>Something didn’t load.</h1>
      <p>
        Please check your connection and try again. If this is a new setup,
        apply the Supabase migration first.
      </p>
      <button className="primary" onClick={reset}>
        Try again
      </button>
    </section>
  );
}
