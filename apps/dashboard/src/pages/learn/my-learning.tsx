import Head from 'next/head';

export default function MyLearningPage() {
  return (
    <>
      <Head>
        <title>My Learning | Devcapsules Learn</title>
      </Head>
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 text-white">
        <h1 className="text-3xl font-bold mb-3">My Learning</h1>
        <p className="text-gray-300 mb-8">
          Track your in-progress courses and completed capsules here.
        </p>

        <div className="rounded-xl border border-gray-800 bg-gray-950/60 p-6">
          <p className="text-gray-400">
            No tracked activity yet. Start a course from Browse to see progress appear.
          </p>
        </div>
      </section>
    </>
  );
}
