'use client';

import Link from 'next/link';

const FEATURES = [
  { title: 'Log Trades', desc: 'Track every entry, exit, and setup with detailed metadata', icon: '&#9998;' },
  { title: 'Find Your Edge', desc: 'Analytics reveal which setups and sessions actually work', icon: '&#9889;' },
  { title: 'Build Discipline', desc: 'Rule checklists, emotional tracking, and reflection prompts', icon: '&#9733;' },
  { title: 'AI Coaching', desc: 'Claude analyzes your patterns and generates playbook rules', icon: '&#9881;' },
];

export default function LandingClient() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent to-accent-dim flex items-center justify-center">
            <span className="text-sm font-bold text-background">TE</span>
          </div>
          <span className="font-bold text-lg">Trading Edge</span>
        </div>
        <Link
          href="/login"
          className="text-sm px-4 py-2 rounded-lg bg-accent text-background font-semibold hover:opacity-90 transition-opacity"
        >
          Get Started
        </Link>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-16 text-center">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-4xl sm:text-5xl font-bold mb-4 bg-gradient-to-r from-accent via-amber-200 to-accent-dim bg-clip-text text-transparent">
            Build Your Trading Edge
          </h1>
          <p className="text-muted text-lg mb-8 max-w-lg mx-auto">
            A personal trading journal designed for Gold futures. Log trades, track emotions,
            analyze your edge, and let AI coach you to consistency.
          </p>
          <Link
            href="/login"
            className="inline-flex px-8 py-3 rounded-xl bg-gradient-to-r from-accent to-accent-dim text-background font-semibold text-lg hover:opacity-90 transition-opacity"
          >
            Start Journaling
          </Link>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto mt-16">
          {FEATURES.map((f) => (
            <div key={f.title} className="bg-card border border-border rounded-xl p-5 text-left">
              <div className="text-2xl mb-2" dangerouslySetInnerHTML={{ __html: f.icon }} />
              <h3 className="font-semibold mb-1">{f.title}</h3>
              <p className="text-sm text-muted">{f.desc}</p>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center text-xs text-muted py-6 border-t border-border">
        Trading Edge Builder &middot; Built for disciplined traders
      </footer>
    </div>
  );
}
