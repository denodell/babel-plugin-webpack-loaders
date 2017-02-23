var path = require('path'); // eslint-disable-line no-var
var ExtractTextPlugin = require('extract-text-webpack-plugin'); // eslint-disable-line no-var
var autoprefixer = require('autoprefixer');  // eslint-disable-line no-var

module.exports = {
  output: {
    // for babel plugin
    libraryTarget: 'commonjs2',
    // where to place webpack files
    path: path.join(__dirname, '../build/myCoolLibrary/assets'),
    // for url-loader if limit exceeded to set publicPath
    publicPath: '/assets/',
  },
  plugins: [
    new ExtractTextPlugin(`${path.parse(process.argv[2]).name}.css`),
  ],
  postcss: [
    autoprefixer({ browsers: ['last 2 versions'] }),
  ],
  module: {
    rules: [
      {
        test: /\.sass$/,
        use: ExtractTextPlugin.extract(
          'style-loader',
          [
            {
              loader: 'css-loader',
              options: {
                modules: true,
                importLoaders: 2,
                localIdentName: '[name]__[local]--[hash:base64:5]',
              },
            },
            'postcss-loader',
            {
              loader: 'sass-loader',
              options: {
                precision: 10,
                indentedSyntax: 'sass',
              },
            },
          ]
        ),
      },
      {
        test: /\.css$/,
        use: ExtractTextPlugin.extract({
          fallback: 'style-loader',
          use: [
            {
              loader: 'css-loader',
              options: {
                modules: true,
                importLoaders: 2,
                localIdentName: '[name]__[local]--[hash:base64:5]',
              },
            },
            'postcss-loader',
          ],
        }),
      },
      {
        test: /\.png$/,
        use: {
          loader: 'url-loader',
          options: {
            limit: 7000,
          },
        },
      },
      {
        test: /\.txt$/,
        use: ['file-loader'],
      },
    ],
  },
};
