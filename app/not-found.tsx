import Link from "next/link";

import { Container } from "@/components/ui/Container";

export default function NotFoundPage() {
  return (
    <main className="page-shell">
      <Container>
        <h1>Page not found</h1>
        <p>The resource you requested does not exist on this site.</p>
        <p>
          <Link href="/">Back to home</Link>
        </p>
      </Container>
    </main>
  );
}
