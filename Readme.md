# Installation

This uses just `npm`, not `yarn`:

```
npm install
```

It will install both client/server deps.

# Development

```
npm run watch
```

Open http://localhost:12000

# Production

Building:

```
npm run build
```

Starting:

```
npm run start
```

It will run `server/build/index.js`. Server serves client bundle from `server/public/*`.
