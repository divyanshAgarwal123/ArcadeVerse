# Constrained FABRIK acceptance

The exact source head and parent are in source.json. The vanilla helper exposes ArcadeVerse.physics.createIKChain, fixed-length 2D FABRIK with relative angle bounds and at most five passes per call, independent snapshots and arm/limb/multiple-tentacle generators. Existing SDK identity and helpers remain intact. The existing docs page demonstrates pointer, touch and keyboard use.

All nine focused cases and the full canonical npm test command pass, together with strict assets, registry --check and metadata integrity. Tests check convergence across bounded frame solves, analytical reach and locked-joint endpoints, 160 target moves with independent segment/angle verification, relocated roots, immutable snapshots, malformed inputs, preset independence and namespace preservation.

Warmed Node arm64 measurements in performance.json retain all scheduling outliers: 4,000 solves each for 8 and 64 joints. Observed mean/P95/max were below 0.1 ms in both cases; this is measured evidence on this machine, not a universal guarantee.

Native installed-Chrome acceptance passed real SDK/API, pixel changes from keyboard and touch, all presets, 320/390/760px containment, zero queued frames while idle, idempotent mounting, explicitly injected persisted page transitions, full listener/frame teardown and remount, without page errors or failed local resources. Representative screenshots were visually inspected. The Lucide CDN uses its captured actual response and Google Fonts are omitted. The first idle-check fixture waited a fixed 200 ms, shorter than 12 settling frames on a 30 Hz callback cadence; it was corrected to wait for actual zero pending work and the full suite passed without a source workaround.

Reproduce with npm test, node scripts/validate-games.js --strict-assets, node scripts/build-registry.js --check and node scripts/verify-registry-integrity.js. Serve the source over HTTP and run browser-check.mjs with BASE, OUT and PLAYWRIGHT_MODULE. Change the explicit LUCIDE fixture path in the harness if necessary. The UI owns no continuous game loop.

Algorithm reference: [Aristidou and Lasenby, FABRIK (2011)](https://www.andreasaristidou.com/publications/papers/FABRIK.pdf).
