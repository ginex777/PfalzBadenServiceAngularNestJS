const target = process.env.PBS_API_PROXY_TARGET ?? 'http://localhost:3000';

module.exports = [
  {
    context: ['/api'],
    target,
    secure: false,
    changeOrigin: true,
    logLevel: 'warn',
  },
];

