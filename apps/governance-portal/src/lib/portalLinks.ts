export function getPortalUrls() {
  const isBrowser = typeof window !== 'undefined';
  const hostname = isBrowser ? window.location.hostname : '';
  const isPagesDev = hostname.includes('pages.dev');
  const isLocalhost = hostname.includes('localhost') || hostname.includes('127.0.0.1');

  let phcUrl = process.env.NEXT_PUBLIC_PHC_URL;
  let bricsUrl = process.env.NEXT_PUBLIC_BRICS_URL;
  let govUrl = process.env.NEXT_PUBLIC_GOVERNANCE_URL;

  if (!phcUrl) {
    if (isLocalhost) {
      phcUrl = 'http://localhost:5173';
    } else {
      phcUrl = 'https://smart-health-phc-portal.pages.dev';
    }
  }

  if (!bricsUrl) {
    if (isLocalhost) {
      bricsUrl = 'http://localhost:5174';
    } else {
      bricsUrl = 'https://smart-health-brics-portal.pages.dev';
    }
  }

  if (!govUrl) {
    if (isLocalhost) {
      govUrl = 'http://localhost:3000';
    } else if (isPagesDev && hostname.startsWith('smart-health-supply-chain-resilience')) {
      govUrl = 'https://smart-health-supply-chain-resilience.pages.dev';
    } else {
      govUrl = 'https://smart-health-governance-portal.pages.dev';
    }
  }

  return { phcUrl, bricsUrl, govUrl };
}
