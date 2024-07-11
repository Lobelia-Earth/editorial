const presets = [
  [
    '@babel/env',
    {
      targets: {
        firefox: '60',
        chrome: '67',
      },
      useBuiltIns: 'usage',
      corejs: 3,
    },
  ],
  '@babel/react',
  '@babel/flow',
];

const plugins = ['@babel/proposal-class-properties', 'styled-jsx/babel'];

module.exports = { presets, plugins };
