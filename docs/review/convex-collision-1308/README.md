# Convex hull collision lab verification

Source commit `57bbc82a2dc300e95dba9afbffa4e7bad2ef6c9b`.

The browser lab is served at `/assets/labs/convex-hull.html`. The two Chromium reports cover the source tree and an isolated copy after the registry build. Both verify keyboard controls, visible canvas overlay changes, pause and frame stepping, and desktop and mobile layouts.

The benchmark warms up the solver and times 240 batches of 60 pairs. Its percentile is calculated from 12-batch group averages. The slowest reported 95th percentile across the measured viewport and server combinations was 0.033 ms per batch on an Apple M3 Max. This measurement covers SAT queries on prepared polygons. It excludes preparation, position updates, and canvas drawing.

Re-run the browser checks by serving the source commit over HTTP and running `PLAYWRIGHT_MODULE=playwright CHROME_PATH=/path/to/chrome node browser.mjs http://127.0.0.1:8000 ./browser-output` in an environment with Playwright installed.
