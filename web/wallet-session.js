import {chooseAccount} from './core.js';
const empty=()=>({account:'',accounts:[],walletChain:null,walletProvider:null});

// A late response from the previous account/network must never overwrite a newer selection.
export function createWalletSession({getEthereum,createProvider}) {
  let revision=0;
  return {
    async load(accounts,preferred='') {
      const current=++revision;
      try {
        const ethereum=getEthereum();
        if(accounts===null){if(!ethereum?.request)throw new Error('Install and unlock a browser wallet first.');accounts=await ethereum.request({method:'eth_accounts'});}
        if(current!==revision)return null;
        const valid=(Array.isArray(accounts)?accounts:[]).filter(a=>typeof a==='string'&&/^0x[0-9a-fA-F]{40}$/.test(a)&&!/^0x0{40}$/i.test(a));
        const account=chooseAccount(valid,preferred);
        if(!account)return empty();
        if(!ethereum?.request)throw new Error('Install and unlock a browser wallet first.');
        const chain=Number(BigInt(await ethereum.request({method:'eth_chainId'})));
        if(current!==revision)return null;
        return {account,accounts:valid,walletChain:chain,walletProvider:createProvider(ethereum)};
      }catch(error){return current===revision?{...empty(),error}:null;}
    }
  };
}
