import { createRoot } from 'react-dom/client';
import './index.css';

import { Suspense } from 'react';
import { App } from './App';
import { Web3Providers } from './Web3Providers';

createRoot(document.getElementById('root')!).render(
  <Web3Providers>
    <Suspense fallback={<p>Loading...</p>}>
      <App />
    </Suspense>
  </Web3Providers>,
);
