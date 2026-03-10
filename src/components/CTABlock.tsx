export default function CTABlock() {
  return (
    <div className="not-prose my-10 rounded-lg border border-slate-700 bg-slate-900 p-6 text-center sm:p-8">
      <h3 className="mb-2 text-xl font-bold text-white sm:text-2xl">
        Build Smarter. Waste Less Material.
      </h3>
      <p className="mb-5 text-slate-400">
        Storage Network auto-generates cut-lists, 3D models, and material
        estimates so you can quote faster and build with confidence.
      </p>
      <a
        href="https://www.storage-network.app"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-block rounded-md bg-safety-orange px-8 py-3 text-base font-bold uppercase tracking-wide text-black shadow-lg shadow-safety-orange/25 transition-all hover:bg-safety-yellow hover:shadow-safety-yellow/30"
      >
        Try Storage Network Free
      </a>
    </div>
  );
}
