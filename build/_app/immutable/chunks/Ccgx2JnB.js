import{t as L,u as k,v as R,x as c,y as Z,o as A,c as S,O as j,i as I,f as E,a as de,E as Y,R as B,V as je,X as $n,z as D,Y as yt,Z as De,C as oe,D as cn,T as Ut,e as Me,M as vn,m as xn,L as Ne,_ as Gn,K as dn,G as Cn}from"./CKhFwjwF.js";import{n as d,c as _,o as C,r as $,U as re,i as Yn,t as Jn,e as Qn}from"./D7e8SSIV.js";(function(){try{var e=typeof window<"u"?window:typeof global<"u"?global:typeof globalThis<"u"?globalThis:typeof self<"u"?self:{};e.SENTRY_RELEASE={id:"b1e593ae5130a8a866939fcd32d632e0f276c846"}}catch{}})();try{(function(){var e=typeof window<"u"?window:typeof global<"u"?global:typeof globalThis<"u"?globalThis:typeof self<"u"?self:{},t=new e.Error().stack;t&&(e._sentryDebugIds=e._sentryDebugIds||{},e._sentryDebugIds[t]="4734f8fb-8f02-4361-b955-25ceb27f8ac8",e._sentryDebugIdIdentifier="sentry-dbid-4734f8fb-8f02-4361-b955-25ceb27f8ac8")})()}catch{}const Xn=L`
  :host {
    position: relative;
    background-color: ${({tokens:e})=>e.theme.foregroundTertiary};
    display: flex;
    justify-content: center;
    align-items: center;
    border-radius: inherit;
    border-radius: var(--local-border-radius);
  }

  :host([data-image='true']) {
    background-color: transparent;
  }

  :host > wui-flex {
    overflow: hidden;
    border-radius: inherit;
    border-radius: var(--local-border-radius);
  }

  :host([data-size='sm']) {
    width: 32px;
    height: 32px;
  }

  :host([data-size='md']) {
    width: 40px;
    height: 40px;
  }

  :host([data-size='lg']) {
    width: 56px;
    height: 56px;
  }

  :host([name='Extension'])::after {
    border: 1px solid ${({colors:e})=>e.accent010};
  }

  :host([data-wallet-icon='allWallets'])::after {
    border: 1px solid ${({colors:e})=>e.accent010};
  }

  wui-icon[data-parent-size='inherit'] {
    width: 75%;
    height: 75%;
    align-items: center;
  }

  wui-icon[data-parent-size='sm'] {
    width: 32px;
    height: 32px;
  }

  wui-icon[data-parent-size='md'] {
    width: 40px;
    height: 40px;
  }

  :host > wui-icon-box {
    position: absolute;
    overflow: hidden;
    right: -1px;
    bottom: -2px;
    z-index: 1;
    border: 2px solid ${({tokens:e})=>e.theme.backgroundPrimary};
    padding: 1px;
  }
`;var xe=function(e,t,i,r){var o=arguments.length,n=o<3?t:r===null?r=Object.getOwnPropertyDescriptor(t,i):r,s;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")n=Reflect.decorate(e,t,i,r);else for(var a=e.length-1;a>=0;a--)(s=e[a])&&(n=(o<3?s(n):o>3?s(t,i,n):s(t,i))||n);return o>3&&n&&Object.defineProperty(t,i,n),n};let se=class extends R{constructor(){super(...arguments),this.size="md",this.name="",this.installed=!1,this.badgeSize="xs"}render(){let t="1";return this.size==="lg"?t="4":this.size==="md"?t="2":this.size==="sm"&&(t="1"),this.style.cssText=`
       --local-border-radius: var(--apkt-borderRadius-${t});
   `,this.dataset.size=this.size,this.imageSrc&&(this.dataset.image="true"),this.walletIcon&&(this.dataset.walletIcon=this.walletIcon),c`
      <wui-flex justifyContent="center" alignItems="center"> ${this.templateVisual()} </wui-flex>
    `}templateVisual(){return this.imageSrc?c`<wui-image src=${this.imageSrc} alt=${this.name}></wui-image>`:this.walletIcon?c`<wui-icon size="md" color="default" name=${this.walletIcon}></wui-icon>`:c`<wui-icon
      data-parent-size=${this.size}
      size="inherit"
      color="inherit"
      name="wallet"
    ></wui-icon>`}};se.styles=[k,Xn];xe([d()],se.prototype,"size",void 0);xe([d()],se.prototype,"name",void 0);xe([d()],se.prototype,"imageSrc",void 0);xe([d()],se.prototype,"walletIcon",void 0);xe([d({type:Boolean})],se.prototype,"installed",void 0);xe([d()],se.prototype,"badgeSize",void 0);se=xe([_("wui-wallet-image")],se);const Zn=L`
  :host {
    position: relative;
    border-radius: ${({borderRadius:e})=>e[2]};
    width: 40px;
    height: 40px;
    overflow: hidden;
    background: ${({tokens:e})=>e.theme.foregroundPrimary};
    display: flex;
    justify-content: center;
    align-items: center;
    flex-wrap: wrap;
    column-gap: ${({spacing:e})=>e[1]};
    padding: ${({spacing:e})=>e[1]};
  }

  :host > wui-wallet-image {
    width: 14px;
    height: 14px;
    border-radius: 2px;
  }
`;var _n=function(e,t,i,r){var o=arguments.length,n=o<3?t:r===null?r=Object.getOwnPropertyDescriptor(t,i):r,s;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")n=Reflect.decorate(e,t,i,r);else for(var a=e.length-1;a>=0;a--)(s=e[a])&&(n=(o<3?s(n):o>3?s(t,i,n):s(t,i))||n);return o>3&&n&&Object.defineProperty(t,i,n),n};const Bt=4;let ot=class extends R{constructor(){super(...arguments),this.walletImages=[]}render(){const t=this.walletImages.length<Bt;return c`${this.walletImages.slice(0,Bt).map(({src:i,walletName:r})=>c`
          <wui-wallet-image
            size="sm"
            imageSrc=${i}
            name=${C(r)}
          ></wui-wallet-image>
        `)}
    ${t?[...Array(Bt-this.walletImages.length)].map(()=>c` <wui-wallet-image size="sm" name=""></wui-wallet-image>`):null} `}};ot.styles=[k,Zn];_n([d({type:Array})],ot.prototype,"walletImages",void 0);ot=_n([_("wui-all-wallets-image")],ot);const ei=L`
  :host {
    width: 100%;
  }

  button {
    column-gap: ${({spacing:e})=>e[2]};
    padding: ${({spacing:e})=>e[3]};
    width: 100%;
    background-color: transparent;
    border-radius: ${({borderRadius:e})=>e[4]};
    color: ${({tokens:e})=>e.theme.textPrimary};
  }

  button > wui-wallet-image {
    background: ${({tokens:e})=>e.theme.foregroundSecondary};
  }

  button > wui-text:nth-child(2) {
    display: flex;
    flex: 1;
  }

  button:hover:enabled {
    background-color: ${({tokens:e})=>e.theme.foregroundPrimary};
  }

  button[data-all-wallets='true'] {
    background-color: ${({tokens:e})=>e.theme.foregroundPrimary};
  }

  button[data-all-wallets='true']:hover:enabled {
    background-color: ${({tokens:e})=>e.theme.foregroundSecondary};
  }

  button:focus-visible:enabled {
    background-color: ${({tokens:e})=>e.theme.foregroundPrimary};
    box-shadow: 0 0 0 4px ${({tokens:e})=>e.core.foregroundAccent020};
  }

  button:disabled {
    background-color: ${({tokens:e})=>e.theme.foregroundPrimary};
    opacity: 0.5;
    cursor: not-allowed;
  }

  button:disabled > wui-tag {
    background-color: ${({tokens:e})=>e.core.glass010};
    color: ${({tokens:e})=>e.theme.foregroundTertiary};
  }
`;var F=function(e,t,i,r){var o=arguments.length,n=o<3?t:r===null?r=Object.getOwnPropertyDescriptor(t,i):r,s;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")n=Reflect.decorate(e,t,i,r);else for(var a=e.length-1;a>=0;a--)(s=e[a])&&(n=(o<3?s(n):o>3?s(t,i,n):s(t,i))||n);return o>3&&n&&Object.defineProperty(t,i,n),n};let z=class extends R{constructor(){super(...arguments),this.walletImages=[],this.imageSrc="",this.name="",this.size="md",this.tabIdx=void 0,this.disabled=!1,this.showAllWallets=!1,this.loading=!1,this.loadingSpinnerColor="accent-100"}render(){return this.dataset.size=this.size,c`
      <button
        ?disabled=${this.disabled}
        data-all-wallets=${this.showAllWallets}
        tabindex=${C(this.tabIdx)}
      >
        ${this.templateAllWallets()} ${this.templateWalletImage()}
        <wui-text variant="lg-regular" color="inherit">${this.name}</wui-text>
        ${this.templateStatus()}
      </button>
    `}templateAllWallets(){return this.showAllWallets&&this.imageSrc?c` <wui-all-wallets-image .imageeSrc=${this.imageSrc}> </wui-all-wallets-image> `:this.showAllWallets&&this.walletIcon?c` <wui-wallet-image .walletIcon=${this.walletIcon} size="sm"> </wui-wallet-image> `:null}templateWalletImage(){return!this.showAllWallets&&this.imageSrc?c`<wui-wallet-image
        size=${C(this.size==="sm"?"sm":"md")}
        imageSrc=${this.imageSrc}
        name=${this.name}
      ></wui-wallet-image>`:!this.showAllWallets&&!this.imageSrc?c`<wui-wallet-image size="sm" name=${this.name}></wui-wallet-image>`:null}templateStatus(){return this.loading?c`<wui-loading-spinner size="lg" color="accent-primary"></wui-loading-spinner>`:this.tagLabel&&this.tagVariant?c`<wui-tag size="sm" variant=${this.tagVariant}>${this.tagLabel}</wui-tag>`:null}};z.styles=[k,Z,ei];F([d({type:Array})],z.prototype,"walletImages",void 0);F([d()],z.prototype,"imageSrc",void 0);F([d()],z.prototype,"name",void 0);F([d()],z.prototype,"size",void 0);F([d()],z.prototype,"tagLabel",void 0);F([d()],z.prototype,"tagVariant",void 0);F([d()],z.prototype,"walletIcon",void 0);F([d()],z.prototype,"tabIdx",void 0);F([d({type:Boolean})],z.prototype,"disabled",void 0);F([d({type:Boolean})],z.prototype,"showAllWallets",void 0);F([d({type:Boolean})],z.prototype,"loading",void 0);F([d({type:String})],z.prototype,"loadingSpinnerColor",void 0);z=F([_("wui-list-wallet")],z);var Ae=function(e,t,i,r){var o=arguments.length,n=o<3?t:r===null?r=Object.getOwnPropertyDescriptor(t,i):r,s;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")n=Reflect.decorate(e,t,i,r);else for(var a=e.length-1;a>=0;a--)(s=e[a])&&(n=(o<3?s(n):o>3?s(t,i,n):s(t,i))||n);return o>3&&n&&Object.defineProperty(t,i,n),n};let pe=class extends R{constructor(){super(),this.unsubscribe=[],this.tabIdx=void 0,this.connectors=A.state.connectors,this.count=S.state.count,this.filteredCount=S.state.filteredWallets.length,this.isFetchingRecommendedWallets=S.state.isFetchingRecommendedWallets,this.unsubscribe.push(A.subscribeKey("connectors",t=>this.connectors=t),S.subscribeKey("count",t=>this.count=t),S.subscribeKey("filteredWallets",t=>this.filteredCount=t.length),S.subscribeKey("isFetchingRecommendedWallets",t=>this.isFetchingRecommendedWallets=t))}disconnectedCallback(){this.unsubscribe.forEach(t=>t())}render(){const t=this.connectors.find(h=>h.id==="walletConnect"),{allWallets:i}=j.state;if(!t||i==="HIDE"||i==="ONLY_MOBILE"&&!I.isMobile())return null;const r=S.state.featured.length,o=this.count+r,n=o<10?o:Math.floor(o/10)*10,s=this.filteredCount>0?this.filteredCount:n;let a=`${s}`;this.filteredCount>0?a=`${this.filteredCount}`:s<o&&(a=`${s}+`);const l=E.hasAnyConnection(de.CONNECTOR_ID.WALLET_CONNECT);return c`
      <wui-list-wallet
        name="Search Wallet"
        walletIcon="search"
        showAllWallets
        @click=${this.onAllWallets.bind(this)}
        tagLabel=${a}
        tagVariant="info"
        data-testid="all-wallets"
        tabIdx=${C(this.tabIdx)}
        .loading=${this.isFetchingRecommendedWallets}
        ?disabled=${l}
        size="sm"
      ></wui-list-wallet>
    `}onAllWallets(){Y.sendEvent({type:"track",event:"CLICK_ALL_WALLETS"}),B.push("AllWallets")}};Ae([d()],pe.prototype,"tabIdx",void 0);Ae([$()],pe.prototype,"connectors",void 0);Ae([$()],pe.prototype,"count",void 0);Ae([$()],pe.prototype,"filteredCount",void 0);Ae([$()],pe.prototype,"isFetchingRecommendedWallets",void 0);pe=Ae([_("w3m-all-wallets-widget")],pe);var $t=function(e,t,i,r){var o=arguments.length,n=o<3?t:r===null?r=Object.getOwnPropertyDescriptor(t,i):r,s;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")n=Reflect.decorate(e,t,i,r);else for(var a=e.length-1;a>=0;a--)(s=e[a])&&(n=(o<3?s(n):o>3?s(t,i,n):s(t,i))||n);return o>3&&n&&Object.defineProperty(t,i,n),n};let Ue=class extends R{constructor(){super(),this.unsubscribe=[],this.tabIdx=void 0,this.connectors=A.state.connectors,this.connections=E.state.connections,this.unsubscribe.push(A.subscribeKey("connectors",t=>this.connectors=t),E.subscribeKey("connections",t=>this.connections=t))}disconnectedCallback(){this.unsubscribe.forEach(t=>t())}render(){const t=this.connectors.filter(i=>i.type==="ANNOUNCED");return t!=null&&t.length?c`
      <wui-flex flexDirection="column" gap="2">
        ${t.filter(je.showConnector).map(i=>{const o=(this.connections.get(i.chain)??[]).some(n=>$n.isLowerCaseMatch(n.connectorId,i.id));return c`
            <wui-list-wallet
              imageSrc=${C(D.getConnectorImage(i))}
              name=${i.name??"Unknown"}
              @click=${()=>this.onConnector(i)}
              tagVariant=${o?"info":"success"}
              tagLabel=${o?"connected":"installed"}
              size="sm"
              data-testid=${`wallet-selector-${i.id}`}
              .installed=${!0}
              tabIdx=${C(this.tabIdx)}
            >
            </wui-list-wallet>
          `})}
      </wui-flex>
    `:(this.style.cssText="display: none",null)}onConnector(t){t.id==="walletConnect"?I.isMobile()?B.push("AllWallets"):B.push("ConnectingWalletConnect"):B.push("ConnectingExternal",{connector:t})}};$t([d()],Ue.prototype,"tabIdx",void 0);$t([$()],Ue.prototype,"connectors",void 0);$t([$()],Ue.prototype,"connections",void 0);Ue=$t([_("w3m-connect-announced-widget")],Ue);var vt=function(e,t,i,r){var o=arguments.length,n=o<3?t:r===null?r=Object.getOwnPropertyDescriptor(t,i):r,s;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")n=Reflect.decorate(e,t,i,r);else for(var a=e.length-1;a>=0;a--)(s=e[a])&&(n=(o<3?s(n):o>3?s(t,i,n):s(t,i))||n);return o>3&&n&&Object.defineProperty(t,i,n),n};let Fe=class extends R{constructor(){super(),this.unsubscribe=[],this.tabIdx=void 0,this.connectors=A.state.connectors,this.loading=!1,this.unsubscribe.push(A.subscribeKey("connectors",t=>this.connectors=t)),I.isTelegram()&&I.isIos()&&(this.loading=!E.state.wcUri,this.unsubscribe.push(E.subscribeKey("wcUri",t=>this.loading=!t)))}disconnectedCallback(){this.unsubscribe.forEach(t=>t())}render(){const{customWallets:t}=j.state;if(!(t!=null&&t.length))return this.style.cssText="display: none",null;const i=this.filterOutDuplicateWallets(t),r=E.hasAnyConnection(de.CONNECTOR_ID.WALLET_CONNECT);return c`<wui-flex flexDirection="column" gap="2">
      ${i.map(o=>c`
          <wui-list-wallet
            imageSrc=${C(D.getWalletImage(o))}
            name=${o.name??"Unknown"}
            @click=${()=>this.onConnectWallet(o)}
            size="sm"
            data-testid=${`wallet-selector-${o.id}`}
            tabIdx=${C(this.tabIdx)}
            ?loading=${this.loading}
            ?disabled=${r}
          >
          </wui-list-wallet>
        `)}
    </wui-flex>`}filterOutDuplicateWallets(t){const i=yt.getRecentWallets(),r=this.connectors.map(a=>{var l;return(l=a.info)==null?void 0:l.rdns}).filter(Boolean),o=i.map(a=>a.rdns).filter(Boolean),n=r.concat(o);if(n.includes("io.metamask.mobile")&&I.isMobile()){const a=n.indexOf("io.metamask.mobile");n[a]="io.metamask"}return t.filter(a=>!n.includes(String(a==null?void 0:a.rdns)))}onConnectWallet(t){this.loading||B.push("ConnectingWalletConnect",{wallet:t})}};vt([d()],Fe.prototype,"tabIdx",void 0);vt([$()],Fe.prototype,"connectors",void 0);vt([$()],Fe.prototype,"loading",void 0);Fe=vt([_("w3m-connect-custom-widget")],Fe);var Yt=function(e,t,i,r){var o=arguments.length,n=o<3?t:r===null?r=Object.getOwnPropertyDescriptor(t,i):r,s;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")n=Reflect.decorate(e,t,i,r);else for(var a=e.length-1;a>=0;a--)(s=e[a])&&(n=(o<3?s(n):o>3?s(t,i,n):s(t,i))||n);return o>3&&n&&Object.defineProperty(t,i,n),n};let rt=class extends R{constructor(){super(),this.unsubscribe=[],this.tabIdx=void 0,this.connectors=A.state.connectors,this.unsubscribe.push(A.subscribeKey("connectors",t=>this.connectors=t))}disconnectedCallback(){this.unsubscribe.forEach(t=>t())}render(){const r=this.connectors.filter(n=>n.type==="EXTERNAL").filter(je.showConnector).filter(n=>n.id!==de.CONNECTOR_ID.COINBASE_SDK);if(!(r!=null&&r.length))return this.style.cssText="display: none",null;const o=E.hasAnyConnection(de.CONNECTOR_ID.WALLET_CONNECT);return c`
      <wui-flex flexDirection="column" gap="2">
        ${r.map(n=>c`
            <wui-list-wallet
              imageSrc=${C(D.getConnectorImage(n))}
              .installed=${!0}
              name=${n.name??"Unknown"}
              data-testid=${`wallet-selector-external-${n.id}`}
              size="sm"
              @click=${()=>this.onConnector(n)}
              tabIdx=${C(this.tabIdx)}
              ?disabled=${o}
            >
            </wui-list-wallet>
          `)}
      </wui-flex>
    `}onConnector(t){B.push("ConnectingExternal",{connector:t})}};Yt([d()],rt.prototype,"tabIdx",void 0);Yt([$()],rt.prototype,"connectors",void 0);rt=Yt([_("w3m-connect-external-widget")],rt);var Jt=function(e,t,i,r){var o=arguments.length,n=o<3?t:r===null?r=Object.getOwnPropertyDescriptor(t,i):r,s;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")n=Reflect.decorate(e,t,i,r);else for(var a=e.length-1;a>=0;a--)(s=e[a])&&(n=(o<3?s(n):o>3?s(t,i,n):s(t,i))||n);return o>3&&n&&Object.defineProperty(t,i,n),n};let st=class extends R{constructor(){super(...arguments),this.tabIdx=void 0,this.wallets=[]}render(){if(!this.wallets.length)return this.style.cssText="display: none",null;const t=E.hasAnyConnection(de.CONNECTOR_ID.WALLET_CONNECT);return c`
      <wui-flex flexDirection="column" gap="2">
        ${this.wallets.map(i=>c`
            <wui-list-wallet
              data-testid=${`wallet-selector-featured-${i.id}`}
              imageSrc=${C(D.getWalletImage(i))}
              name=${i.name??"Unknown"}
              @click=${()=>this.onConnectWallet(i)}
              tabIdx=${C(this.tabIdx)}
              size="sm"
              ?disabled=${t}
            >
            </wui-list-wallet>
          `)}
      </wui-flex>
    `}onConnectWallet(t){A.selectWalletConnector(t)}};Jt([d()],st.prototype,"tabIdx",void 0);Jt([d()],st.prototype,"wallets",void 0);st=Jt([_("w3m-connect-featured-widget")],st);var xt=function(e,t,i,r){var o=arguments.length,n=o<3?t:r===null?r=Object.getOwnPropertyDescriptor(t,i):r,s;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")n=Reflect.decorate(e,t,i,r);else for(var a=e.length-1;a>=0;a--)(s=e[a])&&(n=(o<3?s(n):o>3?s(t,i,n):s(t,i))||n);return o>3&&n&&Object.defineProperty(t,i,n),n};let Ve=class extends R{constructor(){super(),this.unsubscribe=[],this.tabIdx=void 0,this.connectors=[],this.connections=E.state.connections,this.unsubscribe.push(E.subscribeKey("connections",t=>this.connections=t))}render(){const t=this.connectors.filter(je.showConnector);return t.length===0?(this.style.cssText="display: none",null):c`
      <wui-flex flexDirection="column" gap="2">
        ${t.map(i=>{const o=(this.connections.get(i.chain)??[]).some(n=>$n.isLowerCaseMatch(n.connectorId,i.id));return c`
            <wui-list-wallet
              imageSrc=${C(D.getConnectorImage(i))}
              .installed=${!0}
              name=${i.name??"Unknown"}
              tagVariant=${o?"info":"success"}
              tagLabel=${o?"connected":"installed"}
              data-testid=${`wallet-selector-${i.id}`}
              size="sm"
              @click=${()=>this.onConnector(i)}
              tabIdx=${C(this.tabIdx)}
            >
            </wui-list-wallet>
          `})}
      </wui-flex>
    `}onConnector(t){A.setActiveConnector(t),B.push("ConnectingExternal",{connector:t})}};xt([d()],Ve.prototype,"tabIdx",void 0);xt([d()],Ve.prototype,"connectors",void 0);xt([$()],Ve.prototype,"connections",void 0);Ve=xt([_("w3m-connect-injected-widget")],Ve);var Qt=function(e,t,i,r){var o=arguments.length,n=o<3?t:r===null?r=Object.getOwnPropertyDescriptor(t,i):r,s;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")n=Reflect.decorate(e,t,i,r);else for(var a=e.length-1;a>=0;a--)(s=e[a])&&(n=(o<3?s(n):o>3?s(t,i,n):s(t,i))||n);return o>3&&n&&Object.defineProperty(t,i,n),n};let at=class extends R{constructor(){super(),this.unsubscribe=[],this.tabIdx=void 0,this.connectors=A.state.connectors,this.unsubscribe.push(A.subscribeKey("connectors",t=>this.connectors=t))}disconnectedCallback(){this.unsubscribe.forEach(t=>t())}render(){const t=this.connectors.filter(i=>i.type==="MULTI_CHAIN"&&i.name!=="WalletConnect");return t!=null&&t.length?c`
      <wui-flex flexDirection="column" gap="2">
        ${t.map(i=>c`
            <wui-list-wallet
              imageSrc=${C(D.getConnectorImage(i))}
              .installed=${!0}
              name=${i.name??"Unknown"}
              tagVariant="info"
              tagLabel="multichain"
              data-testid=${`wallet-selector-${i.id}`}
              size="sm"
              @click=${()=>this.onConnector(i)}
              tabIdx=${C(this.tabIdx)}
            >
            </wui-list-wallet>
          `)}
      </wui-flex>
    `:(this.style.cssText="display: none",null)}onConnector(t){A.setActiveConnector(t),B.push("ConnectingMultiChain")}};Qt([d()],at.prototype,"tabIdx",void 0);Qt([$()],at.prototype,"connectors",void 0);at=Qt([_("w3m-connect-multi-chain-widget")],at);var Ct=function(e,t,i,r){var o=arguments.length,n=o<3?t:r===null?r=Object.getOwnPropertyDescriptor(t,i):r,s;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")n=Reflect.decorate(e,t,i,r);else for(var a=e.length-1;a>=0;a--)(s=e[a])&&(n=(o<3?s(n):o>3?s(t,i,n):s(t,i))||n);return o>3&&n&&Object.defineProperty(t,i,n),n};let He=class extends R{constructor(){super(),this.unsubscribe=[],this.tabIdx=void 0,this.connectors=A.state.connectors,this.loading=!1,this.unsubscribe.push(A.subscribeKey("connectors",t=>this.connectors=t)),I.isTelegram()&&I.isIos()&&(this.loading=!E.state.wcUri,this.unsubscribe.push(E.subscribeKey("wcUri",t=>this.loading=!t)))}render(){const i=yt.getRecentWallets().filter(o=>!De.isExcluded(o)).filter(o=>!this.hasWalletConnector(o)).filter(o=>this.isWalletCompatibleWithCurrentChain(o));if(!i.length)return this.style.cssText="display: none",null;const r=E.hasAnyConnection(de.CONNECTOR_ID.WALLET_CONNECT);return c`
      <wui-flex flexDirection="column" gap="2">
        ${i.map(o=>c`
            <wui-list-wallet
              imageSrc=${C(D.getWalletImage(o))}
              name=${o.name??"Unknown"}
              @click=${()=>this.onConnectWallet(o)}
              tagLabel="recent"
              tagVariant="info"
              size="sm"
              tabIdx=${C(this.tabIdx)}
              ?loading=${this.loading}
              ?disabled=${r}
            >
            </wui-list-wallet>
          `)}
      </wui-flex>
    `}onConnectWallet(t){this.loading||A.selectWalletConnector(t)}hasWalletConnector(t){return this.connectors.some(i=>i.id===t.id||i.name===t.name)}isWalletCompatibleWithCurrentChain(t){const i=oe.state.activeChain;return i&&t.chains?t.chains.some(r=>{const o=r.split(":")[0];return i===o}):!0}};Ct([d()],He.prototype,"tabIdx",void 0);Ct([$()],He.prototype,"connectors",void 0);Ct([$()],He.prototype,"loading",void 0);He=Ct([_("w3m-connect-recent-widget")],He);var _t=function(e,t,i,r){var o=arguments.length,n=o<3?t:r===null?r=Object.getOwnPropertyDescriptor(t,i):r,s;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")n=Reflect.decorate(e,t,i,r);else for(var a=e.length-1;a>=0;a--)(s=e[a])&&(n=(o<3?s(n):o>3?s(t,i,n):s(t,i))||n);return o>3&&n&&Object.defineProperty(t,i,n),n};let Ke=class extends R{constructor(){super(),this.unsubscribe=[],this.tabIdx=void 0,this.wallets=[],this.loading=!1,I.isTelegram()&&I.isIos()&&(this.loading=!E.state.wcUri,this.unsubscribe.push(E.subscribeKey("wcUri",t=>this.loading=!t)))}render(){const{connectors:t}=A.state,{customWallets:i,featuredWalletIds:r}=j.state,o=yt.getRecentWallets(),n=t.find(g=>g.id==="walletConnect"),a=t.filter(g=>g.type==="INJECTED"||g.type==="ANNOUNCED"||g.type==="MULTI_CHAIN").filter(g=>g.name!=="Browser Wallet");if(!n)return null;if(r||i||!this.wallets.length)return this.style.cssText="display: none",null;const l=a.length+o.length,h=Math.max(0,2-l),u=De.filterOutDuplicateWallets(this.wallets).slice(0,h);if(!u.length)return this.style.cssText="display: none",null;const T=E.hasAnyConnection(de.CONNECTOR_ID.WALLET_CONNECT);return c`
      <wui-flex flexDirection="column" gap="2">
        ${u.map(g=>c`
            <wui-list-wallet
              imageSrc=${C(D.getWalletImage(g))}
              name=${(g==null?void 0:g.name)??"Unknown"}
              @click=${()=>this.onConnectWallet(g)}
              size="sm"
              tabIdx=${C(this.tabIdx)}
              ?loading=${this.loading}
              ?disabled=${T}
            >
            </wui-list-wallet>
          `)}
      </wui-flex>
    `}onConnectWallet(t){if(this.loading)return;const i=A.getConnector({id:t.id,rdns:t.rdns});i?B.push("ConnectingExternal",{connector:i}):B.push("ConnectingWalletConnect",{wallet:t})}};_t([d()],Ke.prototype,"tabIdx",void 0);_t([d()],Ke.prototype,"wallets",void 0);_t([$()],Ke.prototype,"loading",void 0);Ke=_t([_("w3m-connect-recommended-widget")],Ke);var Et=function(e,t,i,r){var o=arguments.length,n=o<3?t:r===null?r=Object.getOwnPropertyDescriptor(t,i):r,s;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")n=Reflect.decorate(e,t,i,r);else for(var a=e.length-1;a>=0;a--)(s=e[a])&&(n=(o<3?s(n):o>3?s(t,i,n):s(t,i))||n);return o>3&&n&&Object.defineProperty(t,i,n),n};let qe=class extends R{constructor(){super(),this.unsubscribe=[],this.tabIdx=void 0,this.connectors=A.state.connectors,this.connectorImages=cn.state.connectorImages,this.unsubscribe.push(A.subscribeKey("connectors",t=>this.connectors=t),cn.subscribeKey("connectorImages",t=>this.connectorImages=t))}disconnectedCallback(){this.unsubscribe.forEach(t=>t())}render(){if(I.isMobile())return this.style.cssText="display: none",null;const t=this.connectors.find(o=>o.id==="walletConnect");if(!t)return this.style.cssText="display: none",null;const i=t.imageUrl||this.connectorImages[(t==null?void 0:t.imageId)??""],r=E.hasAnyConnection(de.CONNECTOR_ID.WALLET_CONNECT);return c`
      <wui-list-wallet
        imageSrc=${C(i)}
        name=${t.name??"Unknown"}
        @click=${()=>this.onConnector(t)}
        tagLabel="qr code"
        tagVariant="accent"
        tabIdx=${C(this.tabIdx)}
        data-testid="wallet-selector-walletconnect"
        size="sm"
        ?disabled=${r}
      >
      </wui-list-wallet>
    `}onConnector(t){A.setActiveConnector(t),B.push("ConnectingWalletConnect")}};Et([d()],qe.prototype,"tabIdx",void 0);Et([$()],qe.prototype,"connectors",void 0);Et([$()],qe.prototype,"connectorImages",void 0);qe=Et([_("w3m-connect-walletconnect-widget")],qe);const ti=L`
  :host {
    margin-top: ${({spacing:e})=>e[1]};
  }
  wui-separator {
    margin: ${({spacing:e})=>e[3]} calc(${({spacing:e})=>e[3]} * -1)
      ${({spacing:e})=>e[2]} calc(${({spacing:e})=>e[3]} * -1);
    width: calc(100% + ${({spacing:e})=>e[3]} * 2);
  }
`;var Ye=function(e,t,i,r){var o=arguments.length,n=o<3?t:r===null?r=Object.getOwnPropertyDescriptor(t,i):r,s;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")n=Reflect.decorate(e,t,i,r);else for(var a=e.length-1;a>=0;a--)(s=e[a])&&(n=(o<3?s(n):o>3?s(t,i,n):s(t,i))||n);return o>3&&n&&Object.defineProperty(t,i,n),n};let ge=class extends R{constructor(){super(),this.unsubscribe=[],this.tabIdx=void 0,this.connectors=A.state.connectors,this.recommended=S.state.recommended,this.featured=S.state.featured,this.unsubscribe.push(A.subscribeKey("connectors",t=>this.connectors=t),S.subscribeKey("recommended",t=>this.recommended=t),S.subscribeKey("featured",t=>this.featured=t))}disconnectedCallback(){this.unsubscribe.forEach(t=>t())}render(){return c`
      <wui-flex flexDirection="column" gap="2"> ${this.connectorListTemplate()} </wui-flex>
    `}connectorListTemplate(){const{custom:t,recent:i,announced:r,injected:o,multiChain:n,recommended:s,featured:a,external:l}=je.getConnectorsByType(this.connectors,this.recommended,this.featured);return je.getConnectorTypeOrder({custom:t,recent:i,announced:r,injected:o,multiChain:n,recommended:s,featured:a,external:l}).map(u=>{switch(u){case"injected":return c`
            ${n.length?c`<w3m-connect-multi-chain-widget
                  tabIdx=${C(this.tabIdx)}
                ></w3m-connect-multi-chain-widget>`:null}
            ${r.length?c`<w3m-connect-announced-widget
                  tabIdx=${C(this.tabIdx)}
                ></w3m-connect-announced-widget>`:null}
            ${o.length?c`<w3m-connect-injected-widget
                  .connectors=${o}
                  tabIdx=${C(this.tabIdx)}
                ></w3m-connect-injected-widget>`:null}
          `;case"walletConnect":return c`<w3m-connect-walletconnect-widget
            tabIdx=${C(this.tabIdx)}
          ></w3m-connect-walletconnect-widget>`;case"recent":return c`<w3m-connect-recent-widget
            tabIdx=${C(this.tabIdx)}
          ></w3m-connect-recent-widget>`;case"featured":return c`<w3m-connect-featured-widget
            .wallets=${a}
            tabIdx=${C(this.tabIdx)}
          ></w3m-connect-featured-widget>`;case"custom":return c`<w3m-connect-custom-widget
            tabIdx=${C(this.tabIdx)}
          ></w3m-connect-custom-widget>`;case"external":return c`<w3m-connect-external-widget
            tabIdx=${C(this.tabIdx)}
          ></w3m-connect-external-widget>`;case"recommended":return c`<w3m-connect-recommended-widget
            .wallets=${s}
            tabIdx=${C(this.tabIdx)}
          ></w3m-connect-recommended-widget>`;default:return console.warn(`Unknown connector type: ${u}`),null}})}};ge.styles=ti;Ye([d()],ge.prototype,"tabIdx",void 0);Ye([$()],ge.prototype,"connectors",void 0);Ye([$()],ge.prototype,"recommended",void 0);Ye([$()],ge.prototype,"featured",void 0);ge=Ye([_("w3m-connector-list")],ge);const ni=L`
  :host {
    flex: 1;
    height: 100%;
  }

  button {
    width: 100%;
    height: 100%;
    display: inline-flex;
    align-items: center;
    padding: ${({spacing:e})=>e[1]} ${({spacing:e})=>e[2]};
    column-gap: ${({spacing:e})=>e[1]};
    color: ${({tokens:e})=>e.theme.textSecondary};
    border-radius: ${({borderRadius:e})=>e[20]};
    background-color: transparent;
    transition: background-color ${({durations:e})=>e.lg}
      ${({easings:e})=>e["ease-out-power-2"]};
    will-change: background-color;
  }

  /* -- Hover & Active states ----------------------------------------------------------- */
  button[data-active='true'] {
    color: ${({tokens:e})=>e.theme.textPrimary};
    background-color: ${({tokens:e})=>e.theme.foregroundTertiary};
  }

  button:hover:enabled:not([data-active='true']),
  button:active:enabled:not([data-active='true']) {
    wui-text,
    wui-icon {
      color: ${({tokens:e})=>e.theme.textPrimary};
    }
  }
`;var Je=function(e,t,i,r){var o=arguments.length,n=o<3?t:r===null?r=Object.getOwnPropertyDescriptor(t,i):r,s;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")n=Reflect.decorate(e,t,i,r);else for(var a=e.length-1;a>=0;a--)(s=e[a])&&(n=(o<3?s(n):o>3?s(t,i,n):s(t,i))||n);return o>3&&n&&Object.defineProperty(t,i,n),n};const ii={lg:"lg-regular",md:"md-regular",sm:"sm-regular"},oi={lg:"md",md:"sm",sm:"sm"};let me=class extends R{constructor(){super(...arguments),this.icon="mobile",this.size="md",this.label="",this.active=!1}render(){return c`
      <button data-active=${this.active}>
        ${this.icon?c`<wui-icon size=${oi[this.size]} name=${this.icon}></wui-icon>`:""}
        <wui-text variant=${ii[this.size]}> ${this.label} </wui-text>
      </button>
    `}};me.styles=[k,Z,ni];Je([d()],me.prototype,"icon",void 0);Je([d()],me.prototype,"size",void 0);Je([d()],me.prototype,"label",void 0);Je([d({type:Boolean})],me.prototype,"active",void 0);me=Je([_("wui-tab-item")],me);const ri=L`
  :host {
    display: inline-flex;
    align-items: center;
    background-color: ${({tokens:e})=>e.theme.foregroundSecondary};
    border-radius: ${({borderRadius:e})=>e[32]};
    padding: ${({spacing:e})=>e["01"]};
    box-sizing: border-box;
  }

  :host([data-size='sm']) {
    height: 26px;
  }

  :host([data-size='md']) {
    height: 36px;
  }
`;var Qe=function(e,t,i,r){var o=arguments.length,n=o<3?t:r===null?r=Object.getOwnPropertyDescriptor(t,i):r,s;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")n=Reflect.decorate(e,t,i,r);else for(var a=e.length-1;a>=0;a--)(s=e[a])&&(n=(o<3?s(n):o>3?s(t,i,n):s(t,i))||n);return o>3&&n&&Object.defineProperty(t,i,n),n};let we=class extends R{constructor(){super(...arguments),this.tabs=[],this.onTabChange=()=>null,this.size="md",this.activeTab=0}render(){return this.dataset.size=this.size,this.tabs.map((t,i)=>{var o;const r=i===this.activeTab;return c`
        <wui-tab-item
          @click=${()=>this.onTabClick(i)}
          icon=${t.icon}
          size=${this.size}
          label=${t.label}
          ?active=${r}
          data-active=${r}
          data-testid="tab-${(o=t.label)==null?void 0:o.toLowerCase()}"
        ></wui-tab-item>
      `})}onTabClick(t){this.activeTab=t,this.onTabChange(t)}};we.styles=[k,Z,ri];Qe([d({type:Array})],we.prototype,"tabs",void 0);Qe([d()],we.prototype,"onTabChange",void 0);Qe([d()],we.prototype,"size",void 0);Qe([$()],we.prototype,"activeTab",void 0);we=Qe([_("wui-tabs")],we);var Xt=function(e,t,i,r){var o=arguments.length,n=o<3?t:r===null?r=Object.getOwnPropertyDescriptor(t,i):r,s;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")n=Reflect.decorate(e,t,i,r);else for(var a=e.length-1;a>=0;a--)(s=e[a])&&(n=(o<3?s(n):o>3?s(t,i,n):s(t,i))||n);return o>3&&n&&Object.defineProperty(t,i,n),n};let lt=class extends R{constructor(){super(...arguments),this.platformTabs=[],this.unsubscribe=[],this.platforms=[],this.onSelectPlatfrom=void 0}disconnectCallback(){this.unsubscribe.forEach(t=>t())}render(){const t=this.generateTabs();return c`
      <wui-flex justifyContent="center" .padding=${["0","0","4","0"]}>
        <wui-tabs .tabs=${t} .onTabChange=${this.onTabChange.bind(this)}></wui-tabs>
      </wui-flex>
    `}generateTabs(){const t=this.platforms.map(i=>i==="browser"?{label:"Browser",icon:"extension",platform:"browser"}:i==="mobile"?{label:"Mobile",icon:"mobile",platform:"mobile"}:i==="qrcode"?{label:"Mobile",icon:"mobile",platform:"qrcode"}:i==="web"?{label:"Webapp",icon:"browser",platform:"web"}:i==="desktop"?{label:"Desktop",icon:"desktop",platform:"desktop"}:{label:"Browser",icon:"extension",platform:"unsupported"});return this.platformTabs=t.map(({platform:i})=>i),t}onTabChange(t){var r;const i=this.platformTabs[t];i&&((r=this.onSelectPlatfrom)==null||r.call(this,i))}};Xt([d({type:Array})],lt.prototype,"platforms",void 0);Xt([d()],lt.prototype,"onSelectPlatfrom",void 0);lt=Xt([_("w3m-connecting-header")],lt);const si=L`
  :host {
    width: var(--local-width);
  }

  button {
    width: var(--local-width);
    white-space: nowrap;
    column-gap: ${({spacing:e})=>e[2]};
    transition:
      scale ${({durations:e})=>e.lg} ${({easings:e})=>e["ease-out-power-1"]},
      background-color ${({durations:e})=>e.lg}
        ${({easings:e})=>e["ease-out-power-2"]},
      border-radius ${({durations:e})=>e.lg}
        ${({easings:e})=>e["ease-out-power-1"]};
    will-change: scale, background-color, border-radius;
    cursor: pointer;
  }

  /* -- Sizes --------------------------------------------------- */
  button[data-size='sm'] {
    border-radius: ${({borderRadius:e})=>e[2]};
    padding: 0 ${({spacing:e})=>e[2]};
    height: 28px;
  }

  button[data-size='md'] {
    border-radius: ${({borderRadius:e})=>e[3]};
    padding: 0 ${({spacing:e})=>e[4]};
    height: 38px;
  }

  button[data-size='lg'] {
    border-radius: ${({borderRadius:e})=>e[4]};
    padding: 0 ${({spacing:e})=>e[5]};
    height: 48px;
  }

  /* -- Variants --------------------------------------------------------- */
  button[data-variant='accent-primary'] {
    background-color: ${({tokens:e})=>e.core.backgroundAccentPrimary};
    color: ${({tokens:e})=>e.theme.textInvert};
  }

  button[data-variant='accent-secondary'] {
    background-color: ${({tokens:e})=>e.core.foregroundAccent010};
    color: ${({tokens:e})=>e.core.textAccentPrimary};
  }

  button[data-variant='neutral-primary'] {
    background-color: ${({tokens:e})=>e.theme.backgroundInvert};
    color: ${({tokens:e})=>e.theme.textInvert};
  }

  button[data-variant='neutral-secondary'] {
    background-color: transparent;
    border: 1px solid ${({tokens:e})=>e.theme.borderSecondary};
    color: ${({tokens:e})=>e.theme.textPrimary};
  }

  button[data-variant='neutral-tertiary'] {
    background-color: ${({tokens:e})=>e.theme.foregroundPrimary};
    color: ${({tokens:e})=>e.theme.textPrimary};
  }

  button[data-variant='error-primary'] {
    background-color: ${({tokens:e})=>e.core.textError};
    color: ${({tokens:e})=>e.theme.textInvert};
  }

  button[data-variant='error-secondary'] {
    background-color: ${({tokens:e})=>e.core.backgroundError};
    color: ${({tokens:e})=>e.core.textError};
  }

  button[data-variant='shade'] {
    background: var(--wui-color-gray-glass-002);
    color: var(--wui-color-fg-200);
    border: none;
    box-shadow: inset 0 0 0 1px var(--wui-color-gray-glass-005);
  }

  /* -- Focus states --------------------------------------------------- */
  button[data-size='sm']:focus-visible:enabled {
    border-radius: 28px;
  }

  button[data-size='md']:focus-visible:enabled {
    border-radius: 38px;
  }

  button[data-size='lg']:focus-visible:enabled {
    border-radius: 48px;
  }
  button[data-variant='shade']:focus-visible:enabled {
    background: var(--wui-color-gray-glass-005);
    box-shadow:
      inset 0 0 0 1px var(--wui-color-gray-glass-010),
      0 0 0 4px var(--wui-color-gray-glass-002);
  }

  /* -- Hover & Active states ----------------------------------------------------------- */
  @media (hover: hover) {
    button[data-size='sm']:hover:enabled {
      border-radius: 28px;
    }

    button[data-size='md']:hover:enabled {
      border-radius: 38px;
    }

    button[data-size='lg']:hover:enabled {
      border-radius: 48px;
    }

    button[data-variant='shade']:hover:enabled {
      background: var(--wui-color-gray-glass-002);
    }

    button[data-variant='shade']:active:enabled {
      background: var(--wui-color-gray-glass-005);
    }
  }

  button[data-size='sm']:active:enabled {
    border-radius: 28px;
  }

  button[data-size='md']:active:enabled {
    border-radius: 38px;
  }

  button[data-size='lg']:active:enabled {
    border-radius: 48px;
  }

  /* -- Disabled states --------------------------------------------------- */
  button:disabled {
    opacity: 0.3;
  }
`;var Ce=function(e,t,i,r){var o=arguments.length,n=o<3?t:r===null?r=Object.getOwnPropertyDescriptor(t,i):r,s;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")n=Reflect.decorate(e,t,i,r);else for(var a=e.length-1;a>=0;a--)(s=e[a])&&(n=(o<3?s(n):o>3?s(t,i,n):s(t,i))||n);return o>3&&n&&Object.defineProperty(t,i,n),n};const ai={lg:"lg-regular-mono",md:"md-regular-mono",sm:"sm-regular-mono"},li={lg:"md",md:"md",sm:"sm"};let ae=class extends R{constructor(){super(...arguments),this.size="lg",this.disabled=!1,this.fullWidth=!1,this.loading=!1,this.variant="accent-primary"}render(){this.style.cssText=`
    --local-width: ${this.fullWidth?"100%":"auto"};
     `;const t=this.textVariant??ai[this.size];return c`
      <button data-variant=${this.variant} data-size=${this.size} ?disabled=${this.disabled}>
        ${this.loadingTemplate()}
        <slot name="iconLeft"></slot>
        <wui-text variant=${t} color="inherit">
          <slot></slot>
        </wui-text>
        <slot name="iconRight"></slot>
      </button>
    `}loadingTemplate(){if(this.loading){const t=li[this.size],i=this.variant==="neutral-primary"||this.variant==="accent-primary"?"invert":"primary";return c`<wui-loading-spinner color=${i} size=${t}></wui-loading-spinner>`}return null}};ae.styles=[k,Z,si];Ce([d()],ae.prototype,"size",void 0);Ce([d({type:Boolean})],ae.prototype,"disabled",void 0);Ce([d({type:Boolean})],ae.prototype,"fullWidth",void 0);Ce([d({type:Boolean})],ae.prototype,"loading",void 0);Ce([d()],ae.prototype,"variant",void 0);Ce([d()],ae.prototype,"textVariant",void 0);ae=Ce([_("wui-button")],ae);const ci=L`
  :host {
    display: block;
    width: 100px;
    height: 100px;
  }

  svg {
    width: 100px;
    height: 100px;
  }

  rect {
    fill: none;
    stroke: ${e=>e.colors.accent100};
    stroke-width: 3px;
    stroke-linecap: round;
    animation: dash 1s linear infinite;
  }

  @keyframes dash {
    to {
      stroke-dashoffset: 0px;
    }
  }
`;var En=function(e,t,i,r){var o=arguments.length,n=o<3?t:r===null?r=Object.getOwnPropertyDescriptor(t,i):r,s;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")n=Reflect.decorate(e,t,i,r);else for(var a=e.length-1;a>=0;a--)(s=e[a])&&(n=(o<3?s(n):o>3?s(t,i,n):s(t,i))||n);return o>3&&n&&Object.defineProperty(t,i,n),n};let ct=class extends R{constructor(){super(...arguments),this.radius=36}render(){return this.svgLoaderTemplate()}svgLoaderTemplate(){const t=this.radius>50?50:this.radius,r=36-t,o=116+r,n=245+r,s=360+r*1.75;return c`
      <svg viewBox="0 0 110 110" width="110" height="110">
        <rect
          x="2"
          y="2"
          width="106"
          height="106"
          rx=${t}
          stroke-dasharray="${o} ${n}"
          stroke-dashoffset=${s}
        />
      </svg>
    `}};ct.styles=[k,ci];En([d({type:Number})],ct.prototype,"radius",void 0);ct=En([_("wui-loading-thumbnail")],ct);const di=L`
  wui-flex {
    width: 100%;
    height: 52px;
    box-sizing: border-box;
    background-color: ${({tokens:e})=>e.theme.foregroundPrimary};
    border-radius: ${({borderRadius:e})=>e[5]};
    padding-left: ${({spacing:e})=>e[3]};
    padding-right: ${({spacing:e})=>e[3]};
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: ${({spacing:e})=>e[6]};
  }

  wui-text {
    color: ${({tokens:e})=>e.theme.textSecondary};
  }

  wui-icon {
    width: 12px;
    height: 12px;
  }
`;var It=function(e,t,i,r){var o=arguments.length,n=o<3?t:r===null?r=Object.getOwnPropertyDescriptor(t,i):r,s;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")n=Reflect.decorate(e,t,i,r);else for(var a=e.length-1;a>=0;a--)(s=e[a])&&(n=(o<3?s(n):o>3?s(t,i,n):s(t,i))||n);return o>3&&n&&Object.defineProperty(t,i,n),n};let _e=class extends R{constructor(){super(...arguments),this.disabled=!1,this.label="",this.buttonLabel=""}render(){return c`
      <wui-flex justifyContent="space-between" alignItems="center">
        <wui-text variant="lg-regular" color="inherit">${this.label}</wui-text>
        <wui-button variant="accent-secondary" size="sm">
          ${this.buttonLabel}
          <wui-icon name="chevronRight" color="inherit" size="inherit" slot="iconRight"></wui-icon>
        </wui-button>
      </wui-flex>
    `}};_e.styles=[k,Z,di];It([d({type:Boolean})],_e.prototype,"disabled",void 0);It([d()],_e.prototype,"label",void 0);It([d()],_e.prototype,"buttonLabel",void 0);_e=It([_("wui-cta-button")],_e);const ui=L`
  :host {
    display: block;
    padding: 0 ${({spacing:e})=>e[5]} ${({spacing:e})=>e[5]};
  }
`;var In=function(e,t,i,r){var o=arguments.length,n=o<3?t:r===null?r=Object.getOwnPropertyDescriptor(t,i):r,s;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")n=Reflect.decorate(e,t,i,r);else for(var a=e.length-1;a>=0;a--)(s=e[a])&&(n=(o<3?s(n):o>3?s(t,i,n):s(t,i))||n);return o>3&&n&&Object.defineProperty(t,i,n),n};let dt=class extends R{constructor(){super(...arguments),this.wallet=void 0}render(){if(!this.wallet)return this.style.display="none",null;const{name:t,app_store:i,play_store:r,chrome_store:o,homepage:n}=this.wallet,s=I.isMobile(),a=I.isIos(),l=I.isAndroid(),h=[i,r,n,o].filter(Boolean).length>1,u=re.getTruncateString({string:t,charsStart:12,charsEnd:0,truncate:"end"});return h&&!s?c`
        <wui-cta-button
          label=${`Don't have ${u}?`}
          buttonLabel="Get"
          @click=${()=>B.push("Downloads",{wallet:this.wallet})}
        ></wui-cta-button>
      `:!h&&n?c`
        <wui-cta-button
          label=${`Don't have ${u}?`}
          buttonLabel="Get"
          @click=${this.onHomePage.bind(this)}
        ></wui-cta-button>
      `:i&&a?c`
        <wui-cta-button
          label=${`Don't have ${u}?`}
          buttonLabel="Get"
          @click=${this.onAppStore.bind(this)}
        ></wui-cta-button>
      `:r&&l?c`
        <wui-cta-button
          label=${`Don't have ${u}?`}
          buttonLabel="Get"
          @click=${this.onPlayStore.bind(this)}
        ></wui-cta-button>
      `:(this.style.display="none",null)}onAppStore(){var t;(t=this.wallet)!=null&&t.app_store&&I.openHref(this.wallet.app_store,"_blank")}onPlayStore(){var t;(t=this.wallet)!=null&&t.play_store&&I.openHref(this.wallet.play_store,"_blank")}onHomePage(){var t;(t=this.wallet)!=null&&t.homepage&&I.openHref(this.wallet.homepage,"_blank")}};dt.styles=[ui];In([d({type:Object})],dt.prototype,"wallet",void 0);dt=In([_("w3m-mobile-download-links")],dt);const hi=L`
  @keyframes shake {
    0% {
      transform: translateX(0);
    }
    25% {
      transform: translateX(3px);
    }
    50% {
      transform: translateX(-3px);
    }
    75% {
      transform: translateX(3px);
    }
    100% {
      transform: translateX(0);
    }
  }

  wui-flex:first-child:not(:only-child) {
    position: relative;
  }

  wui-wallet-image {
    width: 56px;
    height: 56px;
  }

  wui-loading-thumbnail {
    position: absolute;
  }

  wui-icon-box {
    position: absolute;
    right: calc(${({spacing:e})=>e[1]} * -1);
    bottom: calc(${({spacing:e})=>e[1]} * -1);
    opacity: 0;
    transform: scale(0.5);
    transition-property: opacity, transform;
    transition-duration: ${({durations:e})=>e.lg};
    transition-timing-function: ${({easings:e})=>e["ease-out-power-2"]};
    will-change: opacity, transform;
  }

  wui-text[align='center'] {
    width: 100%;
    padding: 0px ${({spacing:e})=>e[4]};
  }

  [data-error='true'] wui-icon-box {
    opacity: 1;
    transform: scale(1);
  }

  [data-error='true'] > wui-flex:first-child {
    animation: shake 250ms ${({easings:e})=>e["ease-out-power-2"]} both;
  }

  [data-retry='false'] wui-link {
    display: none;
  }

  [data-retry='true'] wui-link {
    display: block;
    opacity: 1;
  }

  w3m-mobile-download-links {
    padding: 0px;
    width: 100%;
  }
`;var J=function(e,t,i,r){var o=arguments.length,n=o<3?t:r===null?r=Object.getOwnPropertyDescriptor(t,i):r,s;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")n=Reflect.decorate(e,t,i,r);else for(var a=e.length-1;a>=0;a--)(s=e[a])&&(n=(o<3?s(n):o>3?s(t,i,n):s(t,i))||n);return o>3&&n&&Object.defineProperty(t,i,n),n};class N extends R{constructor(){var t,i,r,o,n;super(),this.wallet=(t=B.state.data)==null?void 0:t.wallet,this.connector=(i=B.state.data)==null?void 0:i.connector,this.timeout=void 0,this.secondaryBtnIcon="refresh",this.onConnect=void 0,this.onRender=void 0,this.onAutoConnect=void 0,this.isWalletConnect=!0,this.unsubscribe=[],this.imageSrc=D.getWalletImage(this.wallet)??D.getConnectorImage(this.connector),this.name=((r=this.wallet)==null?void 0:r.name)??((o=this.connector)==null?void 0:o.name)??"Wallet",this.isRetrying=!1,this.uri=E.state.wcUri,this.error=E.state.wcError,this.ready=!1,this.showRetry=!1,this.label=void 0,this.secondaryBtnLabel="Try again",this.secondaryLabel="Accept connection request in the wallet",this.isLoading=!1,this.isMobile=!1,this.onRetry=void 0,this.unsubscribe.push(E.subscribeKey("wcUri",s=>{var a;this.uri=s,this.isRetrying&&this.onRetry&&(this.isRetrying=!1,(a=this.onConnect)==null||a.call(this))}),E.subscribeKey("wcError",s=>this.error=s)),(I.isTelegram()||I.isSafari())&&I.isIos()&&E.state.wcUri&&((n=this.onConnect)==null||n.call(this))}firstUpdated(){var t;(t=this.onAutoConnect)==null||t.call(this),this.showRetry=!this.onAutoConnect}disconnectedCallback(){this.unsubscribe.forEach(t=>t()),E.setWcError(!1),clearTimeout(this.timeout)}render(){var r;(r=this.onRender)==null||r.call(this),this.onShowRetry();const t=this.error?"Connection can be declined if a previous request is still active":this.secondaryLabel;let i="";return this.label?i=this.label:(i=`Continue in ${this.name}`,this.error&&(i="Connection declined")),c`
      <wui-flex
        data-error=${C(this.error)}
        data-retry=${this.showRetry}
        flexDirection="column"
        alignItems="center"
        .padding=${["10","5","5","5"]}
        gap="6"
      >
        <wui-flex gap="2" justifyContent="center" alignItems="center">
          <wui-wallet-image size="lg" imageSrc=${C(this.imageSrc)}></wui-wallet-image>

          ${this.error?null:this.loaderTemplate()}

          <wui-icon-box
            color="error"
            icon="close"
            size="sm"
            border
            borderColor="wui-color-bg-125"
          ></wui-icon-box>
        </wui-flex>

        <wui-flex flexDirection="column" alignItems="center" gap="6"> <wui-flex
          flexDirection="column"
          alignItems="center"
          gap="2"
          .padding=${["2","0","0","0"]}
        >
          <wui-text align="center" variant="lg-medium" color=${this.error?"error":"primary"}>
            ${i}
          </wui-text>
          <wui-text align="center" variant="lg-regular" color="secondary">${t}</wui-text>
        </wui-flex>

        ${this.secondaryBtnLabel?c`
                <wui-button
                  variant="neutral-secondary"
                  size="md"
                  ?disabled=${this.isRetrying||this.isLoading}
                  @click=${this.onTryAgain.bind(this)}
                  data-testid="w3m-connecting-widget-secondary-button"
                >
                  <wui-icon
                    color="inherit"
                    slot="iconLeft"
                    name=${this.secondaryBtnIcon}
                  ></wui-icon>
                  ${this.secondaryBtnLabel}
                </wui-button>
              `:null}
      </wui-flex>

      ${this.isWalletConnect?c`
              <wui-flex .padding=${["0","5","5","5"]} justifyContent="center">
                <wui-link
                  @click=${this.onCopyUri}
                  variant="secondary"
                  icon="copy"
                  data-testid="wui-link-copy"
                >
                  Copy link
                </wui-link>
              </wui-flex>
            `:null}

      <w3m-mobile-download-links .wallet=${this.wallet}></w3m-mobile-download-links></wui-flex>
      </wui-flex>
    `}onShowRetry(){var t;if(this.error&&!this.showRetry){this.showRetry=!0;const i=(t=this.shadowRoot)==null?void 0:t.querySelector("wui-button");i==null||i.animate([{opacity:0},{opacity:1}],{fill:"forwards",easing:"ease"})}}onTryAgain(){var t,i;E.setWcError(!1),this.onRetry?(this.isRetrying=!0,(t=this.onRetry)==null||t.call(this)):(i=this.onConnect)==null||i.call(this)}loaderTemplate(){const t=Ut.state.themeVariables["--w3m-border-radius-master"],i=t?parseInt(t.replace("px",""),10):4;return c`<wui-loading-thumbnail radius=${i*9}></wui-loading-thumbnail>`}onCopyUri(){try{this.uri&&(I.copyToClopboard(this.uri),Me.showSuccess("Link copied"))}catch{Me.showError("Failed to copy")}}}N.styles=hi;J([$()],N.prototype,"isRetrying",void 0);J([$()],N.prototype,"uri",void 0);J([$()],N.prototype,"error",void 0);J([$()],N.prototype,"ready",void 0);J([$()],N.prototype,"showRetry",void 0);J([$()],N.prototype,"label",void 0);J([$()],N.prototype,"secondaryBtnLabel",void 0);J([$()],N.prototype,"secondaryLabel",void 0);J([$()],N.prototype,"isLoading",void 0);J([d({type:Boolean})],N.prototype,"isMobile",void 0);J([d()],N.prototype,"onRetry",void 0);var fi=function(e,t,i,r){var o=arguments.length,n=o<3?t:r===null?r=Object.getOwnPropertyDescriptor(t,i):r,s;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")n=Reflect.decorate(e,t,i,r);else for(var a=e.length-1;a>=0;a--)(s=e[a])&&(n=(o<3?s(n):o>3?s(t,i,n):s(t,i))||n);return o>3&&n&&Object.defineProperty(t,i,n),n};let un=class extends N{constructor(){var t;if(super(),!this.wallet)throw new Error("w3m-connecting-wc-browser: No wallet provided");this.onConnect=this.onConnectProxy.bind(this),this.onAutoConnect=this.onConnectProxy.bind(this),Y.sendEvent({type:"track",event:"SELECT_WALLET",properties:{name:this.wallet.name,platform:"browser",displayIndex:(t=this.wallet)==null?void 0:t.display_index}})}async onConnectProxy(){var t;try{this.error=!1;const{connectors:i}=A.state,r=i.find(o=>{var n,s,a;return o.type==="ANNOUNCED"&&((n=o.info)==null?void 0:n.rdns)===((s=this.wallet)==null?void 0:s.rdns)||o.type==="INJECTED"||o.name===((a=this.wallet)==null?void 0:a.name)});if(r)await E.connectExternal(r,r.chain);else throw new Error("w3m-connecting-wc-browser: No connector found");vn.close(),Y.sendEvent({type:"track",event:"CONNECT_SUCCESS",properties:{method:"browser",name:((t=this.wallet)==null?void 0:t.name)||"Unknown"}})}catch(i){Y.sendEvent({type:"track",event:"CONNECT_ERROR",properties:{message:(i==null?void 0:i.message)??"Unknown"}}),this.error=!0}}};un=fi([_("w3m-connecting-wc-browser")],un);var pi=function(e,t,i,r){var o=arguments.length,n=o<3?t:r===null?r=Object.getOwnPropertyDescriptor(t,i):r,s;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")n=Reflect.decorate(e,t,i,r);else for(var a=e.length-1;a>=0;a--)(s=e[a])&&(n=(o<3?s(n):o>3?s(t,i,n):s(t,i))||n);return o>3&&n&&Object.defineProperty(t,i,n),n};let hn=class extends N{constructor(){var t;if(super(),!this.wallet)throw new Error("w3m-connecting-wc-desktop: No wallet provided");this.onConnect=this.onConnectProxy.bind(this),this.onRender=this.onRenderProxy.bind(this),Y.sendEvent({type:"track",event:"SELECT_WALLET",properties:{name:this.wallet.name,platform:"desktop",displayIndex:(t=this.wallet)==null?void 0:t.display_index}})}onRenderProxy(){var t;!this.ready&&this.uri&&(this.ready=!0,(t=this.onConnect)==null||t.call(this))}onConnectProxy(){var t;if((t=this.wallet)!=null&&t.desktop_link&&this.uri)try{this.error=!1;const{desktop_link:i,name:r}=this.wallet,{redirect:o,href:n}=I.formatNativeUrl(i,this.uri);E.setWcLinking({name:r,href:n}),E.setRecentWallet(this.wallet),I.openHref(o,"_blank")}catch{this.error=!0}}};hn=pi([_("w3m-connecting-wc-desktop")],hn);var Pe=function(e,t,i,r){var o=arguments.length,n=o<3?t:r===null?r=Object.getOwnPropertyDescriptor(t,i):r,s;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")n=Reflect.decorate(e,t,i,r);else for(var a=e.length-1;a>=0;a--)(s=e[a])&&(n=(o<3?s(n):o>3?s(t,i,n):s(t,i))||n);return o>3&&n&&Object.defineProperty(t,i,n),n};let be=class extends N{constructor(){var t;if(super(),this.btnLabelTimeout=void 0,this.redirectDeeplink=void 0,this.redirectUniversalLink=void 0,this.target=void 0,this.preferUniversalLinks=j.state.experimental_preferUniversalLinks,this.isLoading=!0,this.onConnect=()=>{var i;if((i=this.wallet)!=null&&i.mobile_link&&this.uri)try{this.error=!1;const{mobile_link:r,link_mode:o,name:n}=this.wallet,{redirect:s,redirectUniversalLink:a,href:l}=I.formatNativeUrl(r,this.uri,o);this.redirectDeeplink=s,this.redirectUniversalLink=a,this.target=I.isIframe()?"_top":"_self",E.setWcLinking({name:n,href:l}),E.setRecentWallet(this.wallet),this.preferUniversalLinks&&this.redirectUniversalLink?I.openHref(this.redirectUniversalLink,this.target):I.openHref(this.redirectDeeplink,this.target)}catch(r){Y.sendEvent({type:"track",event:"CONNECT_PROXY_ERROR",properties:{message:r instanceof Error?r.message:"Error parsing the deeplink",uri:this.uri,mobile_link:this.wallet.mobile_link,name:this.wallet.name}}),this.error=!0}},!this.wallet)throw new Error("w3m-connecting-wc-mobile: No wallet provided");this.secondaryBtnLabel="Open",this.secondaryLabel=xn.CONNECT_LABELS.MOBILE,this.secondaryBtnIcon="externalLink",this.onHandleURI(),this.unsubscribe.push(E.subscribeKey("wcUri",()=>{this.onHandleURI()})),Y.sendEvent({type:"track",event:"SELECT_WALLET",properties:{name:this.wallet.name,platform:"mobile",displayIndex:(t=this.wallet)==null?void 0:t.display_index}})}disconnectedCallback(){super.disconnectedCallback(),clearTimeout(this.btnLabelTimeout)}onHandleURI(){var t;this.isLoading=!this.uri,!this.ready&&this.uri&&(this.ready=!0,(t=this.onConnect)==null||t.call(this))}onTryAgain(){var t;E.setWcError(!1),(t=this.onConnect)==null||t.call(this)}};Pe([$()],be.prototype,"redirectDeeplink",void 0);Pe([$()],be.prototype,"redirectUniversalLink",void 0);Pe([$()],be.prototype,"target",void 0);Pe([$()],be.prototype,"preferUniversalLinks",void 0);Pe([$()],be.prototype,"isLoading",void 0);be=Pe([_("w3m-connecting-wc-mobile")],be);var Xe={},gi=function(){return typeof Promise=="function"&&Promise.prototype&&Promise.prototype.then},Rn={},V={};let Zt;const mi=[0,26,44,70,100,134,172,196,242,292,346,404,466,532,581,655,733,815,901,991,1085,1156,1258,1364,1474,1588,1706,1828,1921,2051,2185,2323,2465,2611,2761,2876,3034,3196,3362,3532,3706];V.getSymbolSize=function(t){if(!t)throw new Error('"version" cannot be null or undefined');if(t<1||t>40)throw new Error('"version" should be in range from 1 to 40');return t*4+17};V.getSymbolTotalCodewords=function(t){return mi[t]};V.getBCHDigit=function(e){let t=0;for(;e!==0;)t++,e>>>=1;return t};V.setToSJISFunction=function(t){if(typeof t!="function")throw new Error('"toSJISFunc" is not a valid function.');Zt=t};V.isKanjiModeEnabled=function(){return typeof Zt<"u"};V.toSJIS=function(t){return Zt(t)};var Rt={};(function(e){e.L={bit:1},e.M={bit:0},e.Q={bit:3},e.H={bit:2};function t(i){if(typeof i!="string")throw new Error("Param is not a string");switch(i.toLowerCase()){case"l":case"low":return e.L;case"m":case"medium":return e.M;case"q":case"quartile":return e.Q;case"h":case"high":return e.H;default:throw new Error("Unknown EC Level: "+i)}}e.isValid=function(r){return r&&typeof r.bit<"u"&&r.bit>=0&&r.bit<4},e.from=function(r,o){if(e.isValid(r))return r;try{return t(r)}catch{return o}}})(Rt);function Wn(){this.buffer=[],this.length=0}Wn.prototype={get:function(e){const t=Math.floor(e/8);return(this.buffer[t]>>>7-e%8&1)===1},put:function(e,t){for(let i=0;i<t;i++)this.putBit((e>>>t-i-1&1)===1)},getLengthInBits:function(){return this.length},putBit:function(e){const t=Math.floor(this.length/8);this.buffer.length<=t&&this.buffer.push(0),e&&(this.buffer[t]|=128>>>this.length%8),this.length++}};var wi=Wn;function Ze(e){if(!e||e<1)throw new Error("BitMatrix size must be defined and greater than 0");this.size=e,this.data=new Uint8Array(e*e),this.reservedBit=new Uint8Array(e*e)}Ze.prototype.set=function(e,t,i,r){const o=e*this.size+t;this.data[o]=i,r&&(this.reservedBit[o]=!0)};Ze.prototype.get=function(e,t){return this.data[e*this.size+t]};Ze.prototype.xor=function(e,t,i){this.data[e*this.size+t]^=i};Ze.prototype.isReserved=function(e,t){return this.reservedBit[e*this.size+t]};var bi=Ze,Tn={};(function(e){const t=V.getSymbolSize;e.getRowColCoords=function(r){if(r===1)return[];const o=Math.floor(r/7)+2,n=t(r),s=n===145?26:Math.ceil((n-13)/(2*o-2))*2,a=[n-7];for(let l=1;l<o-1;l++)a[l]=a[l-1]-s;return a.push(6),a.reverse()},e.getPositions=function(r){const o=[],n=e.getRowColCoords(r),s=n.length;for(let a=0;a<s;a++)for(let l=0;l<s;l++)a===0&&l===0||a===0&&l===s-1||a===s-1&&l===0||o.push([n[a],n[l]]);return o}})(Tn);var Sn={};const yi=V.getSymbolSize,fn=7;Sn.getPositions=function(t){const i=yi(t);return[[0,0],[i-fn,0],[0,i-fn]]};var An={};(function(e){e.Patterns={PATTERN000:0,PATTERN001:1,PATTERN010:2,PATTERN011:3,PATTERN100:4,PATTERN101:5,PATTERN110:6,PATTERN111:7};const t={N1:3,N2:3,N3:40,N4:10};e.isValid=function(o){return o!=null&&o!==""&&!isNaN(o)&&o>=0&&o<=7},e.from=function(o){return e.isValid(o)?parseInt(o,10):void 0},e.getPenaltyN1=function(o){const n=o.size;let s=0,a=0,l=0,h=null,u=null;for(let T=0;T<n;T++){a=l=0,h=u=null;for(let g=0;g<n;g++){let y=o.get(T,g);y===h?a++:(a>=5&&(s+=t.N1+(a-5)),h=y,a=1),y=o.get(g,T),y===u?l++:(l>=5&&(s+=t.N1+(l-5)),u=y,l=1)}a>=5&&(s+=t.N1+(a-5)),l>=5&&(s+=t.N1+(l-5))}return s},e.getPenaltyN2=function(o){const n=o.size;let s=0;for(let a=0;a<n-1;a++)for(let l=0;l<n-1;l++){const h=o.get(a,l)+o.get(a,l+1)+o.get(a+1,l)+o.get(a+1,l+1);(h===4||h===0)&&s++}return s*t.N2},e.getPenaltyN3=function(o){const n=o.size;let s=0,a=0,l=0;for(let h=0;h<n;h++){a=l=0;for(let u=0;u<n;u++)a=a<<1&2047|o.get(h,u),u>=10&&(a===1488||a===93)&&s++,l=l<<1&2047|o.get(u,h),u>=10&&(l===1488||l===93)&&s++}return s*t.N3},e.getPenaltyN4=function(o){let n=0;const s=o.data.length;for(let l=0;l<s;l++)n+=o.data[l];return Math.abs(Math.ceil(n*100/s/5)-10)*t.N4};function i(r,o,n){switch(r){case e.Patterns.PATTERN000:return(o+n)%2===0;case e.Patterns.PATTERN001:return o%2===0;case e.Patterns.PATTERN010:return n%3===0;case e.Patterns.PATTERN011:return(o+n)%3===0;case e.Patterns.PATTERN100:return(Math.floor(o/2)+Math.floor(n/3))%2===0;case e.Patterns.PATTERN101:return o*n%2+o*n%3===0;case e.Patterns.PATTERN110:return(o*n%2+o*n%3)%2===0;case e.Patterns.PATTERN111:return(o*n%3+(o+n)%2)%2===0;default:throw new Error("bad maskPattern:"+r)}}e.applyMask=function(o,n){const s=n.size;for(let a=0;a<s;a++)for(let l=0;l<s;l++)n.isReserved(l,a)||n.xor(l,a,i(o,l,a))},e.getBestMask=function(o,n){const s=Object.keys(e.Patterns).length;let a=0,l=1/0;for(let h=0;h<s;h++){n(h),e.applyMask(h,o);const u=e.getPenaltyN1(o)+e.getPenaltyN2(o)+e.getPenaltyN3(o)+e.getPenaltyN4(o);e.applyMask(h,o),u<l&&(l=u,a=h)}return a}})(An);var Wt={};const ce=Rt,nt=[1,1,1,1,1,1,1,1,1,1,2,2,1,2,2,4,1,2,4,4,2,4,4,4,2,4,6,5,2,4,6,6,2,5,8,8,4,5,8,8,4,5,8,11,4,8,10,11,4,9,12,16,4,9,16,16,6,10,12,18,6,10,17,16,6,11,16,19,6,13,18,21,7,14,21,25,8,16,20,25,8,17,23,25,9,17,23,34,9,18,25,30,10,20,27,32,12,21,29,35,12,23,34,37,12,25,34,40,13,26,35,42,14,28,38,45,15,29,40,48,16,31,43,51,17,33,45,54,18,35,48,57,19,37,51,60,19,38,53,63,20,40,56,66,21,43,59,70,22,45,62,74,24,47,65,77,25,49,68,81],it=[7,10,13,17,10,16,22,28,15,26,36,44,20,36,52,64,26,48,72,88,36,64,96,112,40,72,108,130,48,88,132,156,60,110,160,192,72,130,192,224,80,150,224,264,96,176,260,308,104,198,288,352,120,216,320,384,132,240,360,432,144,280,408,480,168,308,448,532,180,338,504,588,196,364,546,650,224,416,600,700,224,442,644,750,252,476,690,816,270,504,750,900,300,560,810,960,312,588,870,1050,336,644,952,1110,360,700,1020,1200,390,728,1050,1260,420,784,1140,1350,450,812,1200,1440,480,868,1290,1530,510,924,1350,1620,540,980,1440,1710,570,1036,1530,1800,570,1064,1590,1890,600,1120,1680,1980,630,1204,1770,2100,660,1260,1860,2220,720,1316,1950,2310,750,1372,2040,2430];Wt.getBlocksCount=function(t,i){switch(i){case ce.L:return nt[(t-1)*4+0];case ce.M:return nt[(t-1)*4+1];case ce.Q:return nt[(t-1)*4+2];case ce.H:return nt[(t-1)*4+3];default:return}};Wt.getTotalCodewordsCount=function(t,i){switch(i){case ce.L:return it[(t-1)*4+0];case ce.M:return it[(t-1)*4+1];case ce.Q:return it[(t-1)*4+2];case ce.H:return it[(t-1)*4+3];default:return}};var Pn={},Tt={};const ke=new Uint8Array(512),ut=new Uint8Array(256);(function(){let t=1;for(let i=0;i<255;i++)ke[i]=t,ut[t]=i,t<<=1,t&256&&(t^=285);for(let i=255;i<512;i++)ke[i]=ke[i-255]})();Tt.log=function(t){if(t<1)throw new Error("log("+t+")");return ut[t]};Tt.exp=function(t){return ke[t]};Tt.mul=function(t,i){return t===0||i===0?0:ke[ut[t]+ut[i]]};(function(e){const t=Tt;e.mul=function(r,o){const n=new Uint8Array(r.length+o.length-1);for(let s=0;s<r.length;s++)for(let a=0;a<o.length;a++)n[s+a]^=t.mul(r[s],o[a]);return n},e.mod=function(r,o){let n=new Uint8Array(r);for(;n.length-o.length>=0;){const s=n[0];for(let l=0;l<o.length;l++)n[l]^=t.mul(o[l],s);let a=0;for(;a<n.length&&n[a]===0;)a++;n=n.slice(a)}return n},e.generateECPolynomial=function(r){let o=new Uint8Array([1]);for(let n=0;n<r;n++)o=e.mul(o,new Uint8Array([1,t.exp(n)]));return o}})(Pn);const Ln=Pn;function en(e){this.genPoly=void 0,this.degree=e,this.degree&&this.initialize(this.degree)}en.prototype.initialize=function(t){this.degree=t,this.genPoly=Ln.generateECPolynomial(this.degree)};en.prototype.encode=function(t){if(!this.genPoly)throw new Error("Encoder not initialized");const i=new Uint8Array(t.length+this.degree);i.set(t);const r=Ln.mod(i,this.genPoly),o=this.degree-r.length;if(o>0){const n=new Uint8Array(this.degree);return n.set(r,o),n}return r};var $i=en,Bn={},he={},tn={};tn.isValid=function(t){return!isNaN(t)&&t>=1&&t<=40};var ee={};const On="[0-9]+",vi="[A-Z $%*+\\-./:]+";let Ge="(?:[u3000-u303F]|[u3040-u309F]|[u30A0-u30FF]|[uFF00-uFFEF]|[u4E00-u9FAF]|[u2605-u2606]|[u2190-u2195]|u203B|[u2010u2015u2018u2019u2025u2026u201Cu201Du2225u2260]|[u0391-u0451]|[u00A7u00A8u00B1u00B4u00D7u00F7])+";Ge=Ge.replace(/u/g,"\\u");const xi="(?:(?![A-Z0-9 $%*+\\-./:]|"+Ge+`)(?:.|[\r
]))+`;ee.KANJI=new RegExp(Ge,"g");ee.BYTE_KANJI=new RegExp("[^A-Z0-9 $%*+\\-./:]+","g");ee.BYTE=new RegExp(xi,"g");ee.NUMERIC=new RegExp(On,"g");ee.ALPHANUMERIC=new RegExp(vi,"g");const Ci=new RegExp("^"+Ge+"$"),_i=new RegExp("^"+On+"$"),Ei=new RegExp("^[A-Z0-9 $%*+\\-./:]+$");ee.testKanji=function(t){return Ci.test(t)};ee.testNumeric=function(t){return _i.test(t)};ee.testAlphanumeric=function(t){return Ei.test(t)};(function(e){const t=tn,i=ee;e.NUMERIC={id:"Numeric",bit:1,ccBits:[10,12,14]},e.ALPHANUMERIC={id:"Alphanumeric",bit:2,ccBits:[9,11,13]},e.BYTE={id:"Byte",bit:4,ccBits:[8,16,16]},e.KANJI={id:"Kanji",bit:8,ccBits:[8,10,12]},e.MIXED={bit:-1},e.getCharCountIndicator=function(n,s){if(!n.ccBits)throw new Error("Invalid mode: "+n);if(!t.isValid(s))throw new Error("Invalid version: "+s);return s>=1&&s<10?n.ccBits[0]:s<27?n.ccBits[1]:n.ccBits[2]},e.getBestModeForData=function(n){return i.testNumeric(n)?e.NUMERIC:i.testAlphanumeric(n)?e.ALPHANUMERIC:i.testKanji(n)?e.KANJI:e.BYTE},e.toString=function(n){if(n&&n.id)return n.id;throw new Error("Invalid mode")},e.isValid=function(n){return n&&n.bit&&n.ccBits};function r(o){if(typeof o!="string")throw new Error("Param is not a string");switch(o.toLowerCase()){case"numeric":return e.NUMERIC;case"alphanumeric":return e.ALPHANUMERIC;case"kanji":return e.KANJI;case"byte":return e.BYTE;default:throw new Error("Unknown mode: "+o)}}e.from=function(n,s){if(e.isValid(n))return n;try{return r(n)}catch{return s}}})(he);(function(e){const t=V,i=Wt,r=Rt,o=he,n=tn,s=7973,a=t.getBCHDigit(s);function l(g,y,v){for(let b=1;b<=40;b++)if(y<=e.getCapacity(b,v,g))return b}function h(g,y){return o.getCharCountIndicator(g,y)+4}function u(g,y){let v=0;return g.forEach(function(b){const x=h(b.mode,y);v+=x+b.getBitsLength()}),v}function T(g,y){for(let v=1;v<=40;v++)if(u(g,v)<=e.getCapacity(v,y,o.MIXED))return v}e.from=function(y,v){return n.isValid(y)?parseInt(y,10):v},e.getCapacity=function(y,v,b){if(!n.isValid(y))throw new Error("Invalid QR Code version");typeof b>"u"&&(b=o.BYTE);const x=t.getSymbolTotalCodewords(y),m=i.getTotalCodewordsCount(y,v),p=(x-m)*8;if(b===o.MIXED)return p;const w=p-h(b,y);switch(b){case o.NUMERIC:return Math.floor(w/10*3);case o.ALPHANUMERIC:return Math.floor(w/11*2);case o.KANJI:return Math.floor(w/13);case o.BYTE:default:return Math.floor(w/8)}},e.getBestVersionForData=function(y,v){let b;const x=r.from(v,r.M);if(Array.isArray(y)){if(y.length>1)return T(y,x);if(y.length===0)return 1;b=y[0]}else b=y;return l(b.mode,b.getLength(),x)},e.getEncodedBits=function(y){if(!n.isValid(y)||y<7)throw new Error("Invalid QR Code version");let v=y<<12;for(;t.getBCHDigit(v)-a>=0;)v^=s<<t.getBCHDigit(v)-a;return y<<12|v}})(Bn);var Nn={};const Ft=V,kn=1335,Ii=21522,pn=Ft.getBCHDigit(kn);Nn.getEncodedBits=function(t,i){const r=t.bit<<3|i;let o=r<<10;for(;Ft.getBCHDigit(o)-pn>=0;)o^=kn<<Ft.getBCHDigit(o)-pn;return(r<<10|o)^Ii};var zn={};const Ri=he;function Ee(e){this.mode=Ri.NUMERIC,this.data=e.toString()}Ee.getBitsLength=function(t){return 10*Math.floor(t/3)+(t%3?t%3*3+1:0)};Ee.prototype.getLength=function(){return this.data.length};Ee.prototype.getBitsLength=function(){return Ee.getBitsLength(this.data.length)};Ee.prototype.write=function(t){let i,r,o;for(i=0;i+3<=this.data.length;i+=3)r=this.data.substr(i,3),o=parseInt(r,10),t.put(o,10);const n=this.data.length-i;n>0&&(r=this.data.substr(i),o=parseInt(r,10),t.put(o,n*3+1))};var Wi=Ee;const Ti=he,Ot=["0","1","2","3","4","5","6","7","8","9","A","B","C","D","E","F","G","H","I","J","K","L","M","N","O","P","Q","R","S","T","U","V","W","X","Y","Z"," ","$","%","*","+","-",".","/",":"];function Ie(e){this.mode=Ti.ALPHANUMERIC,this.data=e}Ie.getBitsLength=function(t){return 11*Math.floor(t/2)+6*(t%2)};Ie.prototype.getLength=function(){return this.data.length};Ie.prototype.getBitsLength=function(){return Ie.getBitsLength(this.data.length)};Ie.prototype.write=function(t){let i;for(i=0;i+2<=this.data.length;i+=2){let r=Ot.indexOf(this.data[i])*45;r+=Ot.indexOf(this.data[i+1]),t.put(r,11)}this.data.length%2&&t.put(Ot.indexOf(this.data[i]),6)};var Si=Ie,Ai=function(t){for(var i=[],r=t.length,o=0;o<r;o++){var n=t.charCodeAt(o);if(n>=55296&&n<=56319&&r>o+1){var s=t.charCodeAt(o+1);s>=56320&&s<=57343&&(n=(n-55296)*1024+s-56320+65536,o+=1)}if(n<128){i.push(n);continue}if(n<2048){i.push(n>>6|192),i.push(n&63|128);continue}if(n<55296||n>=57344&&n<65536){i.push(n>>12|224),i.push(n>>6&63|128),i.push(n&63|128);continue}if(n>=65536&&n<=1114111){i.push(n>>18|240),i.push(n>>12&63|128),i.push(n>>6&63|128),i.push(n&63|128);continue}i.push(239,191,189)}return new Uint8Array(i).buffer};const Pi=Ai,Li=he;function Re(e){this.mode=Li.BYTE,typeof e=="string"&&(e=Pi(e)),this.data=new Uint8Array(e)}Re.getBitsLength=function(t){return t*8};Re.prototype.getLength=function(){return this.data.length};Re.prototype.getBitsLength=function(){return Re.getBitsLength(this.data.length)};Re.prototype.write=function(e){for(let t=0,i=this.data.length;t<i;t++)e.put(this.data[t],8)};var Bi=Re;const Oi=he,Ni=V;function We(e){this.mode=Oi.KANJI,this.data=e}We.getBitsLength=function(t){return t*13};We.prototype.getLength=function(){return this.data.length};We.prototype.getBitsLength=function(){return We.getBitsLength(this.data.length)};We.prototype.write=function(e){let t;for(t=0;t<this.data.length;t++){let i=Ni.toSJIS(this.data[t]);if(i>=33088&&i<=40956)i-=33088;else if(i>=57408&&i<=60351)i-=49472;else throw new Error("Invalid SJIS character: "+this.data[t]+`
Make sure your charset is UTF-8`);i=(i>>>8&255)*192+(i&255),e.put(i,13)}};var ki=We,jn={exports:{}};(function(e){var t={single_source_shortest_paths:function(i,r,o){var n={},s={};s[r]=0;var a=t.PriorityQueue.make();a.push(r,0);for(var l,h,u,T,g,y,v,b,x;!a.empty();){l=a.pop(),h=l.value,T=l.cost,g=i[h]||{};for(u in g)g.hasOwnProperty(u)&&(y=g[u],v=T+y,b=s[u],x=typeof s[u]>"u",(x||b>v)&&(s[u]=v,a.push(u,v),n[u]=h))}if(typeof o<"u"&&typeof s[o]>"u"){var m=["Could not find a path from ",r," to ",o,"."].join("");throw new Error(m)}return n},extract_shortest_path_from_predecessor_list:function(i,r){for(var o=[],n=r;n;)o.push(n),i[n],n=i[n];return o.reverse(),o},find_path:function(i,r,o){var n=t.single_source_shortest_paths(i,r,o);return t.extract_shortest_path_from_predecessor_list(n,o)},PriorityQueue:{make:function(i){var r=t.PriorityQueue,o={},n;i=i||{};for(n in r)r.hasOwnProperty(n)&&(o[n]=r[n]);return o.queue=[],o.sorter=i.sorter||r.default_sorter,o},default_sorter:function(i,r){return i.cost-r.cost},push:function(i,r){var o={value:i,cost:r};this.queue.push(o),this.queue.sort(this.sorter)},pop:function(){return this.queue.shift()},empty:function(){return this.queue.length===0}}};e.exports=t})(jn);var zi=jn.exports;(function(e){const t=he,i=Wi,r=Si,o=Bi,n=ki,s=ee,a=V,l=zi;function h(m){return unescape(encodeURIComponent(m)).length}function u(m,p,w){const f=[];let W;for(;(W=m.exec(w))!==null;)f.push({data:W[0],index:W.index,mode:p,length:W[0].length});return f}function T(m){const p=u(s.NUMERIC,t.NUMERIC,m),w=u(s.ALPHANUMERIC,t.ALPHANUMERIC,m);let f,W;return a.isKanjiModeEnabled()?(f=u(s.BYTE,t.BYTE,m),W=u(s.KANJI,t.KANJI,m)):(f=u(s.BYTE_KANJI,t.BYTE,m),W=[]),p.concat(w,f,W).sort(function(O,G){return O.index-G.index}).map(function(O){return{data:O.data,mode:O.mode,length:O.length}})}function g(m,p){switch(p){case t.NUMERIC:return i.getBitsLength(m);case t.ALPHANUMERIC:return r.getBitsLength(m);case t.KANJI:return n.getBitsLength(m);case t.BYTE:return o.getBitsLength(m)}}function y(m){return m.reduce(function(p,w){const f=p.length-1>=0?p[p.length-1]:null;return f&&f.mode===w.mode?(p[p.length-1].data+=w.data,p):(p.push(w),p)},[])}function v(m){const p=[];for(let w=0;w<m.length;w++){const f=m[w];switch(f.mode){case t.NUMERIC:p.push([f,{data:f.data,mode:t.ALPHANUMERIC,length:f.length},{data:f.data,mode:t.BYTE,length:f.length}]);break;case t.ALPHANUMERIC:p.push([f,{data:f.data,mode:t.BYTE,length:f.length}]);break;case t.KANJI:p.push([f,{data:f.data,mode:t.BYTE,length:h(f.data)}]);break;case t.BYTE:p.push([{data:f.data,mode:t.BYTE,length:h(f.data)}])}}return p}function b(m,p){const w={},f={start:{}};let W=["start"];for(let P=0;P<m.length;P++){const O=m[P],G=[];for(let le=0;le<O.length;le++){const Q=O[le],Oe=""+P+le;G.push(Oe),w[Oe]={node:Q,lastCount:0},f[Oe]={};for(let Lt=0;Lt<W.length;Lt++){const ne=W[Lt];w[ne]&&w[ne].node.mode===Q.mode?(f[ne][Oe]=g(w[ne].lastCount+Q.length,Q.mode)-g(w[ne].lastCount,Q.mode),w[ne].lastCount+=Q.length):(w[ne]&&(w[ne].lastCount=Q.length),f[ne][Oe]=g(Q.length,Q.mode)+4+t.getCharCountIndicator(Q.mode,p))}}W=G}for(let P=0;P<W.length;P++)f[W[P]].end=0;return{map:f,table:w}}function x(m,p){let w;const f=t.getBestModeForData(m);if(w=t.from(p,f),w!==t.BYTE&&w.bit<f.bit)throw new Error('"'+m+'" cannot be encoded with mode '+t.toString(w)+`.
 Suggested mode is: `+t.toString(f));switch(w===t.KANJI&&!a.isKanjiModeEnabled()&&(w=t.BYTE),w){case t.NUMERIC:return new i(m);case t.ALPHANUMERIC:return new r(m);case t.KANJI:return new n(m);case t.BYTE:return new o(m)}}e.fromArray=function(p){return p.reduce(function(w,f){return typeof f=="string"?w.push(x(f,null)):f.data&&w.push(x(f.data,f.mode)),w},[])},e.fromString=function(p,w){const f=T(p,a.isKanjiModeEnabled()),W=v(f),P=b(W,w),O=l.find_path(P.map,"start","end"),G=[];for(let le=1;le<O.length-1;le++)G.push(P.table[O[le]].node);return e.fromArray(y(G))},e.rawSplit=function(p){return e.fromArray(T(p,a.isKanjiModeEnabled()))}})(zn);const St=V,Nt=Rt,ji=wi,Di=bi,Mi=Tn,Ui=Sn,Vt=An,Ht=Wt,Fi=$i,ht=Bn,Vi=Nn,Hi=he,kt=zn;function Ki(e,t){const i=e.size,r=Ui.getPositions(t);for(let o=0;o<r.length;o++){const n=r[o][0],s=r[o][1];for(let a=-1;a<=7;a++)if(!(n+a<=-1||i<=n+a))for(let l=-1;l<=7;l++)s+l<=-1||i<=s+l||(a>=0&&a<=6&&(l===0||l===6)||l>=0&&l<=6&&(a===0||a===6)||a>=2&&a<=4&&l>=2&&l<=4?e.set(n+a,s+l,!0,!0):e.set(n+a,s+l,!1,!0))}}function qi(e){const t=e.size;for(let i=8;i<t-8;i++){const r=i%2===0;e.set(i,6,r,!0),e.set(6,i,r,!0)}}function Gi(e,t){const i=Mi.getPositions(t);for(let r=0;r<i.length;r++){const o=i[r][0],n=i[r][1];for(let s=-2;s<=2;s++)for(let a=-2;a<=2;a++)s===-2||s===2||a===-2||a===2||s===0&&a===0?e.set(o+s,n+a,!0,!0):e.set(o+s,n+a,!1,!0)}}function Yi(e,t){const i=e.size,r=ht.getEncodedBits(t);let o,n,s;for(let a=0;a<18;a++)o=Math.floor(a/3),n=a%3+i-8-3,s=(r>>a&1)===1,e.set(o,n,s,!0),e.set(n,o,s,!0)}function zt(e,t,i){const r=e.size,o=Vi.getEncodedBits(t,i);let n,s;for(n=0;n<15;n++)s=(o>>n&1)===1,n<6?e.set(n,8,s,!0):n<8?e.set(n+1,8,s,!0):e.set(r-15+n,8,s,!0),n<8?e.set(8,r-n-1,s,!0):n<9?e.set(8,15-n-1+1,s,!0):e.set(8,15-n-1,s,!0);e.set(r-8,8,1,!0)}function Ji(e,t){const i=e.size;let r=-1,o=i-1,n=7,s=0;for(let a=i-1;a>0;a-=2)for(a===6&&a--;;){for(let l=0;l<2;l++)if(!e.isReserved(o,a-l)){let h=!1;s<t.length&&(h=(t[s]>>>n&1)===1),e.set(o,a-l,h),n--,n===-1&&(s++,n=7)}if(o+=r,o<0||i<=o){o-=r,r=-r;break}}}function Qi(e,t,i){const r=new ji;i.forEach(function(l){r.put(l.mode.bit,4),r.put(l.getLength(),Hi.getCharCountIndicator(l.mode,e)),l.write(r)});const o=St.getSymbolTotalCodewords(e),n=Ht.getTotalCodewordsCount(e,t),s=(o-n)*8;for(r.getLengthInBits()+4<=s&&r.put(0,4);r.getLengthInBits()%8!==0;)r.putBit(0);const a=(s-r.getLengthInBits())/8;for(let l=0;l<a;l++)r.put(l%2?17:236,8);return Xi(r,e,t)}function Xi(e,t,i){const r=St.getSymbolTotalCodewords(t),o=Ht.getTotalCodewordsCount(t,i),n=r-o,s=Ht.getBlocksCount(t,i),a=r%s,l=s-a,h=Math.floor(r/s),u=Math.floor(n/s),T=u+1,g=h-u,y=new Fi(g);let v=0;const b=new Array(s),x=new Array(s);let m=0;const p=new Uint8Array(e.buffer);for(let O=0;O<s;O++){const G=O<l?u:T;b[O]=p.slice(v,v+G),x[O]=y.encode(b[O]),v+=G,m=Math.max(m,G)}const w=new Uint8Array(r);let f=0,W,P;for(W=0;W<m;W++)for(P=0;P<s;P++)W<b[P].length&&(w[f++]=b[P][W]);for(W=0;W<g;W++)for(P=0;P<s;P++)w[f++]=x[P][W];return w}function Zi(e,t,i,r){let o;if(Array.isArray(e))o=kt.fromArray(e);else if(typeof e=="string"){let h=t;if(!h){const u=kt.rawSplit(e);h=ht.getBestVersionForData(u,i)}o=kt.fromString(e,h||40)}else throw new Error("Invalid data");const n=ht.getBestVersionForData(o,i);if(!n)throw new Error("The amount of data is too big to be stored in a QR Code");if(!t)t=n;else if(t<n)throw new Error(`
