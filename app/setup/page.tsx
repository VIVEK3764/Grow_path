import Link from "next/link";
export default function Setup() {
  return (
    <section className="setup-page">
      <span className="eyebrow">CONNECTION REQUIRED</span>
      <h1>Your Path starts with a secure account.</h1>
      <p>
        The application is installed, but its Supabase connection is not
        configured yet.
      </p>
      <ol>
        <li>
          Copy <code>.env.example</code> to <code>.env.local</code>.
        </li>
        <li>Set the Supabase project URL and anon key.</li>
        <li>Run the SQL migration in Supabase’s SQL Editor.</li>
        <li>Add your server-side OpenAI key for Decode.</li>
        <li>
          Restart <code>npm run dev</code>.
        </li>
      </ol>
      <p>
        No sample accounts or balances are substituted when the database is
        unavailable.
      </p>
      <Link href="/login" className="primary">
        Check connection
      </Link>
      <small>See README.md for exact setup instructions.</small>
    </section>
  );
}
