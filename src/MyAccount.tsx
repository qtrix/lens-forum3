import { type EvmAddress, useAccount } from '@lens-protocol/react';

export function MyAccount({ address }: { address: EvmAddress }) {
  const { data } = useAccount({ address, suspense: true });

  return (
    <div className="bg-gray-800 rounded-lg p-6 text-white space-y-3 shadow-lg">
      <p><strong>Created on:</strong> {data?.createdAt}</p>
      <p><strong>Account Score:</strong> {data?.score}</p>
    </div>
  );
}
