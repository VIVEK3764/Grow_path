import Link from "next/link";
export default function NotFound() {
  return (
    <section className="empty-state">
      <h1>Page not found</h1>
      <p>This item may have been removed or belong to another account.</p>
      <Link href="/path" className="primary">
        Back to Path
      </Link>
    </section>
  );
}
