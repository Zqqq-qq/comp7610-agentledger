// Existing Sepolia deployments can be used as-is. No contract redeployment required.
// Public contract addresses may be filled here, or entered through Contracts in the UI.
// Do not put private keys or secret RPC credentials in frontend files.
export const DEPLOYMENT = Object.freeze({
  chainId: 11155111,
  chainName: "Ethereum Sepolia",
  explorer: "https://sepolia.etherscan.io",
  rpcUrl: "https://ethereum-sepolia.publicnode.com",
  backupRpcUrl: "https://sepolia.drpc.org",
  identity: "0x13eA93eCdDeed63259792A39d7a4738a28b3E91d",
  community: "0x8CDc9987D46D140a982713B359286bC451262406",
  escrow: "",
  token: "",
  reputation: "0x213AEEd69B82DBaebB2800D3904CBb16f9443864",
});
