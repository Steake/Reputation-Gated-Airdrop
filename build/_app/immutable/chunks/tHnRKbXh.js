import{n as p,Y as h,t as o,p as g,O as s,s as c}from"./DJTdek4-.js";(function(){try{var e=typeof window<"u"?window:typeof global<"u"?global:typeof globalThis<"u"?globalThis:typeof self<"u"?self:{};e.SENTRY_RELEASE={id:"b1e593ae5130a8a866939fcd32d632e0f276c846"}}catch{}})();try{(function(){var e=typeof window<"u"?window:typeof global<"u"?global:typeof globalThis<"u"?globalThis:typeof self<"u"?self:{},r=new e.Error().stack;r&&(e._sentryDebugIds=e._sentryDebugIds||{},e._sentryDebugIds[r]="f6326fbd-dbe9-4824-aaa2-b21a67b3cced",e._sentryDebugIdIdentifier="sentry-dbid-f6326fbd-dbe9-4824-aaa2-b21a67b3cced")})()}catch{}var u=Object.defineProperty,y=Object.getOwnPropertyDescriptor,l=(e,r,d,i)=>{for(var a=i>1?void 0:i?y(r,d):r,n=e.length-1,f;n>=0;n--)(f=e[n])&&(a=(i?f(r,d,a):f(a))||a);return i&&a&&u(r,d,a),a};let t=class extends p{constructor(){super(...arguments),this.size="1em",this.weight="regular",this.color="currentColor",this.mirrored=!1}render(){var e;return h`<svg
      xmlns="http://www.w3.org/2000/svg"
      width="${this.size}"
      height="${this.size}"
      fill="${this.color}"
      viewBox="0 0 256 256"
      transform=${this.mirrored?"scale(-1, 1)":null}
    >
      ${t.weightsMap.get((e=this.weight)!=null?e:"regular")}
    </svg>`}};t.weightsMap=new Map([["thin",o`<path d="M162.83,205.17a4,4,0,0,1-5.66,5.66l-80-80a4,4,0,0,1,0-5.66l80-80a4,4,0,1,1,5.66,5.66L85.66,128Z"/>`],["light",o`<path d="M164.24,203.76a6,6,0,1,1-8.48,8.48l-80-80a6,6,0,0,1,0-8.48l80-80a6,6,0,0,1,8.48,8.48L88.49,128Z"/>`],["regular",o`<path d="M165.66,202.34a8,8,0,0,1-11.32,11.32l-80-80a8,8,0,0,1,0-11.32l80-80a8,8,0,0,1,11.32,11.32L91.31,128Z"/>`],["bold",o`<path d="M168.49,199.51a12,12,0,0,1-17,17l-80-80a12,12,0,0,1,0-17l80-80a12,12,0,0,1,17,17L97,128Z"/>`],["fill",o`<path d="M168,48V208a8,8,0,0,1-13.66,5.66l-80-80a8,8,0,0,1,0-11.32l80-80A8,8,0,0,1,168,48Z"/>`],["duotone",o`<path d="M160,48V208L80,128Z" opacity="0.2"/><path d="M163.06,40.61a8,8,0,0,0-8.72,1.73l-80,80a8,8,0,0,0,0,11.32l80,80A8,8,0,0,0,168,208V48A8,8,0,0,0,163.06,40.61ZM152,188.69,91.31,128,152,67.31Z"/>`]]);t.styles=g`
    :host {
      display: contents;
    }
  `;l([s({type:String,reflect:!0})],t.prototype,"size",2);l([s({type:String,reflect:!0})],t.prototype,"weight",2);l([s({type:String,reflect:!0})],t.prototype,"color",2);l([s({type:Boolean,reflect:!0})],t.prototype,"mirrored",2);t=l([c("ph-caret-left")],t);export{t as PhCaretLeft};
