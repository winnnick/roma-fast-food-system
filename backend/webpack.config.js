const path = require('node:path');

module.exports = (options) => ({
  ...options,
  resolve: {
    ...(options.resolve ?? {}),
    alias: {
      ...(options.resolve?.alias ?? {}),
      '@roma/shared': path.resolve(__dirname, 'libs/shared/src'),
    },
  },
});
