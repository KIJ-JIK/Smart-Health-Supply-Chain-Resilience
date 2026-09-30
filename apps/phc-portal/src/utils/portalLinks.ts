export function getPortalUrls() {
  const isBrowser = typeof window !== 'undefined';
  const hostname = isBrowser ? window.location.hostname : '';
  const isPagesDev = hostname.includes('pages.dev');
  const isLocalhost = hostname.includes('localhost') || hostname.includes('127.0.0.1');

  let phcUrl = (import.meta as any).env?.VITE_PHC_URL;
  let bricsUrl = (import.meta as any).env?.VITE_BRICS_URL;
  let govUrl = (import.meta as any).env?.VITE_GOVERNANCE_URL;

  if (!phcUrl) {
    phcUrl = isLocalhost ? 'http://localhost:5173' : 'https://smart-health-supply-chain-resilience.pages.dev';
  }
  if (!bricsUrl) {
    bricsUrl = isLocalhost ? 'http://localhost:5174' : 'https://smart-health-brics-portal.pages.dev';
  }
  if (!govUrl) {
    govUrl = isLocalhost ? 'http://localhost:3000' : 'https://smart-health-governance-portal.pages.dev';
  }

  return { phcUrl, bricsUrl, govUrl };
}
