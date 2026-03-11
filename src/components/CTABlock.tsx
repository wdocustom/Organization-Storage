interface CTABlockProps {
  category: string;
}

export default function CTABlock({ category }: CTABlockProps) {
  const isHomeowner = category === "homeowner-guide";

  return (
    <div className="not-prose my-10 rounded-lg border border-slate-700 bg-slate-900 p-6 text-center sm:p-8">
      {isHomeowner ? (
        <>
          <h3 className="mb-2 text-xl font-bold text-white sm:text-2xl">
            Ready to Get Your Garage Back?
          </h3>
          <p className="mb-5 text-slate-400">
            Find a qualified installer in your area who builds custom tote
            shelving systems with real lumber — no flimsy kits.
          </p>
          <a
            href="https://www.storage-network.app"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block rounded-md bg-safety-orange px-8 py-3 text-base font-bold uppercase tracking-wide text-black shadow-lg shadow-safety-orange/25 transition-all hover:bg-safety-yellow hover:shadow-safety-yellow/30"
          >
            Get a Free Quote
          </a>
        </>
      ) : (
        <>
          <h3 className="mb-2 text-xl font-bold text-white sm:text-2xl">
            Build Smarter. Waste Less Material.
          </h3>
          <p className="mb-5 text-slate-400">
            Storage Network auto-generates cut-lists, 3D models, and material
            estimates so you can quote faster and build with confidence.
          </p>
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <a
              href="https://www.storage-network.app/join"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block rounded-md bg-safety-orange px-8 py-3 text-base font-bold uppercase tracking-wide text-black shadow-lg shadow-safety-orange/25 transition-all hover:bg-safety-yellow hover:shadow-safety-yellow/30"
            >
              Join the Network
            </a>
            <a
              href="https://www.storage-network.app/features"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block rounded-md border border-slate-600 px-8 py-3 text-base font-bold uppercase tracking-wide text-white transition-all hover:border-slate-400 hover:text-slate-200"
            >
              See Features
            </a>
          </div>
        </>
      )}
    </div>
  );
}
