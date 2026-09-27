// Root entrypoint for Cloud Platforms (Railway, Render, Heroku)
// Forwards execution to the compiled Central Backend
const path = require('path');
const backendDist = path.join(__dirname, 'services', 'backend', 'smart-health-platform', 'backend', 'dist', 'src', 'index.js');

try {
  require(backendDist);
} catch (err) {
  // If dist doesn't exist yet, run with ts-node in development/fallback
  console.log('[root] Dist not found, executing via ts-node...');
  require('ts-node/register');
  require('./services/backend/smart-health-platform/backend/src/index.ts');
}
