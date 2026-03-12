"use client";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-24 text-center sm:px-6">
      <h1 className="mb-4 text-4xl font-black text-white">
        Something went wrong
      </h1>
      <p className="mb-8 text-lg text-slate-400">
        An unexpected error occurred. Please try again.
      </p>
      <button
        onClick={reset}
        className="inline-block rounded-md bg-safety-orange px-8 py-3 text-base font-bold uppercase tracking-wide text-black shadow-lg shadow-safety-orange/25 transition-all hover:bg-safety-yellow hover:shadow-safety-yellow/30"
      >
        Try Again
      </button>
    </div>
  );
}
