# Final demonstration script (English)

- Recorded and assembled: 2026-11-08, Asia/Shanghai. Narration: Zhiqi Dai (@daizhiqi).
- Video: [AgentLedger-final-v1.mp4](assets/AgentLedger-final-v1.mp4), 06:59.92, 1920x1080, 30 fps, AAC mono 48 kHz.
- [Captions](assets/AgentLedger-final-v1.en.srt) are also burned into the video; do not enable a second subtitle overlay.
- Actual chapter timing below replaces the previous 1:49 archive script. Technical scope and materials are in [final delivery record](FINAL_DEMO_2026-11-08.zh-CN.md).
- The example story combines separately prepared Demo sessions, followed by separate historical Sepolia records and local Ganache tests. It is not one continuous live acceptance run.

## voice-01 | 00:00.0-00:23.4 | AgentLedger

AgentLedger is a social DApp prototype for agent developers and operators. It connects finding a collaborator, agreeing on responsibilities, and acknowledging shared work. We will follow one example collaboration, then show separate evidence of real wallet interactions and optional payment settlement.

## voice-02 | 00:23.4-00:49.9 | An example collaboration

Imagine Alex operates a data-analysis agent and needs help presenting its results. Maya can contribute charts and explain the visual choices. Their goal is a clear division of work and a record they can revisit. This illustrative scenario guides our demonstration; it is not an observed study of independent users.

## voice-03 | 00:49.9-01:16.5 | Architecture and trust boundaries

The core DApp uses public RPC for reads and the user's wallet for signed writes. An optional agent service runs separately. Contracts record who accepted an invitation and acknowledged a work: neither participant can approve for the other. These records are inspectable, but public storage brings cost and privacy trade-offs, without guaranteeing quality.

## voice-04 | 01:16.5-01:46.6 | Alex publishes an open task

We now enter the local Demo sandbox, using Alex and Maya as sample accounts in this browser. No Sepolia transactions are sent here. Alex publishes an open task requesting a chart and an explanation of an analysis result. The description states what help is needed and what Alex will contribute: checking the analysis and sources. This gives potential collaborators a concrete starting point.

## voice-05 | 01:46.6-02:05.0 | Maya offers a contribution

Maya opens Alex's task and offers to create the chart and explain the visual choices. Her reply stays with the original request, keeping the discussion in context. They have expressed interest; the next step is to agree on a team.

## voice-06 | 02:05.0-02:28.0 | Alex proposes a team

Alex invites Maya to the analysis visualisation team. The proposed roles distinguish analysis and source checking from charts and explanation. The interface shows Invitation pending. This records Alex's proposal, but the team is not active yet. Maya must review the roles and accept from her own account.

## voice-07 | 02:28.0-02:50.5 | Maya reviews the invitation

We switch to Maya and open My activity. The invitation links back to the source team, where she can review the roles before accepting. The interface then shows Active team. This brings account-related actions together and helps Maya return to their context. It is not a push-notification service.

## voice-08 | 02:50.5-03:15.2 | Maya proposes a shared work

Maya now proposes a shared work called Analysis chart draft. Its summary identifies both contributions. We use an example link to demonstrate the workflow, not a real AI-generated deliverable. The interface shows Awaiting partner: the proposal is recorded, but Maya cannot confirm it herself. The contract calls this state Proposed.

## voice-09 | 03:15.2-03:38.9 | Alex reviews and confirms

Back in Alex's account, My activity shows the work awaiting review. Alex opens the proposal and confirms it. The interface now shows Jointly confirmed, corresponding to the contract's Published state. This records the other account's acknowledgement; it does not prove output quality or that the accounts belong to different people.

## voice-10 | 03:38.9-04:09.4 | A traceable collaboration history

My collaboration history now connects the confirmed work with the partner and its source discussions. We can follow the record back to the team and the original task, rather than inspect an isolated title. This is the lasting record in our example journey. These views cover loaded records, not a guaranteed lifetime history. The Demo has no verified escrow orders; live order references require separate validation.

## voice-11 | 04:09.4-04:47.3 | Real wallet interactions

We now switch to archived real-wallet footage from October twenty-eighth, separate from the Demo story. Joining a circle opens MetaMask for the operator's confirmation. The application waits for a transaction receipt before updating membership. The edit shortens that waiting time. We then see the operator leave the circle and cancel a later request. Together, these moments show the difference between requesting an action, confirming it in the wallet, and observing the result. Cancelling a wallet request is not a contract permission failure.

## voice-12 | 04:47.3-05:21.0 | Three settlement paths

Three separate archived Sepolia jobs demonstrate settlement. Job one paid the provider after client approval. Job two refunded the client after the delivery deadline passed without a submitted delivery digest. In job three, the provider submitted delivery and claimed payment after the review window expired without client action. Receipts establish these paths; a Completed label alone does not. All payments use valueless test mUSD.

## voice-13 | 05:21.0-05:33.8 | Community to escrow: archived evidence

A separate archived run linked team three to job five and settled one test mUSD. One operator controlled both accounts. This is not a payment by the Demo team shown earlier.

## voice-14 | 05:33.8-06:07.9 | Bilateral confirmation: contract rules

Here we show local Ganache contract tests, not Sepolia transactions. The proposing address attempts to confirm its own work. The test checks the reason, only other member, verifies that the work remains Proposed, and checks that the collaboration count stays zero. A passing negative test means the forbidden action was rejected. We then show the positive control: the other participant can confirm through the main flow. Both the assertion code and the actual execution result are visible.

## voice-15 | 06:07.9-06:42.1 | Evidence scope and product limits

Each type of evidence answers a different question. Local tests check contract rules; Demo and simulated browser checks exercise interfaces; archived Sepolia records show particular transactions. The new views cover a loading window and have no push or unread service. Confirmation does not prove quality, and a community reference does not enforce payment. The sample service performs placeholder work. Demand, adoption and retention still need investigation.

## voice-16 | 06:42.1-06:59.9 | AgentLedger · Team and sources

AgentLedger makes participation, agreement and settlement records inspectable. The report and repository explain the implementation, its checks, reused components and remaining limits. Thank you for watching our team's demonstration.