The chosen QR Code version cannot contain this amount of data.
Minimum version required to store current data is: `+n+`.
`);const s=Qi(t,i,o),a=St.getSymbolSize(t),l=new Di(a);return Ki(l,t),qi(l),Gi(l,t),zt(l,i,0),t>=7&&Yi(l,t),Ji(l,s),isNaN(r)&&(r=Vt.getBestMask(l,zt.bind(null,l,i))),Vt.applyMask(r,l),zt(l,i,r),{modules:l,version:t,errorCorrectionLevel:i,maskPattern:r,segments:o}}Rn.create=function(t,i){if(typeof t>"u"||t==="")throw new Error("No input text");let r=Nt.M,o,n;return typeof i<"u"&&(r=Nt.from(i.errorCorrectionLevel,Nt.M),o=ht.from(i.version),n=Vt.from(i.maskPattern),i.toSJISFunc&&St.setToSJISFunction(i.toSJISFunc)),Zi(t,o,r,n)};var Dn={},nn={};(function(e){function t(i){if(typeof i=="number"&&(i=i.toString()),typeof i!="string")throw new Error("Color should be defined as hex string");let r=i.slice().replace("#","").split("");if(r.length<3||r.length===5||r.length>8)throw new Error("Invalid hex color: "+i);(r.length===3||r.length===4)&&(r=Array.prototype.concat.apply([],r.map(function(n){return[n,n]}))),r.length===6&&r.push("F","F");const o=parseInt(r.join(""),16);return{r:o>>24&255,g:o>>16&255,b:o>>8&255,a:o&255,hex:"#"+r.slice(0,6).join("")}}e.getOptions=function(r){r||(r={}),r.color||(r.color={});const o=typeof r.margin>"u"||r.margin===null||r.margin<0?4:r.margin,n=r.width&&r.width>=21?r.width:void 0,s=r.scale||4;return{width:n,scale:n?4:s,margin:o,color:{dark:t(r.color.dark||"#000000ff"),light:t(r.color.light||"#ffffffff")},type:r.type,rendererOpts:r.rendererOpts||{}}},e.getScale=function(r,o){return o.width&&o.width>=r+o.margin*2?o.width/(r+o.margin*2):o.scale},e.getImageWidth=function(r,o){const n=e.getScale(r,o);return Math.floor((r+o.margin*2)*n)},e.qrToImageData=function(r,o,n){const s=o.modules.size,a=o.modules.data,l=e.getScale(s,n),h=Math.floor((s+n.margin*2)*l),u=n.margin*l,T=[n.color.light,n.color.dark];for(let g=0;g<h;g++)for(let y=0;y<h;y++){let v=(g*h+y)*4,b=n.color.light;if(g>=u&&y>=u&&g<h-u&&y<h-u){const x=Math.floor((g-u)/l),m=Math.floor((y-u)/l);b=T[a[x*s+m]?1:0]}r[v++]=b.r,r[v++]=b.g,r[v++]=b.b,r[v]=b.a}}})(nn);(function(e){const t=nn;function i(o,n,s){o.clearRect(0,0,n.width,n.height),n.style||(n.style={}),n.height=s,n.width=s,n.style.height=s+"px",n.style.width=s+"px"}function r(){try{return document.createElement("canvas")}catch{throw new Error("You need to specify a canvas element")}}e.render=function(n,s,a){let l=a,h=s;typeof l>"u"&&(!s||!s.getContext)&&(l=s,s=void 0),s||(h=r()),l=t.getOptions(l);const u=t.getImageWidth(n.modules.size,l),T=h.getContext("2d"),g=T.createImageData(u,u);return t.qrToImageData(g.data,n,l),i(T,h,u),T.putImageData(g,0,0),h},e.renderToDataURL=function(n,s,a){let l=a;typeof l>"u"&&(!s||!s.getContext)&&(l=s,s=void 0),l||(l={});const h=e.render(n,s,l),u=l.type||"image/png",T=l.rendererOpts||{};return h.toDataURL(u,T.quality)}})(Dn);var Mn={};const eo=nn;function gn(e,t){const i=e.a/255,r=t+'="'+e.hex+'"';return i<1?r+" "+t+'-opacity="'+i.toFixed(2).slice(1)+'"':r}function jt(e,t,i){let r=e+t;return typeof i<"u"&&(r+=" "+i),r}function to(e,t,i){let r="",o=0,n=!1,s=0;for(let a=0;a<e.length;a++){const l=Math.floor(a%t),h=Math.floor(a/t);!l&&!n&&(n=!0),e[a]?(s++,a>0&&l>0&&e[a-1]||(r+=n?jt("M",l+i,.5+h+i):jt("m",o,0),o=0,n=!1),l+1<t&&e[a+1]||(r+=jt("h",s),s=0)):o++}return r}Mn.render=function(t,i,r){const o=eo.getOptions(i),n=t.modules.size,s=t.modules.data,a=n+o.margin*2,l=o.color.light.a?"<path "+gn(o.color.light,"fill")+' d="M0 0h'+a+"v"+a+'H0z"/>':"",h="<path "+gn(o.color.dark,"stroke")+' d="'+to(s,n,o.margin)+'"/>',u='viewBox="0 0 '+a+" "+a+'"',g='<svg xmlns="http://www.w3.org/2000/svg" '+(o.width?'width="'+o.width+'" height="'+o.width+'" ':"")+u+' shape-rendering="crispEdges">'+l+h+`</svg>
`;return typeof r=="function"&&r(null,g),g};const no=gi,Kt=Rn,Un=Dn,io=Mn;function on(e,t,i,r,o){const n=[].slice.call(arguments,1),s=n.length,a=typeof n[s-1]=="function";if(!a&&!no())throw new Error("Callback required as last argument");if(a){if(s<2)throw new Error("Too few arguments provided");s===2?(o=i,i=t,t=r=void 0):s===3&&(t.getContext&&typeof o>"u"?(o=r,r=void 0):(o=r,r=i,i=t,t=void 0))}else{if(s<1)throw new Error("Too few arguments provided");return s===1?(i=t,t=r=void 0):s===2&&!t.getContext&&(r=i,i=t,t=void 0),new Promise(function(l,h){try{const u=Kt.create(i,r);l(e(u,t,r))}catch(u){h(u)}})}try{const l=Kt.create(i,r);o(null,e(l,t,r))}catch(l){o(l)}}Xe.create=Kt.create;Xe.toCanvas=on.bind(null,Un.render);Xe.toDataURL=on.bind(null,Un.renderToDataURL);Xe.toString=on.bind(null,function(e,t,i){return io.render(e,i)});const oo=.1,mn=2.5,ie=7;function Dt(e,t,i){return e===t?!1:(e-t<0?t-e:e-t)<=i+oo}function ro(e,t){const i=Array.prototype.slice.call(Xe.create(e,{errorCorrectionLevel:t}).modules.data,0),r=Math.sqrt(i.length);return i.reduce((o,n,s)=>(s%r===0?o.push([n]):o[o.length-1].push(n))&&o,[])}const so={generate({uri:e,size:t,logoSize:i,padding:r=8,dotColor:o="var(--apkt-tokens-theme-textInvert)"}){const s=[],a=ro(e,"Q"),l=(t-2*r)/a.length,h=[{x:0,y:0},{x:1,y:0},{x:0,y:1}];h.forEach(({x:b,y:x})=>{const m=(a.length-ie)*l*b+r,p=(a.length-ie)*l*x+r,w=.45;for(let f=0;f<h.length;f+=1){const W=l*(ie-f*2);s.push(Ne`
            <rect
              fill=${f===2?"var(--apkt-tokens-theme-textInvert)":"var(--apkt-tokens-theme-textPrimary)"}
              width=${f===0?W-10:W}
              rx= ${f===0?(W-10)*w:W*w}
              ry= ${f===0?(W-10)*w:W*w}
              stroke=${o}
              stroke-width=${f===0?10:0}
              height=${f===0?W-10:W}
              x= ${f===0?p+l*f+10/2:p+l*f}
              y= ${f===0?m+l*f+10/2:m+l*f}
            />
          `)}});const u=Math.floor((i+25)/l),T=a.length/2-u/2,g=a.length/2+u/2-1,y=[];a.forEach((b,x)=>{b.forEach((m,p)=>{if(a[x][p]&&!(x<ie&&p<ie||x>a.length-(ie+1)&&p<ie||x<ie&&p>a.length-(ie+1))&&!(x>T&&x<g&&p>T&&p<g)){const w=x*l+l/2+r,f=p*l+l/2+r;y.push([w,f])}})});const v={};return y.forEach(([b,x])=>{var m;v[b]?(m=v[b])==null||m.push(x):v[b]=[x]}),Object.entries(v).map(([b,x])=>{const m=x.filter(p=>x.every(w=>!Dt(p,w,l)));return[Number(b),m]}).forEach(([b,x])=>{x.forEach(m=>{s.push(Ne`<circle cx=${b} cy=${m} fill=${o} r=${l/mn} />`)})}),Object.entries(v).filter(([b,x])=>x.length>1).map(([b,x])=>{const m=x.filter(p=>x.some(w=>Dt(p,w,l)));return[Number(b),m]}).map(([b,x])=>{x.sort((p,w)=>p<w?-1:1);const m=[];for(const p of x){const w=m.find(f=>f.some(W=>Dt(p,W,l)));w?w.push(p):m.push([p])}return[b,m.map(p=>[p[0],p[p.length-1]])]}).forEach(([b,x])=>{x.forEach(([m,p])=>{s.push(Ne`
              <line
                x1=${b}
                x2=${b}
                y1=${m}
                y2=${p}
                stroke=${o}
                stroke-width=${l/(mn/2)}
                stroke-linecap="round"
              />
            `)})}),s}},ao=L`
  :host {
    position: relative;
    user-select: none;
    display: block;
    overflow: hidden;
    aspect-ratio: 1 / 1;
    width: 100%;
    height: 100%;
    background-color: ${({tokens:e})=>e.theme.backgroundInvert};
    color: ${({tokens:e})=>e.theme.textInvert};
  }

  :host {
    border-radius: ${({borderRadius:e})=>e[4]};
    display: flex;
    align-items: center;
    justify-content: center;
  }

  :host([data-clear='true']) > wui-icon {
    display: none;
  }

  svg:first-child,
  wui-image,
  wui-icon {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translateY(-50%) translateX(-50%);
    background-color: ${({tokens:e})=>e.theme.backgroundPrimary};
    box-shadow: inset 0 0 0 4px ${({tokens:e})=>e.theme.backgroundPrimary};
    border-radius: ${({borderRadius:e})=>e[6]};
  }

  wui-image {
    width: 25%;
    height: 25%;
    border-radius: ${({borderRadius:e})=>e[2]};
  }

  wui-icon {
    width: 100%;
    height: 100%;
    color: #3396ff !important;
    transform: translateY(-50%) translateX(-50%) scale(0.25);
  }

  wui-icon > svg {
    width: inherit;
    height: inherit;
  }
