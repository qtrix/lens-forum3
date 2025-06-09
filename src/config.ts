import { polygon } from 'wagmi/chains';
import { getDefaultConfig } from 'connectkit';
import { http, createConfig } from 'wagmi';

export const config = createConfig(
  getDefaultConfig({
    chains: [polygon],
    transports: {
        [polygon.id]: http(polygon.rpcUrls.default.http[0]!),
    },
    walletConnectProjectId: '',
    appName: 'Lens + ConnectKit Example',
    appDescription: 'A sample app integrating ConnectKit and Lens React SDK.',
    appUrl: `${import.meta.env.BASE_URL}`,
  }),
);
