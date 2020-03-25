var MinifyPlugin = require("babel-minify-webpack-plugin")
const CompressionPlugin = require("compression-webpack-plugin")
const CopyWebpackPlugin = require("copy-webpack-plugin")
var fs = require("fs")
var ip = require("ip")
var path = require("path")
const os = require('os')
var webpack = require("webpack")
const selfsigned = require("selfsigned")
const cors = require("cors")
const HtmlWebPackPlugin = require("html-webpack-plugin")

const pkg = require("./package.json")

const PORT = process.env.PORT || 3000

const production = process.env.NODE_ENV === "production"

const defaultHostName = `${os.hostname()}`
const host = process.env.HOST_IP || defaultHostName


function createHTTPSConfig() {
  // Generate certs for the local webpack-dev-server.
  if (fs.existsSync(path.join(__dirname, "certs"))) {
    const key = fs.readFileSync(path.join(__dirname, "certs", "key.pem"))
    const cert = fs.readFileSync(path.join(__dirname, "certs", "cert.pem"))

    return { key, cert }
  } else {
    const pems = selfsigned.generate(
      [
        {
          name: "commonName",
          value: "localhost"
        }
      ],
      {
        days: 365,
        algorithm: "sha256",
        extensions: [
          {
            name: "subjectAltName",
            altNames: [
              {
                type: 2,
                value: "localhost"
              },
              {
                type: 2,
                value: host
              }
            ]
          }
        ]
      }
    )

    fs.mkdirSync(path.join(__dirname, "certs"))
    fs.writeFileSync(path.join(__dirname, "certs", "cert.pem"), pems.cert)
    fs.writeFileSync(path.join(__dirname, "certs", "key.pem"), pems.private)

    return {
      key: pems.private,
      cert: pems.cert
    }
  }
}

const PLUGINS = [
  // Hot swap please!
  new webpack.HotModuleReplacementPlugin(),

  // Define env variables
  new webpack.EnvironmentPlugin({
    NODE_ENV: process.env.NODE_ENV,
    PACKAGE_VERSION: `${pkg.version}`
  })
]

if (production) {
  // compress and optimize code for production
  PLUGINS.push(new webpack.optimize.AggressiveMergingPlugin())
  PLUGINS.push(new CompressionPlugin())
  PLUGINS.push(
    // Serves the html
    new CopyWebpackPlugin([
      {
        // Note:- No wildcard is specified hence will copy all files and folders
        from: "assets", // Will resolve to RepoDir/src/assets
        to: "assets" // Copies all files from above dest to dist/assets
      },
      {
        from: "public", // Will resolve to RepoDir/src/assets
        to: "" // Copies all files from above dest to dist/assets
      },
      {
        from: "*.html",
        to: ""
      }
    ])
  )
}

module.exports = {
  devServer: {
    https: createHTTPSConfig(),
    host: "0.0.0.0",
    public: `${host}:${PORT}`,
    useLocalIp: true,
    allowedHosts: [host],
    headers: {
      "Access-Control-Allow-Origin": "*"
    },
    before: function(app) {
      // be flexible with people accessing via a local reticulum on another port
      app.use(cors({ origin: /hubs\.local(:\d*)?$/ }))
      // networked-aframe makes HEAD requests to the server for time syncing. Respond with an empty body.
      app.head("*", function(req, res, next) {
        if (req.method === "HEAD") {
          res.append("Date", new Date().toGMTString())
          res.send("")
        } else {
          next()
        }
      })
    }
  },
  performance: {
    // Ignore media and sourcemaps when warning about file size.
    assetFilter(assetFilename) {
      return !/\.(map|png|jpg|gif|glb|webm)$/.test(assetFilename)
    }
  },
  entry: {
    build: "./src/index.js"
  },
  output: {
    path: `${__dirname}/build`,
    filename: "[name].js",
    globalObject: "this"
  },
  mode: process.env.NODE_ENV || "development",
  watch: !production,
  watchOptions: {
    ignored: ["node_modules", "dist"]
  },
  node: {
    fs: "empty" // fixes bug with Draco making reference to fs from node
  },
  optimization: {
    minimize: production,
    splitChunks: {
      chunks: "async",
      minSize: 30000,
      maxSize: 0,
      minChunks: 1,
      maxAsyncRequests: 5,
      maxInitialRequests: 3,
      automaticNameDelimiter: "~",
      name: true,
      cacheGroups: {
        vendors: {
          test: /[\\/]node_modules[\\/]/,
          priority: -10
        },
        default: {
          minChunks: 2,
          priority: -20,
          reuseExistingChunk: true
        }
      }
    }
  },
  plugins: PLUGINS,
  module: {
    rules: [
      {
        test: /\.js/,
        exclude: /(node_modules)/,
        use: ["babel-loader", "aframe-super-hot-loader"]
      },
      {
        test: /\.html/,
        exclude: /(node_modules)/,
        use: [
          "aframe-super-hot-html-loader",
          {
            loader: "super-nunjucks-loader",
            options: {
              globals: {
                HOST: ip.address(),
                IS_PRODUCTION: process.env.NODE_ENV === "production"
              },
              path: process.env.NUNJUCKS_PATH || path.join(__dirname, "src")
            }
          },
          {
            loader: "html-require-loader",
            options: {
              root: path.resolve(__dirname, "src")
            }
          }
        ]
      },
      {
        test: /\.glsl/,
        exclude: /(node_modules)/,
        loader: "webpack-glsl-loader"
      },
      {
        test: /\.css$/,
        loader: "style-loader!css-loader"
      },
      {
        test: /\.jpg/,
        exclude: /(node_modules)/,
        use: ["url-loader"]
      },
      {
        test: /\.png$/,
        loader: "url-loader",
        query: { mimetype: "image/png" }
      }
    ]
  }
}
