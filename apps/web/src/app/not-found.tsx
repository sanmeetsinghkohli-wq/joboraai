import { ButtonLink } from '@/components/ui/button';
import { Logo } from '@/components/ui/logo';

export default function NotFound() {
  return (
    <main id="main" className="flex min-h-screen flex-col items-center justify-center bg-ivory px-4 text-center">
      <Logo />
      <p className="eyebrow mt-10">Page not found</p>
      <h1 className="mt-2 font-serif text-3xl text-plum">This page does not exist</h1>
      <p className="mt-2 max-w-md text-ink-muted">The link may be out of date. Head back and try again.</p>
      <div className="mt-8 flex gap-2">
        <ButtonLink href="/dashboard">Go to your workspace</ButtonLink>
        <ButtonLink href="/" variant="secondary">Home</ButtonLink>
      </div>
    </main>
  );
}
