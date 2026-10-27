// Read-only evidence verification, shared by the browser deployment flow and CLI.
export async function verifyDeployment({provider,sdk,artifact,registry,transactionHash,address}) {
  if(BigInt(await provider.send('eth_chainId',[]))!==11155111n)throw new Error('Deployment evidence must come from Ethereum Sepolia (11155111).');
  registry=sdk.getAddress(registry);
  if(registry===sdk.ZeroAddress||await provider.getCode(registry)==='0x')throw new Error('The configured IdentityRegistry has no contract code.');
  if(!/^0x[0-9a-fA-F]{64}$/.test(transactionHash||''))throw new Error('Enter the actual deployment transaction hash.');
  const [receipt,transaction]=await Promise.all([provider.getTransactionReceipt(transactionHash),provider.getTransaction(transactionHash)]);
  if(!receipt||!transaction)throw new Error('Deployment has no confirmed receipt yet. Wait and retry.');
  if(receipt.status!==1)throw new Error('The deployment transaction failed.');
  if(transaction.to!==null||!receipt.contractAddress)throw new Error('Use a direct contract-creation transaction from the member wallet.');
  const deployed=sdk.getAddress(receipt.contractAddress);
  if(address&&!sdk.isAddress(address))throw new Error('The supplied community address is invalid.');
  if(address&&sdk.getAddress(address)!==deployed)throw new Error('The receipt created a different community address.');
  const expected=await new sdk.ContractFactory(artifact.abi,artifact.bytecode).getDeployTransaction(registry);
  if(transaction.data.toLowerCase()!==expected.data.toLowerCase())throw new Error('Deployment input differs from the committed AgentCommunity artifact or constructor registry.');
  const block=Math.max(await provider.getBlockNumber(),receipt.blockNumber);
  const code=await provider.getCode(deployed,block);
  if(code==='0x')throw new Error('No community contract exists at the receipt address.');
  const contract=new sdk.Contract(deployed,artifact.abi,provider);
  const [linked,circles]=await Promise.all([contract.identity({blockTag:block}),contract.CIRCLE_COUNT({blockTag:block})]);
  if(sdk.getAddress(linked)!==registry||Number(circles)!==3)throw new Error('The deployed community has an incompatible registry or circle count.');
  return {schema:'agentledger-deployment-evidence-v1',network:'Ethereum Sepolia',chainId:11155111,contract:'AgentCommunity',address:deployed,identity:registry,transactionHash:receipt.hash,blockNumber:receipt.blockNumber,deployer:transaction.from,compiler:artifact.compiler,settings:{optimizer:{enabled:true,runs:200},viaIR:true,evmVersion:'shanghai'},constructorArguments:[registry],creationBytecodeHash:sdk.keccak256(artifact.bytecode),runtimeCodeHash:sdk.keccak256(code),verifiedAtBlock:block,confirmations:block-receipt.blockNumber+1,evidenceType:'direct-creation-receipt-and-artifact-match'};
}
