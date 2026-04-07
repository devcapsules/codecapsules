import Head from 'next/head';
import { useAuth } from '../../contexts/AuthContext';

export default function ProfilePage() {
  const { user } = useAuth();

  return (
    <>
      <Head>
        <title>Profile | Devcapsules Learn</title>
      </Head>
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 text-white">
        <h1 className="text-3xl font-bold mb-3">Profile</h1>
        <p className="text-gray-300 mb-8">
          Manage your learner identity and account details.
        </p>

        <div className="rounded-xl border border-gray-800 bg-gray-950/60 p-6 space-y-3">
          <div>
            <p className="text-sm text-gray-400">Email</p>
            <p className="text-white">{user?.email || 'Not signed in'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-400">Name</p>
            <p className="text-white">{user?.user_metadata?.full_name || 'Not set'}</p>
          </div>
        </div>
      </section>
    </>
  );
}
