// webpack.config.js
const path = require('path')
const VueLoaderPlugin = require('vue-loader/lib/plugin')
const WebpackUserscript = require('webpack-userscript')

module.exports = (env, options) => {
  prodMode = options.mode === 'production'
  return {
    entry: path.resolve(__dirname, 'index.js'),
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: 'inw.user.js'
    },
    devServer: {
      contentBase: path.join(__dirname, 'dist')
    },
    devtool: prodMode ? false : 'inline-source-map',
    devtool: false,
    module: {
      rules: [
        {
          test: /\.vue$/,
          loader: 'vue-loader'
        }
      ]
    },
    plugins: [
      new VueLoaderPlugin(),
      new WebpackUserscript({
        headers: {
          namespace: `[homepage]`,
          author: `[author]`,
          match: 'https://www.isnichwahr.de',
          downloadURL: `[homepage]/raw/master/inw/dist/inw.user.js`,
          version: prodMode ? `[version]` : `[version]-build.[buildNo]` 
        },
        proxyScript: {
          baseUrl: 'http://127.0.0.1:8080',
          filename: '[basename].proxy.user.js',
          enable: true
        }
      })
    ]
  }
}
