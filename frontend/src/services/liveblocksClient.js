import { createClient } from "@liveblocks/client";

const apiKey = process.env.REACT_APP_LIVEBLOCKS_PUBLIC_KEY;

// Debug logging
console.log('🔍 Liveblocks API Key Check:');
console.log('- Variable exists:', typeof apiKey !== 'undefined');
console.log('- Value length:', apiKey ? apiKey.length : 0);
console.log('- Starts with pk_:', apiKey ? apiKey.startsWith('pk_') : false);
console.log('- First 10 chars:', apiKey ? apiKey.substring(0, 10) + '...' : 'undefined');

if (!apiKey || apiKey === 'your_public_api_key_here' || apiKey.trim() === '') {
  console.error('⚠️ Liveblocks API key is missing or not set!');
  console.error('Please add REACT_APP_LIVEBLOCKS_PUBLIC_KEY to your .env file');
  console.error('Format: REACT_APP_LIVEBLOCKS_PUBLIC_KEY=pk_your_key_here');
  console.error('Make sure:');
  console.error('  1. File is named .env (not .env.local)');
  console.error('  2. File is in the frontend/ directory');
  console.error('  3. No quotes around the value');
  console.error('  4. No spaces around the = sign');
  console.error('  5. Dev server was restarted after creating .env');
}

if (!apiKey || apiKey.trim() === '') {
  throw new Error(
    'Liveblocks API key is required. Please add REACT_APP_LIVEBLOCKS_PUBLIC_KEY to your .env file and restart the dev server.'
  );
}

const client = createClient({
  publicApiKey: apiKey,
});

export default client;

