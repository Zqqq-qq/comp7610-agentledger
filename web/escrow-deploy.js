import {DEPLOYMENT} from './config.js';
const e=globalThis.ethers,$=id=>document.getElementById(id),key='agentledger-sepolia-escrow-deployment-v1';
let records=JSON.parse(localStorage.getItem(key)||'{}'),provider,signer,busy=false;
const readProvider=new e.JsonRpcProvider(DEPLOYMENT.rpcUrl,11155111,{staticNetwork:true});
const artifacts=Object.fromEntries(await Promise.all(['MockUSDC','JobEscrow'].map(async n=>[n,await (await fetch('generated/'+n+'.json')).json()])));
function save(){localStorage.setItem(key,JSON.stringify(records));$('records').textContent=JSON.stringify(records,null,2);}
function status(text){$('status').textContent=text;}
function buttons(){for(const id of ['connect','deployToken','deployEscrow','verify','configure'])$(id).disabled=busy||((id==='deployToken'||id==='deployEscrow')&&!signer);}
async function run(action){if(busy)return;busy=true;buttons();try{await action();}catch(error){status(error.shortMessage||error.message);}finally{busy=false;buttons();}}
async function connect(){if(!window.ethereum)throw Error('请在安装 MetaMask 的 Chrome 中打开。');provider=new e.BrowserProvider(window.ethereum);await provider.send('eth_requestAccounts',[]);if(Number((await provider.getNetwork()).chainId)!==11155111)throw Error('请在 MetaMask 选择 Sepolia 后重试。');signer=await provider.getSigner();const account=await signer.getAddress();$('wallet').textContent=`Sepolia · ${account} · ${e.formatEther(await readProvider.getBalance(account))} SepoliaETH`;status('测试钱包已连接；请选择部署项目。');}
async function verify(){
 if(Number(BigInt(await readProvider.send('eth_chainId',[])))!==11155111)throw Error('RPC 网络不匹配。');
 const block=await readProvider.getBlock('latest');
 for(const [name,record] of Object.entries(records)){
  delete record.runtimeMatches; delete record.creationInputMatches;
  const receipt=await readProvider.getTransactionReceipt(record.transactionHash);if(!receipt){status(name+' 等待上链：'+record.transactionHash);continue;}
  if(receipt.status!==1||!receipt.contractAddress)throw Error(name+' 部署失败；请保留回执检查。');
  const artifact=artifacts[name],args=name==='JobEscrow'?[DEPLOYMENT.identity]:[];
  const expected=(await new e.ContractFactory(artifact.abi,artifact.bytecode).getDeployTransaction(...args)).data;
  const tx=await readProvider.getTransaction(record.transactionHash);if(tx.data.toLowerCase()!==expected.toLowerCase())throw Error(name+' 创建输入不匹配。');
  let runtime=artifact.runtime;const word=DEPLOYMENT.identity.slice(2).toLowerCase().padStart(64,'0');
  for(const ref of Object.values(artifact.immutableReferences).flat()){if(ref.length!==32)throw Error('Unexpected immutable');const pos=2+ref.start*2;runtime=runtime.slice(0,pos)+word+runtime.slice(pos+64);}
  const code=await readProvider.getCode(receipt.contractAddress,block.number);if(code.toLowerCase()!==runtime.toLowerCase())throw Error(name+' 运行时代码不匹配。');
  const contract=new e.Contract(receipt.contractAddress,artifact.abi,readProvider);
  if(name==='JobEscrow'&&(await contract.identity()).toLowerCase()!==DEPLOYMENT.identity.toLowerCase())throw Error('Registry 不匹配。');
  if(name==='MockUSDC'&&(Number(await contract.decimals())!==6||await contract.symbol()!=='mUSD'))throw Error('代币配置不匹配。');
  const header=await readProvider.getBlock(receipt.blockNumber);if(header.hash!==receipt.blockHash)throw Error('回执区块哈希不匹配。');
  Object.assign(record,{address:receipt.contractAddress,chainId:11155111,sourceReference:artifact.sourceReference,sourceGitBlob:artifact.sourceGitBlob,compiler:artifact.compiler,settings:artifact.settings,constructorArgs:args,receipt:receipt.toJSON(),runtimeHash:e.keccak256(code),runtimeMatches:true,creationInputMatches:true,verifiedAt:new Date().toISOString(),verificationBlock:{number:block.number,hash:block.hash},rpc:DEPLOYMENT.rpcUrl});save();
 }
 $('verification').textContent=JSON.stringify(records,null,2);status(Object.keys(records).length?'已刷新。runtimeMatches=true 表示本地重编译匹配，不等于区块浏览器源码发布认证。':'尚无部署记录。');
}
async function deploy(name){
 if(records[name])throw Error(name+' 已有部署记录，请先刷新核验，避免重复部署。');
 if(Number(BigInt(await window.ethereum.request({method:'eth_chainId'})))!==11155111)throw Error('仅允许 Sepolia。');
 const active=await window.ethereum.request({method:'eth_accounts'});if(active[0]?.toLowerCase()!==(await signer.getAddress()).toLowerCase())throw Error('账户已切换，请重新连接。');
 const artifact=artifacts[name];status('请在 MetaMask 核对并亲自确认 '+name+' 部署。');
 const contract=await new e.ContractFactory(artifact.abi,artifact.bytecode,signer).deploy(...(name==='JobEscrow'?[DEPLOYMENT.identity]:[]));
 records[name]={transactionHash:contract.deploymentTransaction().hash,submittedAt:new Date().toISOString()};save();status(name+' 已广播：'+records[name].transactionHash+'；确认后点击刷新核验。');
}
$('connect').onclick=()=>run(connect);$('deployToken').onclick=()=>run(()=>deploy('MockUSDC'));$('deployEscrow').onclick=()=>run(()=>deploy('JobEscrow'));$('verify').onclick=()=>run(verify);
$('download').onclick=()=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(records,null,2)],{type:'application/json'}));a.download='escrow-sepolia-deployments.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);};
$('configure').onclick=()=>run(async()=>{await verify();if(!records.MockUSDC?.runtimeMatches||!records.JobEscrow?.runtimeMatches)throw Error('请先完成两个合约的部署与核验。');const previous=JSON.parse(localStorage.getItem('agent-ledger.sepolia.v1')||'{}');localStorage.setItem('agent-ledger.sepolia.v1',JSON.stringify({...previous,...DEPLOYMENT,escrow:records.JobEscrow.address,token:records.MockUSDC.address}));status('已保存到此浏览器，请进入托管验收。');});
save();buttons();