`;var fe=function(e,t,i,r){var o=arguments.length,n=o<3?t:r===null?r=Object.getOwnPropertyDescriptor(t,i):r,s;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")n=Reflect.decorate(e,t,i,r);else for(var a=e.length-1;a>=0;a--)(s=e[a])&&(n=(o<3?s(n):o>3?s(t,i,n):s(t,i))||n);return o>3&&n&&Object.defineProperty(t,i,n),n};let X=class extends R{constructor(){super(...arguments),this.uri="",this.size=0,this.theme="dark",this.imageSrc=void 0,this.alt=void 0,this.arenaClear=void 0,this.farcaster=void 0}render(){return this.dataset.theme=this.theme,this.dataset.clear=String(this.arenaClear),this.style.cssText=`--local-size: ${this.size}px`,c`<wui-flex
      alignItems="center"
      justifyContent="center"
      class="wui-qr-code"
      direction="column"
      gap="4"
      width="100%"
      style="height: 100%"
    >
      ${this.templateVisual()} ${this.templateSvg()}
    </wui-flex>`}templateSvg(){return Ne`
      <svg height=${this.size} width=${this.size}>
        ${so.generate({uri:this.uri,size:this.size,logoSize:this.arenaClear?0:this.size/4})}
      </svg>
    `}templateVisual(){return this.imageSrc?c`<wui-image src=${this.imageSrc} alt=${this.alt??"logo"}></wui-image>`:this.farcaster?c`<wui-icon
        class="farcaster"
        size="inherit"
        color="inherit"
        name="farcaster"
      ></wui-icon>`:c`<wui-icon size="inherit" color="inherit" name="walletConnect"></wui-icon>`}};X.styles=[k,ao];fe([d()],X.prototype,"uri",void 0);fe([d({type:Number})],X.prototype,"size",void 0);fe([d()],X.prototype,"theme",void 0);fe([d()],X.prototype,"imageSrc",void 0);fe([d()],X.prototype,"alt",void 0);fe([d({type:Boolean})],X.prototype,"arenaClear",void 0);fe([d({type:Boolean})],X.prototype,"farcaster",void 0);X=fe([_("wui-qr-code")],X);const lo=L`
  :host {
    display: block;
    background: linear-gradient(
      90deg,
      ${({tokens:e})=>e.theme.foregroundSecondary} 0%,
      ${({tokens:e})=>e.theme.foregroundTertiary} 50%,
      ${({tokens:e})=>e.theme.foregroundSecondary} 100%
    );
    background-size: 200% 100%;
    animation: shimmer 1s ease-in-out infinite;
    border-radius: ${({borderRadius:e})=>e[2]};
  }

  :host([data-rounded='true']) {
    border-radius: ${({borderRadius:e})=>e[16]};
  }

  @keyframes shimmer {
    0% {
      background-position: 200% 0;
    }
    100% {
      background-position: -200% 0;
    }
  }
