import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-24 text-center sm:px-6">
      <h1 className="mb-4 text-6xl font-black text-white">404</h1>
      <p className="mb-8 text-lg text-slate-400">
        This page doesn&apos;t exist or has been moved.
      </p>
      <Link
        href="/"
        className="inline-block rounded-md bg-safety-orange px-8 py-3 text-base font-bold uppercase tracking-wide text-black shadow-lg shadow-safety-orange/25 transition-all hover:bg-safety-yellow hover:shadow-safety-yellow/30"
      >
        Back to Home
      </Link>
    </div>
  );
}
