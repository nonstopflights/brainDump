// Build first with `npm run build`, then start with `pm2 start ecosystem.config.js`.
// Next.js loads .env.local from this directory when the server starts.
const port = process.env.PORT || '3200';
const host = process.env.DAYBOOK_HOST || '127.0.0.1';

if (!/^\d{1,5}$/.test(port) || Number(port) < 1 || Number(port) > 65535) {
  throw new Error('PORT must be a valid TCP port');
}
if (!/^[a-zA-Z0-9.:-]+$/.test(host)) {
  throw new Error('DAYBOOK_HOST must be a hostname or IP address');
}

module.exports = {
  apps: [{
    name: 'daybook',
    cwd: __dirname,
    script: './node_modules/next/dist/bin/next',
    args: `start --hostname ${host} --port ${port}`,
    exec_mode: 'fork',
    instances: 1,
    watch: false,
    autorestart: true,
    env: { NODE_ENV: 'production' },
  }],
};