`;var et=function(e,t,i,r){var o=arguments.length,n=o<3?t:r===null?r=Object.getOwnPropertyDescriptor(t,i):r,s;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")n=Reflect.decorate(e,t,i,r);else for(var a=e.length-1;a>=0;a--)(s=e[a])&&(n=(o<3?s(n):o>3?s(t,i,n):s(t,i))||n);return o>3&&n&&Object.defineProperty(t,i,n),n};let ye=class extends R{constructor(){super(...arguments),this.width="",this.height="",this.variant="default",this.rounded=!1}render(){return this.style.cssText=`
      width: ${this.width};
      height: ${this.height};
    `,this.dataset.rounded=this.rounded?"true":"false",c`<slot></slot>`}};ye.styles=[lo];et([d()],ye.prototype,"width",void 0);et([d()],ye.prototype,"height",void 0);et([d()],ye.prototype,"variant",void 0);et([d({type:Boolean})],ye.prototype,"rounded",void 0);ye=et([_("wui-shimmer")],ye);const co=L`
  wui-shimmer {
    width: 100%;
    aspect-ratio: 1 / 1;
    border-radius: ${({borderRadius:e})=>e[4]};
  }

  wui-qr-code {
    opacity: 0;
    animation-duration: ${({durations:e})=>e.xl};
    animation-timing-function: ${({easings:e})=>e["ease-out-power-2"]};
    animation-name: fade-in;
    animation-fill-mode: forwards;
  }

  @keyframes fade-in {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
`;var uo=function(e,t,i,r){var o=arguments.length,n=o<3?t:r===null?r=Object.getOwnPropertyDescriptor(t,i):r,s;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")n=Reflect.decorate(e,t,i,r);else for(var a=e.length-1;a>=0;a--)(s=e[a])&&(n=(o<3?s(n):o>3?s(t,i,n):s(t,i))||n);return o>3&&n&&Object.defineProperty(t,i,n),n};let qt=class extends N{constructor(){var t,i;super(),this.forceUpdate=()=>{this.requestUpdate()},window.addEventListener("resize",this.forceUpdate),Y.sendEvent({type:"track",event:"SELECT_WALLET",properties:{name:((t=this.wallet)==null?void 0:t.name)??"WalletConnect",platform:"qrcode",displayIndex:(i=this.wallet)==null?void 0:i.display_index}})}disconnectedCallback(){var t;super.disconnectedCallback(),(t=this.unsubscribe)==null||t.forEach(i=>i()),window.removeEventListener("resize",this.forceUpdate)}render(){return this.onRenderProxy(),c`
      <wui-flex
        flexDirection="column"
        alignItems="center"
        .padding=${["0","5","5","5"]}
        gap="5"
      >
        <wui-shimmer width="100%"> ${this.qrCodeTemplate()} </wui-shimmer>
        <wui-text variant="lg-medium" color="primary"> Scan this QR Code with your phone </wui-text>
        ${this.copyTemplate()}
      </wui-flex>
      <w3m-mobile-download-links .wallet=${this.wallet}></w3m-mobile-download-links>
    `}onRenderProxy(){!this.ready&&this.uri&&(this.timeout=setTimeout(()=>{this.ready=!0},200))}qrCodeTemplate(){if(!this.uri||!this.ready)return null;const t=this.getBoundingClientRect().width-40,i=this.wallet?this.wallet.name:void 0;return E.setWcLinking(void 0),E.setRecentWallet(this.wallet),c` <wui-qr-code
      size=${t}
      theme=${Ut.state.themeMode}
      uri=${this.uri}
      imageSrc=${C(D.getWalletImage(this.wallet))}
      color=${C(Ut.state.themeVariables["--w3m-qr-color"])}
      alt=${C(i)}
      data-testid="wui-qr-code"
    ></wui-qr-code>`}copyTemplate(){const t=!this.uri||!this.ready;return c`<wui-button
      .disabled=${t}
      @click=${this.onCopyUri}
      variant="neutral-secondary"
      size="sm"
      data-testid="copy-wc2-uri"
    >
      Copy link
      <wui-icon size="sm" color="inherit" name="copy" slot="iconRight"></wui-icon>
    </wui-button>`}};qt.styles=co;qt=uo([_("w3m-connecting-wc-qrcode")],qt);var ho=function(e,t,i,r){var o=arguments.length,n=o<3?t:r===null?r=Object.getOwnPropertyDescriptor(t,i):r,s;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")n=Reflect.decorate(e,t,i,r);else for(var a=e.length-1;a>=0;a--)(s=e[a])&&(n=(o<3?s(n):o>3?s(t,i,n):s(t,i))||n);return o>3&&n&&Object.defineProperty(t,i,n),n};let wn=class extends R{constructor(){var t,i;if(super(),this.wallet=(t=B.state.data)==null?void 0:t.wallet,!this.wallet)throw new Error("w3m-connecting-wc-unsupported: No wallet provided");Y.sendEvent({type:"track",event:"SELECT_WALLET",properties:{name:this.wallet.name,platform:"browser",displayIndex:(i=this.wallet)==null?void 0:i.display_index}})}render(){return c`
      <wui-flex
        flexDirection="column"
        alignItems="center"
        .padding=${["10","5","5","5"]}
        gap="5"
      >
        <wui-wallet-image
          size="lg"
          imageSrc=${C(D.getWalletImage(this.wallet))}
        ></wui-wallet-image>

        <wui-text variant="md-regular" color="primary">Not Detected</wui-text>
      </wui-flex>

      <w3m-mobile-download-links .wallet=${this.wallet}></w3m-mobile-download-links>
    `}};wn=ho([_("w3m-connecting-wc-unsupported")],wn);var Fn=function(e,t,i,r){var o=arguments.length,n=o<3?t:r===null?r=Object.getOwnPropertyDescriptor(t,i):r,s;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")n=Reflect.decorate(e,t,i,r);else for(var a=e.length-1;a>=0;a--)(s=e[a])&&(n=(o<3?s(n):o>3?s(t,i,n):s(t,i))||n);return o>3&&n&&Object.defineProperty(t,i,n),n};let Gt=class extends N{constructor(){var t;if(super(),this.isLoading=!0,!this.wallet)throw new Error("w3m-connecting-wc-web: No wallet provided");this.onConnect=this.onConnectProxy.bind(this),this.secondaryBtnLabel="Open",this.secondaryLabel=xn.CONNECT_LABELS.MOBILE,this.secondaryBtnIcon="externalLink",this.updateLoadingState(),this.unsubscribe.push(E.subscribeKey("wcUri",()=>{this.updateLoadingState()})),Y.sendEvent({type:"track",event:"SELECT_WALLET",properties:{name:this.wallet.name,platform:"web",displayIndex:(t=this.wallet)==null?void 0:t.display_index}})}updateLoadingState(){this.isLoading=!this.uri}onConnectProxy(){var t;if((t=this.wallet)!=null&&t.webapp_link&&this.uri)try{this.error=!1;const{webapp_link:i,name:r}=this.wallet,{redirect:o,href:n}=I.formatUniversalUrl(i,this.uri);E.setWcLinking({name:r,href:n}),E.setRecentWallet(this.wallet),I.openHref(o,"_blank")}catch{this.error=!0}}};Fn([$()],Gt.prototype,"isLoading",void 0);Gt=Fn([_("w3m-connecting-wc-web")],Gt);var Le=function(e,t,i,r){var o=arguments.length,n=o<3?t:r===null?r=Object.getOwnPropertyDescriptor(t,i):r,s;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")n=Reflect.decorate(e,t,i,r);else for(var a=e.length-1;a>=0;a--)(s=e[a])&&(n=(o<3?s(n):o>3?s(t,i,n):s(t,i))||n);return o>3&&n&&Object.defineProperty(t,i,n),n};let $e=class extends R{constructor(){var t;super(),this.wallet=(t=B.state.data)==null?void 0:t.wallet,this.unsubscribe=[],this.platform=void 0,this.platforms=[],this.isSiwxEnabled=!!j.state.siwx,this.remoteFeatures=j.state.remoteFeatures,this.displayBranding=!0,this.determinePlatforms(),this.initializeConnection(),this.unsubscribe.push(j.subscribeKey("remoteFeatures",i=>this.remoteFeatures=i))}disconnectedCallback(){this.unsubscribe.forEach(t=>t())}render(){return c`
      ${this.headerTemplate()}
      <div>${this.platformTemplate()}</div>
      ${this.reownBrandingTemplate()}
    `}reownBrandingTemplate(){var t;return!((t=this.remoteFeatures)!=null&&t.reownBranding)||!this.displayBranding?null:c`<wui-ux-by-reown></wui-ux-by-reown>`}async initializeConnection(t=!1){var i,r;if(!(this.platform==="browser"||j.state.manualWCControl&&!t))try{const{wcPairingExpiry:o,status:n}=E.state;if(t||j.state.enableEmbedded||I.isPairingExpired(o)||n==="connecting"){const s=E.getConnections(oe.state.activeChain),a=(i=this.remoteFeatures)==null?void 0:i.multiWallet,l=s.length>0;await E.connectWalletConnect({cache:"never"}),this.isSiwxEnabled||(l&&a?(B.replace("ProfileWallets"),Me.showSuccess("New Wallet Added")):vn.close())}}catch(o){if(o instanceof Error&&o.message.includes("An error occurred when attempting to switch chain")&&!j.state.enableNetworkSwitch&&oe.state.activeChain){oe.setActiveCaipNetwork(Gn.getUnsupportedNetwork(`${oe.state.activeChain}:${(r=oe.state.activeCaipNetwork)==null?void 0:r.id}`)),oe.showUnsupportedChainUI();return}Y.sendEvent({type:"track",event:"CONNECT_ERROR",properties:{message:(o==null?void 0:o.message)??"Unknown"}}),E.setWcError(!0),Me.showError(o.message??"Connection error"),E.resetWcConnection(),B.goBack()}}determinePlatforms(){if(!this.wallet){this.platforms.push("qrcode"),this.platform="qrcode";return}if(this.platform)return;const{mobile_link:t,desktop_link:i,webapp_link:r,injected:o,rdns:n}=this.wallet,s=o==null?void 0:o.map(({injected_id:v})=>v).filter(Boolean),a=[...n?[n]:s??[]],l=j.state.isUniversalProvider?!1:a.length,h=t,u=r,T=E.checkInstalled(a),g=l&&T,y=i&&!I.isMobile();g&&!oe.state.noAdapters&&this.platforms.push("browser"),h&&this.platforms.push(I.isMobile()?"mobile":"qrcode"),u&&this.platforms.push("web"),y&&this.platforms.push("desktop"),!g&&l&&!oe.state.noAdapters&&this.platforms.push("unsupported"),this.platform=this.platforms[0]}platformTemplate(){switch(this.platform){case"browser":return c`<w3m-connecting-wc-browser></w3m-connecting-wc-browser>`;case"web":return c`<w3m-connecting-wc-web></w3m-connecting-wc-web>`;case"desktop":return c`
          <w3m-connecting-wc-desktop .onRetry=${()=>this.initializeConnection(!0)}>
          </w3m-connecting-wc-desktop>
        `;case"mobile":return c`
          <w3m-connecting-wc-mobile isMobile .onRetry=${()=>this.initializeConnection(!0)}>
          </w3m-connecting-wc-mobile>
        `;case"qrcode":return c`<w3m-connecting-wc-qrcode></w3m-connecting-wc-qrcode>`;default:return c`<w3m-connecting-wc-unsupported></w3m-connecting-wc-unsupported>`}}headerTemplate(){return this.platforms.length>1?c`
      <w3m-connecting-header
        .platforms=${this.platforms}
        .onSelectPlatfrom=${this.onSelectPlatform.bind(this)}
      >
      </w3m-connecting-header>
    `:null}async onSelectPlatform(t){var r;const i=(r=this.shadowRoot)==null?void 0:r.querySelector("div");i&&(await i.animate([{opacity:1},{opacity:0}],{duration:200,fill:"forwards",easing:"ease"}).finished,this.platform=t,i.animate([{opacity:0},{opacity:1}],{duration:200,fill:"forwards",easing:"ease"}))}};Le([$()],$e.prototype,"platform",void 0);Le([$()],$e.prototype,"platforms",void 0);Le([$()],$e.prototype,"isSiwxEnabled",void 0);Le([$()],$e.prototype,"remoteFeatures",void 0);Le([d({type:Boolean})],$e.prototype,"displayBranding",void 0);$e=Le([_("w3m-connecting-wc-view")],$e);var rn=function(e,t,i,r){var o=arguments.length,n=o<3?t:r===null?r=Object.getOwnPropertyDescriptor(t,i):r,s;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")n=Reflect.decorate(e,t,i,r);else for(var a=e.length-1;a>=0;a--)(s=e[a])&&(n=(o<3?s(n):o>3?s(t,i,n):s(t,i))||n);return o>3&&n&&Object.defineProperty(t,i,n),n};let ft=class extends R{constructor(){super(),this.unsubscribe=[],this.isMobile=I.isMobile(),this.remoteFeatures=j.state.remoteFeatures,this.unsubscribe.push(j.subscribeKey("remoteFeatures",t=>this.remoteFeatures=t))}disconnectedCallback(){this.unsubscribe.forEach(t=>t())}render(){if(this.isMobile){const{featured:t,recommended:i}=S.state,{customWallets:r}=j.state,o=yt.getRecentWallets(),n=t.length||i.length||(r==null?void 0:r.length)||o.length;return c`<wui-flex flexDirection="column" gap="2" .margin=${["1","3","3","3"]}>
        ${n?c`<w3m-connector-list></w3m-connector-list>`:null}
        <w3m-all-wallets-widget></w3m-all-wallets-widget>
      </wui-flex>`}return c`<wui-flex flexDirection="column" .padding=${["0","0","4","0"]}>
        <w3m-connecting-wc-view .displayBranding=${!1}></w3m-connecting-wc-view>
        <wui-flex flexDirection="column" .padding=${["0","3","0","3"]}>
          <w3m-all-wallets-widget></w3m-all-wallets-widget>
        </wui-flex>
      </wui-flex>
      ${this.reownBrandingTemplate()} `}reownBrandingTemplate(){var t;return(t=this.remoteFeatures)!=null&&t.reownBranding?c` <wui-flex flexDirection="column" .padding=${["1","0","1","0"]}>
      <wui-ux-by-reown></wui-ux-by-reown>
    </wui-flex>`:null}};rn([$()],ft.prototype,"isMobile",void 0);rn([$()],ft.prototype,"remoteFeatures",void 0);ft=rn([_("w3m-connecting-wc-basic-view")],ft);/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const fo=e=>e.strings===void 0;/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const ze=(e,t)=>{var r;const i=e._$AN;if(i===void 0)return!1;for(const o of i)(r=o._$AO)==null||r.call(o,t,!1),ze(o,t);return!0},pt=e=>{let t,i;do{if((t=e._$AM)===void 0)break;i=t._$AN,i.delete(e),e=t}while((i==null?void 0:i.size)===0)},Vn=e=>{for(let t;t=e._$AM;e=t){let i=t._$AN;if(i===void 0)t._$AN=i=new Set;else if(i.has(e))break;i.add(e),mo(t)}};function po(e){this._$AN!==void 0?(pt(this),this._$AM=e,Vn(this)):this._$AM=e}function go(e,t=!1,i=0){const r=this._$AH,o=this._$AN;if(o!==void 0&&o.size!==0)if(t)if(Array.isArray(r))for(let n=i;n<r.length;n++)ze(r[n],!1),pt(r[n]);else r!=null&&(ze(r,!1),pt(r));else ze(this,e)}const mo=e=>{e.type==Jn.CHILD&&(e._$AP??(e._$AP=go),e._$AQ??(e._$AQ=po))};class wo extends Yn{constructor(){super(...arguments),this._$AN=void 0}_$AT(t,i,r){super._$AT(t,i,r),Vn(this),this.isConnected=t._$AU}_$AO(t,i=!0){var r,o;t!==this.isConnected&&(this.isConnected=t,t?(r=this.reconnected)==null||r.call(this):(o=this.disconnected)==null||o.call(this)),i&&(ze(this,t),pt(this))}setValue(t){if(fo(this._$Ct))this._$Ct._$AI(t,this);else{const i=[...this._$Ct._$AH];i[this._$Ci]=t,this._$Ct._$AI(i,this,0)}}disconnected(){}reconnected(){}}/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const sn=()=>new bo;class bo{}const Mt=new WeakMap,an=Qn(class extends wo{render(e){return dn}update(e,[t]){var r;const i=t!==this.G;return i&&this.G!==void 0&&this.rt(void 0),(i||this.lt!==this.ct)&&(this.G=t,this.ht=(r=e.options)==null?void 0:r.host,this.rt(this.ct=e.element)),dn}rt(e){if(this.isConnected||(e=void 0),typeof this.G=="function"){const t=this.ht??globalThis;let i=Mt.get(t);i===void 0&&(i=new WeakMap,Mt.set(t,i)),i.get(this.G)!==void 0&&this.G.call(this.ht,void 0),i.set(this.G,e),e!==void 0&&this.G.call(this.ht,e)}else this.G.value=e}get lt(){var e,t;return typeof this.G=="function"?(e=Mt.get(this.ht??globalThis))==null?void 0:e.get(this.G):(t=this.G)==null?void 0:t.value}disconnected(){this.lt===this.ct&&this.rt(void 0)}reconnected(){this.rt(this.ct)}}),yo=L`
  :host {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  label {
    position: relative;
    display: inline-block;
    user-select: none;
    transition:
      background-color ${({durations:e})=>e.lg}
        ${({easings:e})=>e["ease-out-power-2"]},
      color ${({durations:e})=>e.lg} ${({easings:e})=>e["ease-out-power-2"]},
      border ${({durations:e})=>e.lg} ${({easings:e})=>e["ease-out-power-2"]},
      box-shadow ${({durations:e})=>e.lg}
        ${({easings:e})=>e["ease-out-power-2"]},
      width ${({durations:e})=>e.lg} ${({easings:e})=>e["ease-out-power-2"]},
      height ${({durations:e})=>e.lg} ${({easings:e})=>e["ease-out-power-2"]},
      transform ${({durations:e})=>e.lg}
        ${({easings:e})=>e["ease-out-power-2"]},
      opacity ${({durations:e})=>e.lg} ${({easings:e})=>e["ease-out-power-2"]};
    will-change: background-color, color, border, box-shadow, width, height, transform, opacity;
  }

  input {
    width: 0;
    height: 0;
    opacity: 0;
  }

  span {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: ${({colors:e})=>e.neutrals300};
    border-radius: ${({borderRadius:e})=>e.round};
    border: 1px solid transparent;
    will-change: border;
    transition:
      background-color ${({durations:e})=>e.lg}
        ${({easings:e})=>e["ease-out-power-2"]},
      color ${({durations:e})=>e.lg} ${({easings:e})=>e["ease-out-power-2"]},
      border ${({durations:e})=>e.lg} ${({easings:e})=>e["ease-out-power-2"]},
      box-shadow ${({durations:e})=>e.lg}
        ${({easings:e})=>e["ease-out-power-2"]},
      width ${({durations:e})=>e.lg} ${({easings:e})=>e["ease-out-power-2"]},
      height ${({durations:e})=>e.lg} ${({easings:e})=>e["ease-out-power-2"]},
      transform ${({durations:e})=>e.lg}
        ${({easings:e})=>e["ease-out-power-2"]},
      opacity ${({durations:e})=>e.lg} ${({easings:e})=>e["ease-out-power-2"]};
    will-change: background-color, color, border, box-shadow, width, height, transform, opacity;
  }

  span:before {
    content: '';
    position: absolute;
    background-color: ${({colors:e})=>e.white};
    border-radius: 50%;
  }

  /* -- Sizes --------------------------------------------------------- */
  label[data-size='lg'] {
    width: 48px;
    height: 32px;
  }

  label[data-size='md'] {
    width: 40px;
    height: 28px;
  }

  label[data-size='sm'] {
    width: 32px;
    height: 22px;
  }

  label[data-size='lg'] > span:before {
    height: 24px;
    width: 24px;
    left: 4px;
    top: 3px;
  }

  label[data-size='md'] > span:before {
    height: 20px;
    width: 20px;
    left: 4px;
    top: 3px;
  }

  label[data-size='sm'] > span:before {
    height: 16px;
    width: 16px;
    left: 3px;
    top: 2px;
  }

  /* -- Focus states --------------------------------------------------- */
  input:focus-visible:not(:checked) + span,
  input:focus:not(:checked) + span {
    border: 1px solid ${({tokens:e})=>e.core.iconAccentPrimary};
    background-color: ${({tokens:e})=>e.theme.textTertiary};
    box-shadow: 0px 0px 0px 4px rgba(9, 136, 240, 0.2);
  }

  input:focus-visible:checked + span,
  input:focus:checked + span {
    border: 1px solid ${({tokens:e})=>e.core.iconAccentPrimary};
    box-shadow: 0px 0px 0px 4px rgba(9, 136, 240, 0.2);
  }

  /* -- Checked states --------------------------------------------------- */
  input:checked + span {
    background-color: ${({tokens:e})=>e.core.iconAccentPrimary};
  }

  label[data-size='lg'] > input:checked + span:before {
    transform: translateX(calc(100% - 9px));
  }

  label[data-size='md'] > input:checked + span:before {
    transform: translateX(calc(100% - 9px));
  }

  label[data-size='sm'] > input:checked + span:before {
    transform: translateX(calc(100% - 7px));
  }

  /* -- Hover states ------------------------------------------------------- */
  label:hover > input:not(:checked):not(:disabled) + span {
    background-color: ${({colors:e})=>e.neutrals400};
  }

  label:hover > input:checked:not(:disabled) + span {
    background-color: ${({colors:e})=>e.accent080};
  }

  /* -- Disabled state --------------------------------------------------- */
  label:has(input:disabled) {
    pointer-events: none;
    user-select: none;
  }

  input:not(:checked):disabled + span {
    background-color: ${({colors:e})=>e.neutrals700};
  }

  input:checked:disabled + span {
    background-color: ${({colors:e})=>e.neutrals700};
  }

  input:not(:checked):disabled + span::before {
    background-color: ${({colors:e})=>e.neutrals400};
  }

  input:checked:disabled + span::before {
    background-color: ${({tokens:e})=>e.theme.textTertiary};
  }
`;var At=function(e,t,i,r){var o=arguments.length,n=o<3?t:r===null?r=Object.getOwnPropertyDescriptor(t,i):r,s;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")n=Reflect.decorate(e,t,i,r);else for(var a=e.length-1;a>=0;a--)(s=e[a])&&(n=(o<3?s(n):o>3?s(t,i,n):s(t,i))||n);return o>3&&n&&Object.defineProperty(t,i,n),n};let Te=class extends R{constructor(){super(...arguments),this.inputElementRef=sn(),this.checked=!1,this.disabled=!1,this.size="md"}render(){return c`
      <label data-size=${this.size}>
        <input
          ${an(this.inputElementRef)}
          type="checkbox"
          ?checked=${this.checked}
          ?disabled=${this.disabled}
          @change=${this.dispatchChangeEvent.bind(this)}
        />
        <span></span>
      </label>
    `}dispatchChangeEvent(){var t;this.dispatchEvent(new CustomEvent("switchChange",{detail:(t=this.inputElementRef.value)==null?void 0:t.checked,bubbles:!0,composed:!0}))}};Te.styles=[k,Z,yo];At([d({type:Boolean})],Te.prototype,"checked",void 0);At([d({type:Boolean})],Te.prototype,"disabled",void 0);At([d()],Te.prototype,"size",void 0);Te=At([_("wui-toggle")],Te);const $o=L`
  :host {
    height: auto;
  }

  :host > wui-flex {
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    column-gap: ${({spacing:e})=>e[2]};
    padding: ${({spacing:e})=>e[2]} ${({spacing:e})=>e[3]};
    background-color: ${({tokens:e})=>e.theme.foregroundPrimary};
    border-radius: ${({borderRadius:e})=>e[4]};
    box-shadow: inset 0 0 0 1px ${({tokens:e})=>e.theme.foregroundPrimary};
    transition: background-color ${({durations:e})=>e.lg}
      ${({easings:e})=>e["ease-out-power-2"]};
    will-change: background-color;
    cursor: pointer;
  }

  wui-switch {
    pointer-events: none;
  }
`;var Hn=function(e,t,i,r){var o=arguments.length,n=o<3?t:r===null?r=Object.getOwnPropertyDescriptor(t,i):r,s;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")n=Reflect.decorate(e,t,i,r);else for(var a=e.length-1;a>=0;a--)(s=e[a])&&(n=(o<3?s(n):o>3?s(t,i,n):s(t,i))||n);return o>3&&n&&Object.defineProperty(t,i,n),n};let gt=class extends R{constructor(){super(...arguments),this.checked=!1}render(){return c`
      <wui-flex>
        <wui-icon size="xl" name="walletConnectBrown"></wui-icon>
        <wui-toggle
          ?checked=${this.checked}
          size="sm"
          @switchChange=${this.handleToggleChange.bind(this)}
        ></wui-toggle>
      </wui-flex>
    `}handleToggleChange(t){t.stopPropagation(),this.checked=t.detail,this.dispatchSwitchEvent()}dispatchSwitchEvent(){this.dispatchEvent(new CustomEvent("certifiedSwitchChange",{detail:this.checked,bubbles:!0,composed:!0}))}};gt.styles=[k,Z,$o];Hn([d({type:Boolean})],gt.prototype,"checked",void 0);gt=Hn([_("wui-certified-switch")],gt);const vo=L`
  :host {
    position: relative;
    width: 100%;
    display: inline-flex;
    flex-direction: column;
    gap: ${({spacing:e})=>e[3]};
    color: ${({tokens:e})=>e.theme.textPrimary};
    caret-color: ${({tokens:e})=>e.core.textAccentPrimary};
  }

  .wui-input-text-container {
    position: relative;
    display: flex;
  }

  input {
    width: 100%;
    border-radius: ${({borderRadius:e})=>e[4]};
    color: inherit;
    background: transparent;
    border: 1px solid ${({tokens:e})=>e.theme.borderPrimary};
    caret-color: ${({tokens:e})=>e.core.textAccentPrimary};
    padding: ${({spacing:e})=>e[3]} ${({spacing:e})=>e[3]}
      ${({spacing:e})=>e[3]} ${({spacing:e})=>e[10]};
    font-size: ${({textSize:e})=>e.large};
    line-height: ${({typography:e})=>e["lg-regular"].lineHeight};
    letter-spacing: ${({typography:e})=>e["lg-regular"].letterSpacing};
    font-weight: ${({fontWeight:e})=>e.regular};
    font-family: ${({fontFamily:e})=>e.regular};
  }

  input[data-size='lg'] {
    padding: ${({spacing:e})=>e[4]} ${({spacing:e})=>e[3]}
      ${({spacing:e})=>e[4]} ${({spacing:e})=>e[10]};
  }

  @media (hover: hover) and (pointer: fine) {
    input:hover:enabled {
      border: 1px solid ${({tokens:e})=>e.theme.borderSecondary};
    }
  }

  input:disabled {
    cursor: unset;
    border: 1px solid ${({tokens:e})=>e.theme.borderPrimary};
  }

  input::placeholder {
    color: ${({tokens:e})=>e.theme.textSecondary};
  }

  input:focus:enabled {
    border: 1px solid ${({tokens:e})=>e.theme.borderSecondary};
    background-color: ${({tokens:e})=>e.theme.foregroundPrimary};
    -webkit-box-shadow: 0px 0px 0px 4px ${({tokens:e})=>e.core.foregroundAccent040};
    -moz-box-shadow: 0px 0px 0px 4px ${({tokens:e})=>e.core.foregroundAccent040};
    box-shadow: 0px 0px 0px 4px ${({tokens:e})=>e.core.foregroundAccent040};
  }

  div.wui-input-text-container:has(input:disabled) {
    opacity: 0.5;
  }

  wui-icon.wui-input-text-left-icon {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    pointer-events: none;
    left: ${({spacing:e})=>e[4]};
    color: ${({tokens:e})=>e.theme.iconDefault};
  }

  button.wui-input-text-submit-button {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    right: ${({spacing:e})=>e[3]};
    width: 24px;
    height: 24px;
    border: none;
    background: transparent;
    border-radius: ${({borderRadius:e})=>e[2]};
    color: ${({tokens:e})=>e.core.textAccentPrimary};
  }

  button.wui-input-text-submit-button:disabled {
    opacity: 1;
  }

  button.wui-input-text-submit-button.loading wui-icon {
    animation: spin 1s linear infinite;
  }

  button.wui-input-text-submit-button:hover {
    background: ${({tokens:e})=>e.core.foregroundAccent010};
  }

  input:has(+ .wui-input-text-submit-button) {
    padding-right: ${({spacing:e})=>e[12]};
  }

  input[type='number'] {
    -moz-appearance: textfield;
  }

  input[type='search']::-webkit-search-decoration,
  input[type='search']::-webkit-search-cancel-button,
  input[type='search']::-webkit-search-results-button,
  input[type='search']::-webkit-search-results-decoration {
    -webkit-appearance: none;
  }

  /* -- Keyframes --------------------------------------------------- */
  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
`;var K=function(e,t,i,r){var o=arguments.length,n=o<3?t:r===null?r=Object.getOwnPropertyDescriptor(t,i):r,s;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")n=Reflect.decorate(e,t,i,r);else for(var a=e.length-1;a>=0;a--)(s=e[a])&&(n=(o<3?s(n):o>3?s(t,i,n):s(t,i))||n);return o>3&&n&&Object.defineProperty(t,i,n),n};let M=class extends R{constructor(){super(...arguments),this.inputElementRef=sn(),this.disabled=!1,this.loading=!1,this.placeholder="",this.type="text",this.value="",this.size="md"}render(){return c` <div class="wui-input-text-container">
        ${this.templateLeftIcon()}
        <input
          data-size=${this.size}
          ${an(this.inputElementRef)}
          data-testid="wui-input-text"
          type=${this.type}
          enterkeyhint=${C(this.enterKeyHint)}
          ?disabled=${this.disabled}
          placeholder=${this.placeholder}
          @input=${this.dispatchInputChangeEvent.bind(this)}
          @keydown=${this.onKeyDown}
          .value=${this.value||""}
        />
        ${this.templateSubmitButton()}
        <slot class="wui-input-text-slot"></slot>
      </div>
      ${this.templateError()} ${this.templateWarning()}`}templateLeftIcon(){return this.icon?c`<wui-icon
        class="wui-input-text-left-icon"
        size="md"
        data-size=${this.size}
        color="inherit"
        name=${this.icon}
      ></wui-icon>`:null}templateSubmitButton(){var t;return this.onSubmit?c`<button
        class="wui-input-text-submit-button ${this.loading?"loading":""}"
        @click=${(t=this.onSubmit)==null?void 0:t.bind(this)}
        ?disabled=${this.disabled||this.loading}
      >
        ${this.loading?c`<wui-icon name="spinner" size="md"></wui-icon>`:c`<wui-icon name="chevronRight" size="md"></wui-icon>`}
      </button>`:null}templateError(){return this.errorText?c`<wui-text variant="sm-regular" color="error">${this.errorText}</wui-text>`:null}templateWarning(){return this.warningText?c`<wui-text variant="sm-regular" color="warning">${this.warningText}</wui-text>`:null}dispatchInputChangeEvent(){var t;this.dispatchEvent(new CustomEvent("inputChange",{detail:(t=this.inputElementRef.value)==null?void 0:t.value,bubbles:!0,composed:!0}))}};M.styles=[k,Z,vo];K([d()],M.prototype,"icon",void 0);K([d({type:Boolean})],M.prototype,"disabled",void 0);K([d({type:Boolean})],M.prototype,"loading",void 0);K([d()],M.prototype,"placeholder",void 0);K([d()],M.prototype,"type",void 0);K([d()],M.prototype,"value",void 0);K([d()],M.prototype,"errorText",void 0);K([d()],M.prototype,"warningText",void 0);K([d()],M.prototype,"onSubmit",void 0);K([d()],M.prototype,"size",void 0);K([d({attribute:!1})],M.prototype,"onKeyDown",void 0);M=K([_("wui-input-text")],M);const xo=L`
  :host {
    position: relative;
    display: inline-block;
    width: 100%;
  }

  wui-icon {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    right: ${({spacing:e})=>e[3]};
    color: ${({tokens:e})=>e.theme.iconDefault};
    cursor: pointer;
    padding: ${({spacing:e})=>e[2]};
    background-color: transparent;
    border-radius: ${({borderRadius:e})=>e[4]};
    transition: background-color ${({durations:e})=>e.lg}
      ${({easings:e})=>e["ease-out-power-2"]};
  }

  @media (hover: hover) {
    wui-icon:hover {
      background-color: ${({tokens:e})=>e.theme.foregroundSecondary};
    }
  }
`;var Kn=function(e,t,i,r){var o=arguments.length,n=o<3?t:r===null?r=Object.getOwnPropertyDescriptor(t,i):r,s;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")n=Reflect.decorate(e,t,i,r);else for(var a=e.length-1;a>=0;a--)(s=e[a])&&(n=(o<3?s(n):o>3?s(t,i,n):s(t,i))||n);return o>3&&n&&Object.defineProperty(t,i,n),n};let mt=class extends R{constructor(){super(...arguments),this.inputComponentRef=sn(),this.inputValue=""}render(){return c`
      <wui-input-text
        ${an(this.inputComponentRef)}
        placeholder="Search wallet"
        icon="search"
        type="search"
        enterKeyHint="search"
        size="sm"
        @inputChange=${this.onInputChange}
      >
        ${this.inputValue?c`<wui-icon
              @click=${this.clearValue}
              color="inherit"
              size="sm"
              name="close"
            ></wui-icon>`:null}
      </wui-input-text>
    `}onInputChange(t){this.inputValue=t.detail||""}clearValue(){const t=this.inputComponentRef.value,i=t==null?void 0:t.inputElementRef.value;i&&(i.value="",this.inputValue="",i.focus(),i.dispatchEvent(new Event("input")))}};mt.styles=[k,xo];Kn([d()],mt.prototype,"inputValue",void 0);mt=Kn([_("wui-search-bar")],mt);const Co=Ne`<svg  viewBox="0 0 48 54" fill="none">
  <path
    d="M43.4605 10.7248L28.0485 1.61089C25.5438 0.129705 22.4562 0.129705 19.9515 1.61088L4.53951 10.7248C2.03626 12.2051 0.5 14.9365 0.5 17.886V36.1139C0.5 39.0635 2.03626 41.7949 4.53951 43.2752L19.9515 52.3891C22.4562 53.8703 25.5438 53.8703 28.0485 52.3891L43.4605 43.2752C45.9637 41.7949 47.5 39.0635 47.5 36.114V17.8861C47.5 14.9365 45.9637 12.2051 43.4605 10.7248Z"
  />
</svg>`,_o=L`
  :host {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    height: 104px;
    width: 104px;
    row-gap: ${({spacing:e})=>e[2]};
    background-color: ${({tokens:e})=>e.theme.foregroundPrimary};
    border-radius: ${({borderRadius:e})=>e[5]};
    position: relative;
  }

  wui-shimmer[data-type='network'] {
    border: none;
    -webkit-clip-path: var(--apkt-path-network);
    clip-path: var(--apkt-path-network);
  }

  svg {
    position: absolute;
    width: 48px;
    height: 54px;
    z-index: 1;
  }

  svg > path {
    stroke: ${({tokens:e})=>e.theme.foregroundSecondary};
    stroke-width: 1px;
  }

  @media (max-width: 350px) {
    :host {
      width: 100%;
    }
  }
`;var qn=function(e,t,i,r){var o=arguments.length,n=o<3?t:r===null?r=Object.getOwnPropertyDescriptor(t,i):r,s;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")n=Reflect.decorate(e,t,i,r);else for(var a=e.length-1;a>=0;a--)(s=e[a])&&(n=(o<3?s(n):o>3?s(t,i,n):s(t,i))||n);return o>3&&n&&Object.defineProperty(t,i,n),n};let wt=class extends R{constructor(){super(...arguments),this.type="wallet"}render(){return c`
      ${this.shimmerTemplate()}
      <wui-shimmer width="80px" height="20px"></wui-shimmer>
    `}shimmerTemplate(){return this.type==="network"?c` <wui-shimmer data-type=${this.type} width="48px" height="54px"></wui-shimmer>
        ${Co}`:c`<wui-shimmer width="56px" height="56px"></wui-shimmer>`}};wt.styles=[k,Z,_o];qn([d()],wt.prototype,"type",void 0);wt=qn([_("wui-card-select-loader")],wt);const Eo=Cn`
  :host {
    display: grid;
    width: inherit;
    height: inherit;
  }
`;var q=function(e,t,i,r){var o=arguments.length,n=o<3?t:r===null?r=Object.getOwnPropertyDescriptor(t,i):r,s;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")n=Reflect.decorate(e,t,i,r);else for(var a=e.length-1;a>=0;a--)(s=e[a])&&(n=(o<3?s(n):o>3?s(t,i,n):s(t,i))||n);return o>3&&n&&Object.defineProperty(t,i,n),n};let U=class extends R{render(){return this.style.cssText=`
      grid-template-rows: ${this.gridTemplateRows};
      grid-template-columns: ${this.gridTemplateColumns};
      justify-items: ${this.justifyItems};
      align-items: ${this.alignItems};
      justify-content: ${this.justifyContent};
      align-content: ${this.alignContent};
      column-gap: ${this.columnGap&&`var(--apkt-spacing-${this.columnGap})`};
      row-gap: ${this.rowGap&&`var(--apkt-spacing-${this.rowGap})`};
      gap: ${this.gap&&`var(--apkt-spacing-${this.gap})`};
      padding-top: ${this.padding&&re.getSpacingStyles(this.padding,0)};
      padding-right: ${this.padding&&re.getSpacingStyles(this.padding,1)};
      padding-bottom: ${this.padding&&re.getSpacingStyles(this.padding,2)};
      padding-left: ${this.padding&&re.getSpacingStyles(this.padding,3)};
      margin-top: ${this.margin&&re.getSpacingStyles(this.margin,0)};
      margin-right: ${this.margin&&re.getSpacingStyles(this.margin,1)};
      margin-bottom: ${this.margin&&re.getSpacingStyles(this.margin,2)};
      margin-left: ${this.margin&&re.getSpacingStyles(this.margin,3)};
    `,c`<slot></slot>`}};U.styles=[k,Eo];q([d()],U.prototype,"gridTemplateRows",void 0);q([d()],U.prototype,"gridTemplateColumns",void 0);q([d()],U.prototype,"justifyItems",void 0);q([d()],U.prototype,"alignItems",void 0);q([d()],U.prototype,"justifyContent",void 0);q([d()],U.prototype,"alignContent",void 0);q([d()],U.prototype,"columnGap",void 0);q([d()],U.prototype,"rowGap",void 0);q([d()],U.prototype,"gap",void 0);q([d()],U.prototype,"padding",void 0);q([d()],U.prototype,"margin",void 0);U=q([_("wui-grid")],U);const Io=L`
  button {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    cursor: pointer;
    width: 104px;
    row-gap: ${({spacing:e})=>e[2]};
    padding: ${({spacing:e})=>e[3]} ${({spacing:e})=>e[0]};
    background-color: ${({tokens:e})=>e.theme.foregroundPrimary};
    border-radius: clamp(0px, ${({borderRadius:e})=>e[4]}, 20px);
    transition:
      color ${({durations:e})=>e.lg} ${({easings:e})=>e["ease-out-power-1"]},
      background-color ${({durations:e})=>e.lg}
        ${({easings:e})=>e["ease-out-power-1"]},
      border-radius ${({durations:e})=>e.lg}
        ${({easings:e})=>e["ease-out-power-1"]};
    will-change: background-color, color, border-radius;
    outline: none;
    border: none;
  }

  button > wui-flex > wui-text {
    color: ${({tokens:e})=>e.theme.textPrimary};
    max-width: 86px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    justify-content: center;
  }

  button > wui-flex > wui-text.certified {
    max-width: 66px;
  }

  @media (hover: hover) and (pointer: fine) {
    button:hover:enabled {
      background-color: ${({tokens:e})=>e.theme.foregroundSecondary};
    }
  }

  button:disabled > wui-flex > wui-text {
    color: ${({tokens:e})=>e.core.glass010};
  }

  [data-selected='true'] {
    background-color: ${({colors:e})=>e.accent020};
  }

  @media (hover: hover) and (pointer: fine) {
    [data-selected='true']:hover:enabled {
      background-color: ${({colors:e})=>e.accent010};
    }
  }

  [data-selected='true']:active:enabled {
    background-color: ${({colors:e})=>e.accent010};
  }

  @media (max-width: 350px) {
    button {
      width: 100%;
    }
  }
`;var tt=function(e,t,i,r){var o=arguments.length,n=o<3?t:r===null?r=Object.getOwnPropertyDescriptor(t,i):r,s;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")n=Reflect.decorate(e,t,i,r);else for(var a=e.length-1;a>=0;a--)(s=e[a])&&(n=(o<3?s(n):o>3?s(t,i,n):s(t,i))||n);return o>3&&n&&Object.defineProperty(t,i,n),n};let ve=class extends R{constructor(){super(),this.observer=new IntersectionObserver(()=>{}),this.visible=!1,this.imageSrc=void 0,this.imageLoading=!1,this.wallet=void 0,this.observer=new IntersectionObserver(t=>{t.forEach(i=>{i.isIntersecting?(this.visible=!0,this.fetchImageSrc()):this.visible=!1})},{threshold:.01})}firstUpdated(){this.observer.observe(this)}disconnectedCallback(){this.observer.disconnect()}render(){var i,r;const t=((i=this.wallet)==null?void 0:i.badge_type)==="certified";return c`
      <button>
        ${this.imageTemplate()}
        <wui-flex flexDirection="row" alignItems="center" justifyContent="center" gap="1">
          <wui-text
            variant="md-regular"
            color="inherit"
            class=${C(t?"certified":void 0)}
            >${(r=this.wallet)==null?void 0:r.name}</wui-text
          >
          ${t?c`<wui-icon size="sm" name="walletConnectBrown"></wui-icon>`:null}
        </wui-flex>
      </button>
    `}imageTemplate(){var t,i;return!this.visible&&!this.imageSrc||this.imageLoading?this.shimmerTemplate():c`
      <wui-wallet-image
        size="lg"
        imageSrc=${C(this.imageSrc)}
        name=${(t=this.wallet)==null?void 0:t.name}
        .installed=${(i=this.wallet)==null?void 0:i.installed}
        badgeSize="sm"
      >
      </wui-wallet-image>
    `}shimmerTemplate(){return c`<wui-shimmer width="56px" height="56px"></wui-shimmer>`}async fetchImageSrc(){this.wallet&&(this.imageSrc=D.getWalletImage(this.wallet),!this.imageSrc&&(this.imageLoading=!0,this.imageSrc=await D.fetchWalletImage(this.wallet.image_id),this.imageLoading=!1))}};ve.styles=Io;tt([$()],ve.prototype,"visible",void 0);tt([$()],ve.prototype,"imageSrc",void 0);tt([$()],ve.prototype,"imageLoading",void 0);tt([d()],ve.prototype,"wallet",void 0);ve=tt([_("w3m-all-wallets-list-item")],ve);const Ro=L`
  wui-grid {
    max-height: clamp(360px, 400px, 80vh);
    overflow: scroll;
    scrollbar-width: none;
    grid-auto-rows: min-content;
    grid-template-columns: repeat(auto-fill, 104px);
  }

  @media (max-width: 350px) {
    wui-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  wui-grid[data-scroll='false'] {
    overflow: hidden;
  }

  wui-grid::-webkit-scrollbar {
    display: none;
  }

  w3m-all-wallets-list-item {
    opacity: 0;
    animation-duration: ${({durations:e})=>e.xl};
    animation-timing-function: ${({easings:e})=>e["ease-inout-power-2"]};
    animation-name: fade-in;
    animation-fill-mode: forwards;
  }

  @keyframes fade-in {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  wui-loading-spinner {
    padding-top: ${({spacing:e})=>e[4]};
    padding-bottom: ${({spacing:e})=>e[4]};
    justify-content: center;
    grid-column: 1 / span 4;
  }
`;var Be=function(e,t,i,r){var o=arguments.length,n=o<3?t:r===null?r=Object.getOwnPropertyDescriptor(t,i):r,s;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")n=Reflect.decorate(e,t,i,r);else for(var a=e.length-1;a>=0;a--)(s=e[a])&&(n=(o<3?s(n):o>3?s(t,i,n):s(t,i))||n);return o>3&&n&&Object.defineProperty(t,i,n),n};const bn="local-paginator";let ue=class extends R{constructor(){super(),this.unsubscribe=[],this.paginationObserver=void 0,this.loading=!S.state.wallets.length,this.wallets=S.state.wallets,this.recommended=S.state.recommended,this.featured=S.state.featured,this.filteredWallets=S.state.filteredWallets,this.unsubscribe.push(S.subscribeKey("wallets",t=>this.wallets=t),S.subscribeKey("recommended",t=>this.recommended=t),S.subscribeKey("featured",t=>this.featured=t),S.subscribeKey("filteredWallets",t=>this.filteredWallets=t))}firstUpdated(){this.initialFetch(),this.createPaginationObserver()}disconnectedCallback(){var t;this.unsubscribe.forEach(i=>i()),(t=this.paginationObserver)==null||t.disconnect()}render(){return c`
      <wui-grid
        data-scroll=${!this.loading}
        .padding=${["0","3","3","3"]}
        gap="2"
        justifyContent="space-between"
      >
        ${this.loading?this.shimmerTemplate(16):this.walletsTemplate()}
        ${this.paginationLoaderTemplate()}
      </wui-grid>
    `}async initialFetch(){var i;this.loading=!0;const t=(i=this.shadowRoot)==null?void 0:i.querySelector("wui-grid");t&&(await S.fetchWalletsByPage({page:1}),await t.animate([{opacity:1},{opacity:0}],{duration:200,fill:"forwards",easing:"ease"}).finished,this.loading=!1,t.animate([{opacity:0},{opacity:1}],{duration:200,fill:"forwards",easing:"ease"}))}shimmerTemplate(t,i){return[...Array(t)].map(()=>c`
        <wui-card-select-loader type="wallet" id=${C(i)}></wui-card-select-loader>
      `)}getWallets(){var o;const t=[...this.featured,...this.recommended];((o=this.filteredWallets)==null?void 0:o.length)>0?t.push(...this.filteredWallets):t.push(...this.wallets);const i=I.uniqueBy(t,"id"),r=De.markWalletsAsInstalled(i);return De.markWalletsWithDisplayIndex(r)}walletsTemplate(){return this.getWallets().map(i=>c`
        <w3m-all-wallets-list-item
          data-testid="wallet-search-item-${i.id}"
          @click=${()=>this.onConnectWallet(i)}
          .wallet=${i}
        ></w3m-all-wallets-list-item>
      `)}paginationLoaderTemplate(){const{wallets:t,recommended:i,featured:r,count:o}=S.state,n=window.innerWidth<352?3:4,s=t.length+i.length;let l=Math.ceil(s/n)*n-s+n;return l-=t.length?r.length%n:0,o===0&&r.length>0?null:o===0||[...r,...t,...i].length<o?this.shimmerTemplate(l,bn):null}createPaginationObserver(){var i;const t=(i=this.shadowRoot)==null?void 0:i.querySelector(`#${bn}`);t&&(this.paginationObserver=new IntersectionObserver(([r])=>{if(r!=null&&r.isIntersecting&&!this.loading){const{page:o,count:n,wallets:s}=S.state;s.length<n&&S.fetchWalletsByPage({page:o+1})}}),this.paginationObserver.observe(t))}onConnectWallet(t){A.selectWalletConnector(t)}};ue.styles=Ro;Be([$()],ue.prototype,"loading",void 0);Be([$()],ue.prototype,"wallets",void 0);Be([$()],ue.prototype,"recommended",void 0);Be([$()],ue.prototype,"featured",void 0);Be([$()],ue.prototype,"filteredWallets",void 0);ue=Be([_("w3m-all-wallets-list")],ue);const Wo=Cn`
  wui-grid,
  wui-loading-spinner,
  wui-flex {
    height: 360px;
  }

  wui-grid {
    overflow: scroll;
    scrollbar-width: none;
    grid-auto-rows: min-content;
    grid-template-columns: repeat(auto-fill, 104px);
  }

  wui-grid[data-scroll='false'] {
    overflow: hidden;
  }

  wui-grid::-webkit-scrollbar {
    display: none;
  }

  wui-loading-spinner {
    justify-content: center;
    align-items: center;
  }

  @media (max-width: 350px) {
    wui-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }
`;var Pt=function(e,t,i,r){var o=arguments.length,n=o<3?t:r===null?r=Object.getOwnPropertyDescriptor(t,i):r,s;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")n=Reflect.decorate(e,t,i,r);else for(var a=e.length-1;a>=0;a--)(s=e[a])&&(n=(o<3?s(n):o>3?s(t,i,n):s(t,i))||n);return o>3&&n&&Object.defineProperty(t,i,n),n};let Se=class extends R{constructor(){super(...arguments),this.prevQuery="",this.prevBadge=void 0,this.loading=!0,this.query=""}render(){return this.onSearch(),this.loading?c`<wui-loading-spinner color="accent-primary"></wui-loading-spinner>`:this.walletsTemplate()}async onSearch(){(this.query.trim()!==this.prevQuery.trim()||this.badge!==this.prevBadge)&&(this.prevQuery=this.query,this.prevBadge=this.badge,this.loading=!0,await S.searchWallet({search:this.query,badge:this.badge}),this.loading=!1)}walletsTemplate(){const{search:t}=S.state,i=De.markWalletsAsInstalled(t);return t.length?c`
      <wui-grid
        data-testid="wallet-list"
        .padding=${["0","3","3","3"]}
        rowGap="4"
        columngap="2"
        justifyContent="space-between"
      >
        ${i.map(r=>c`
            <w3m-all-wallets-list-item
              @click=${()=>this.onConnectWallet(r)}
              .wallet=${r}
              data-testid="wallet-search-item-${r.id}"
            ></w3m-all-wallets-list-item>
          `)}
      </wui-grid>
    `:c`
        <wui-flex
          data-testid="no-wallet-found"
          justifyContent="center"
          alignItems="center"
          gap="3"
          flexDirection="column"
        >
          <wui-icon-box size="lg" color="default" icon="wallet"></wui-icon-box>
          <wui-text data-testid="no-wallet-found-text" color="secondary" variant="md-medium">
            No Wallet found
          </wui-text>
        </wui-flex>
      `}onConnectWallet(t){A.selectWalletConnector(t)}};Se.styles=Wo;Pt([$()],Se.prototype,"loading",void 0);Pt([d()],Se.prototype,"query",void 0);Pt([d()],Se.prototype,"badge",void 0);Se=Pt([_("w3m-all-wallets-search")],Se);var ln=function(e,t,i,r){var o=arguments.length,n=o<3?t:r===null?r=Object.getOwnPropertyDescriptor(t,i):r,s;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")n=Reflect.decorate(e,t,i,r);else for(var a=e.length-1;a>=0;a--)(s=e[a])&&(n=(o<3?s(n):o>3?s(t,i,n):s(t,i))||n);return o>3&&n&&Object.defineProperty(t,i,n),n};let bt=class extends R{constructor(){super(...arguments),this.search="",this.badge=void 0,this.onDebouncedSearch=I.debounce(t=>{this.search=t})}render(){const t=this.search.length>=2;return c`
      <wui-flex .padding=${["1","3","3","3"]} gap="2" alignItems="center">
        <wui-search-bar @inputChange=${this.onInputChange.bind(this)}></wui-search-bar>
        <wui-certified-switch
          ?checked=${this.badge==="certified"}
          @certifiedSwitchChange=${this.onCertifiedSwitchChange.bind(this)}
          data-testid="wui-certified-switch"
        ></wui-certified-switch>
        ${this.qrButtonTemplate()}
      </wui-flex>
      ${t||this.badge?c`<w3m-all-wallets-search
            query=${this.search}
            .badge=${this.badge}
          ></w3m-all-wallets-search>`:c`<w3m-all-wallets-list .badge=${this.badge}></w3m-all-wallets-list>`}
    `}onInputChange(t){this.onDebouncedSearch(t.detail)}onCertifiedSwitchChange(t){t.detail?(this.badge="certified",Me.showSvg("Only WalletConnect certified",{icon:"walletConnectBrown",iconColor:"accent-100"})):this.badge=void 0}qrButtonTemplate(){return I.isMobile()?c`
        <wui-icon-box
          size="xl"
          iconSize="xl"
          color="accent-primary"
          icon="qrCode"
          border
          borderColor="wui-accent-glass-010"
          @click=${this.onWalletConnectQr.bind(this)}
        ></wui-icon-box>
      `:null}onWalletConnectQr(){B.push("ConnectingWalletConnect")}};ln([$()],bt.prototype,"search",void 0);ln([$()],bt.prototype,"badge",void 0);bt=ln([_("w3m-all-wallets-view")],bt);const To=L`
  :host {
    width: 100%;
  }

  button {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: ${({spacing:e})=>e[3]};
    width: 100%;
    background-color: ${({tokens:e})=>e.theme.backgroundPrimary};
    border-radius: ${({borderRadius:e})=>e[4]};
    transition:
      background-color ${({durations:e})=>e.lg}
        ${({easings:e})=>e["ease-out-power-2"]},
      scale ${({durations:e})=>e.lg} ${({easings:e})=>e["ease-out-power-2"]};
    will-change: background-color, scale;
  }

  wui-text {
    text-transform: capitalize;
  }

  wui-image {
    color: ${({tokens:e})=>e.theme.textPrimary};
  }

  @media (hover: hover) {
    button:hover:enabled {
      background-color: ${({tokens:e})=>e.theme.foregroundPrimary};
    }
  }

  button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;var te=function(e,t,i,r){var o=arguments.length,n=o<3?t:r===null?r=Object.getOwnPropertyDescriptor(t,i):r,s;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")n=Reflect.decorate(e,t,i,r);else for(var a=e.length-1;a>=0;a--)(s=e[a])&&(n=(o<3?s(n):o>3?s(t,i,n):s(t,i))||n);return o>3&&n&&Object.defineProperty(t,i,n),n};let H=class extends R{constructor(){super(...arguments),this.imageSrc="google",this.loading=!1,this.disabled=!1,this.rightIcon=!0,this.rounded=!1,this.fullSize=!1}render(){return this.dataset.rounded=this.rounded?"true":"false",c`
      <button
        ?disabled=${this.loading?!0:!!this.disabled}
        data-loading=${this.loading}
        tabindex=${C(this.tabIdx)}
      >
        <wui-flex gap="2" alignItems="center">
          ${this.templateLeftIcon()}
          <wui-flex gap="1">
            <slot></slot>
          </wui-flex>
        </wui-flex>
        ${this.templateRightIcon()}
      </button>
    `}templateLeftIcon(){return this.icon?c`<wui-image
        icon=${this.icon}
        iconColor=${C(this.iconColor)}
        ?boxed=${!0}
        ?rounded=${this.rounded}
      ></wui-image>`:c`<wui-image
      ?boxed=${!0}
      ?rounded=${this.rounded}
      ?fullSize=${this.fullSize}
      src=${this.imageSrc}
    ></wui-image>`}templateRightIcon(){return this.rightIcon?this.loading?c`<wui-loading-spinner size="md" color="accent-primary"></wui-loading-spinner>`:c`<wui-icon name="chevronRight" size="lg" color="default"></wui-icon>`:null}};H.styles=[k,Z,To];te([d()],H.prototype,"imageSrc",void 0);te([d()],H.prototype,"icon",void 0);te([d()],H.prototype,"iconColor",void 0);te([d({type:Boolean})],H.prototype,"loading",void 0);te([d()],H.prototype,"tabIdx",void 0);te([d({type:Boolean})],H.prototype,"disabled",void 0);te([d({type:Boolean})],H.prototype,"rightIcon",void 0);te([d({type:Boolean})],H.prototype,"rounded",void 0);te([d({type:Boolean})],H.prototype,"fullSize",void 0);H=te([_("wui-list-item")],H);var So=function(e,t,i,r){var o=arguments.length,n=o<3?t:r===null?r=Object.getOwnPropertyDescriptor(t,i):r,s;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")n=Reflect.decorate(e,t,i,r);else for(var a=e.length-1;a>=0;a--)(s=e[a])&&(n=(o<3?s(n):o>3?s(t,i,n):s(t,i))||n);return o>3&&n&&Object.defineProperty(t,i,n),n};let yn=class extends R{constructor(){var t;super(...arguments),this.wallet=(t=B.state.data)==null?void 0:t.wallet}render(){if(!this.wallet)throw new Error("w3m-downloads-view");return c`
      <wui-flex gap="2" flexDirection="column" .padding=${["3","3","4","3"]}>
        ${this.chromeTemplate()} ${this.iosTemplate()} ${this.androidTemplate()}
        ${this.homepageTemplate()}
      </wui-flex>
    `}chromeTemplate(){var t;return(t=this.wallet)!=null&&t.chrome_store?c`<wui-list-item
      variant="icon"
      icon="chromeStore"
      iconVariant="square"
      @click=${this.onChromeStore.bind(this)}
      chevron
    >
      <wui-text variant="md-medium" color="primary">Chrome Extension</wui-text>
    </wui-list-item>`:null}iosTemplate(){var t;return(t=this.wallet)!=null&&t.app_store?c`<wui-list-item
      variant="icon"
      icon="appStore"
      iconVariant="square"
      @click=${this.onAppStore.bind(this)}
      chevron
    >
      <wui-text variant="md-medium" color="primary">iOS App</wui-text>
    </wui-list-item>`:null}androidTemplate(){var t;return(t=this.wallet)!=null&&t.play_store?c`<wui-list-item
      variant="icon"
      icon="playStore"
      iconVariant="square"
      @click=${this.onPlayStore.bind(this)}
      chevron
    >
      <wui-text variant="md-medium" color="primary">Android App</wui-text>
    </wui-list-item>`:null}homepageTemplate(){var t;return(t=this.wallet)!=null&&t.homepage?c`
      <wui-list-item
        variant="icon"
        icon="browser"
        iconVariant="square-blue"
        @click=${this.onHomePage.bind(this)}
        chevron
      >
        <wui-text variant="md-medium" color="primary">Website</wui-text>
      </wui-list-item>
    `:null}onChromeStore(){var t;(t=this.wallet)!=null&&t.chrome_store&&I.openHref(this.wallet.chrome_store,"_blank")}onAppStore(){var t;(t=this.wallet)!=null&&t.app_store&&I.openHref(this.wallet.app_store,"_blank")}onPlayStore(){var t;(t=this.wallet)!=null&&t.play_store&&I.openHref(this.wallet.play_store,"_blank")}onHomePage(){var t;(t=this.wallet)!=null&&t.homepage&&I.openHref(this.wallet.homepage,"_blank")}};yn=So([_("w3m-downloads-view")],yn);export{bt as W3mAllWalletsView,ft as W3mConnectingWcBasicView,yn as W3mDownloadsView};
