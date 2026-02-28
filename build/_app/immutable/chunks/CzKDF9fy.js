import{d as b,w as Oe,p as Re,R as u,e as v,f as de,a as N,E as V,h as ue,W as pe,C as h,B as Q,i as we,j as ce,A as J,k as ee,l as Ve,m as De,n as Ke,o as fe,s as _e,q as Be,M as I,r as me,t as $,u as re,v as C,x as c,y as Ue,z as ke,D as Ge,F as H,O as k,G as ze,c as le,T as Ye,H as Xe,P as qe}from"./CKhFwjwF.js";import{c as T,n as g,o as ge,r as m,U as Fe}from"./D7e8SSIV.js";(function(){try{var e=typeof window<"u"?window:typeof global<"u"?global:typeof globalThis<"u"?globalThis:typeof self<"u"?self:{};e.SENTRY_RELEASE={id:"b1e593ae5130a8a866939fcd32d632e0f276c846"}}catch{}})();try{(function(){var e=typeof window<"u"?window:typeof global<"u"?global:typeof globalThis<"u"?globalThis:typeof self<"u"?self:{},t=new e.Error().stack;t&&(e._sentryDebugIds=e._sentryDebugIds||{},e._sentryDebugIds[t]="f8d7f1d8-0ab8-49aa-9287-ef023f8f2202",e._sentryDebugIdIdentifier="sentry-dbid-f8d7f1d8-0ab8-49aa-9287-ef023f8f2202")})()}catch{}const _={getGasPriceInEther(e,t){const o=t*e;return Number(o)/1e18},getGasPriceInUSD(e,t,o){const i=_.getGasPriceInEther(t,o);return b.bigNumber(e).times(i).toNumber()},getPriceImpact({sourceTokenAmount:e,sourceTokenPriceInUSD:t,toTokenPriceInUSD:o,toTokenAmount:i}){const r=b.bigNumber(e).times(t),n=b.bigNumber(i).times(o);return r.minus(n).div(r).times(100).toNumber()},getMaxSlippage(e,t){const o=b.bigNumber(e).div(100);return b.multiply(t,o).toNumber()},getProviderFee(e,t=.0085){return b.bigNumber(e).times(t).toString()},isInsufficientNetworkTokenForGas(e,t){const o=t||"0";return b.bigNumber(e).eq(0)?!0:b.bigNumber(b.bigNumber(o)).gt(e)},isInsufficientSourceTokenForSwap(e,t,o){var n,s;const i=(s=(n=o==null?void 0:o.find(l=>l.address===t))==null?void 0:n.quantity)==null?void 0:s.numeric;return b.bigNumber(i||"0").lt(e)}},Pe=15e4,Qe=6,S={initializing:!1,initialized:!1,loadingPrices:!1,loadingQuote:!1,loadingApprovalTransaction:!1,loadingBuildTransaction:!1,loadingTransaction:!1,fetchError:!1,approvalTransaction:void 0,swapTransaction:void 0,transactionError:void 0,sourceToken:void 0,sourceTokenAmount:"",sourceTokenPriceInUSD:0,toToken:void 0,toTokenAmount:"",toTokenPriceInUSD:0,networkPrice:"0",networkBalanceInUSD:"0",networkTokenSymbol:"",inputError:void 0,slippage:De.CONVERT_SLIPPAGE_TOLERANCE,tokens:void 0,popularTokens:void 0,suggestedTokens:void 0,foundTokens:void 0,myTokensWithBalance:void 0,tokensPriceMap:{},gasFee:"0",gasPriceInUSD:0,priceImpact:void 0,maxSlippage:void 0,providerFee:void 0},a=Re({...S}),he={state:a,subscribe(e){return Be(a,()=>e(a))},subscribeKey(e,t){return _e(a,e,t)},getParams(){var p,w,f,x,A,L,M,j;const e=h.state.activeChain,t=J.getCaipAddress(e)??h.state.activeCaipAddress,o=we.getPlainAddress(t),i=Ke(),r=fe.getConnectorId(h.state.activeChain);if(!o)throw new Error("No address found to swap the tokens from.");const n=!((p=a.toToken)!=null&&p.address)||!((w=a.toToken)!=null&&w.decimals),s=!((f=a.sourceToken)!=null&&f.address)||!((x=a.sourceToken)!=null&&x.decimals)||!b.bigNumber(a.sourceTokenAmount).gt(0),l=!a.sourceTokenAmount;return{networkAddress:i,fromAddress:o,fromCaipAddress:t,sourceTokenAddress:(A=a.sourceToken)==null?void 0:A.address,toTokenAddress:(L=a.toToken)==null?void 0:L.address,toTokenAmount:a.toTokenAmount,toTokenDecimals:(M=a.toToken)==null?void 0:M.decimals,sourceTokenAmount:a.sourceTokenAmount,sourceTokenDecimals:(j=a.sourceToken)==null?void 0:j.decimals,invalidToToken:n,invalidSourceToken:s,invalidSourceTokenAmount:l,availableToSwap:t&&!n&&!s&&!l,isAuthConnector:r===N.CONNECTOR_ID.AUTH}},setSourceToken(e){if(!e){a.sourceToken=e,a.sourceTokenAmount="",a.sourceTokenPriceInUSD=0;return}a.sourceToken=e,d.setTokenPrice(e.address,"sourceToken")},setSourceTokenAmount(e){a.sourceTokenAmount=e},setToToken(e){if(!e){a.toToken=e,a.toTokenAmount="",a.toTokenPriceInUSD=0;return}a.toToken=e,d.setTokenPrice(e.address,"toToken")},setToTokenAmount(e){a.toTokenAmount=e?b.toFixed(e,Qe):""},async setTokenPrice(e,t){let o=a.tokensPriceMap[e]||0;o||(a.loadingPrices=!0,o=await d.getAddressPrice(e)),t==="sourceToken"?a.sourceTokenPriceInUSD=o:t==="toToken"&&(a.toTokenPriceInUSD=o),a.loadingPrices&&(a.loadingPrices=!1),d.getParams().availableToSwap&&d.swapTokens()},switchTokens(){if(a.initializing||!a.initialized)return;const e=a.toToken?{...a.toToken}:void 0,t=a.sourceToken?{...a.sourceToken}:void 0,o=e&&a.toTokenAmount===""?"1":a.toTokenAmount;d.setSourceToken(e),d.setToToken(t),d.setSourceTokenAmount(o),d.setToTokenAmount(""),d.swapTokens()},resetState(){a.myTokensWithBalance=S.myTokensWithBalance,a.tokensPriceMap=S.tokensPriceMap,a.initialized=S.initialized,a.initializing=S.initializing,a.sourceToken=S.sourceToken,a.sourceTokenAmount=S.sourceTokenAmount,a.sourceTokenPriceInUSD=S.sourceTokenPriceInUSD,a.toToken=S.toToken,a.toTokenAmount=S.toTokenAmount,a.toTokenPriceInUSD=S.toTokenPriceInUSD,a.networkPrice=S.networkPrice,a.networkTokenSymbol=S.networkTokenSymbol,a.networkBalanceInUSD=S.networkBalanceInUSD,a.inputError=S.inputError},resetValues(){var o;const{networkAddress:e}=d.getParams(),t=(o=a.tokens)==null?void 0:o.find(i=>i.address===e);d.setSourceToken(t),d.setToToken(void 0)},getApprovalLoadingState(){return a.loadingApprovalTransaction},clearError(){a.transactionError=void 0},async initializeState(){if(!a.initializing){if(a.initializing=!0,!a.initialized)try{await d.fetchTokens(),a.initialized=!0}catch{a.initialized=!1,v.showError("Failed to initialize swap"),u.goBack()}a.initializing=!1}},async fetchTokens(){var o;const{networkAddress:e}=d.getParams();await d.getNetworkTokenPrice(),await d.getMyTokensWithBalance();const t=(o=a.myTokensWithBalance)==null?void 0:o.find(i=>i.address===e);t&&(a.networkTokenSymbol=t.symbol,d.setSourceToken(t),d.setSourceTokenAmount("0"))},async getTokenList(){var t;const e=(t=h.state.activeCaipNetwork)==null?void 0:t.caipNetworkId;if(!(a.caipNetworkId===e&&a.tokens))try{a.tokensLoading=!0;const o=await ce.getTokenList(e);a.tokens=o,a.caipNetworkId=e,a.popularTokens=o.sort((i,r)=>i.symbol<r.symbol?-1:i.symbol>r.symbol?1:0),a.suggestedTokens=o.filter(i=>!!De.SWAP_SUGGESTED_TOKENS.includes(i.symbol))}catch{a.tokens=[],a.popularTokens=[],a.suggestedTokens=[]}finally{a.tokensLoading=!1}},async getAddressPrice(e){var p,w;const t=a.tokensPriceMap[e];if(t)return t;const o=await Q.fetchTokenPrice({addresses:[e]}),i=(o==null?void 0:o.fungibles)||[],r=[...a.tokens||[],...a.myTokensWithBalance||[]],n=(p=r==null?void 0:r.find(f=>f.address===e))==null?void 0:p.symbol,s=((w=i.find(f=>f.symbol.toLowerCase()===(n==null?void 0:n.toLowerCase())))==null?void 0:w.price)||0,l=parseFloat(s.toString());return a.tokensPriceMap[e]=l,l},async getNetworkTokenPrice(){var r;const{networkAddress:e}=d.getParams(),o=(r=(await Q.fetchTokenPrice({addresses:[e]}).catch(()=>(v.showError("Failed to fetch network token price"),{fungibles:[]}))).fungibles)==null?void 0:r[0],i=(o==null?void 0:o.price.toString())||"0";a.tokensPriceMap[e]=parseFloat(i),a.networkTokenSymbol=(o==null?void 0:o.symbol)||"",a.networkPrice=i},async getMyTokensWithBalance(e){const t=await Ve.getMyTokensWithBalance(e),o=ce.mapBalancesToSwapTokens(t);o&&(await d.getInitialGasPrice(),d.setBalances(o))},setBalances(e){const{networkAddress:t}=d.getParams(),o=h.state.activeCaipNetwork;if(!o)return;const i=e.find(r=>r.address===t);e.forEach(r=>{a.tokensPriceMap[r.address]=r.price||0}),a.myTokensWithBalance=e.filter(r=>r.address.startsWith(o.caipNetworkId)),a.networkBalanceInUSD=i?b.multiply(i.quantity.numeric,i.price).toString():"0"},async getInitialGasPrice(){var t,o;const e=await ce.fetchGasPrice();if(!e)return{gasPrice:null,gasPriceInUSD:null};switch((o=(t=h.state)==null?void 0:t.activeCaipNetwork)==null?void 0:o.chainNamespace){case N.CHAIN.SOLANA:return a.gasFee=e.standard??"0",a.gasPriceInUSD=b.multiply(e.standard,a.networkPrice).div(1e9).toNumber(),{gasPrice:BigInt(a.gasFee),gasPriceInUSD:Number(a.gasPriceInUSD)};case N.CHAIN.EVM:default:const i=e.standard??"0",r=BigInt(i),n=BigInt(Pe),s=_.getGasPriceInUSD(a.networkPrice,n,r);return a.gasFee=i,a.gasPriceInUSD=s,{gasPrice:r,gasPriceInUSD:s}}},async swapTokens(){var n,s;const e=J.state.address,t=a.sourceToken,o=a.toToken,i=b.bigNumber(a.sourceTokenAmount).gt(0);if(i||d.setToTokenAmount(""),!o||!t||a.loadingPrices||!i)return;a.loadingQuote=!0;const r=b.bigNumber(a.sourceTokenAmount).times(10**t.decimals).round(0);try{const l=await Q.fetchSwapQuote({userAddress:e,from:t.address,to:o.address,gasPrice:a.gasFee,amount:r.toString()});a.loadingQuote=!1;const p=(s=(n=l==null?void 0:l.quotes)==null?void 0:n[0])==null?void 0:s.toAmount;if(!p){ee.open({displayMessage:"Incorrect amount",debugMessage:"Please enter a valid amount"},"error");return}const w=b.bigNumber(p).div(10**o.decimals).toString();d.setToTokenAmount(w),d.hasInsufficientToken(a.sourceTokenAmount,t.address)?a.inputError="Insufficient balance":(a.inputError=void 0,d.setTransactionDetails())}catch{a.loadingQuote=!1,a.inputError="Insufficient balance"}},async getTransaction(){const{fromCaipAddress:e,availableToSwap:t}=d.getParams(),o=a.sourceToken,i=a.toToken;if(!(!e||!t||!o||!i||a.loadingQuote))try{a.loadingBuildTransaction=!0;const r=await ce.fetchSwapAllowance({userAddress:e,tokenAddress:o.address,sourceTokenAmount:a.sourceTokenAmount,sourceTokenDecimals:o.decimals});let n;return r?n=await d.createSwapTransaction():n=await d.createAllowanceTransaction(),a.loadingBuildTransaction=!1,a.fetchError=!1,n}catch{u.goBack(),v.showError("Failed to check allowance"),a.loadingBuildTransaction=!1,a.approvalTransaction=void 0,a.swapTransaction=void 0,a.fetchError=!0;return}},async createAllowanceTransaction(){const{fromCaipAddress:e,sourceTokenAddress:t,toTokenAddress:o}=d.getParams();if(!(!e||!o)){if(!t)throw new Error("createAllowanceTransaction - No source token address found.");try{const i=await Q.generateApproveCalldata({from:t,to:o,userAddress:e}),r=we.getPlainAddress(i.tx.from);if(!r)throw new Error("SwapController:createAllowanceTransaction - address is required");const n={data:i.tx.data,to:r,gasPrice:BigInt(i.tx.eip155.gasPrice),value:BigInt(i.tx.value),toAmount:a.toTokenAmount};return a.swapTransaction=void 0,a.approvalTransaction={data:n.data,to:n.to,gasPrice:n.gasPrice,value:n.value,toAmount:n.toAmount},{data:n.data,to:n.to,gasPrice:n.gasPrice,value:n.value,toAmount:n.toAmount}}catch{u.goBack(),v.showError("Failed to create approval transaction"),a.approvalTransaction=void 0,a.swapTransaction=void 0,a.fetchError=!0;return}}},async createSwapTransaction(){var s;const{networkAddress:e,fromCaipAddress:t,sourceTokenAmount:o}=d.getParams(),i=a.sourceToken,r=a.toToken;if(!t||!o||!i||!r)return;const n=(s=de.parseUnits(o,i.decimals))==null?void 0:s.toString();try{const l=await Q.generateSwapCalldata({userAddress:t,from:i.address,to:r.address,amount:n,disableEstimate:!0}),p=i.address===e,w=BigInt(l.tx.eip155.gas),f=BigInt(l.tx.eip155.gasPrice),x=we.getPlainAddress(l.tx.to);if(!x)throw new Error("SwapController:createSwapTransaction - address is required");const A={data:l.tx.data,to:x,gas:w,gasPrice:f,value:BigInt(p?n??"0":"0"),toAmount:a.toTokenAmount};return a.gasPriceInUSD=_.getGasPriceInUSD(a.networkPrice,w,f),a.approvalTransaction=void 0,a.swapTransaction=A,A}catch{u.goBack(),v.showError("Failed to create transaction"),a.approvalTransaction=void 0,a.swapTransaction=void 0,a.fetchError=!0;return}},onEmbeddedWalletApprovalSuccess(){v.showLoading("Approve limit increase in your wallet"),u.replace("SwapPreview")},async sendTransactionForApproval(e){var r,n,s;const{fromAddress:t,isAuthConnector:o}=d.getParams();a.loadingApprovalTransaction=!0,o?u.pushTransactionStack({onSuccess:d.onEmbeddedWalletApprovalSuccess}):v.showLoading("Approve limit increase in your wallet");try{await de.sendTransaction({address:t,to:e.to,data:e.data,value:e.value,chainNamespace:N.CHAIN.EVM}),await d.swapTokens(),await d.getTransaction(),a.approvalTransaction=void 0,a.loadingApprovalTransaction=!1}catch(l){const p=l;a.transactionError=p==null?void 0:p.displayMessage,a.loadingApprovalTransaction=!1,v.showError((p==null?void 0:p.displayMessage)||"Transaction error"),V.sendEvent({type:"track",event:"SWAP_APPROVAL_ERROR",properties:{message:(p==null?void 0:p.displayMessage)||(p==null?void 0:p.message)||"Unknown",network:((r=h.state.activeCaipNetwork)==null?void 0:r.caipNetworkId)||"",swapFromToken:((n=d.state.sourceToken)==null?void 0:n.symbol)||"",swapToToken:((s=d.state.toToken)==null?void 0:s.symbol)||"",swapFromAmount:d.state.sourceTokenAmount||"",swapToAmount:d.state.toTokenAmount||"",isSmartAccount:ue(N.CHAIN.EVM)===pe.ACCOUNT_TYPES.SMART_ACCOUNT}})}},async sendTransactionForSwap(e){var s,l,p,w,f,x,A,L,M,j,D,q;if(!e)return;const{fromAddress:t,toTokenAmount:o,isAuthConnector:i}=d.getParams();a.loadingTransaction=!0;const r=`Swapping ${(s=a.sourceToken)==null?void 0:s.symbol} to ${b.formatNumberToLocalString(o,3)} ${(l=a.toToken)==null?void 0:l.symbol}`,n=`Swapped ${(p=a.sourceToken)==null?void 0:p.symbol} to ${b.formatNumberToLocalString(o,3)} ${(w=a.toToken)==null?void 0:w.symbol}`;i?u.pushTransactionStack({onSuccess(){u.replace("Account"),v.showLoading(r),he.resetState()}}):v.showLoading("Confirm transaction in your wallet");try{const G=[(f=a.sourceToken)==null?void 0:f.address,(x=a.toToken)==null?void 0:x.address].join(","),y=await de.sendTransaction({address:t,to:e.to,data:e.data,value:e.value,chainNamespace:N.CHAIN.EVM});return a.loadingTransaction=!1,v.showSuccess(n),V.sendEvent({type:"track",event:"SWAP_SUCCESS",properties:{network:((A=h.state.activeCaipNetwork)==null?void 0:A.caipNetworkId)||"",swapFromToken:((L=d.state.sourceToken)==null?void 0:L.symbol)||"",swapToToken:((M=d.state.toToken)==null?void 0:M.symbol)||"",swapFromAmount:d.state.sourceTokenAmount||"",swapToAmount:d.state.toTokenAmount||"",isSmartAccount:ue(N.CHAIN.EVM)===pe.ACCOUNT_TYPES.SMART_ACCOUNT}}),he.resetState(),i||u.replace("Account"),he.getMyTokensWithBalance(G),y}catch(G){const y=G;a.transactionError=y==null?void 0:y.displayMessage,a.loadingTransaction=!1,v.showError((y==null?void 0:y.displayMessage)||"Transaction error"),V.sendEvent({type:"track",event:"SWAP_ERROR",properties:{message:(y==null?void 0:y.displayMessage)||(y==null?void 0:y.message)||"Unknown",network:((j=h.state.activeCaipNetwork)==null?void 0:j.caipNetworkId)||"",swapFromToken:((D=d.state.sourceToken)==null?void 0:D.symbol)||"",swapToToken:((q=d.state.toToken)==null?void 0:q.symbol)||"",swapFromAmount:d.state.sourceTokenAmount||"",swapToAmount:d.state.toTokenAmount||"",isSmartAccount:ue(N.CHAIN.EVM)===pe.ACCOUNT_TYPES.SMART_ACCOUNT}});return}},hasInsufficientToken(e,t){return _.isInsufficientSourceTokenForSwap(e,t,a.myTokensWithBalance)},setTransactionDetails(){const{toTokenAddress:e,toTokenDecimals:t}=d.getParams();!e||!t||(a.gasPriceInUSD=_.getGasPriceInUSD(a.networkPrice,BigInt(a.gasFee),BigInt(Pe)),a.priceImpact=_.getPriceImpact({sourceTokenAmount:a.sourceTokenAmount,sourceTokenPriceInUSD:a.sourceTokenPriceInUSD,toTokenPriceInUSD:a.toTokenPriceInUSD,toTokenAmount:a.toTokenAmount}),a.maxSlippage=_.getMaxSlippage(a.slippage,a.toTokenAmount),a.providerFee=_.getProviderFee(a.sourceTokenAmount))}},d=Oe(he),P=Re({message:"",open:!1,triggerRect:{width:0,height:0,top:0,left:0},variant:"shade"}),Ze={state:P,subscribe(e){return Be(P,()=>e(P))},subscribeKey(e,t){return _e(P,e,t)},showTooltip({message:e,triggerRect:t,variant:o}){P.open=!0,P.message=e,P.triggerRect=t,P.variant=o},hide(){P.open=!1,P.message="",P.triggerRect={width:0,height:0,top:0,left:0}}},Z=Oe(Ze),Le={isUnsupportedChainView(){return u.state.view==="UnsupportedChain"||u.state.view==="SwitchNetwork"&&u.state.history.includes("UnsupportedChain")},async safeClose(){if(this.isUnsupportedChainView()){I.shake();return}if(await me.isSIWXCloseDisabled()){I.shake();return}(u.state.view==="DataCapture"||u.state.view==="DataCaptureOtpConfirm")&&de.disconnect(),I.close()}},Je=$`
  :host {
    display: block;
    border-radius: clamp(0px, ${({borderRadius:e})=>e[8]}, 44px);
    box-shadow: 0 0 0 1px ${({tokens:e})=>e.theme.foregroundPrimary};
    background-color: ${({tokens:e})=>e.theme.backgroundPrimary};
    overflow: hidden;
  }
`;var et=function(e,t,o,i){var r=arguments.length,n=r<3?t:i===null?i=Object.getOwnPropertyDescriptor(t,o):i,s;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")n=Reflect.decorate(e,t,o,i);else for(var l=e.length-1;l>=0;l--)(s=e[l])&&(n=(r<3?s(n):r>3?s(t,o,n):s(t,o))||n);return r>3&&n&&Object.defineProperty(t,o,n),n};let Te=class extends C{render(){return c`<slot></slot>`}};Te.styles=[re,Je];Te=et([T("wui-card")],Te);const tt=$`
  :host {
    width: 100%;
  }

  :host > wui-flex {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: ${({spacing:e})=>e[2]};
    padding: ${({spacing:e})=>e[3]};
    border-radius: ${({borderRadius:e})=>e[6]};
    border: 1px solid ${({tokens:e})=>e.theme.borderPrimary};
    box-sizing: border-box;
    background-color: ${({tokens:e})=>e.theme.foregroundPrimary};
    box-shadow: 0px 0px 16px 0px rgba(0, 0, 0, 0.25);
    color: ${({tokens:e})=>e.theme.textPrimary};
  }

  :host > wui-flex[data-type='info'] {
    .icon-box {
      background-color: ${({tokens:e})=>e.theme.foregroundSecondary};

      wui-icon {
        color: ${({tokens:e})=>e.theme.iconDefault};
      }
    }
  }
  :host > wui-flex[data-type='success'] {
    .icon-box {
      background-color: ${({tokens:e})=>e.core.backgroundSuccess};

      wui-icon {
        color: ${({tokens:e})=>e.core.borderSuccess};
      }
    }
  }
  :host > wui-flex[data-type='warning'] {
    .icon-box {
      background-color: ${({tokens:e})=>e.core.backgroundWarning};

      wui-icon {
        color: ${({tokens:e})=>e.core.borderWarning};
      }
    }
  }
  :host > wui-flex[data-type='error'] {
    .icon-box {
      background-color: ${({tokens:e})=>e.core.backgroundError};

      wui-icon {
        color: ${({tokens:e})=>e.core.borderError};
      }
    }
  }

  wui-flex {
    width: 100%;
  }

  wui-text {
    word-break: break-word;
    flex: 1;
  }

  .close {
    cursor: pointer;
    color: ${({tokens:e})=>e.theme.iconDefault};
  }

  .icon-box {
    height: 40px;
    width: 40px;
    border-radius: ${({borderRadius:e})=>e[2]};
    background-color: var(--local-icon-bg-value);
  }
`;var Se=function(e,t,o,i){var r=arguments.length,n=r<3?t:i===null?i=Object.getOwnPropertyDescriptor(t,o):i,s;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")n=Reflect.decorate(e,t,o,i);else for(var l=e.length-1;l>=0;l--)(s=e[l])&&(n=(r<3?s(n):r>3?s(t,o,n):s(t,o))||n);return r>3&&n&&Object.defineProperty(t,o,n),n};const ot={info:"info",success:"checkmark",warning:"warningCircle",error:"warning"};let oe=class extends C{constructor(){super(...arguments),this.message="",this.type="info"}render(){return c`
      <wui-flex
        data-type=${ge(this.type)}
        flexDirection="row"
        justifyContent="space-between"
        alignItems="center"
        gap="2"
      >
        <wui-flex columnGap="2" flexDirection="row" alignItems="center">
          <wui-flex
            flexDirection="row"
            alignItems="center"
            justifyContent="center"
            class="icon-box"
          >
            <wui-icon color="inherit" size="md" name=${ot[this.type]}></wui-icon>
          </wui-flex>
          <wui-text variant="md-medium" color="inherit" data-testid="wui-alertbar-text"
            >${this.message}</wui-text
          >
        </wui-flex>
        <wui-icon
          class="close"
          color="inherit"
          size="sm"
          name="close"
          @click=${this.onClose}
        ></wui-icon>
      </wui-flex>
    `}onClose(){ee.close()}};oe.styles=[re,tt];Se([g()],oe.prototype,"message",void 0);Se([g()],oe.prototype,"type",void 0);oe=Se([T("wui-alertbar")],oe);const nt=$`
  :host {
    display: block;
    position: absolute;
    top: ${({spacing:e})=>e[3]};
    left: ${({spacing:e})=>e[4]};
    right: ${({spacing:e})=>e[4]};
    opacity: 0;
    pointer-events: none;
  }
`;var Me=function(e,t,o,i){var r=arguments.length,n=r<3?t:i===null?i=Object.getOwnPropertyDescriptor(t,o):i,s;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")n=Reflect.decorate(e,t,o,i);else for(var l=e.length-1;l>=0;l--)(s=e[l])&&(n=(r<3?s(n):r>3?s(t,o,n):s(t,o))||n);return r>3&&n&&Object.defineProperty(t,o,n),n};const it={info:{backgroundColor:"fg-350",iconColor:"fg-325",icon:"info"},success:{backgroundColor:"success-glass-reown-020",iconColor:"success-125",icon:"checkmark"},warning:{backgroundColor:"warning-glass-reown-020",iconColor:"warning-100",icon:"warningCircle"},error:{backgroundColor:"error-glass-reown-020",iconColor:"error-125",icon:"warning"}};let be=class extends C{constructor(){super(),this.unsubscribe=[],this.open=ee.state.open,this.onOpen(!0),this.unsubscribe.push(ee.subscribeKey("open",t=>{this.open=t,this.onOpen(!1)}))}disconnectedCallback(){this.unsubscribe.forEach(t=>t())}render(){const{message:t,variant:o}=ee.state,i=it[o];return c`
      <wui-alertbar
        message=${t}
        backgroundColor=${i==null?void 0:i.backgroundColor}
        iconColor=${i==null?void 0:i.iconColor}
        icon=${i==null?void 0:i.icon}
        type=${o}
      ></wui-alertbar>
    `}onOpen(t){this.open?(this.animate([{opacity:0,transform:"scale(0.85)"},{opacity:1,transform:"scale(1)"}],{duration:150,fill:"forwards",easing:"ease"}),this.style.cssText="pointer-events: auto"):t||(this.animate([{opacity:1,transform:"scale(1)"},{opacity:0,transform:"scale(0.85)"}],{duration:150,fill:"forwards",easing:"ease"}),this.style.cssText="pointer-events: none")}};be.styles=nt;Me([m()],be.prototype,"open",void 0);be=Me([T("w3m-alertbar")],be);const at=$`
  button {
    background-color: transparent;
    padding: ${({spacing:e})=>e[1]};
  }

  button:focus-visible {
    box-shadow: 0 0 0 4px ${({tokens:e})=>e.core.foregroundAccent020};
  }

  button[data-variant='accent']:hover:enabled,
  button[data-variant='accent']:focus-visible {
    background-color: ${({tokens:e})=>e.core.foregroundAccent010};
  }

  button[data-variant='primary']:hover:enabled,
  button[data-variant='primary']:focus-visible,
  button[data-variant='secondary']:hover:enabled,
  button[data-variant='secondary']:focus-visible {
    background-color: ${({tokens:e})=>e.theme.foregroundSecondary};
  }

  button[data-size='xs'] > wui-icon {
    width: 8px;
    height: 8px;
  }

  button[data-size='sm'] > wui-icon {
    width: 12px;
    height: 12px;
  }

  button[data-size='xs'],
  button[data-size='sm'] {
    border-radius: ${({borderRadius:e})=>e[1]};
  }

  button[data-size='md'],
  button[data-size='lg'] {
    border-radius: ${({borderRadius:e})=>e[2]};
  }

  button[data-size='md'] > wui-icon {
    width: 16px;
    height: 16px;
  }

  button[data-size='lg'] > wui-icon {
    width: 20px;
    height: 20px;
  }

  button:disabled {
    background-color: transparent;
    cursor: not-allowed;
    opacity: 0.5;
  }

  button:hover:not(:disabled) {
    background-color: var(--wui-color-accent-glass-015);
  }

  button:focus-visible:not(:disabled) {
    background-color: var(--wui-color-accent-glass-015);
    box-shadow:
      inset 0 0 0 1px var(--wui-color-accent-100),
      0 0 0 4px var(--wui-color-accent-glass-020);
  }
`;var Y=function(e,t,o,i){var r=arguments.length,n=r<3?t:i===null?i=Object.getOwnPropertyDescriptor(t,o):i,s;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")n=Reflect.decorate(e,t,o,i);else for(var l=e.length-1;l>=0;l--)(s=e[l])&&(n=(r<3?s(n):r>3?s(t,o,n):s(t,o))||n);return r>3&&n&&Object.defineProperty(t,o,n),n};let B=class extends C{constructor(){super(...arguments),this.size="md",this.disabled=!1,this.icon="copy",this.iconColor="default",this.variant="accent"}render(){const t={accent:"accent-primary",primary:"inverse",secondary:"default"};return c`
      <button data-variant=${this.variant} ?disabled=${this.disabled} data-size=${this.size}>
        <wui-icon
          color=${t[this.variant]||this.iconColor}
          size=${this.size}
          name=${this.icon}
        ></wui-icon>
      </button>
    `}};B.styles=[re,Ue,at];Y([g()],B.prototype,"size",void 0);Y([g({type:Boolean})],B.prototype,"disabled",void 0);Y([g()],B.prototype,"icon",void 0);Y([g()],B.prototype,"iconColor",void 0);Y([g()],B.prototype,"variant",void 0);B=Y([T("wui-icon-link")],B);const rt=$`
  button {
    display: block;
    display: flex;
    align-items: center;
    padding: ${({spacing:e})=>e[1]};
    transition: background-color ${({durations:e})=>e.lg}
      ${({easings:e})=>e["ease-out-power-2"]};
    will-change: background-color;
    border-radius: ${({borderRadius:e})=>e[32]};
  }

  wui-image {
    border-radius: 100%;
  }

  wui-text {
    padding-left: ${({spacing:e})=>e[1]};
  }

  .left-icon-container,
  .right-icon-container {
    width: 24px;
    height: 24px;
    justify-content: center;
    align-items: center;
  }

  wui-icon {
    color: ${({tokens:e})=>e.theme.iconDefault};
  }

  /* -- Sizes --------------------------------------------------- */
  button[data-size='lg'] {
    height: 32px;
  }

  button[data-size='md'] {
    height: 28px;
  }

  button[data-size='sm'] {
    height: 24px;
  }

  button[data-size='lg'] wui-image {
    width: 24px;
    height: 24px;
  }

  button[data-size='md'] wui-image {
    width: 20px;
    height: 20px;
  }

  button[data-size='sm'] wui-image {
    width: 16px;
    height: 16px;
  }

  button[data-size='lg'] .left-icon-container {
    width: 24px;
    height: 24px;
  }

  button[data-size='md'] .left-icon-container {
    width: 20px;
    height: 20px;
  }

  button[data-size='sm'] .left-icon-container {
    width: 16px;
    height: 16px;
  }

  /* -- Variants --------------------------------------------------------- */
  button[data-type='filled-dropdown'] {
    background-color: ${({tokens:e})=>e.theme.foregroundPrimary};
  }

  button[data-type='text-dropdown'] {
    background-color: transparent;
  }

  /* -- Focus states --------------------------------------------------- */
  button:focus-visible:enabled {
    background-color: ${({tokens:e})=>e.theme.foregroundSecondary};
    box-shadow: 0 0 0 4px ${({tokens:e})=>e.core.foregroundAccent040};
  }

  /* -- Hover & Active states ----------------------------------------------------------- */
  @media (hover: hover) and (pointer: fine) {
    button:hover:enabled,
    button:active:enabled {
      background-color: ${({tokens:e})=>e.theme.foregroundSecondary};
    }
  }

  /* -- Disabled states --------------------------------------------------- */
  button:disabled {
    background-color: ${({tokens:e})=>e.theme.foregroundSecondary};
    opacity: 0.5;
  }
`;var X=function(e,t,o,i){var r=arguments.length,n=r<3?t:i===null?i=Object.getOwnPropertyDescriptor(t,o):i,s;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")n=Reflect.decorate(e,t,o,i);else for(var l=e.length-1;l>=0;l--)(s=e[l])&&(n=(r<3?s(n):r>3?s(t,o,n):s(t,o))||n);return r>3&&n&&Object.defineProperty(t,o,n),n};const st={lg:"lg-regular",md:"md-regular",sm:"sm-regular"},ct={lg:"lg",md:"md",sm:"sm"};let U=class extends C{constructor(){super(...arguments),this.imageSrc="",this.text="",this.size="lg",this.type="text-dropdown",this.disabled=!1}render(){return c`<button ?disabled=${this.disabled} data-size=${this.size} data-type=${this.type}>
      ${this.imageTemplate()} ${this.textTemplate()}
      <wui-flex class="right-icon-container">
        <wui-icon name="chevronBottom"></wui-icon>
      </wui-flex>
    </button>`}textTemplate(){const t=st[this.size];return this.text?c`<wui-text color="primary" variant=${t}>${this.text}</wui-text>`:null}imageTemplate(){if(this.imageSrc)return c`<wui-image src=${this.imageSrc} alt="select visual"></wui-image>`;const t=ct[this.size];return c` <wui-flex class="left-icon-container">
      <wui-icon size=${t} name="networkPlaceholder"></wui-icon>
    </wui-flex>`}};U.styles=[re,Ue,rt];X([g()],U.prototype,"imageSrc",void 0);X([g()],U.prototype,"text",void 0);X([g()],U.prototype,"size",void 0);X([g()],U.prototype,"type",void 0);X([g({type:Boolean})],U.prototype,"disabled",void 0);U=X([T("wui-select")],U);const lt=$`
  :host {
    height: 60px;
  }

  :host > wui-flex {
    box-sizing: border-box;
    background-color: ${({tokens:e})=>e.theme.backgroundPrimary};
  }

  wui-text {
    background-color: ${({tokens:e})=>e.theme.backgroundPrimary};
  }

  wui-flex.w3m-header-title {
    transform: translateY(0);
    opacity: 1;
  }

  wui-flex.w3m-header-title[view-direction='prev'] {
    animation:
      slide-down-out 120ms forwards ${({easings:e})=>e["ease-out-power-2"]},
      slide-down-in 120ms forwards ${({easings:e})=>e["ease-out-power-2"]};
    animation-delay: 0ms, 200ms;
  }

  wui-flex.w3m-header-title[view-direction='next'] {
    animation:
      slide-up-out 120ms forwards ${({easings:e})=>e["ease-out-power-2"]},
      slide-up-in 120ms forwards ${({easings:e})=>e["ease-out-power-2"]};
    animation-delay: 0ms, 200ms;
  }

  wui-icon-link[data-hidden='true'] {
    opacity: 0 !important;
    pointer-events: none;
  }

  @keyframes slide-up-out {
    from {
      transform: translateY(0px);
      opacity: 1;
    }
    to {
      transform: translateY(3px);
      opacity: 0;
    }
  }

  @keyframes slide-up-in {
    from {
      transform: translateY(-3px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }

  @keyframes slide-down-out {
    from {
      transform: translateY(0px);
      opacity: 1;
    }
    to {
      transform: translateY(-3px);
      opacity: 0;
    }
  }

  @keyframes slide-down-in {
    from {
      transform: translateY(3px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }
`;var z=function(e,t,o,i){var r=arguments.length,n=r<3?t:i===null?i=Object.getOwnPropertyDescriptor(t,o):i,s;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")n=Reflect.decorate(e,t,o,i);else for(var l=e.length-1;l>=0;l--)(s=e[l])&&(n=(r<3?s(n):r>3?s(t,o,n):s(t,o))||n);return r>3&&n&&Object.defineProperty(t,o,n),n};const dt=["SmartSessionList"];function Ie(){var s,l,p,w,f,x,A;const e=(l=(s=u.state.data)==null?void 0:s.connector)==null?void 0:l.name,t=(w=(p=u.state.data)==null?void 0:p.wallet)==null?void 0:w.name,o=(x=(f=u.state.data)==null?void 0:f.network)==null?void 0:x.name,i=t??e,r=fe.getConnectors();return{Connect:`Connect ${r.length===1&&((A=r[0])==null?void 0:A.id)==="w3m-email"?"Email":""} Wallet`,Create:"Create Wallet",ChooseAccountName:void 0,Account:void 0,AccountSettings:void 0,AllWallets:"All Wallets",ApproveTransaction:"Approve Transaction",BuyInProgress:"Buy",ConnectingExternal:i??"Connect Wallet",ConnectingWalletConnect:i??"WalletConnect",ConnectingWalletConnectBasic:"WalletConnect",ConnectingSiwe:"Sign In",Convert:"Convert",ConvertSelectToken:"Select token",ConvertPreview:"Preview Convert",Downloads:i?`Get ${i}`:"Downloads",EmailLogin:"Email Login",EmailVerifyOtp:"Confirm Email",EmailVerifyDevice:"Register Device",GetWallet:"Get a Wallet",Networks:"Choose Network",OnRampProviders:"Choose Provider",OnRampActivity:"Activity",OnRampTokenSelect:"Select Token",OnRampFiatSelect:"Select Currency",Pay:"How you pay",ProfileWallets:"Wallets",SwitchNetwork:o??"Switch Network",Transactions:"Activity",UnsupportedChain:"Switch Network",UpgradeEmailWallet:"Upgrade Your Wallet",UpdateEmailWallet:"Edit Email",UpdateEmailPrimaryOtp:"Confirm Current Email",UpdateEmailSecondaryOtp:"Confirm New Email",WhatIsABuy:"What is Buy?",RegisterAccountName:"Choose Name",RegisterAccountNameSuccess:"",WalletReceive:"Receive",WalletCompatibleNetworks:"Compatible Networks",Swap:"Swap",SwapSelectToken:"Select Token",SwapPreview:"Preview Swap",WalletSend:"Send",WalletSendPreview:"Review Send",WalletSendSelectToken:"Select Token",WhatIsANetwork:"What is a network?",WhatIsAWallet:"What is a Wallet?",ConnectWallets:"Connect Wallet",ConnectSocials:"All Socials",ConnectingSocial:J.state.socialProvider?J.state.socialProvider.charAt(0).toUpperCase()+J.state.socialProvider.slice(1):"Connect Social",ConnectingMultiChain:"Select Chain",ConnectingFarcaster:"Farcaster",SwitchActiveChain:"Switch Chain",SmartSessionCreated:void 0,SmartSessionList:"Smart Sessions",SIWXSignMessage:"Sign In",PayLoading:"Payment in Progress",DataCapture:"Profile",DataCaptureOtpConfirm:"Confirm Email",FundWallet:"Fund Wallet",PayWithExchange:"Deposit from an Exchange",PayWithExchangeSelectAsset:"Select Asset"}}let W=class extends C{constructor(){super(),this.unsubscribe=[],this.heading=Ie()[u.state.view],this.network=h.state.activeCaipNetwork,this.networkImage=ke.getNetworkImage(this.network),this.showBack=!1,this.prevHistoryLength=1,this.view=u.state.view,this.viewDirection="",this.unsubscribe.push(Ge.subscribeNetworkImages(()=>{this.networkImage=ke.getNetworkImage(this.network)}),u.subscribeKey("view",t=>{setTimeout(()=>{this.view=t,this.heading=Ie()[t]},H.ANIMATION_DURATIONS.HeaderText),this.onViewChange(),this.onHistoryChange()}),h.subscribeKey("activeCaipNetwork",t=>{this.network=t,this.networkImage=ke.getNetworkImage(this.network)}))}disconnectCallback(){this.unsubscribe.forEach(t=>t())}render(){return c`
      <wui-flex
        .padding=${["0","5","0","5"]}
        justifyContent="space-between"
        alignItems="center"
      >
        ${this.leftHeaderTemplate()} ${this.titleTemplate()} ${this.rightHeaderTemplate()}
      </wui-flex>
    `}onWalletHelp(){V.sendEvent({type:"track",event:"CLICK_WALLET_HELP"}),u.push("WhatIsAWallet")}async onClose(){await Le.safeClose()}rightHeaderTemplate(){var o,i,r;const t=(r=(i=(o=k)==null?void 0:o.state)==null?void 0:i.features)==null?void 0:r.smartSessions;return u.state.view!=="Account"||!t?this.closeButtonTemplate():c`<wui-flex>
      <wui-icon-link
        icon="clock"
        variant="primary"
        @click=${()=>u.push("SmartSessionList")}
        data-testid="w3m-header-smart-sessions"
      ></wui-icon-link>
      ${this.closeButtonTemplate()}
    </wui-flex> `}closeButtonTemplate(){return c`
      <wui-icon-link
        icon="close"
        variant="primary"
        @click=${this.onClose.bind(this)}
        data-testid="w3m-header-close"
      ></wui-icon-link>
    `}titleTemplate(){const t=dt.includes(this.view);return c`
      <wui-flex
        view-direction="${this.viewDirection}"
        class="w3m-header-title"
        alignItems="center"
        gap="2"
      >
        <wui-text variant="lg-regular" color="primary" data-testid="w3m-header-text">
          ${this.heading}
        </wui-text>
        ${t?c`<wui-tag variant="accent" size="md">Beta</wui-tag>`:null}
      </wui-flex>
    `}leftHeaderTemplate(){var w;const{view:t}=u.state,o=t==="Connect",i=k.state.enableEmbedded,r=t==="ApproveTransaction",n=t==="ConnectingSiwe",s=t==="Account",l=k.state.enableNetworkSwitch,p=r||n||o&&i;return s&&l?c`<wui-select
        id="dynamic"
        data-testid="w3m-account-select-network"
        active-network=${ge((w=this.network)==null?void 0:w.name)}
        @click=${this.onNetworks.bind(this)}
        imageSrc=${ge(this.networkImage)}
      ></wui-select>`:this.showBack&&!p?c`<wui-icon-link
        data-testid="header-back"
        id="dynamic"
        icon="chevronLeft"
        variant="primary"
        @click=${this.onGoBack.bind(this)}
      ></wui-icon-link>`:c`<wui-icon-link
      data-hidden=${!o}
      id="dynamic"
      icon="helpCircle"
      variant="primary"
      @click=${this.onWalletHelp.bind(this)}
    ></wui-icon-link>`}onNetworks(){this.isAllowedNetworkSwitch()&&(V.sendEvent({type:"track",event:"CLICK_NETWORKS"}),u.push("Networks"))}isAllowedNetworkSwitch(){const t=h.getAllRequestedCaipNetworks(),o=t?t.length>1:!1,i=t==null?void 0:t.find(({id:r})=>{var n;return r===((n=this.network)==null?void 0:n.id)});return o||!i}onViewChange(){const{history:t}=u.state;let o=H.VIEW_DIRECTION.Next;t.length<this.prevHistoryLength&&(o=H.VIEW_DIRECTION.Prev),this.prevHistoryLength=t.length,this.viewDirection=o}async onHistoryChange(){var i;const{history:t}=u.state,o=(i=this.shadowRoot)==null?void 0:i.querySelector("#dynamic");t.length>1&&!this.showBack&&o?(await o.animate([{opacity:1},{opacity:0}],{duration:200,fill:"forwards",easing:"ease"}).finished,this.showBack=!0,o.animate([{opacity:0},{opacity:1}],{duration:200,fill:"forwards",easing:"ease"})):t.length<=1&&this.showBack&&o&&(await o.animate([{opacity:1},{opacity:0}],{duration:200,fill:"forwards",easing:"ease"}).finished,this.showBack=!1,o.animate([{opacity:0},{opacity:1}],{duration:200,fill:"forwards",easing:"ease"}))}onGoBack(){u.goBack()}};W.styles=lt;z([m()],W.prototype,"heading",void 0);z([m()],W.prototype,"network",void 0);z([m()],W.prototype,"networkImage",void 0);z([m()],W.prototype,"showBack",void 0);z([m()],W.prototype,"prevHistoryLength",void 0);z([m()],W.prototype,"view",void 0);z([m()],W.prototype,"viewDirection",void 0);W=z([T("w3m-header")],W);const ut=$`
  :host {
    display: flex;
    align-items: center;
    gap: ${({spacing:e})=>e[1]};
    padding: ${({spacing:e})=>e[2]} ${({spacing:e})=>e[3]}
      ${({spacing:e})=>e[2]} ${({spacing:e})=>e[2]};
    border-radius: ${({borderRadius:e})=>e[20]};
    background-color: ${({tokens:e})=>e.theme.foregroundPrimary};
    box-shadow:
      0px 0px 8px 0px rgba(0, 0, 0, 0.1),
      inset 0 0 0 1px ${({tokens:e})=>e.theme.borderPrimary};
    max-width: 320px;
  }

  wui-icon-box {
    border-radius: ${({borderRadius:e})=>e.round} !important;
    overflow: hidden;
  }

  wui-loading-spinner {
    padding: ${({spacing:e})=>e[1]};
    background-color: ${({tokens:e})=>e.core.foregroundAccent010};
    border-radius: ${({borderRadius:e})=>e.round} !important;
  }
`;var Ce=function(e,t,o,i){var r=arguments.length,n=r<3?t:i===null?i=Object.getOwnPropertyDescriptor(t,o):i,s;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")n=Reflect.decorate(e,t,o,i);else for(var l=e.length-1;l>=0;l--)(s=e[l])&&(n=(r<3?s(n):r>3?s(t,o,n):s(t,o))||n);return r>3&&n&&Object.defineProperty(t,o,n),n};let ne=class extends C{constructor(){super(...arguments),this.message="",this.variant="success"}render(){return c`
      ${this.templateIcon()}
      <wui-text variant="lg-regular" color="primary" data-testid="wui-snackbar-message"
        >${this.message}</wui-text
      >
    `}templateIcon(){const t={success:"success",error:"error",warning:"warning",info:"default"},o={success:"checkmark",error:"warning",warning:"warningCircle",info:"info"};return this.variant==="loading"?c`<wui-loading-spinner size="md" color="accent-primary"></wui-loading-spinner>`:c`<wui-icon-box
      size="md"
      color=${t[this.variant]}
      icon=${o[this.variant]}
    ></wui-icon-box>`}};ne.styles=[re,ut];Ce([g()],ne.prototype,"message",void 0);Ce([g()],ne.prototype,"variant",void 0);ne=Ce([T("wui-snackbar")],ne);const pt=ze`
  :host {
    display: block;
    position: absolute;
    opacity: 0;
    pointer-events: none;
    top: 11px;
    left: 50%;
    width: max-content;
  }
`;var je=function(e,t,o,i){var r=arguments.length,n=r<3?t:i===null?i=Object.getOwnPropertyDescriptor(t,o):i,s;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")n=Reflect.decorate(e,t,o,i);else for(var l=e.length-1;l>=0;l--)(s=e[l])&&(n=(r<3?s(n):r>3?s(t,o,n):s(t,o))||n);return r>3&&n&&Object.defineProperty(t,o,n),n};let ve=class extends C{constructor(){super(),this.unsubscribe=[],this.timeout=void 0,this.open=v.state.open,this.unsubscribe.push(v.subscribeKey("open",t=>{this.open=t,this.onOpen()}))}disconnectedCallback(){clearTimeout(this.timeout),this.unsubscribe.forEach(t=>t())}render(){const{message:t,variant:o}=v.state;return c` <wui-snackbar message=${t} variant=${o}></wui-snackbar> `}onOpen(){clearTimeout(this.timeout),this.open?(this.animate([{opacity:0,transform:"translateX(-50%) scale(0.85)"},{opacity:1,transform:"translateX(-50%) scale(1)"}],{duration:150,fill:"forwards",easing:"ease"}),this.timeout&&clearTimeout(this.timeout),v.state.autoClose&&(this.timeout=setTimeout(()=>v.hide(),2500))):this.animate([{opacity:1,transform:"translateX(-50%) scale(1)"},{opacity:0,transform:"translateX(-50%) scale(0.85)"}],{duration:150,fill:"forwards",easing:"ease"})}};ve.styles=pt;je([m()],ve.prototype,"open",void 0);ve=je([T("w3m-snackbar")],ve);const wt=$`
  :host {
    pointer-events: none;
  }

  :host > wui-flex {
    display: var(--w3m-tooltip-display);
    opacity: var(--w3m-tooltip-opacity);
    padding: 9px ${({spacing:e})=>e[3]} 10px ${({spacing:e})=>e[3]};
    border-radius: ${({borderRadius:e})=>e[3]};
    color: ${({tokens:e})=>e.theme.backgroundPrimary};
    position: absolute;
    top: var(--w3m-tooltip-top);
    left: var(--w3m-tooltip-left);
    transform: translate(calc(-50% + var(--w3m-tooltip-parent-width)), calc(-100% - 8px));
    max-width: calc(var(--apkt-modal-width) - ${({spacing:e})=>e[5]});
    transition: opacity ${({durations:e})=>e.lg}
      ${({easings:e})=>e["ease-out-power-2"]};
    will-change: opacity;
    opacity: 0;
    animation-duration: ${({durations:e})=>e.xl};
    animation-timing-function: ${({easings:e})=>e["ease-out-power-2"]};
    animation-name: fade-in;
    animation-fill-mode: forwards;
  }

  :host([data-variant='shade']) > wui-flex {
    background-color: ${({tokens:e})=>e.theme.foregroundPrimary};
  }

  :host([data-variant='shade']) > wui-flex > wui-text {
    color: ${({tokens:e})=>e.theme.textSecondary};
  }

  :host([data-variant='fill']) > wui-flex {
    background-color: ${({tokens:e})=>e.theme.textPrimary};
    border: none;
  }

  wui-icon {
    position: absolute;
    width: 12px !important;
    height: 4px !important;
    color: ${({tokens:e})=>e.theme.foregroundPrimary};
  }

  wui-icon[data-placement='top'] {
    bottom: 0px;
    left: 50%;
    transform: translate(-50%, 95%);
  }

  wui-icon[data-placement='bottom'] {
    top: 0;
    left: 50%;
    transform: translate(-50%, -95%) rotate(180deg);
  }

  wui-icon[data-placement='right'] {
    top: 50%;
    left: 0;
    transform: translate(-65%, -50%) rotate(90deg);
  }

  wui-icon[data-placement='left'] {
    top: 50%;
    right: 0%;
    transform: translate(65%, -50%) rotate(270deg);
  }

  @keyframes fade-in {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
`;var se=function(e,t,o,i){var r=arguments.length,n=r<3?t:i===null?i=Object.getOwnPropertyDescriptor(t,o):i,s;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")n=Reflect.decorate(e,t,o,i);else for(var l=e.length-1;l>=0;l--)(s=e[l])&&(n=(r<3?s(n):r>3?s(t,o,n):s(t,o))||n);return r>3&&n&&Object.defineProperty(t,o,n),n};let K=class extends C{constructor(){super(),this.unsubscribe=[],this.open=Z.state.open,this.message=Z.state.message,this.triggerRect=Z.state.triggerRect,this.variant=Z.state.variant,this.unsubscribe.push(Z.subscribe(t=>{this.open=t.open,this.message=t.message,this.triggerRect=t.triggerRect,this.variant=t.variant}))}disconnectedCallback(){this.unsubscribe.forEach(t=>t())}render(){this.dataset.variant=this.variant;const t=this.triggerRect.top,o=this.triggerRect.left;return this.style.cssText=`
    --w3m-tooltip-top: ${t}px;
    --w3m-tooltip-left: ${o}px;
    --w3m-tooltip-parent-width: ${this.triggerRect.width/2}px;
    --w3m-tooltip-display: ${this.open?"flex":"none"};
    --w3m-tooltip-opacity: ${this.open?1:0};
    `,c`<wui-flex>
      <wui-icon data-placement="top" size="inherit" name="cursor"></wui-icon>
      <wui-text color="primary" variant="sm-regular">${this.message}</wui-text>
    </wui-flex>`}};K.styles=[wt];se([m()],K.prototype,"open",void 0);se([m()],K.prototype,"message",void 0);se([m()],K.prototype,"triggerRect",void 0);se([m()],K.prototype,"variant",void 0);K=se([T("w3m-tooltip")],K);const te={getTabsByNamespace(e){var o;return!!e&&e===N.CHAIN.EVM?((o=k.state.remoteFeatures)==null?void 0:o.activity)===!1?H.ACCOUNT_TABS.filter(i=>i.label!=="Activity"):H.ACCOUNT_TABS:[]},isValidReownName(e){return/^[a-zA-Z0-9]+$/gu.test(e)},isValidEmail(e){return/^[^\s@]+@[^\s@]+\.[^\s@]+$/gu.test(e)},validateReownName(e){return e.replace(/\^/gu,"").toLowerCase().replace(/[^a-zA-Z0-9]/gu,"")},hasFooter(){var t;const e=u.state.view;if(H.VIEWS_WITH_LEGAL_FOOTER.includes(e)){const{termsConditionsUrl:o,privacyPolicyUrl:i}=k.state,r=(t=k.state.features)==null?void 0:t.legalCheckbox;return!(!o&&!i||r)}return H.VIEWS_WITH_DEFAULT_FOOTER.includes(e)}},mt=$`
  :host wui-ux-by-reown {
    padding-top: 0;
  }

  :host wui-ux-by-reown.branding-only {
    padding-top: ${({spacing:e})=>e[3]};
  }

  a {
    text-decoration: none;
    color: ${({tokens:e})=>e.core.textAccentPrimary};
    font-weight: 500;
  }
`;var He=function(e,t,o,i){var r=arguments.length,n=r<3?t:i===null?i=Object.getOwnPropertyDescriptor(t,o):i,s;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")n=Reflect.decorate(e,t,o,i);else for(var l=e.length-1;l>=0;l--)(s=e[l])&&(n=(r<3?s(n):r>3?s(t,o,n):s(t,o))||n);return r>3&&n&&Object.defineProperty(t,o,n),n};let ye=class extends C{constructor(){super(),this.unsubscribe=[],this.remoteFeatures=k.state.remoteFeatures,this.unsubscribe.push(k.subscribeKey("remoteFeatures",t=>this.remoteFeatures=t))}disconnectedCallback(){this.unsubscribe.forEach(t=>t())}render(){var n;const{termsConditionsUrl:t,privacyPolicyUrl:o}=k.state,i=(n=k.state.features)==null?void 0:n.legalCheckbox;return!t&&!o||i?c`
        <wui-flex flexDirection="column"> ${this.reownBrandingTemplate(!0)} </wui-flex>
      `:c`
      <wui-flex flexDirection="column">
        <wui-flex .padding=${["4","3","3","3"]} justifyContent="center">
          <wui-text color="secondary" variant="md-regular" align="center">
            By connecting your wallet, you agree to our <br />
            ${this.termsTemplate()} ${this.andTemplate()} ${this.privacyTemplate()}
          </wui-text>
        </wui-flex>
        ${this.reownBrandingTemplate()}
      </wui-flex>
    `}andTemplate(){const{termsConditionsUrl:t,privacyPolicyUrl:o}=k.state;return t&&o?"and":""}termsTemplate(){const{termsConditionsUrl:t}=k.state;return t?c`<a href=${t} target="_blank" rel="noopener noreferrer"
      >Terms of Service</a
    >`:null}privacyTemplate(){const{privacyPolicyUrl:t}=k.state;return t?c`<a href=${t} target="_blank" rel="noopener noreferrer"
      >Privacy Policy</a
    >`:null}reownBrandingTemplate(t=!1){var o;return(o=this.remoteFeatures)!=null&&o.reownBranding?t?c`<wui-ux-by-reown class="branding-only"></wui-ux-by-reown>`:c`<wui-ux-by-reown></wui-ux-by-reown>`:null}};ye.styles=[mt];He([m()],ye.prototype,"remoteFeatures",void 0);ye=He([T("w3m-legal-footer")],ye);const ht=ze``;var ft=function(e,t,o,i){var r=arguments.length,n=r<3?t:i===null?i=Object.getOwnPropertyDescriptor(t,o):i,s;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")n=Reflect.decorate(e,t,o,i);else for(var l=e.length-1;l>=0;l--)(s=e[l])&&(n=(r<3?s(n):r>3?s(t,o,n):s(t,o))||n);return r>3&&n&&Object.defineProperty(t,o,n),n};let xe=class extends C{render(){const{termsConditionsUrl:t,privacyPolicyUrl:o}=k.state;return!t&&!o?null:c`
      <wui-flex
        .padding=${["4","3","3","3"]}
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        gap="3"
      >
        <wui-text color="secondary" variant="md-regular" align="center">
          We work with the best providers to give you the lowest fees and best support. More options
          coming soon!
        </wui-text>

        ${this.howDoesItWorkTemplate()}
      </wui-flex>
    `}howDoesItWorkTemplate(){return c` <wui-link @click=${this.onWhatIsBuy.bind(this)}>
      <wui-icon size="xs" color="accent-primary" slot="iconLeft" name="helpCircle"></wui-icon>
      How does it work?
    </wui-link>`}onWhatIsBuy(){V.sendEvent({type:"track",event:"SELECT_WHAT_IS_A_BUY",properties:{isSmartAccount:ue(h.state.activeChain)===pe.ACCOUNT_TYPES.SMART_ACCOUNT}}),u.push("WhatIsABuy")}};xe.styles=[ht];xe=ft([T("w3m-onramp-providers-footer")],xe);const gt=$`
  :host {
    display: block;
  }

  div.container {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    overflow: hidden;
    height: auto;
    display: block;
  }

  div.container[status='hide'] {
    animation: fade-out;
    animation-duration: var(--apkt-duration-dynamic);
    animation-timing-function: ${({easings:e})=>e["ease-out-power-2"]};
    animation-fill-mode: both;
    animation-delay: 0s;
  }

  div.container[status='show'] {
    animation: fade-in;
    animation-duration: var(--apkt-duration-dynamic);
    animation-timing-function: ${({easings:e})=>e["ease-out-power-2"]};
    animation-fill-mode: both;
    animation-delay: var(--apkt-duration-dynamic);
  }

  @keyframes fade-in {
    from {
      opacity: 0;
      filter: blur(6px);
    }
    to {
      opacity: 1;
      filter: blur(0px);
    }
  }

  @keyframes fade-out {
    from {
      opacity: 1;
      filter: blur(0px);
    }
    to {
      opacity: 0;
      filter: blur(6px);
    }
  }
`;var Ae=function(e,t,o,i){var r=arguments.length,n=r<3?t:i===null?i=Object.getOwnPropertyDescriptor(t,o):i,s;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")n=Reflect.decorate(e,t,o,i);else for(var l=e.length-1;l>=0;l--)(s=e[l])&&(n=(r<3?s(n):r>3?s(t,o,n):s(t,o))||n);return r>3&&n&&Object.defineProperty(t,o,n),n};let ie=class extends C{constructor(){super(...arguments),this.resizeObserver=void 0,this.unsubscribe=[],this.status="hide",this.view=u.state.view}firstUpdated(){this.status=te.hasFooter()?"show":"hide",this.unsubscribe.push(u.subscribeKey("view",t=>{this.view=t,this.status=te.hasFooter()?"show":"hide",this.status==="hide"&&document.documentElement.style.setProperty("--apkt-footer-height","0px")})),this.resizeObserver=new ResizeObserver(t=>{for(const o of t)if(o.target===this.getWrapper()){const i=`${o.contentRect.height}px`;document.documentElement.style.setProperty("--apkt-footer-height",i)}}),this.resizeObserver.observe(this.getWrapper())}render(){return c`
      <div class="container" status=${this.status}>${this.templatePageContainer()}</div>
    `}templatePageContainer(){return te.hasFooter()?c` ${this.templateFooter()}`:null}templateFooter(){switch(this.view){case"Networks":return this.templateNetworksFooter();case"Connect":case"ConnectWallets":case"OnRampFiatSelect":case"OnRampTokenSelect":return c`<w3m-legal-footer></w3m-legal-footer>`;case"OnRampProviders":return c`<w3m-onramp-providers-footer></w3m-onramp-providers-footer>`;default:return null}}templateNetworksFooter(){return c` <wui-flex
      class="footer-in"
      padding="3"
      flexDirection="column"
      gap="3"
      alignItems="center"
    >
      <wui-text variant="md-regular" color="secondary" align="center">
        Your connected wallet may not support some of the networks available for this dApp
      </wui-text>
      <wui-link @click=${this.onNetworkHelp.bind(this)}>
        <wui-icon size="sm" color="accent-primary" slot="iconLeft" name="helpCircle"></wui-icon>
        What is a network
      </wui-link>
    </wui-flex>`}onNetworkHelp(){V.sendEvent({type:"track",event:"CLICK_NETWORK_HELP"}),u.push("WhatIsANetwork")}getWrapper(){var t;return(t=this.shadowRoot)==null?void 0:t.querySelector("div.container")}};ie.styles=[gt];Ae([m()],ie.prototype,"status",void 0);Ae([m()],ie.prototype,"view",void 0);ie=Ae([T("w3m-footer")],ie);const bt=$`
  :host {
    display: block;
    width: inherit;
  }
`;var $e=function(e,t,o,i){var r=arguments.length,n=r<3?t:i===null?i=Object.getOwnPropertyDescriptor(t,o):i,s;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")n=Reflect.decorate(e,t,o,i);else for(var l=e.length-1;l>=0;l--)(s=e[l])&&(n=(r<3?s(n):r>3?s(t,o,n):s(t,o))||n);return r>3&&n&&Object.defineProperty(t,o,n),n};let ae=class extends C{constructor(){super(),this.unsubscribe=[],this.viewState=u.state.view,this.history=u.state.history.join(","),this.unsubscribe.push(u.subscribeKey("view",()=>{this.history=u.state.history.join(","),document.documentElement.style.setProperty("--apkt-duration-dynamic","var(--apkt-durations-lg)")}))}disconnectedCallback(){this.unsubscribe.forEach(t=>t()),document.documentElement.style.setProperty("--apkt-duration-dynamic","0s")}render(){return c`${this.templatePageContainer()}`}templatePageContainer(){return c`<w3m-router-container
      history=${this.history}
      .setView=${()=>{this.viewState=u.state.view}}
    >
      ${this.viewTemplate(this.viewState)}
    </w3m-router-container>`}viewTemplate(t){switch(t){case"AccountSettings":return c`<w3m-account-settings-view></w3m-account-settings-view>`;case"Account":return c`<w3m-account-view></w3m-account-view>`;case"AllWallets":return c`<w3m-all-wallets-view></w3m-all-wallets-view>`;case"ApproveTransaction":return c`<w3m-approve-transaction-view></w3m-approve-transaction-view>`;case"BuyInProgress":return c`<w3m-buy-in-progress-view></w3m-buy-in-progress-view>`;case"ChooseAccountName":return c`<w3m-choose-account-name-view></w3m-choose-account-name-view>`;case"Connect":return c`<w3m-connect-view></w3m-connect-view>`;case"Create":return c`<w3m-connect-view walletGuide="explore"></w3m-connect-view>`;case"ConnectingWalletConnect":return c`<w3m-connecting-wc-view></w3m-connecting-wc-view>`;case"ConnectingWalletConnectBasic":return c`<w3m-connecting-wc-basic-view></w3m-connecting-wc-basic-view>`;case"ConnectingExternal":return c`<w3m-connecting-external-view></w3m-connecting-external-view>`;case"ConnectingSiwe":return c`<w3m-connecting-siwe-view></w3m-connecting-siwe-view>`;case"ConnectWallets":return c`<w3m-connect-wallets-view></w3m-connect-wallets-view>`;case"ConnectSocials":return c`<w3m-connect-socials-view></w3m-connect-socials-view>`;case"ConnectingSocial":return c`<w3m-connecting-social-view></w3m-connecting-social-view>`;case"DataCapture":return c`<w3m-data-capture-view></w3m-data-capture-view>`;case"DataCaptureOtpConfirm":return c`<w3m-data-capture-otp-confirm-view></w3m-data-capture-otp-confirm-view>`;case"Downloads":return c`<w3m-downloads-view></w3m-downloads-view>`;case"EmailLogin":return c`<w3m-email-login-view></w3m-email-login-view>`;case"EmailVerifyOtp":return c`<w3m-email-verify-otp-view></w3m-email-verify-otp-view>`;case"EmailVerifyDevice":return c`<w3m-email-verify-device-view></w3m-email-verify-device-view>`;case"GetWallet":return c`<w3m-get-wallet-view></w3m-get-wallet-view>`;case"Networks":return c`<w3m-networks-view></w3m-networks-view>`;case"SwitchNetwork":return c`<w3m-network-switch-view></w3m-network-switch-view>`;case"ProfileWallets":return c`<w3m-profile-wallets-view></w3m-profile-wallets-view>`;case"Transactions":return c`<w3m-transactions-view></w3m-transactions-view>`;case"OnRampProviders":return c`<w3m-onramp-providers-view></w3m-onramp-providers-view>`;case"OnRampTokenSelect":return c`<w3m-onramp-token-select-view></w3m-onramp-token-select-view>`;case"OnRampFiatSelect":return c`<w3m-onramp-fiat-select-view></w3m-onramp-fiat-select-view>`;case"UpgradeEmailWallet":return c`<w3m-upgrade-wallet-view></w3m-upgrade-wallet-view>`;case"UpdateEmailWallet":return c`<w3m-update-email-wallet-view></w3m-update-email-wallet-view>`;case"UpdateEmailPrimaryOtp":return c`<w3m-update-email-primary-otp-view></w3m-update-email-primary-otp-view>`;case"UpdateEmailSecondaryOtp":return c`<w3m-update-email-secondary-otp-view></w3m-update-email-secondary-otp-view>`;case"UnsupportedChain":return c`<w3m-unsupported-chain-view></w3m-unsupported-chain-view>`;case"Swap":return c`<w3m-swap-view></w3m-swap-view>`;case"SwapSelectToken":return c`<w3m-swap-select-token-view></w3m-swap-select-token-view>`;case"SwapPreview":return c`<w3m-swap-preview-view></w3m-swap-preview-view>`;case"WalletSend":return c`<w3m-wallet-send-view></w3m-wallet-send-view>`;case"WalletSendSelectToken":return c`<w3m-wallet-send-select-token-view></w3m-wallet-send-select-token-view>`;case"WalletSendPreview":return c`<w3m-wallet-send-preview-view></w3m-wallet-send-preview-view>`;case"WhatIsABuy":return c`<w3m-what-is-a-buy-view></w3m-what-is-a-buy-view>`;case"WalletReceive":return c`<w3m-wallet-receive-view></w3m-wallet-receive-view>`;case"WalletCompatibleNetworks":return c`<w3m-wallet-compatible-networks-view></w3m-wallet-compatible-networks-view>`;case"WhatIsAWallet":return c`<w3m-what-is-a-wallet-view></w3m-what-is-a-wallet-view>`;case"ConnectingMultiChain":return c`<w3m-connecting-multi-chain-view></w3m-connecting-multi-chain-view>`;case"WhatIsANetwork":return c`<w3m-what-is-a-network-view></w3m-what-is-a-network-view>`;case"ConnectingFarcaster":return c`<w3m-connecting-farcaster-view></w3m-connecting-farcaster-view>`;case"SwitchActiveChain":return c`<w3m-switch-active-chain-view></w3m-switch-active-chain-view>`;case"RegisterAccountName":return c`<w3m-register-account-name-view></w3m-register-account-name-view>`;case"RegisterAccountNameSuccess":return c`<w3m-register-account-name-success-view></w3m-register-account-name-success-view>`;case"SmartSessionCreated":return c`<w3m-smart-session-created-view></w3m-smart-session-created-view>`;case"SmartSessionList":return c`<w3m-smart-session-list-view></w3m-smart-session-list-view>`;case"SIWXSignMessage":return c`<w3m-siwx-sign-message-view></w3m-siwx-sign-message-view>`;case"Pay":return c`<w3m-pay-view></w3m-pay-view>`;case"PayLoading":return c`<w3m-pay-loading-view></w3m-pay-loading-view>`;case"FundWallet":return c`<w3m-fund-wallet-view></w3m-fund-wallet-view>`;case"PayWithExchange":return c`<w3m-deposit-from-exchange-view></w3m-deposit-from-exchange-view>`;case"PayWithExchangeSelectAsset":return c`<w3m-deposit-from-exchange-select-asset-view></w3m-deposit-from-exchange-select-asset-view>`;default:return c`<w3m-connect-view></w3m-connect-view>`}}};ae.styles=[bt];$e([m()],ae.prototype,"viewState",void 0);$e([m()],ae.prototype,"history",void 0);ae=$e([T("w3m-router")],ae);const vt=$`
  :host {
    z-index: var(--w3m-z-index);
    display: block;
    backface-visibility: hidden;
    will-change: opacity;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    pointer-events: none;
    opacity: 0;
    background-color: ${({tokens:e})=>e.theme.overlay};
    backdrop-filter: blur(0px);
    transition:
      opacity ${({durations:e})=>e.lg} ${({easings:e})=>e["ease-out-power-2"]},
      backdrop-filter ${({durations:e})=>e.lg}
        ${({easings:e})=>e["ease-out-power-2"]};
    will-change: opacity;
  }

  :host(.open) {
    opacity: 1;
    backdrop-filter: blur(8px);
  }

  :host(.appkit-modal) {
    position: relative;
    pointer-events: unset;
    background: none;
    width: 100%;
    opacity: 1;
  }

  wui-card {
    max-width: var(--apkt-modal-width);
    width: 100%;
    position: relative;
    outline: none;
    transform: translateY(4px);
    box-shadow: 0 2px 8px 0 rgba(0, 0, 0, 0.05);
    transition:
      transform ${({durations:e})=>e.lg}
        ${({easings:e})=>e["ease-out-power-2"]},
      border-radius ${({durations:e})=>e.lg}
        ${({easings:e})=>e["ease-out-power-1"]},
      background-color ${({durations:e})=>e.lg}
        ${({easings:e})=>e["ease-out-power-1"]},
      box-shadow ${({durations:e})=>e.lg}
        ${({easings:e})=>e["ease-out-power-1"]};
    will-change: border-radius, background-color, transform, box-shadow;
    background-color: ${({tokens:e})=>e.theme.backgroundPrimary};
    padding: ${({spacing:e})=>e[1]};
    box-sizing: border-box;
  }

  :host(.open) wui-card {
    transform: translateY(0px);
  }

  wui-card::before {
    z-index: 1;
    pointer-events: none;
    content: '';
    position: absolute;
    inset: 0;
    border-radius: clamp(0px, var(--apkt-borderRadius-8), 44px);
    transition: box-shadow ${({durations:e})=>e.lg}
      ${({easings:e})=>e["ease-out-power-2"]};
    transition-delay: ${({durations:e})=>e.md};
    will-change: box-shadow;
  }

  :host([data-border='true']) wui-card::before {
    box-shadow: inset 0px 0px 0px 4px ${({tokens:e})=>e.theme.foregroundSecondary};
  }

  :host([data-border='false']) wui-card::before {
    box-shadow: inset 0px 0px 0px 1px ${({tokens:e})=>e.theme.borderPrimaryDark};
  }

  :host([data-border='true']) wui-card {
    animation:
      fade-in ${({durations:e})=>e.lg} ${({easings:e})=>e["ease-out-power-2"]},
      card-background-border var(--apkt-duration-dynamic)
        ${({easings:e})=>e["ease-out-power-2"]};
    animation-fill-mode: backwards, both;
    animation-delay: var(--apkt-duration-dynamic);
  }

  :host([data-border='false']) wui-card {
    animation:
      fade-in ${({durations:e})=>e.lg} ${({easings:e})=>e["ease-out-power-2"]},
      card-background-default var(--apkt-duration-dynamic)
        ${({easings:e})=>e["ease-out-power-2"]};
    animation-fill-mode: backwards, both;
    animation-delay: 0s;
  }

  :host(.appkit-modal) wui-card {
    max-width: 400px;
  }

  wui-card[shake='true'] {
    animation:
      fade-in ${({durations:e})=>e.lg} ${({easings:e})=>e["ease-out-power-2"]},
      w3m-shake ${({durations:e})=>e.xl}
        ${({easings:e})=>e["ease-out-power-2"]};
  }

  wui-flex {
    overflow-x: hidden;
    overflow-y: auto;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
  }

  @media (max-height: 700px) and (min-width: 431px) {
    wui-flex {
      align-items: flex-start;
    }

    wui-card {
      margin: var(--apkt-spacing-6) 0px;
    }
  }

  @media (max-width: 430px) {
    wui-flex {
      align-items: flex-end;
    }

    wui-card {
      max-width: 100%;
      border-bottom-left-radius: var(--local-border-bottom-mobile-radius);
      border-bottom-right-radius: var(--local-border-bottom-mobile-radius);
      border-bottom: none;
    }

    wui-card[shake='true'] {
      animation: w3m-shake 0.5s ${({easings:e})=>e["ease-out-power-2"]};
    }
  }

  @keyframes fade-in {
    0% {
      transform: scale(0.99) translateY(4px);
    }
    100% {
      transform: scale(1) translateY(0);
    }
  }

  @keyframes w3m-shake {
    0% {
      transform: scale(1) rotate(0deg);
    }
    20% {
      transform: scale(1) rotate(-1deg);
    }
    40% {
      transform: scale(1) rotate(1.5deg);
    }
    60% {
      transform: scale(1) rotate(-1.5deg);
    }
    80% {
      transform: scale(1) rotate(1deg);
    }
    100% {
      transform: scale(1) rotate(0deg);
    }
  }

  @keyframes card-background-border {
    from {
      background-color: ${({tokens:e})=>e.theme.backgroundPrimary};
    }
    to {
      background-color: ${({tokens:e})=>e.theme.foregroundSecondary};
    }
  }

  @keyframes card-background-default {
    from {
      background-color: ${({tokens:e})=>e.theme.foregroundSecondary};
    }
    to {
      background-color: ${({tokens:e})=>e.theme.backgroundPrimary};
    }
  }
`;var F=function(e,t,o,i){var r=arguments.length,n=r<3?t:i===null?i=Object.getOwnPropertyDescriptor(t,o):i,s;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")n=Reflect.decorate(e,t,o,i);else for(var l=e.length-1;l>=0;l--)(s=e[l])&&(n=(r<3?s(n):r>3?s(t,o,n):s(t,o))||n);return r>3&&n&&Object.defineProperty(t,o,n),n};const Ee="scroll-lock";class O extends C{constructor(){super(),this.unsubscribe=[],this.abortController=void 0,this.hasPrefetched=!1,this.enableEmbedded=k.state.enableEmbedded,this.open=I.state.open,this.caipAddress=h.state.activeCaipAddress,this.caipNetwork=h.state.activeCaipNetwork,this.shake=I.state.shake,this.filterByNamespace=fe.state.filterByNamespace,this.initializeTheming(),le.prefetchAnalyticsConfig(),this.unsubscribe.push(I.subscribeKey("open",t=>t?this.onOpen():this.onClose()),I.subscribeKey("shake",t=>this.shake=t),h.subscribeKey("activeCaipNetwork",t=>this.onNewNetwork(t)),h.subscribeKey("activeCaipAddress",t=>this.onNewAddress(t)),k.subscribeKey("enableEmbedded",t=>this.enableEmbedded=t),fe.subscribeKey("filterByNamespace",t=>{var o;this.filterByNamespace!==t&&!((o=h.getAccountData(t))!=null&&o.caipAddress)&&(le.fetchRecommendedWallets(),this.filterByNamespace=t)}),u.subscribeKey("view",()=>{this.dataset.border=te.hasFooter()?"true":"false"}))}firstUpdated(){if(this.dataset.border=te.hasFooter()?"true":"false",this.caipAddress){if(this.enableEmbedded){I.close(),this.prefetch();return}this.onNewAddress(this.caipAddress)}this.open&&this.onOpen(),this.enableEmbedded&&this.prefetch()}disconnectedCallback(){this.unsubscribe.forEach(t=>t()),this.onRemoveKeyboardListener()}render(){return this.style.cssText=`
      --local-border-bottom-mobile-radius: ${this.enableEmbedded?"clamp(0px, var(--apkt-borderRadius-8), 44px)":"0px"};
    `,this.enableEmbedded?c`${this.contentTemplate()}
        <w3m-tooltip></w3m-tooltip> `:this.open?c`
          <wui-flex @click=${this.onOverlayClick.bind(this)} data-testid="w3m-modal-overlay">
            ${this.contentTemplate()}
          </wui-flex>
          <w3m-tooltip></w3m-tooltip>
        `:null}contentTemplate(){return c` <wui-card
      shake="${this.shake}"
      data-embedded="${ge(this.enableEmbedded)}"
      role="alertdialog"
      aria-modal="true"
      tabindex="0"
      data-testid="w3m-modal-card"
    >
      <w3m-header></w3m-header>
      <w3m-router></w3m-router>
      <w3m-footer></w3m-footer>
      <w3m-snackbar></w3m-snackbar>
      <w3m-alertbar></w3m-alertbar>
    </wui-card>`}async onOverlayClick(t){t.target===t.currentTarget&&await this.handleClose()}async handleClose(){await Le.safeClose()}initializeTheming(){const{themeVariables:t,themeMode:o}=Ye.state,i=Fe.getColorTheme(o);Xe(t,i)}onClose(){this.open=!1,this.classList.remove("open"),this.onScrollUnlock(),v.hide(),this.onRemoveKeyboardListener()}onOpen(){this.open=!0,this.classList.add("open"),this.onScrollLock(),this.onAddKeyboardListener()}onScrollLock(){const t=document.createElement("style");t.dataset.w3m=Ee,t.textContent=`
      body {
        touch-action: none;
        overflow: hidden;
        overscroll-behavior: contain;
      }
      w3m-modal {
        pointer-events: auto;
      }
    `,document.head.appendChild(t)}onScrollUnlock(){const t=document.head.querySelector(`style[data-w3m="${Ee}"]`);t&&t.remove()}onAddKeyboardListener(){var o;this.abortController=new AbortController;const t=(o=this.shadowRoot)==null?void 0:o.querySelector("wui-card");t==null||t.focus(),window.addEventListener("keydown",i=>{if(i.key==="Escape")this.handleClose();else if(i.key==="Tab"){const{tagName:r}=i.target;r&&!r.includes("W3M-")&&!r.includes("WUI-")&&(t==null||t.focus())}},this.abortController)}onRemoveKeyboardListener(){var t;(t=this.abortController)==null||t.abort(),this.abortController=void 0}async onNewAddress(t){const o=h.state.isSwitchingNamespace,i=u.state.view==="ProfileWallets";t?await this.onConnected({caipAddress:t,isSwitchingNamespace:o,isInProfileView:i}):!o&&!this.enableEmbedded&&!i&&I.close(),await me.initializeIfEnabled(t),this.caipAddress=t,h.setIsSwitchingNamespace(!1)}async onConnected(t){if(t.isInProfileView)return;const{chainNamespace:o,chainId:i,address:r}=qe.parseCaipAddress(t.caipAddress),n=`${o}:${i}`,s=!we.getPlainAddress(this.caipAddress),l=await me.getSessions({address:r,caipNetworkId:n}),p=me.getSIWX()?l.some(x=>x.data.accountAddress===r):!0,w=t.isSwitchingNamespace&&p&&!this.enableEmbedded,f=this.enableEmbedded&&s;w?u.goBack():f&&I.close()}onNewNetwork(t){var q,G,y;const o=this.caipNetwork,i=(q=o==null?void 0:o.caipNetworkId)==null?void 0:q.toString(),r=o==null?void 0:o.chainNamespace,n=(G=t==null?void 0:t.caipNetworkId)==null?void 0:G.toString(),s=t==null?void 0:t.chainNamespace,l=i!==n,w=l&&!(r!==s),f=(o==null?void 0:o.name)===N.UNSUPPORTED_NETWORK_NAME,x=u.state.view==="ConnectingExternal",A=u.state.view==="ProfileWallets",L=!((y=h.getAccountData(t==null?void 0:t.chainNamespace))!=null&&y.caipAddress),M=u.state.view==="UnsupportedChain",j=I.state.open;let D=!1;this.enableEmbedded&&u.state.view==="SwitchNetwork"&&(D=!0),l&&d.resetState(),j&&!x&&!A&&(L?l&&(D=!0):(M||w&&!f)&&(D=!0)),D&&u.state.view!=="SIWXSignMessage"&&u.goBack(),this.caipNetwork=t}prefetch(){this.hasPrefetched||(le.prefetch(),le.fetchWalletsByPage({page:1}),this.hasPrefetched=!0)}}O.styles=vt;F([g({type:Boolean})],O.prototype,"enableEmbedded",void 0);F([m()],O.prototype,"open",void 0);F([m()],O.prototype,"caipAddress",void 0);F([m()],O.prototype,"caipNetwork",void 0);F([m()],O.prototype,"shake",void 0);F([m()],O.prototype,"filterByNamespace",void 0);let Ne=class extends O{};Ne=F([T("w3m-modal")],Ne);let We=class extends O{};We=F([T("appkit-modal")],We);const yt=$`
  :host {
    --local-duration-height: 0s;
    --local-duration: ${({durations:e})=>e.lg};
    --local-transition: ${({easings:e})=>e["ease-out-power-2"]};
  }

  .container {
    display: block;
    overflow: hidden;
    overflow: hidden;
    position: relative;
    height: var(--local-container-height);
    transition: height var(--local-duration-height) var(--local-transition);
    will-change: height, padding-bottom;
  }

  .page {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    width: 100%;
    height: auto;
    width: inherit;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    background-color: ${({tokens:e})=>e.theme.backgroundPrimary};
    border-bottom-left-radius: var(--local-border-bottom-radius);
    border-bottom-right-radius: var(--local-border-bottom-radius);
    transition: border-bottom-left-radius var(--local-duration) var(--local-transition);
  }

  .footer {
    height: var(--apkt-footer-height);
  }

  div.page[view-direction^='prev-'] .page-content {
    animation:
      slide-left-out var(--local-duration) forwards var(--local-transition),
      slide-left-in var(--local-duration) forwards var(--local-transition);
    animation-delay: 0ms, var(--local-duration, ${({durations:e})=>e.lg});
  }

  div.page[view-direction^='next-'] .page-content {
    animation:
      slide-right-out var(--local-duration) forwards var(--local-transition),
      slide-right-in var(--local-duration) forwards var(--local-transition);
    animation-delay: 0ms, var(--local-duration, ${({durations:e})=>e.lg});
  }

  @keyframes slide-left-out {
    from {
      transform: translateX(0px) scale(1);
      opacity: 1;
      filter: blur(0px);
    }
    to {
      transform: translateX(8px) scale(0.99);
      opacity: 0;
      filter: blur(4px);
    }
  }

  @keyframes slide-left-in {
    from {
      transform: translateX(-8px) scale(0.99);
      opacity: 0;
      filter: blur(4px);
    }
    to {
      transform: translateX(0) translateY(0) scale(1);
      opacity: 1;
      filter: blur(0px);
    }
  }

  @keyframes slide-right-out {
    from {
      transform: translateX(0px) scale(1);
      opacity: 1;
      filter: blur(0px);
    }
    to {
      transform: translateX(-8px) scale(0.99);
      opacity: 0;
      filter: blur(4px);
    }
  }

  @keyframes slide-right-in {
    from {
      transform: translateX(8px) scale(0.99);
      opacity: 0;
      filter: blur(4px);
    }
    to {
      transform: translateX(0) translateY(0) scale(1);
      opacity: 1;
      filter: blur(0px);
    }
  }
`;var R=function(e,t,o,i){var r=arguments.length,n=r<3?t:i===null?i=Object.getOwnPropertyDescriptor(t,o):i,s;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")n=Reflect.decorate(e,t,o,i);else for(var l=e.length-1;l>=0;l--)(s=e[l])&&(n=(r<3?s(n):r>3?s(t,o,n):s(t,o))||n);return r>3&&n&&Object.defineProperty(t,o,n),n};let E=class extends C{constructor(){super(...arguments),this.resizeObserver=void 0,this.transitionDuration="0.15s",this.transitionFunction="",this.history="",this.view="",this.setView=void 0,this.viewDirection="",this.historyState="",this.previousHeight="0px"}updated(t){if(t.has("history")){const o=this.history;this.historyState!==""&&this.historyState!==o&&this.onViewChange(o)}t.has("transitionDuration")&&this.style.setProperty("--local-duration",this.transitionDuration),t.has("transitionFunction")&&this.style.setProperty("--local-transition",this.transitionFunction)}firstUpdated(){this.transitionFunction&&this.style.setProperty("--local-transition",this.transitionFunction),this.style.setProperty("--local-duration",this.transitionDuration),this.historyState=this.history,this.resizeObserver=new ResizeObserver(t=>{for(const o of t)if(o.target===this.getWrapper()){let i=o.contentRect.height;const r=parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--apkt-footer-height")||"0");i=i+r,this.style.setProperty("--local-border-bottom-radius",r?"var(--apkt-borderRadius-5)":"0px"),this.style.setProperty("--local-container-height",`${i}px`),this.previousHeight!=="0px"&&this.style.setProperty("--local-duration-height",this.transitionDuration),this.previousHeight=`${i}px`}}),this.resizeObserver.observe(this.getWrapper())}disconnectedCallback(){const t=this.getWrapper();t&&this.resizeObserver&&this.resizeObserver.unobserve(t)}render(){return c`
      <div class="container">
        <div class="page" view-direction="${this.viewDirection}">
          <div class="page-content">
            <slot></slot>
          </div>
        </div>
      </div>
    `}onViewChange(t){const o=t.split(",").filter(Boolean),i=this.historyState.split(",").filter(Boolean),r=i.length,n=o.length,s=o[o.length-1]||"",l=Fe.cssDurationToNumber(this.transitionDuration);let p="";n>r?p="next":n<r?p="prev":n===r&&o[n-1]!==i[r-1]&&(p="next"),this.viewDirection=`${p}-${s}`,setTimeout(()=>{var w;this.historyState=t,(w=this.setView)==null||w.call(this,s)},l),setTimeout(()=>{this.viewDirection=""},l*2)}getWrapper(){var t;return(t=this.shadowRoot)==null?void 0:t.querySelector("div.page")}};E.styles=[yt];R([g({type:String})],E.prototype,"transitionDuration",void 0);R([g({type:String})],E.prototype,"transitionFunction",void 0);R([g({type:String})],E.prototype,"history",void 0);R([g({type:String})],E.prototype,"view",void 0);R([g({attribute:!1})],E.prototype,"setView",void 0);R([m()],E.prototype,"viewDirection",void 0);R([m()],E.prototype,"historyState",void 0);R([m()],E.prototype,"previousHeight",void 0);E=R([T("w3m-router-container")],E);export{We as AppKitModal,Ne as W3mModal,O as W3mModalBase,E as W3mRouterContainer};
