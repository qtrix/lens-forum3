import { mainnet, PublicClient } from '@lens-protocol/react';

export const client = PublicClient.create({
  environment: mainnet, // ✅ Not testnet
});
