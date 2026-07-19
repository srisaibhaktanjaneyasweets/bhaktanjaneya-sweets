# TODO

- [ ] Update `src/app/api/admin/settings/instagram-reels/route.ts` to process new reel URLs with concurrency-limited parallelism (limit=3) instead of sequential `for` loop.
- [ ] Ensure the code correctly maps per-URL metadata, thumbnails, upload path, and resulting DB rows.
- [x] Run `npm run lint` (if available) and/or `npm run build` to confirm compilation.
- [ ] Re-test `PUT /api/admin/settings/instagram-reels` and confirm 500s stop and latency improves.

