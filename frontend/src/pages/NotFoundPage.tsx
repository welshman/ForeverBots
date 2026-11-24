import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <section aria-labelledby="not-found-heading" className="mx-auto max-w-xl space-y-4 py-12">
      <h1 id="not-found-heading" className="text-3xl font-bold">Page not found</h1>
      <p>This address does not match a ForeverBots page.</p>
      <nav aria-label="Find your way back" className="flex flex-wrap gap-4">
        <Link></Link>
      </nav>
    </section>
  );
}
