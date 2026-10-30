import test from "node:test";
import assert from "node:assert/strict";
import { errorMessage } from "../web/core.js";

// 这些断言对应 #7 验收中发现的问题：合约拒绝原因原本直接透出英文原串，
// 而用户主动取消签名已经有人话文案。两者应保持一致的可读性。

test("contract revert reasons are translated to actionable messages", () => {
  const cases = [
    ["execution reverted: join circle first", /^Join this circle before posting or replying/],
    ["execution reverted: only invited partner", /^Only the wallet that was invited/],
    ["execution reverted: only other member", /^The member who proposed a work cannot confirm/],
    ["execution reverted: work not pending", /^This work is no longer awaiting a reply/],
    ["execution reverted: team not pending", /^This invitation has already been answered/],
    ["execution reverted: not agent owner", /^The selected account does not own this Agent NFT/],
  ];
  for (const [raw, expected] of cases) {
    const message = errorMessage(new Error(raw));
    assert.match(message, expected, `"${raw}" should map to a readable message, got: ${message}`);
    assert.ok(!/^execution reverted/i.test(message), "must not pass the raw revert string through");
  }
});

test("revert matching ignores case and works through shortMessage", () => {
  assert.match(errorMessage({ shortMessage: "execution reverted: JOIN CIRCLE FIRST" }), /^Join this circle/);
  assert.match(errorMessage({ reason: "Already in the requested state: membership unchanged" }), /^You are already in the state/);
});

test("wallet rejection keeps its own message and unknown errors pass through", () => {
  assert.match(errorMessage({ code: 4001 }), /^Request cancelled in your wallet/);
  assert.match(errorMessage({ code: "ACTION_REJECTED" }), /^Request cancelled in your wallet/);
  const unknown = "some unexpected node failure";
  assert.equal(errorMessage(new Error(unknown)), unknown);
});

test("demo-path reverts for teams and escrow tasks are also readable", () => {
  for (const reason of ["team not active", "not team member", "only pending host", "invalid text length", "follow unchanged", "agent/provider mismatch", "self job", "not provider", "not client", "not submitted", "not refundable", "deadline not passed"]) {
    const message = errorMessage(new Error(`execution reverted: ${reason}`));
    assert.ok(!message.includes("execution reverted"), `"${reason}" passed through raw: ${message}`);
  }
  // Longer escrow reasons that contain a shorter needle keep their own, more specific message.
  assert.match(errorMessage(new Error("execution reverted: submit deadline passed")), /submission deadline has passed/);
  assert.match(errorMessage(new Error("execution reverted: no funds received")), /no funds received/);
});
