# Screenshot sources

## Current interface, captured 2026-11-08

Source: main commit `70629990d78a62c059a53d6df5c3c3c2b9e9a08e`, served locally with `scripts/serve.mjs`. Captured at a 1440 × 1050 browser viewport, with full-page capture for activity and history. No wallet was connected and external HTTPS requests were blocked during capture.

| File | View | Data |
| --- | --- | --- |
| `community-feed-demo.png` | Community feed | Demo sample accounts and records |
| `my-activity-demo.png` | My activity, Maya Lin | Invitation, pending work and reply |
| `collaboration-history-demo.png` | My collaboration history, Maya Lin | Confirmed partner/work, source posts and no verified escrow orders |

The fixture starts with `seedState()` from `web/social-core.js`. Three valid `applyAction()` calls add an Alex-to-Maya invitation on sample post 4, a work proposed by Alex for active team 1, and Alex's reply to Maya's sample post 3. Existing confirmed work and partner records remain unchanged. These are browser-local illustrative records, not a recording of independent people, newly executed Sepolia transactions or evidence of payment. Screenshots preserve the application's Demo banner and visible scope limitations.

## Retained historical images

`community-feed.png`, `circles.png` and `task-escrow.png` are existing repository screenshots retained without modification. The first two predate the new activity/history navigation and current illustration. The original community image labels its source as live Sepolia data. Their presence does not establish current chain state or a new acceptance run. The English README labels them as archived and separates them from the current Demo views.
