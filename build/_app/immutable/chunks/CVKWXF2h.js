import{n as f,Y as h,t as o,p as g,O as n,s as c}from"./DJTdek4-.js";(function(){try{var e=typeof window<"u"?window:typeof global<"u"?global:typeof globalThis<"u"?globalThis:typeof self<"u"?self:{};e.SENTRY_RELEASE={id:"b1e593ae5130a8a866939fcd32d632e0f276c846"}}catch{}})();try{(function(){var e=typeof window<"u"?window:typeof global<"u"?global:typeof globalThis<"u"?globalThis:typeof self<"u"?self:{},r=new e.Error().stack;r&&(e._sentryDebugIds=e._sentryDebugIds||{},e._sentryDebugIds[r]="82a3e06f-0ec4-4728-99e1-6d78d25633e5",e._sentryDebugIdIdentifier="sentry-dbid-82a3e06f-0ec4-4728-99e1-6d78d25633e5")})()}catch{}var u=Object.defineProperty,y=Object.getOwnPropertyDescriptor,l=(e,r,d,i)=>{for(var a=i>1?void 0:i?y(r,d):r,s=e.length-1,p;s>=0;s--)(p=e[s])&&(a=(i?p(r,d,a):p(a))||a);return i&&a&&u(r,d,a),a};let t=class extends f{constructor(){super(...arguments),this.size="1em",this.weight="regular",this.color="currentColor",this.mirrored=!1}render(){var e;return h`<svg
      xmlns="http://www.w3.org/2000/svg"
      width="${this.size}"
      height="${this.size}"
      fill="${this.color}"
      viewBox="0 0 256 256"
      transform=${this.mirrored?"scale(-1, 1)":null}
    >
      ${t.weightsMap.get((e=this.weight)!=null?e:"regular")}
    </svg>`}};t.weightsMap=new Map([["thin",o`<path d="M226.83,74.83l-128,128a4,4,0,0,1-5.66,0l-56-56a4,4,0,0,1,5.66-5.66L96,194.34,221.17,69.17a4,4,0,1,1,5.66,5.66Z"/>`],["light",o`<path d="M228.24,76.24l-128,128a6,6,0,0,1-8.48,0l-56-56a6,6,0,0,1,8.48-8.48L96,191.51,219.76,67.76a6,6,0,0,1,8.48,8.48Z"/>`],["regular",o`<path d="M229.66,77.66l-128,128a8,8,0,0,1-11.32,0l-56-56a8,8,0,0,1,11.32-11.32L96,188.69,218.34,66.34a8,8,0,0,1,11.32,11.32Z"/>`],["bold",o`<path d="M232.49,80.49l-128,128a12,12,0,0,1-17,0l-56-56a12,12,0,1,1,17-17L96,183,215.51,63.51a12,12,0,0,1,17,17Z"/>`],["fill",o`<path d="M216,40H40A16,16,0,0,0,24,56V200a16,16,0,0,0,16,16H216a16,16,0,0,0,16-16V56A16,16,0,0,0,216,40ZM205.66,85.66l-96,96a8,8,0,0,1-11.32,0l-40-40a8,8,0,0,1,11.32-11.32L104,164.69l90.34-90.35a8,8,0,0,1,11.32,11.32Z"/>`],["duotone",o`<path d="M232,56V200a16,16,0,0,1-16,16H40a16,16,0,0,1-16-16V56A16,16,0,0,1,40,40H216A16,16,0,0,1,232,56Z" opacity="0.2"/><path d="M205.66,85.66l-96,96a8,8,0,0,1-11.32,0l-40-40a8,8,0,0,1,11.32-11.32L104,164.69l90.34-90.35a8,8,0,0,1,11.32,11.32Z"/>`]]);t.styles=g`
    :host {
      display: contents;
    }
  `;l([n({type:String,reflect:!0})],t.prototype,"size",2);l([n({type:String,reflect:!0})],t.prototype,"weight",2);l([n({type:String,reflect:!0})],t.prototype,"color",2);l([n({type:Boolean,reflect:!0})],t.prototype,"mirrored",2);t=l([c("ph-check")],t);export{t as PhCheck};
