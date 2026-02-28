import{n as p,Y as f,t as a,p as g,O as s,s as c}from"./DJTdek4-.js";(function(){try{var e=typeof window<"u"?window:typeof global<"u"?global:typeof globalThis<"u"?globalThis:typeof self<"u"?self:{};e.SENTRY_RELEASE={id:"b1e593ae5130a8a866939fcd32d632e0f276c846"}}catch{}})();try{(function(){var e=typeof window<"u"?window:typeof global<"u"?global:typeof globalThis<"u"?globalThis:typeof self<"u"?self:{},r=new e.Error().stack;r&&(e._sentryDebugIds=e._sentryDebugIds||{},e._sentryDebugIds[r]="e874eb9d-aa94-4347-90c1-5d0842431cc6",e._sentryDebugIdIdentifier="sentry-dbid-e874eb9d-aa94-4347-90c1-5d0842431cc6")})()}catch{}var u=Object.defineProperty,y=Object.getOwnPropertyDescriptor,i=(e,r,n,l)=>{for(var o=l>1?void 0:l?y(r,n):r,d=e.length-1,h;d>=0;d--)(h=e[d])&&(o=(l?h(r,n,o):h(o))||o);return l&&o&&u(r,n,o),o};let t=class extends p{constructor(){super(...arguments),this.size="1em",this.weight="regular",this.color="currentColor",this.mirrored=!1}render(){var e;return f`<svg
      xmlns="http://www.w3.org/2000/svg"
      width="${this.size}"
      height="${this.size}"
      fill="${this.color}"
      viewBox="0 0 256 256"
      transform=${this.mirrored?"scale(-1, 1)":null}
    >
      ${t.weightsMap.get((e=this.weight)!=null?e:"regular")}
    </svg>`}};t.weightsMap=new Map([["thin",a`<path d="M218.83,130.83l-72,72a4,4,0,0,1-5.66-5.66L206.34,132H40a4,4,0,0,1,0-8H206.34L141.17,58.83a4,4,0,0,1,5.66-5.66l72,72A4,4,0,0,1,218.83,130.83Z"/>`],["light",a`<path d="M220.24,132.24l-72,72a6,6,0,0,1-8.48-8.48L201.51,134H40a6,6,0,0,1,0-12H201.51L139.76,60.24a6,6,0,0,1,8.48-8.48l72,72A6,6,0,0,1,220.24,132.24Z"/>`],["regular",a`<path d="M221.66,133.66l-72,72a8,8,0,0,1-11.32-11.32L196.69,136H40a8,8,0,0,1,0-16H196.69L138.34,61.66a8,8,0,0,1,11.32-11.32l72,72A8,8,0,0,1,221.66,133.66Z"/>`],["bold",a`<path d="M224.49,136.49l-72,72a12,12,0,0,1-17-17L187,140H40a12,12,0,0,1,0-24H187L135.51,64.48a12,12,0,0,1,17-17l72,72A12,12,0,0,1,224.49,136.49Z"/>`],["fill",a`<path d="M221.66,133.66l-72,72A8,8,0,0,1,136,200V136H40a8,8,0,0,1,0-16h96V56a8,8,0,0,1,13.66-5.66l72,72A8,8,0,0,1,221.66,133.66Z"/>`],["duotone",a`<path d="M216,128l-72,72V56Z" opacity="0.2"/><path d="M221.66,122.34l-72-72A8,8,0,0,0,136,56v64H40a8,8,0,0,0,0,16h96v64a8,8,0,0,0,13.66,5.66l72-72A8,8,0,0,0,221.66,122.34ZM152,180.69V75.31L204.69,128Z"/>`]]);t.styles=g`
    :host {
      display: contents;
    }
  `;i([s({type:String,reflect:!0})],t.prototype,"size",2);i([s({type:String,reflect:!0})],t.prototype,"weight",2);i([s({type:String,reflect:!0})],t.prototype,"color",2);i([s({type:Boolean,reflect:!0})],t.prototype,"mirrored",2);t=i([c("ph-arrow-right")],t);export{t as PhArrowRight};
