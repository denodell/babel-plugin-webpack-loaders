import path from 'path';

export default {
  output: {
    // YOU NEED TO SET libraryTarget: 'commonjs2'
    libraryTarget: 'commonjs2',
  },
  module: {
    rules: [
      {
        test: /\.css$/,
        use: [
          'style-loader',
          {
            loader: 'css-loader',
            options: {
              modules: true,
              importLoaders: 1,
              localIdentName: '[name]__[local]',
            },
          },
          'postcss-loader',
        ],
        include: [
          path.join(__dirname, 'assets/withoutExtractText'),
        ],
      },
    ],
  },
};
