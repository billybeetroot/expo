module.exports = function (api) {
  api.cache(true)
  const isTesting = process.env.NODE_ENV === 'test'
  return {
    presets: [
      isTesting
        ? 'babel-preset-expo'
        : ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
      ...(!isTesting ? ['nativewind/babel'] : []),
    ],
  }
}
