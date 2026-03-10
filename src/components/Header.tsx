import Link from "next/link";

export default function Header() {
  return (
    <header className="border-b border-slate-800 bg-black">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
        <Link href="/" className="text-xl font-black tracking-tight text-white">
          STORAGE<span className="text-safety-orange">NETWORK</span>
        </Link>
        <a
          href="https://www.storage-network.app"
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-md bg-safety-orange px-4 py-2 text-sm font-bold uppercase tracking-wide text-black shadow-lg shadow-safety-orange/25 transition-all hover:bg-safety-yellow hover:shadow-safety-yellow/30"
        >
          Get Started
        </a>
      </div>
    </header>
  );
}
