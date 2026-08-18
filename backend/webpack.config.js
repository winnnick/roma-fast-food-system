const path = require('node:path');

const systemDrive = process.env.SystemDrive || 'C:';

const archivosSistemaWindows = [
  'pagefile.sys',
  'hiberfil.sys',
  'swapfile.sys',
].map((archivo) => path.resolve(`${systemDrive}\\`, archivo));

module.exports = (options) => ({
  ...options,
  resolve: {
    ...(options.resolve ?? {}),
    alias: {
      ...(options.resolve?.alias ?? {}),
      '@roma/shared': path.resolve(__dirname, 'libs/shared/src'),
    },
  },
  watchOptions: {
    ...(options.watchOptions ?? {}),
    ignored: [
      '**/node_modules/**',
      '**/.git/**',
      '**/dist/**',
      '**/.runtime/**',
      ...archivosSistemaWindows,
    ],
  },
});
