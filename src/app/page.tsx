import { getAuthSession } from 'lib/auth';
import { redirect } from 'next/navigation';

export default async function HomePage() {
  const session = await getAuthSession();

  if (!session) {
    redirect('/login');
  }

  redirect('/dashboard');
}
