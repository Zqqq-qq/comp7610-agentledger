// Run: AGENT_PRIVATE_KEY=0x… AGENT_ID=7 PUBLIC_URL=https://agent.example.com/ node agent-service/server.mjs
// The key stays in the environment of this process. Never commit it or put it in web/config.js.
import http from "node:http";
import "../web/vendor/ethers.umd.min.js";
import { DEPLOYMENT } from "../web/config.js";
import { createAgent } from "./agent.mjs";

const sdk = globalThis.ethers, env = process.env;
for (const key of ["AGENT_PRIVATE_KEY", "AGENT_ID"]) if (!env[key]) { console.error(`Missing ${key}. See agent-service/README.zh-CN.md.`); process.exit(1); }
const port = Number(env.PORT || 8092), host = env.HOST || "127.0.0.1";
const request = new sdk.FetchRequest(env.RPC_URL || DEPLOYMENT.rpcUrl); request.timeout = 15000;
const provider = new sdk.JsonRpcProvider(request, undefined, { cacheTimeout: 0 });
const signer = new sdk.Wallet(env.AGENT_PRIVATE_KEY, provider);
const agent = await createAgent({
  sdk, provider, signer,
  escrowAddress: env.ESCROW || DEPLOYMENT.escrow, tokenAddress: env.TOKEN || DEPLOYMENT.token, identityAddress: env.IDENTITY || DEPLOYMENT.identity,
  agentId: env.AGENT_ID, publicUrl: env.PUBLIC_URL || `http://${host}:${port}/`,
  name: env.AGENT_NAME, price: env.PRICE || "1", callPrice: env.CALL_PRICE || "0.1", skills: env.SKILLS || "demo, automation",
  log: line => console.log(new Date().toISOString(), line),
});
http.createServer(agent.handle).listen(port, host, () => console.log(`Agent #${env.AGENT_ID} (${agent.wallet}) card: http://${host}:${port}/.well-known/agent-card.json`));
const interval = Math.max(5, Number(env.POLL_SECONDS || 15)) * 1000;
let polling = false;
async function tick() { if (polling) return; polling = true; try { await agent.poll(); } catch (error) { console.error("poll failed:", error.shortMessage || error.message); } finally { polling = false; } }
tick(); setInterval(tick, interval);
