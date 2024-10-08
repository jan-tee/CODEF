const path = require("path");

module.exports = {
  entry: "./src/index.ts", // The entry point of your application,
  devtool: "inline-source-map",
  output: {
    filename: "bundle.js", // Output bundle file
    path: path.resolve(__dirname, "dist"), // Output directory
    // library: "[name]",
    // libraryTarget: "window",
  },
  resolve: {
    extensions: [".ts", ".js"], // Resolve both .ts and .js files
  },
  module: {
    rules: [
      {
        test: /\.ts$/, // All files with a .ts extension will be handled by ts-loader
        use: "ts-loader",
        exclude: /node_modules/,
      },
    ],
  },
  devtool: "source-map", // Enables source maps for debugging
  mode: "development", // Or 'development' for easier debugging
};
