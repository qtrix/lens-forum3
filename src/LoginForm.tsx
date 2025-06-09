'use client';

import { useState } from 'react';
import {
  useAccount,
  useDisconnect,
  useWalletClient,
} from 'wagmi';
import {
  evmAddress,
  useAccountsAvailable,
  type EvmAddress,
  type AccountAvailable,
  useLogin,
} from '@lens-protocol/react';
import { signMessageWith } from '@lens-protocol/react/viem';
import { chains } from '@lens-chain/sdk/viem';
import { StorageClient, immutable } from '@lens-chain/storage-client';
import {
  PublicClient,
  mainnet,
} from '@lens-protocol/client';
import {
  createAccountWithUsername,
  fetchAccount,
} from '@lens-protocol/client/actions';
import { handleOperationWith } from '@lens-protocol/client/viem';
import { account as accountMetadata } from '@lens-protocol/metadata';
import {
  type Address,
  createWalletClient,
  custom,
} from 'viem';
import { useModal } from 'connectkit';

export function LoginWith({ signer, value }: { signer: EvmAddress; value: AccountAvailable }) {
  const { execute } = useLogin();
  const { data } = useWalletClient();

  const loginAs =
    value.__typename === 'AccountManaged'
      ? {
          accountManager: {
            account: value.account.address,
            manager: signer,
          },
        }
      : {
          accountOwner: {
            account: value.account.address,
            owner: signer,
          },
        };

  return (
    <button
      type='button'
      onClick={() => {
        execute({
          ...loginAs,
          signMessage: signMessageWith(data!),
        });
      }}
    >
      {value.account.username?.value ?? value.account.address}
    </button>
  );
}

export function LoginOptions({ address }: { address: string }) {
  const { data: availableAccounts, loading } = useAccountsAvailable({
    managedBy: evmAddress(address),
  });

  const [open, setOpen] = useState(false);
  const hasAccounts = !!availableAccounts?.items && availableAccounts.items.length > 0;

  if (loading) return <p>Loading profiles...</p>;

  if (hasAccounts) {
    return (
      <div className="relative inline-block">
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          onClick={() => setOpen((prev) => !prev)}
        >
          Select Profile
        </button>
        {open && (
          <div className="absolute right-0 mt-2 w-56 bg-white rounded shadow z-50">
            {availableAccounts!.items.map((item) => (
              <LoginWith
                key={item.account.address}
                signer={evmAddress(address)}
                value={item}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  return <CreateAccountFlow address={address} />;
}

function CreateAccountFlow({ address }: { address: string }) {
  const [creating, setCreating] = useState(false);
  const [username, setUsername] = useState('');
  const [loadingCreate, setLoadingCreate] = useState(false);

  const { execute } = useLogin();

  const handleCreateAccount = async () => {
    try {
      setLoadingCreate(true);

      const chain = chains.mainnet;

      const walletClient = createWalletClient({
        account: address as Address,
        chain,
        transport: custom(window.ethereum!),
      });

      const client = PublicClient.create({
        environment: mainnet,
      });

      const sessionClient = await client
        .login({
          onboardingUser: {
            wallet: walletClient.account.address,
            app: '0xA0B0592Fe935Ee8FbC4E105d7C6b523d2e6D0e6a', // Replace with your app contract address if needed
          },
          signMessage: async (message) =>
            walletClient.signMessage({ message }),
        })
        .match(
          (result) => result,
          (error) => {
            throw error;
          }
        );

      const storageClient = StorageClient.create();

      const metadata = accountMetadata({
        name: username,
      });

      const { uri } = await storageClient.uploadFile(
        new File([JSON.stringify(metadata)], 'metadata.json', {
          type: 'application/json',
        }),
        { acl: immutable(chain.id) }
      );

      const created = await createAccountWithUsername(sessionClient, {
        metadataUri: uri,
        username: {
          localName: username + Date.now(),
        },
      })
        .andThen(handleOperationWith(walletClient))
        .andThen(sessionClient.waitForTransaction)
        .andThen((txHash) => fetchAccount(sessionClient, { txHash }))
        .match(
          (result) => result,
          (error) => {
            throw error;
          }
        );

      alert(`Account created! Username: ${created?.username?.value}`);

      // Automatically login after account creation
      execute({
        accountOwner: {
          account: created?.address,
          owner: evmAddress(address),
        },
        signMessage: signMessageWith(walletClient),
      });

      setCreating(false);
      setUsername('');
    } catch (error) {
      console.error(error);
      alert('Failed to create Lens profile.');
    } finally {
      setLoadingCreate(false);
    }
  };

  if (creating) {
    return (
      <div className="space-y-2">
        <input
          type="text"
          placeholder="Enter username"
          className="border px-4 py-2 rounded w-full"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          disabled={loadingCreate}
        />
        <button
          onClick={handleCreateAccount}
          disabled={!username || loadingCreate}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
        >
          {loadingCreate ? 'Creating...' : 'Create Account'}
        </button>
      </div>
    );
  }

  return (
    <button
      className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
      onClick={() => setCreating(true)}
    >
      Create Account
    </button>
  );
}

export function LoginForm() {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { setOpen } = useModal();

  if (!isConnected) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="bg-teal-600 text-white px-4 py-2 rounded hover:bg-teal-700"
      >
        Connect Wallet
      </button>
    );
  }

  return (
    <div className="space-y-4">
      <button
        onClick={() => disconnect()}
        className="text-red-600 underline text-sm"
      >
        Disconnect
      </button>
      <LoginOptions address={address!} />
    </div>
  );
}
