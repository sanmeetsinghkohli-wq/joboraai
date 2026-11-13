import { redirect } from 'next/navigation';

/** Job links open the job inside the Jobs page. */
export default function Page({ params }: { params: { id: string } }) {
  redirect(`/jobs?selected=${encodeURIComponent(params.id)}`);
}
