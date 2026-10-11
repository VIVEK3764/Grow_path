import Link from "next/link";
export default function Investments() {
  return (
    <section className="narrow empty-state">
      <h1>Your bigger picture</h1>
      <p>
        Path tracks money you set aside for goals. It does not connect to your
        investment account or execute trades.
      </p>
      <Link href="/goals" className="primary">
        View my goals
      </Link>
      <a
        href="https://groww.in"
        target="_blank"
        rel="noreferrer"
        className="text-button full"
      >
        Open Groww ↗
      </a>
    </section>
  );
}
