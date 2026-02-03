'use client';

import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function AuthButton({ displayName }: { displayName?: string | null }) {
  const router = useRouter();
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/landing');
  };

  return (
    <div className="flex items-center gap-3">
      {displayName && (
        <span className="text-sm text-muted hidden sm:block">{displayName}</span>
      )}
      <button
        onClick={handleSignOut}
        className="text-sm px-3 py-1.5 rounded-lg border border-border text-muted hover:text-foreground hover:border-accent/50 transition-colors"
      >
        Sign Out
      </button>
    </div>
  );
}
