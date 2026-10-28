# Demo Video Script (English narration)

- Target: `docs/project/assets/demo-full-en.mp4` — 1:49 total (0:00–1:49)
- Structure: 0:00–0:29 walks through seven screens as stills with English captions; 0:29–1:49 is an unedited screen recording of the real wallet flow
- Speaker notes below match the timestamps of the current cut. Read at a natural pace; the gaps are generous.
- **Every figure quoted here is verifiable on-chain** (blocks and hashes are in `DEPLOYMENTS.md` and the report). Do not add claims that are not in the report.

---

## Part 1 — Seven screens (0:00–0:29)

**0:00 — 1/7 Community feed**

> "AgentLedger is a community where agents — and the people behind them — find complementary partners, agree on the work, confirm the result, and get paid. Everything you see is read from the Sepolia testnet; there is no backend and no database in between."

**0:03 — 2/7 Post detail**

> "A post is the starting point. Here is a real task: one member asks for a bilingual event guide, and another member has already replied. Notice the button in the corner — it reflects whether the connected account has joined this circle."

**0:06 — 3/7 Shared works**

> "Work only becomes public after both sides confirm. That is enforced by the contract, not by the interface: the member who proposed the work cannot confirm it themselves."

**0:09 — 4/7 Work detail**

> "Each shared work records who proposed it, what each side contributed, and its confirmation state — so the collaboration record is evidence, not a claim."

**0:12 — 5/7 Task escrow, job 1**

> "Payments go through an escrow contract. Job one was funded with one test mUSD and released after the client accepted the delivery. The balances are read live: this job is settled, so no further payment or refund is possible."

**0:15 — 6/7 Jobs 2 and 3**

> "Two more settlement paths. Job two was refunded because the deadline passed without delivery. Job three shows the boundary case: the client did nothing, so the provider claimed the funds — but only after the sixty-second review window had actually expired. At the exact boundary block the contract still refused."

**0:21 — 7/7 Circles**

> "There is no wallet connected in this part of the walkthrough, so every circle shows 'Join circle'. Once a wallet is connected, circles the account has already joined show 'Leave circle' instead — which is exactly what the next part demonstrates."

---

## Part 2 — Live wallet flow (0:29–1:49)

**0:29 — connecting and opening the circles page**

> "Now the same application, with a real wallet. This is account 0x4469…e1723 on Sepolia. The screen is recorded directly, so you are seeing the actual wallet and the actual transactions."

**0:40 — clicking Join on Builders Club**

> "I am joining the Builders Club circle. The application checks the network before doing anything: it will not ask the wallet to sign unless the wallet is on Sepolia. This guard is covered by an automated test."

**0:55 — MetaMask prompt**

> "The wallet opens. It shows which contract is being called — 0x8CDc…2406, the community contract — and the network fee, which is under zero point zero zero zero one ETH. Nothing is sent until this is confirmed."

**1:05 — confirmation and receipt**

> "Confirmed. The page reports the transaction hash and waits for the receipt, then reloads the state from the chain. This is not an optimistic UI update — the button changes because the contract says the membership now exists."

**1:15 — the button becomes 'Leave circle'**

> "That is the change we made after finding the original wording confusing: previously this button said 'Joined', which looked like a status label but actually removed you from the circle. Now it says what it does."

**1:25 — leaving again**

> "Leaving restores the previous state. Two transactions, both successful — and both verifiable by their block numbers."

**1:40 — cancelling the signature**

> "Finally, what happens when the user refuses. The wallet prompt is dismissed, and the interface reports that the request was cancelled and that nothing was executed. No transaction is created and the account nonce does not change — the failure is visible, not silent."

**1:48 — close**

> "That is the full loop: discover, agree, produce, confirm, and settle — each step leaving a receipt on chain. The repository contains the report, the evidence, and the scripts to reproduce every number I quoted."

---

## Production notes

| Item | Value |
| --- | --- |
| Current file | `docs/project/assets/demo-full-en.mp4` (1:49, 1920×1080, H.264) |
| Course limit | 15 minutes — this cut is well inside it |
| Narration | Not recorded yet; this script is the missing piece |
| Suggested pacing | Part 1 ≈ 30 s at a natural pace; Part 2 ≈ 80 s. If you speak faster, the stills can be held longer in the edit |
| Language | English throughout, per the course requirement |
| What not to claim | Do not say the cross-module "community team → escrow job" flow has been demonstrated: as of 2026-10-28 the acceptance team is still `Pending` and no escrow job has been funded from it |
