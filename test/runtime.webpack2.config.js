module.exports = function config() {
  return {
    output: {
      // YOU NEED TO SET libraryTarget: 'commonjs2'
      libraryTarget: 'commonjs2',
    },
    module: {
      rules: [
        {
          test: /\.txt$/,
          use: {
            loader: 'file-loader',
            options: {
              name: '[name].[ext]',
            },
          },
        },
      ],
    },
  };
};
