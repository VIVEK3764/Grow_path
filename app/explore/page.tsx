import Link from "next/link";
import { lessons } from "@/lib/lessons";
export default function Explore() {
  return (
    <>
      <div className="page-heading">
        <div>
          <h1>A little more understanding.</h1>
          <p>Learn the basics before taking your next step.</p>
        </div>
      </div>
      <div className="product-grid">
        {[
          ["Stocks", "https://groww.in/stocks"],
          ["Mutual funds", "https://groww.in/mutual-funds"],
          ["IPOs", "https://groww.in/ipo"],
        ].map(([t, url]) => (
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="product-card"
            key={t}
          >
            <h3>{t} ↗</h3>
            <p>Explore on Groww</p>
          </a>
        ))}
      </div>
      <div className="section-heading">
        <h2>Build your confidence</h2>
      </div>
      {Object.entries(lessons).map(([id, l]) => (
        <Link key={id} className="resource-row" href={"/learn/" + id}>
          {l.title} →
        </Link>
      ))}
    </>
  );
}
