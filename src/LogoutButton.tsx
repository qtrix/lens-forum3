import { useLogout } from '@lens-protocol/react';
import { useDisconnect } from 'wagmi';
import { useState } from 'react';
import { ArrowRightOnRectangleIcon } from '@heroicons/react/24/solid';

interface LogoutButtonProps {
  className?: string;
}
export function LogoutButton({ className = '' }: LogoutButtonProps) {
  const { execute } = useLogout();
  const { disconnectAsync } = useDisconnect();
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);
    try {
      await execute();
      await disconnectAsync();
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={loading}
      style={{
        backgroundColor: "#bb86fc",
        color: "#121212",
        fontWeight: "700",
        padding: "12px 24px",
        borderRadius: "8px",
        border: "none",
        boxShadow: "0 4px 14px rgba(187, 134, 252, 0.6)",
        cursor: "pointer"
      }}
    >
      {loading ? 'Logging out...' : 'Logout'}
    </button>
  );
}

