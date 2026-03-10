export default function CTABanner() {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-700 bg-black/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <p className="text-sm font-medium text-slate-300 sm:text-base">
          Stop doing lumber math in your head. Auto-generate cut-lists and 3D
          models with{" "}
          <span className="font-bold text-white">Storage Network</span>.
        </p>
        <a
          href="https://www.storage-network.app"
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 rounded-md bg-safety-orange px-5 py-2.5 text-sm font-bold uppercase tracking-wide text-black shadow-lg shadow-safety-orange/25 transition-all hover:bg-safety-yellow hover:shadow-safety-yellow/30"
        >
          Try Free
        </a>
      </div>
    </div>
  );
}
