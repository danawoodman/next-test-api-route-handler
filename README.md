[![Black Lives Matter!](https://api.ergodark.com/badges/blm "Join the movement!")](https://secure.actblue.com/donate/ms_blm_homepage_2019)
[![Next.js compat](https://api.ergodark.com/badges/is-next-compat "This package works with Next.js up to and including this version")](https://www.npmjs.com/package/next-test-api-route-handler)
[![Next.js dependency version](https://api.ergodark.com/badges/next-lock-version "This package uses an internal API feature from this specific version of Next.js")](https://www.npmjs.com/package/next-test-api-route-handler)
[![Maintenance status](https://img.shields.io/maintenance/active/2020 "Is this package maintained?")](https://www.npmjs.com/package/next-test-api-route-handler)
[![Last commit timestamp](https://img.shields.io/github/last-commit/xunnamius/next-test-api-route-handler/develop "When was the last commit to the official repo?")](https://www.npmjs.com/package/next-test-api-route-handler)
[![Open issues](https://img.shields.io/github/issues/xunnamius/next-test-api-route-handler "Number of known issues with this package")](https://www.npmjs.com/package/next-test-api-route-handler)
[![Pull requests](https://img.shields.io/github/issues-pr/xunnamius/next-test-api-route-handler "Number of open pull requests")](https://www.npmjs.com/package/next-test-api-route-handler)
[![DavidDM dependencies](https://img.shields.io/david/xunnamius/next-test-api-route-handler "Status of this package's dependencies")](https://david-dm.org/xunnamius/next-test-api-route-handler)
[![Source license](https://img.shields.io/npm/l/next-test-api-route-handler "This package's source license")](https://www.npmjs.com/package/next-test-api-route-handler)
[![NPM version](https://api.ergodark.com/badges/npm-pkg-version/next-test-api-route-handler "Install this package using npm or yarn!")](https://www.npmjs.com/package/next-test-api-route-handler)

# next-test-api-route-handler

Trying to unit test your [Next.js API route
handlers](https://nextjs.org/docs/api-routes/introduction)? Want to avoid
mucking around with custom servers and writing boring test infra just to get
some unit tests working? Want your handlers to receive actual
[NextApiRequest](https://nextjs.org/docs/basic-features/typescript#api-routes)
and
[NextApiResponse](https://nextjs.org/docs/basic-features/typescript#api-routes)
objects rather than having to hack something together with express? Then look no
further! This package allows you to test your Next.js API routes/handlers in an
isolated Next.js-like environment simply, quickly, and without hassle.

This package uses Next.js's internal API resolver to precisely emulate API route
handling. Since this is not a public or documented interface, the next
dependency is locked to [![Next.js dependency
version](https://api.ergodark.com/badges/next-lock-version "This package uses an
internal API feature from this specific version of
Next.js")](https://www.npmjs.com/package/next-test-api-route-handler). What this
means is, barring a major (probably semver-major) change to how Next handles API
routes, **this package will not break even if the resolver interface changes
between Next releases**.

> Additionally, this package is automatically tested for compatibility with
> [each full release of Next.js](https://github.com/vercel/next.js/releases)
> with results visible in badge form: ![Next.js
> compat](https://api.ergodark.com/badges/is-next-compat "This package works
> with Next.js up to and including this version"). Any regressions between
> releases will be addressed as they're detected.



## Install

```Bash
npm install --save-dev next-test-api-route-handler
```

> Note: this is a [dual CJS2/ES module](#package-details) package

If you're looking for a version of this package compatible with a very old
version of Next.js, consult [CHANGELOG.md](CHANGELOG.md).

## Usage

```TypeScript
// ESM
import { testApiHandler } from 'next-test-api-route-handler'
```

```JavaScript
// CJS
const { testApiHandler } = require('next-test-api-route-handler');
```

The interface for `testApiHandler` looks like this:

```TypeScript
async function testApiHandler({ requestPatcher, responsePatcher, params, handler, test }: {
  requestPatcher?: (req: IncomingMessage) => void,
  responsePatcher?: (res: ServerResponse) => void,
  params?: Record<string, unknown>,
  handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void>
  test: (obj: { fetch: (init?: RequestInit) => ReturnType<typeof fetch> }) => Promise<void>,
})
```

`requestPatcher` is a function that receives an
[IncomingMessage](https://nodejs.org/api/http.html#http_class_http_incomingmessage).
Use this function to modify the request before it's injected into Next.js's
resolver.

`responsePatcher` is a function that receives an
[ServerResponse](https://nodejs.org/api/http.html#http_class_http_serverresponse).
Use this function to modify the response before it's injected into Next.js's
resolver.

`params` is an object representing "processed" dynamic routes, e.g. testing a
handler that expects `/api/user/:id` requires `params: { id: ...}`. This should
not be confused with requiring query string parameters, which are parsed out
from the url and added to the params object automatically.

`handler` is the actual route handler under test (usually imported from
`pages/api/*`). It should be an async function that accepts
[NextApiRequest](https://nextjs.org/docs/basic-features/typescript#api-routes)
and
[NextApiResponse](https://nextjs.org/docs/basic-features/typescript#api-routes)
objects as its two parameters.

`test` is a function that returns a promise (or async) where test assertions can
be run. This function receives one parameter: `fetch`, which is a simple
[unfetch](https://www.npmjs.com/package/isomorphic-unfetch) instance (**note
that the *url parameter*, i.e. the first parameter in
[`fetch(...)`](https://github.com/developit/unfetch#examples--demos), is
omitted**). Use this to send HTTP requests to the handler under test.

## Examples

### Testing an Unreliable API Handler @ `pages/api/unreliable`

Suppose we have an API endpoint we use to test our application's error handling.
The endpoint responds with status code `HTTP 200` for every request except the
10th, where status code `HTTP 555` is returned instead.

How might we test that this endpoint responds with `HTTP 555` once for every
nine `HTTP 200` responses?

```TypeScript
import * as UnreliableHandler from '../pages/api/unreliable'
import { testApiHandler } from 'next-test-api-route-handler'
import { shuffle } from 'fast-shuffle'
import array from 'array-range'

import type { WithConfig } from '@ergodark/next-types'

// Import the handler under test from the pages/api directory and respect the
// Next.js config object if it's exported
const unreliableHandler: WithConfig<typeof UnreliableHandler.default> = UnreliableHandler.default;
unreliableHandler.config = UnreliableHandler.config;

it('injects contrived errors at the required rate', async () => {
  expect.hasAssertions();

  // Signal to the endpoint (which is configurable) that there should be 1
  // error among every 10 requests
  process.env.REQUESTS_PER_CONTRIVED_ERROR = '10';

  const expectedReqPerError = parseInt(process.env.REQUESTS_PER_CONTRIVED_ERROR);

  // Returns one of ['GET', 'POST', 'PUT', 'DELETE'] at random
  const getMethod = () => shuffle(['GET', 'POST', 'PUT', 'DELETE'])[0];

  // Returns the status code from a response object
  const getStatus = async (res: Promise<Response>) => (await res).status;

  await testApiHandler({
    handler: unreliableHandler,
    test: async ({ fetch }) => {
      // Run 20 requests with REQUESTS_PER_CONTRIVED_ERROR = '10' and
      // record the results
      const results1 = await Promise.all([
        ...array(expectedReqPerError - 1).map(_ => getStatus(fetch({ method: getMethod() }))),
        getStatus(fetch({ method: getMethod() })),
        ...array(expectedReqPerError - 1).map(_ => getStatus(fetch({ method: getMethod() }))),
        getStatus(fetch({ method: getMethod() }))
      ].map(p => p.then(s => s, _ => null)));

      process.env.REQUESTS_PER_CONTRIVED_ERROR = '0';

      // Run 10 requests with REQUESTS_PER_CONTRIVED_ERROR = '0' and
      // record the results
      const results2 = await Promise.all([
        ...array(expectedReqPerError).map(_ => getStatus(fetch({ method: getMethod() }))),
      ].map(p => p.then(s => s, _ => null)));

      // We expect results1 to be an array with eighteen `200`s and two
      // `555`s in any order

      // https://github.com/jest-community/jest-extended#toincludesamemembersmembers
      // because responses could be received out of order
      expect(results1).toIncludeSameMembers([
        ...array(expectedReqPerError - 1).map(_ => 200),
        555,
        ...array(expectedReqPerError - 1).map(_ => 200),
        555
      ]);

      // We expect results2 to be an array with ten `200`s

      expect(results2).toStrictEqual([
        ...array(expectedReqPerError).map(_ => 200),
      ]);
    }
  });
});
```

### Testing a Flight Search API Handler @ `pages/api/v3/flights/search`

Suppose we have an *authenticated* API endpoint our application uses to search
for flights. The endpoint responds with an array of flights satisfying the
query.

How might we test that this endpoint returns flights in our database as
expected?

```TypeScript
import * as V3FlightsSearchHandler from '../pages/api/v3/flights/search'
import { testApiHandler } from 'next-test-api-route-handler'
import { DUMMY_API_KEY as KEY, getFlightData, RESULT_SIZE } from '../backend'
import array from 'array-range'

import type { WithConfig } from '@ergodark/next-types'

// Import the handler under test from the pages/api directory and respect the
// Next.js config object if it's exported
const v3FlightsSearchHandler: WithConfig<typeof V3FlightsSearchHandler.default> = V3FlightsSearchHandler.default;
v3FlightsSearchHandler.config = V3FlightsSearchHandler.config;

it('returns expected public flights with respect to match', async () => {
  expect.hasAssertions();

  // Get the flight data currently in the test database
  const flights = getFlightData();

  // Take any JSON object and stringify it into a URL-ready string
  const encode = (o: Record<string, unknown>) => encodeURIComponent(JSON.stringify(o));

  // This function will return in order the URIs we're interested in testing
  // against our handler. Query strings are parsed automatically, though we
  // also could have used `params` or `fetch({ ... })` itself instead.
  //
  // Example URI for `https://google.com/search?params=yes` would be
  // `/search?params=yes`
  const genUrl = function*() {
    yield `/?match=${encode({ airline: 'Spirit' })}`; // i.e. we want all the flights matching Spirit airlines!
    yield `/?match=${encode({ type: 'departure' })}`;
    yield `/?match=${encode({ landingAt: 'F1A' })}`;
    yield `/?match=${encode({ seatPrice: 500 })}`;
    yield `/?match=${encode({ seatPrice: { $gt: 500 }})}`;
    yield `/?match=${encode({ seatPrice: { $gte: 500 }})}`;
    yield `/?match=${encode({ seatPrice: { $lt: 500 }})}`;
    yield `/?match=${encode({ seatPrice: { $lte: 500 }})}`;
  }();

  await testApiHandler({
    // Patch the request object to include our dummy URI
    requestPatcher: req => {
      req.url = genUrl.next().value || undefined;
      // Could have done this instead of fetch({ headers: { KEY }}) below:
      // req.headers = { KEY };
    },

    handler: v3FlightsSearchHandler,

    test: async ({ fetch }) => {
      // 8 URLS from genUrl means 8 calls to fetch:
      const responses = await Promise.all(array(8).map(_ => {
        return fetch({ headers: { KEY }}).then(r => r.ok ? r.json() : r.status);
      }));

      // We expect all of the responses to be 200

      expect(responses.some(o => !o?.success)).toBe(false);

      // We expect the array of flights returned to match our
      // expectations given we already know what dummy data will be
      // returned:

      // https://github.com/jest-community/jest-extended#toincludesamemembersmembers
      // because responses could be received out of order
      expect(responses.map(r => r.flights)).toIncludeSameMembers([
        flights.filter(f => f.airline == 'Spirit').slice(0, RESULT_SIZE),
        flights.filter(f => f.type == 'departure').slice(0, RESULT_SIZE),
        flights.filter(f => f.landingAt == 'F1A').slice(0, RESULT_SIZE),
        flights.filter(f => f.seatPrice == 500).slice(0, RESULT_SIZE),
        flights.filter(f => f.seatPrice > 500).slice(0, RESULT_SIZE),
        flights.filter(f => f.seatPrice >= 500).slice(0, RESULT_SIZE),
        flights.filter(f => f.seatPrice < 500).slice(0, RESULT_SIZE),
        flights.filter(f => f.seatPrice <= 500).slice(0, RESULT_SIZE),
      ]);
    }
  });

  // We expect these two to fail with 400 errors

  await testApiHandler({
    handler: v3FlightsSearchHandler,
    requestPatcher: req => { req.url = `/?match=${encode({ ffms: { $eq: 500 }})}` },
    test: async ({ fetch }) => expect((await fetch({ headers: { KEY }})).status).toBe(400)
  });

  await testApiHandler({
    handler: v3FlightsSearchHandler,
    requestPatcher: req => { req.url = `/?match=${encode({ bad: 500 })}` },
    test: async ({ fetch }) => expect((await fetch({ headers: { KEY }})).status).toBe(400)
  });
});
```

See [test/index.test.ts](test/index.test.ts) for more examples.

## Documentation

Documentation can be found under [`docs/`](docs/README.md) and can be built with
`npm run build-docs`.

## Contributing

**New issues and pull requests are always welcome and greatly appreciated!** If
you submit a pull request, take care to maintain the existing coding style and
add unit tests for any new or changed functionality. Please lint and test your
code, of course!

### NPM Scripts

Run `npm run list-tasks` to see which of the following scripts are available for
this project.

> Using these scripts requires a linux-like development environment. None of the
> scripts are likely to work on non-POSIX environments. If you're on Windows,
> use [WSL](https://docs.microsoft.com/en-us/windows/wsl/install-win10).

#### Development

- `npm run repl` to run a buffered TypeScript-Babel REPL
- `npm test` to run the unit tests and gather test coverage data
  - Look for HTML files under `coverage/`
- `npm run check-build` to run the integration tests
- `npm run check-types` to run a project-wide type check
- `npm run test-repeat` to run the entire test suite 100 times
  - Good for spotting bad async code and heisenbugs
  - Uses `__test-repeat` NPM script under the hood
- `npm run dev` to start a development server or instance
- `npm run generate` to transpile config files (under `config/`) from scratch
- `npm run regenerate` to quickly re-transpile config files (under `config/`)

#### Building

- `npm run clean` to delete all build process artifacts
- `npm run build` to compile `src/` into `dist/`, which is what makes it into
the published package
- `npm run build-docs` to re-build the documentation
- `npm run build-externals` to compile `external-scripts/` into
  `external-scripts/bin/`
- `npm run build-stats` to gather statistics about Webpack (look for
  `bundle-stats.json`)

#### Publishing

- `npm run start` to start a production instance
- `npm run fixup` to run pre-publication tests, rebuilds (like documentation),
  and validations
  - Triggered automatically by
    [publish-please](https://www.npmjs.com/package/publish-please)

#### NPX

- `npx publish-please` to publish the package
- `npx sort-package-json` to consistently sort `package.json`
- `npx npm-force-resolutions` to forcefully patch security audit problems

## Package Details

> You don't need to read this section to use this package, everything should
"just work"!

This is a [dual CJS2/ES module][dual-module] package. That means this package
exposes both CJS2 and ESM entry points.

Loading this package via `require(...)` will cause Node to use the [CJS2
bundle][CJS2] entry point, disable [tree shaking][tree-shaking] in Webpack 4,
and lead to larger bundles in Webpack 5. Alternatively, loading this package via
`import { ... } from ...` or `import(...)` will cause Node to use the ESM entry
point in [versions that support it][node-esm-support] and in Webpack. Using the
`import` syntax is the modern, preferred choice.

For backwards compatibility with Webpack 4 and Node versions < 14,
[`package.json`](package.json) retains the [`module`][module-key] key, which
points to the ESM entry point, and the [`main`][exports-main-key] key, which
points to both the ESM and CJS2 entry points implicitly (no file extension). For
Webpack 5 and Node versions >= 14, [`package.json`](package.json) includes the
[`exports`][exports-main-key] key, which points to both entry points explicitly.

Though [`package.json`](package.json) includes [`{ "type":
"commonjs"}`][local-pkg], note that the ESM entry points are ES module (`.mjs`)
files. [`package.json`](package.json) also includes the
[`sideEffects`][side-effects-key] key, which is `false` for [optimal tree
shaking][tree-shaking], and the `types` key, which points to a TypeScript
declarations file.

> This package does not maintain shared state and so does not exhibit the [dual
> package hazard][hazard].

## Release History

See [CHANGELOG.md](CHANGELOG.md).

[module-key]: https://webpack.js.org/guides/author-libraries/#final-steps
[side-effects-key]: https://webpack.js.org/guides/tree-shaking/#mark-the-file-as-side-effect-free
[dual-module]: https://github.com/nodejs/node/blob/8d8e06a345043bec787e904edc9a2f5c5e9c275f/doc/api/packages.md#dual-commonjses-module-packages
[exports-main-key]: https://github.com/nodejs/node/blob/8d8e06a345043bec787e904edc9a2f5c5e9c275f/doc/api/packages.md#package-entry-points
[hazard]: https://github.com/nodejs/node/blob/8d8e06a345043bec787e904edc9a2f5c5e9c275f/doc/api/packages.md#dual-package-hazard
[CJS2]: https://webpack.js.org/configuration/output/#module-definition-systems
[tree-shaking]: https://webpack.js.org/guides/tree-shaking
[local-pkg]: https://github.com/nodejs/node/blob/8d8e06a345043bec787e904edc9a2f5c5e9c275f/doc/api/packages.md#type
[node-esm-support]: https://medium.com/@nodejs/node-js-version-14-available-now-8170d384567e#2368
