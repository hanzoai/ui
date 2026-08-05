const path = require('path')

// The whole config. No @hanzo/ui in it — no alias to the package, no transpile
// list, no CSS plugin of its own. That absence is the claim being tested, same
// as the Vite consumer beside it.
//
// The two resolutions below are react-native-web's, not ours, and every RNW app
// on webpack carries them — Next apps included. @hanzo/gui renders through RNW
// on the web, and react-native-svg's web build imports bare `react-native`,
// which only resolves once `.web.js` outranks `.js`. Without them webpack tries
// to parse react-native's Flow source and fails loudly at the bundler, which is
// a different animal from the defect this file exists to catch.
module.exports = {
  entry: './entry.js',
  output: { path: path.resolve(__dirname, 'out'), filename: 'bundle.js' },
  // style-loader + css-loader is the pair Next runs, and css-loader is the one
  // that RESOLVES url(). Without it the stylesheet is never parsed and this
  // test proves nothing about the regression it exists for.
  module: { rules: [{ test: /\.css$/i, use: ['style-loader', 'css-loader'] }] },
  resolve: {
    alias: { 'react-native': 'react-native-web' },
    extensions: ['.web.js', '.web.jsx', '.web.ts', '.web.tsx', '.mjs', '.js', '.jsx', '.json'],
    conditionNames: ['import', 'require', 'default'],
  },
  performance: { hints: false },
  stats: 'errors-only',
}
