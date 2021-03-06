// * Every now and then, we adopt best practices from CRA
// * https://tinyurl.com/yakv4ggx

// ? https://nodejs.org/en/about/releases
const NODE_OLDEST_LTS = '10.13.0';

module.exports = {
    parserOpts: { strictMode: true },
    plugins: [
        '@babel/plugin-proposal-export-default-from',
        '@babel/plugin-proposal-function-bind',
        '@babel/plugin-transform-typescript',
    ],
    // ? Sub-keys under the "env" config key will augment the above
    // ? configuration depending on the value of NODE_ENV and friends. Default
    // ? is: development
    env: {
        // * Used by Jest and `npm test`
        test: {
            sourceMaps: 'both',
            presets: [
                ['@babel/preset-env', { targets: { node: true }}],
                ['@babel/preset-typescript', { allowDeclareFields: true }],
                // ? We don't care about minification
            ]
        },
        // * Used by `npm run build`
        production: {
            presets: [
                ['@babel/preset-env', {
                    // ? https://github.com/babel/babel-loader/issues/521#issuecomment-441466991
                    //modules: false,
                    targets: { node: NODE_OLDEST_LTS }
                }],
                ['@babel/preset-typescript', { allowDeclareFields: true }],
                // ? Webpack will handle minification
            ]
        },
        // * Used by `npm run build-externals`
        external: {
            presets: [
                ['@babel/preset-env', { targets: { node: NODE_OLDEST_LTS } }],
                ['@babel/preset-typescript', { allowDeclareFields: true }],
                // ? Webpack will handle minification
            ]
        },
        // * Used for compiling ESM code into ./dist/lib/
        esm: {
            presets: [
                ['@babel/preset-env', {
                    // ? https://babeljs.io/docs/en/babel-preset-env#modules
                    modules: false,
                    targets: { node: NODE_OLDEST_LTS }
                }],
                ['@babel/preset-typescript', { allowDeclareFields: true }],
                // ? The end user will handle minification
            ],
            plugins: [
                // ? Interoperable named CJS imports for free
                'babel-plugin-transform-mjs-imports',
            ]
        },
    }
};
