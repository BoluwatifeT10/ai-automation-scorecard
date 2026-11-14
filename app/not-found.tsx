import { ButtonLink } from "@/components/ui";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-20 sm:px-6">
      <h1 className="text-3xl font-semibold tracking-tight">This page is not available</h1>
      <p className="mt-3 text-sm leading-6 text-muted">The link does not match a page in the scorecard.</p>
      <ButtonLink href="/" className="mt-6 w-full sm:w-auto">
        Back to the start
      </ButtonLink>
    </div>
  );
}
