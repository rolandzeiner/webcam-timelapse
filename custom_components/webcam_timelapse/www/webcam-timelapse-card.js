/*! Webcam Timelapse Card — bundled by Rolldown. Edit sources in src/, then `npm run build`. */
/**
* @license
* Copyright 2019 Google LLC
* SPDX-License-Identifier: BSD-3-Clause
*/
var e=globalThis,t=e.ShadowRoot&&(e.ShadyCSS===void 0||e.ShadyCSS.nativeShadow)&&`adoptedStyleSheets`in Document.prototype&&`replace`in CSSStyleSheet.prototype,n=Symbol(),r=/* @__PURE__ */ new WeakMap,i=class{constructor(e,t,r){if(this._$cssResult$=!0,r!==n)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=e,this.t=t}get styleSheet(){let e=this.o,n=this.t;if(t&&e===void 0){let t=n!==void 0&&n.length===1;t&&(e=r.get(n)),e===void 0&&((this.o=e=new CSSStyleSheet).replaceSync(this.cssText),t&&r.set(n,e))}return e}toString(){return this.cssText}},a=e=>new i(typeof e==`string`?e:e+``,void 0,n),o=(e,...t)=>new i(e.length===1?e[0]:t.reduce((t,n,r)=>t+(e=>{if(!0===e._$cssResult$)return e.cssText;if(typeof e==`number`)return e;throw Error(`Value passed to 'css' function must be a 'css' function result: `+e+`. Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.`)})(n)+e[r+1],e[0]),e,n),s=(n,r)=>{if(t)n.adoptedStyleSheets=r.map(e=>e instanceof CSSStyleSheet?e:e.styleSheet);else for(let t of r){let r=document.createElement(`style`),i=e.litNonce;i!==void 0&&r.setAttribute(`nonce`,i),r.textContent=t.cssText,n.appendChild(r)}},c=t?e=>e:e=>e instanceof CSSStyleSheet?(e=>{let t=``;for(let n of e.cssRules)t+=n.cssText;return a(t)})(e):e,{is:l,defineProperty:u,getOwnPropertyDescriptor:d,getOwnPropertyNames:f,getOwnPropertySymbols:p,getPrototypeOf:m}=Object,h=globalThis,g=h.trustedTypes,_=g?g.emptyScript:``,v=h.reactiveElementPolyfillSupport,y=(e,t)=>e,b={toAttribute(e,t){
/**
* @license
* Copyright 2017 Google LLC
* SPDX-License-Identifier: BSD-3-Clause
*/
switch(t){case Boolean:e=e?_:null;break;case Object:case Array:e=e==null?e:JSON.stringify(e)}return e},fromAttribute(e,t){let n=e;switch(t){case Boolean:n=e!==null;break;case Number:n=e===null?null:Number(e);break;case Object:case Array:try{n=JSON.parse(e)}catch{n=null}}return n}},x=(e,t)=>!l(e,t),S={attribute:!0,type:String,converter:b,reflect:!1,useDefault:!1,hasChanged:x};Symbol.metadata??=Symbol(`metadata`),h.litPropertyMetadata??=/* @__PURE__ */ new WeakMap;var C=class extends HTMLElement{static addInitializer(e){this._$Ei(),(this.l??=[]).push(e)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(e,t=S){if(t.state&&(t.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(e)&&((t=Object.create(t)).wrapped=!0),this.elementProperties.set(e,t),!t.noAccessor){let n=Symbol(),r=this.getPropertyDescriptor(e,n,t);r!==void 0&&u(this.prototype,e,r)}}static getPropertyDescriptor(e,t,n){let{get:r,set:i}=d(this.prototype,e)??{get(){return this[t]},set(e){this[t]=e}};return{get:r,set(t){let a=r?.call(this);i?.call(this,t),this.requestUpdate(e,a,n)},configurable:!0,enumerable:!0}}static getPropertyOptions(e){return this.elementProperties.get(e)??S}static _$Ei(){if(this.hasOwnProperty(y(`elementProperties`)))return;let e=m(this);e.finalize(),e.l!==void 0&&(this.l=[...e.l]),this.elementProperties=new Map(e.elementProperties)}static finalize(){if(this.hasOwnProperty(y(`finalized`)))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(y(`properties`))){let e=this.properties,t=[...f(e),...p(e)];for(let n of t)this.createProperty(n,e[n])}let e=this[Symbol.metadata];if(e!==null){let t=litPropertyMetadata.get(e);if(t!==void 0)for(let[e,n]of t)this.elementProperties.set(e,n)}this._$Eh=/* @__PURE__ */ new Map;for(let[e,t]of this.elementProperties){let n=this._$Eu(e,t);n!==void 0&&this._$Eh.set(n,e)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(e){let t=[];if(Array.isArray(e)){let n=new Set(e.flat(1/0).reverse());for(let e of n)t.unshift(c(e))}else e!==void 0&&t.push(c(e));return t}static _$Eu(e,t){let n=t.attribute;return!1===n?void 0:typeof n==`string`?n:typeof e==`string`?e.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$ES=new Promise(e=>this.enableUpdating=e),this._$AL=/* @__PURE__ */ new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach(e=>e(this))}addController(e){(this._$EO??=/* @__PURE__ */ new Set).add(e),this.renderRoot!==void 0&&this.isConnected&&e.hostConnected?.()}removeController(e){this._$EO?.delete(e)}_$E_(){let e=/* @__PURE__ */ new Map,t=this.constructor.elementProperties;for(let n of t.keys())this.hasOwnProperty(n)&&(e.set(n,this[n]),delete this[n]);e.size>0&&(this._$Ep=e)}createRenderRoot(){let e=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return s(e,this.constructor.elementStyles),e}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(!0),this._$EO?.forEach(e=>e.hostConnected?.())}enableUpdating(e){}disconnectedCallback(){this._$EO?.forEach(e=>e.hostDisconnected?.())}attributeChangedCallback(e,t,n){this._$AK(e,n)}_$ET(e,t){let n=this.constructor.elementProperties.get(e),r=this.constructor._$Eu(e,n);if(r!==void 0&&!0===n.reflect){let i=(n.converter?.toAttribute===void 0?b:n.converter).toAttribute(t,n.type);this._$Em=e,i==null?this.removeAttribute(r):this.setAttribute(r,i),this._$Em=null}}_$AK(e,t){let n=this.constructor,r=n._$Eh.get(e);if(r!==void 0&&this._$Em!==r){let e=n.getPropertyOptions(r),i=typeof e.converter==`function`?{fromAttribute:e.converter}:e.converter?.fromAttribute===void 0?b:e.converter;this._$Em=r;let a=i.fromAttribute(t,e.type);this[r]=a??this._$Ej?.get(r)??a,this._$Em=null}}requestUpdate(e,t,n,r=!1,i){if(e!==void 0){let a=this.constructor;if(!1===r&&(i=this[e]),n??=a.getPropertyOptions(e),!((n.hasChanged??x)(i,t)||n.useDefault&&n.reflect&&i===this._$Ej?.get(e)&&!this.hasAttribute(a._$Eu(e,n))))return;this.C(e,t,n)}!1===this.isUpdatePending&&(this._$ES=this._$EP())}C(e,t,{useDefault:n,reflect:r,wrapped:i},a){n&&!(this._$Ej??=/* @__PURE__ */ new Map).has(e)&&(this._$Ej.set(e,a??t??this[e]),!0!==i||a!==void 0)||(this._$AL.has(e)||(this.hasUpdated||n||(t=void 0),this._$AL.set(e,t)),!0===r&&this._$Em!==e&&(this._$Eq??=/* @__PURE__ */ new Set).add(e))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(e){Promise.reject(e)}let e=this.scheduleUpdate();return e!=null&&await e,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(let[e,t]of this._$Ep)this[e]=t;this._$Ep=void 0}let e=this.constructor.elementProperties;if(e.size>0)for(let[t,n]of e){let{wrapped:e}=n,r=this[t];!0!==e||this._$AL.has(t)||r===void 0||this.C(t,void 0,n,r)}}let e=!1,t=this._$AL;try{e=this.shouldUpdate(t),e?(this.willUpdate(t),this._$EO?.forEach(e=>e.hostUpdate?.()),this.update(t)):this._$EM()}catch(t){throw e=!1,this._$EM(),t}e&&this._$AE(t)}willUpdate(e){}_$AE(e){this._$EO?.forEach(e=>e.hostUpdated?.()),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(e)),this.updated(e)}_$EM(){this._$AL=/* @__PURE__ */ new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(e){return!0}update(e){this._$Eq&&=this._$Eq.forEach(e=>this._$ET(e,this[e])),this._$EM()}updated(e){}firstUpdated(e){}};C.elementStyles=[],C.shadowRootOptions={mode:`open`},C[y(`elementProperties`)]=/* @__PURE__ */ new Map,C[y(`finalized`)]=/* @__PURE__ */ new Map,v?.({ReactiveElement:C}),(h.reactiveElementVersions??=[]).push(`2.1.2`);
/**
* @license
* Copyright 2017 Google LLC
* SPDX-License-Identifier: BSD-3-Clause
*/
var ee=globalThis,te=e=>e,w=ee.trustedTypes,T=w?w.createPolicy(`lit-html`,{createHTML:e=>e}):void 0,ne=`$lit$`,E=`lit$${Math.random().toFixed(9).slice(2)}$`,re=`?`+E,ie=`<${re}>`,D=document,O=()=>D.createComment(``),k=e=>e===null||typeof e!=`object`&&typeof e!=`function`,ae=Array.isArray,oe=e=>ae(e)||typeof e?.[Symbol.iterator]==`function`,se=`[ 	
\f\r]`,A=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,ce=/-->/g,le=/>/g,j=RegExp(`>|${se}(?:([^\\s"'>=/]+)(${se}*=${se}*(?:[^ \t\n\f\r"'\`<>=]|("|')|))|$)`,`g`),ue=/'/g,de=/"/g,fe=/^(?:script|style|textarea|title)$/i,pe=e=>(t,...n)=>({_$litType$:e,strings:t,values:n}),M=pe(1),me=pe(2),N=Symbol.for(`lit-noChange`),P=Symbol.for(`lit-nothing`),he=/* @__PURE__ */ new WeakMap,F=D.createTreeWalker(D,129);function ge(e,t){if(!ae(e)||!e.hasOwnProperty(`raw`))throw Error(`invalid template strings array`);return T===void 0?t:T.createHTML(t)}var _e=(e,t)=>{let n=e.length-1,r=[],i,a=t===2?`<svg>`:t===3?`<math>`:``,o=A;for(let t=0;t<n;t++){let n=e[t],s,c,l=-1,u=0;for(;u<n.length&&(o.lastIndex=u,c=o.exec(n),c!==null);)u=o.lastIndex,o===A?c[1]===`!--`?o=ce:c[1]===void 0?c[2]===void 0?c[3]!==void 0&&(o=j):(fe.test(c[2])&&(i=RegExp(`</`+c[2],`g`)),o=j):o=le:o===j?c[0]===`>`?(o=i??A,l=-1):c[1]===void 0?l=-2:(l=o.lastIndex-c[2].length,s=c[1],o=c[3]===void 0?j:c[3]===`"`?de:ue):o===de||o===ue?o=j:o===ce||o===le?o=A:(o=j,i=void 0);let d=o===j&&e[t+1].startsWith(`/>`)?` `:``;a+=o===A?n+ie:l>=0?(r.push(s),n.slice(0,l)+ne+n.slice(l)+E+d):n+E+(l===-2?t:d)}return[ge(e,a+(e[n]||`<?>`)+(t===2?`</svg>`:t===3?`</math>`:``)),r]},ve=class e{constructor({strings:t,_$litType$:n},r){let i;this.parts=[];let a=0,o=0,s=t.length-1,c=this.parts,[l,u]=_e(t,n);if(this.el=e.createElement(l,r),F.currentNode=this.el.content,n===2||n===3){let e=this.el.content.firstChild;e.replaceWith(...e.childNodes)}for(;(i=F.nextNode())!==null&&c.length<s;){if(i.nodeType===1){if(i.hasAttributes())for(let e of i.getAttributeNames())if(e.endsWith(ne)){let t=u[o++],n=i.getAttribute(e).split(E),r=/([.?@])?(.*)/.exec(t);c.push({type:1,index:a,name:r[2],strings:n,ctor:r[1]===`.`?xe:r[1]===`?`?Se:r[1]===`@`?Ce:L}),i.removeAttribute(e)}else e.startsWith(E)&&(c.push({type:6,index:a}),i.removeAttribute(e));if(fe.test(i.tagName)){let e=i.textContent.split(E),t=e.length-1;if(t>0){i.textContent=w?w.emptyScript:``;for(let n=0;n<t;n++)i.append(e[n],O()),F.nextNode(),c.push({type:2,index:++a});i.append(e[t],O())}}}else if(i.nodeType===8){if(i.data===re)c.push({type:2,index:a});else{let e=-1;for(;(e=i.data.indexOf(E,e+1))!==-1;)c.push({type:7,index:a}),e+=E.length-1}}a++}}static createElement(e,t){let n=D.createElement(`template`);return n.innerHTML=e,n}};function I(e,t,n=e,r){if(t===N)return t;let i=r===void 0?n._$Cl:n._$Co?.[r],a=k(t)?void 0:t._$litDirective$;return i?.constructor!==a&&(i?._$AO?.(!1),a===void 0?i=void 0:(i=new a(e),i._$AT(e,n,r)),r===void 0?n._$Cl=i:(n._$Co??=[])[r]=i),i!==void 0&&(t=I(e,i._$AS(e,t.values),i,r)),t}var ye=class{constructor(e,t){this._$AV=[],this._$AN=void 0,this._$AD=e,this._$AM=t}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(e){let{el:{content:t},parts:n}=this._$AD,r=(e?.creationScope??D).importNode(t,!0);F.currentNode=r;let i=F.nextNode(),a=0,o=0,s=n[0];for(;s!==void 0;){if(a===s.index){let t;s.type===2?t=new be(i,i.nextSibling,this,e):s.type===1?t=new s.ctor(i,s.name,s.strings,this,e):s.type===6&&(t=new we(i,this,e)),this._$AV.push(t),s=n[++o]}a!==s?.index&&(i=F.nextNode(),a++)}return F.currentNode=D,r}p(e){let t=0;for(let n of this._$AV)n!==void 0&&(n.strings===void 0?n._$AI(e[t]):(n._$AI(e,n,t),t+=n.strings.length-2)),t++}},be=class e{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(e,t,n,r){this.type=2,this._$AH=P,this._$AN=void 0,this._$AA=e,this._$AB=t,this._$AM=n,this.options=r,this._$Cv=r?.isConnected??!0}get parentNode(){let e=this._$AA.parentNode,t=this._$AM;return t!==void 0&&e?.nodeType===11&&(e=t.parentNode),e}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(e,t=this){e=I(this,e,t),k(e)?e===P||e==null||e===``?(this._$AH!==P&&this._$AR(),this._$AH=P):e!==this._$AH&&e!==N&&this._(e):e._$litType$===void 0?e.nodeType===void 0?oe(e)?this.k(e):this._(e):this.T(e):this.$(e)}O(e){return this._$AA.parentNode.insertBefore(e,this._$AB)}T(e){this._$AH!==e&&(this._$AR(),this._$AH=this.O(e))}_(e){this._$AH!==P&&k(this._$AH)?this._$AA.nextSibling.data=e:this.T(D.createTextNode(e)),this._$AH=e}$(e){let{values:t,_$litType$:n}=e,r=typeof n==`number`?this._$AC(e):(n.el===void 0&&(n.el=ve.createElement(ge(n.h,n.h[0]),this.options)),n);if(this._$AH?._$AD===r)this._$AH.p(t);else{let e=new ye(r,this),n=e.u(this.options);e.p(t),this.T(n),this._$AH=e}}_$AC(e){let t=he.get(e.strings);return t===void 0&&he.set(e.strings,t=new ve(e)),t}k(t){ae(this._$AH)||(this._$AH=[],this._$AR());let n=this._$AH,r,i=0;for(let a of t)i===n.length?n.push(r=new e(this.O(O()),this.O(O()),this,this.options)):r=n[i],r._$AI(a),i++;i<n.length&&(this._$AR(r&&r._$AB.nextSibling,i),n.length=i)}_$AR(e=this._$AA.nextSibling,t){for(this._$AP?.(!1,!0,t);e!==this._$AB;){let t=te(e).nextSibling;te(e).remove(),e=t}}setConnected(e){this._$AM===void 0&&(this._$Cv=e,this._$AP?.(e))}},L=class{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(e,t,n,r,i){this.type=1,this._$AH=P,this._$AN=void 0,this.element=e,this.name=t,this._$AM=r,this.options=i,n.length>2||n[0]!==``||n[1]!==``?(this._$AH=Array(n.length-1).fill(/* @__PURE__ */ new String),this.strings=n):this._$AH=P}_$AI(e,t=this,n,r){let i=this.strings,a=!1;if(i===void 0)e=I(this,e,t,0),a=!k(e)||e!==this._$AH&&e!==N,a&&(this._$AH=e);else{let r=e,o,s;for(e=i[0],o=0;o<i.length-1;o++)s=I(this,r[n+o],t,o),s===N&&(s=this._$AH[o]),a||=!k(s)||s!==this._$AH[o],s===P?e=P:e!==P&&(e+=(s??``)+i[o+1]),this._$AH[o]=s}a&&!r&&this.j(e)}j(e){e===P?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,e??``)}},xe=class extends L{constructor(){super(...arguments),this.type=3}j(e){this.element[this.name]=e===P?void 0:e}},Se=class extends L{constructor(){super(...arguments),this.type=4}j(e){this.element.toggleAttribute(this.name,!!e&&e!==P)}},Ce=class extends L{constructor(e,t,n,r,i){super(e,t,n,r,i),this.type=5}_$AI(e,t=this){if((e=I(this,e,t,0)??P)===N)return;let n=this._$AH,r=e===P&&n!==P||e.capture!==n.capture||e.once!==n.once||e.passive!==n.passive,i=e!==P&&(n===P||r);r&&this.element.removeEventListener(this.name,this,n),i&&this.element.addEventListener(this.name,this,e),this._$AH=e}handleEvent(e){typeof this._$AH==`function`?this._$AH.call(this.options?.host??this.element,e):this._$AH.handleEvent(e)}},we=class{constructor(e,t,n){this.element=e,this.type=6,this._$AN=void 0,this._$AM=t,this.options=n}get _$AU(){return this._$AM._$AU}_$AI(e){I(this,e)}},Te=ee.litHtmlPolyfillSupport;Te?.(ve,be),(ee.litHtmlVersions??=[]).push(`3.3.3`);var Ee=(e,t,n)=>{let r=n?.renderBefore??t,i=r._$litPart$;if(i===void 0){let e=n?.renderBefore??null;r._$litPart$=i=new be(t.insertBefore(O(),e),e,void 0,n??{})}return i._$AI(e),i},De=globalThis,R=class extends C{constructor(){
/**
* @license
* Copyright 2017 Google LLC
* SPDX-License-Identifier: BSD-3-Clause
*/
super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){let e=super.createRenderRoot();return this.renderOptions.renderBefore??=e.firstChild,e}update(e){let t=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(e),this._$Do=Ee(t,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return N}};R._$litElement$=!0,R.finalized=!0,De.litElementHydrateSupport?.({LitElement:R});var Oe=De.litElementPolyfillSupport;Oe?.({LitElement:R}),(De.litElementVersions??=[]).push(`4.2.2`);
/**
* @license
* Copyright 2017 Google LLC
* SPDX-License-Identifier: BSD-3-Clause
*/
var ke=e=>(t,n)=>{n===void 0?customElements.define(e,t):n.addInitializer(()=>{customElements.define(e,t)})},Ae={attribute:!0,type:String,converter:b,reflect:!1,hasChanged:x},je=(e=Ae,t,n)=>{
/**
* @license
* Copyright 2017 Google LLC
* SPDX-License-Identifier: BSD-3-Clause
*/
let{kind:r,metadata:i}=n,a=globalThis.litPropertyMetadata.get(i);if(a===void 0&&globalThis.litPropertyMetadata.set(i,a=/* @__PURE__ */ new Map),r===`setter`&&((e=Object.create(e)).wrapped=!0),a.set(n.name,e),r===`accessor`){let{name:r}=n;return{set(n){let i=t.get.call(this);t.set.call(this,n),this.requestUpdate(r,i,e,!0,n)},init(t){return t!==void 0&&this.C(r,void 0,e,t),t}}}if(r===`setter`){let{name:r}=n;return function(n){let i=this[r];t.call(this,n),this.requestUpdate(r,i,e,!0,n)}}throw Error(`Unsupported decorator location: `+r)};function Me(e){return(t,n)=>typeof n==`object`?je(e,t,n):((e,t,n)=>{let r=t.hasOwnProperty(n);return t.constructor.createProperty(n,e),r?Object.getOwnPropertyDescriptor(t,n):void 0})(e,t,n)}
/**
* @license
* Copyright 2017 Google LLC
* SPDX-License-Identifier: BSD-3-Clause
*/function z(e){return Me({...e,state:!0,attribute:!1})}
/**
* @license
* Copyright 2017 Google LLC
* SPDX-License-Identifier: BSD-3-Clause
*/
var Ne=(e,t,n)=>(n.configurable=!0,n.enumerable=!0,Reflect.decorate&&typeof t!=`object`&&Object.defineProperty(e,t,n),n);
/**
* @license
* Copyright 2017 Google LLC
* SPDX-License-Identifier: BSD-3-Clause
*/function Pe(e,t){return(n,r,i)=>{let a=t=>t.renderRoot?.querySelector(e)??null;if(t){let{get:e,set:t}=typeof r==`object`?n:i??(()=>{let e=Symbol();return{get(){return this[e]},set(t){this[e]=t}}})();return Ne(n,r,{get(){let n=e.call(this);return n===void 0&&(n=a(this),(n!==null||this.hasUpdated)&&t.call(this,n)),n}})}return Ne(n,r,{get(){return a(this)}})}}var Fe=o`
  :host {
    --wtl-accent: var(--primary-color, #03a9f4);
    --wtl-surface: var(--card-background-color, #fff);
    --wtl-text: var(--primary-text-color, #212121);
    --wtl-muted: var(--secondary-text-color, #727272);
    --wtl-divider: var(--divider-color, #e0e0e0);
    --wtl-gap: var(--error-color, #db4437);
    --wtl-radius: var(--ha-card-border-radius, 12px);
    /* Frames are ~4:3; reserving the box up front stops the card from
       jumping when the first image decodes. */
    --wtl-aspect: 4 / 3;

    display: block;
    /* Fill the grid cell the dashboard gave us.
       A sections view puts a fixed pixel height on the cell WRAPPER whenever
       the card's rows are numeric -- which a user also causes by dragging the
       row handle, since a stored grid_options overrides what getGridOptions()
       returns -- and styles nothing inside that wrapper.
       This host is display: block, so IT is the containing block for the
       ha-card below, and a percentage height against a containing block whose
       own height is auto computes to auto. Without this line ha-card therefore
       sizes to its content, overflows a cell too short for it, and is painted
       over the card underneath. Taking the cell's height here is what gives
       ha-card's 100% something to resolve against.
       In an auto-height cell it resolves to auto -- the height it already had
       -- so it costs nothing there. */
    block-size: 100%;
    container-type: inline-size;
  }

  ha-card {
    /* Resolves against the height :host just took from the cell, so
       overflow: hidden clips inside the card rather than the card spilling
       past its own cell. The two declarations only work as a pair: core cards
       that set this one alone leave :host at its default inline display, where
       the cell wrapper is ha-card's containing block instead. */
    block-size: 100%;

    overflow: hidden;
  }

  /* --- stage ------------------------------------------------------- */

  .stage {
    position: relative;
    width: 100%;
    aspect-ratio: var(--wtl-aspect);
    background: #000;
    overflow: hidden;
    /* For the export crop, which sizes itself to the letterboxed frame
       in cq units. Safe as size containment: the stage's height comes
       from its width and aspect-ratio, never from what is inside it. */
    container-type: size;
  }

  /* The frame as object-fit: contain draws it inside the stage, so the
     crop window can be placed in percentages of the picture itself. */
  .crop-frame {
    position: absolute;
    inset: 0;
    margin: auto;
    width: min(100cqw, calc(100cqh * var(--wtl-frame-ratio)));
    height: min(100cqh, calc(100cqw / var(--wtl-frame-ratio)));
    overflow: hidden;
    pointer-events: none;
  }

  /* What the video keeps. The rest of the picture is dimmed by the
     window's own shadow, clipped to the frame above — one element, so
     the bright part and the dim part can never drift apart. */
  .crop-window {
    position: absolute;
    box-sizing: border-box;
    border: 2px solid var(--wtl-accent);
    box-shadow: 0 0 0 100vmax rgba(0, 0, 0, 0.55);
    pointer-events: auto;
    touch-action: none;
  }

  .crop-window.x {
    cursor: ew-resize;
  }

  .crop-window.y {
    cursor: ns-resize;
  }

  /* Wrapper whose only job is to be a stacking context.

     revealFrame() writes z-index onto the two layers so the incoming
     frame paints over the outgoing one. Without this wrapper that
     z-index competes with every other child of .stage — the timestamp,
     the live/gap badge, the sensor readout, the error panel — all of
     which are positioned at z-index auto and had been relying on DOM
     order to paint on top. Adding z-index to the images silently pushed
     the whole overlay underneath an opaque photo.

     position + a numeric z-index makes this element a stacking context,
     so the layers' z-index is scoped to this subtree and can only ever
     rank the two images against each other. */
  .layers {
    position: absolute;
    inset: 0;
    z-index: 0;
    overflow: hidden;
    cursor: pointer;
  }

  /* Inset, because the layers fill the stage — an outset ring would be
     clipped away by the stage's own overflow and the focus state would
     be invisible exactly where it matters most. */
  .layers:focus-visible {
    outline: 2px solid var(--wtl-accent);
    outline-offset: -2px;
  }

  /* opacity, z-index and transition are set imperatively by
     revealFrame() and are deliberately absent here.

     They used to live in this block as a symmetric crossfade: outgoing
     1 -> 0 while incoming 0 -> 1. That is not a crossfade. Two stacked
     elements with independent opacities do not composite to an opaque
     result — at the midpoint the stage renders

         0.5*new + 0.25*old + 0.25*background

     and this background is #000, so every frame transition dipped ~25%
     toward black. A per-frame luminance pulse is exactly the artifact
     the deflicker pass exists to remove.

     The fix holds the outgoing frame fully opaque underneath and fades
     only the incoming one in on top of it, compositing to

         b*new + (1-b)*old

     with no background term. That needs z-order to follow which layer
     is incoming, and DOM order cannot express it: layer b always paints
     over layer a. Hence z-index, hence inline.

     Gap dimming is folded into --wtl-frame-filter rather than opacity,
     so it cannot collide with the fade. */
  .layer {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: contain;
    opacity: 0;
    filter: var(--wtl-frame-filter, none);
  }

  .empty .detail {
    font-size: var(--ha-font-size-s, 12px);
    opacity: 0.75;
    max-width: 34ch;
  }

  .empty {
    position: absolute;
    inset: 0;
    display: grid;
    place-content: center;
    gap: 8px;
    padding: 16px;
    text-align: center;
    color: var(--wtl-muted);
    font-size: var(--ha-font-size-m, 14px);
  }

  /* --- overlays ---------------------------------------------------- */

  /* Passive labels, so they must not eat the click that opens the
     camera's more-info dialog — they sit over the picture and would
     otherwise punch two dead rectangles into it. */
  .stamp,
  .badge {
    pointer-events: none;
    position: absolute;
    padding: 4px 8px;
    border-radius: 6px;
    background: rgba(0, 0, 0, 0.55);
    color: #fff;
    font-size: var(--ha-font-size-s, 12px);
    /* Digits must not shift width as the clock ticks. */
    font-variant-numeric: tabular-nums;
    backdrop-filter: blur(2px);
  }

  /* Top-left, because the controls now own the bottom of the stage. */
  .stamp {
    left: 8px;
    top: 8px;
  }

  .badge {
    right: 8px;
    top: 8px;
    letter-spacing: 0.06em;
    font-weight: var(--ha-font-weight-medium, 500);
  }

  .badge.live {
    background: var(--wtl-accent);
  }

  .badge.gap {
    background: var(--wtl-gap);
  }

  /* Generates no box, so the blocks inside it position themselves
     against .stage exactly as they did when there was only ever one.
     It becomes a real element only in the narrow pair layout, and only
     through .pair — see the container query below. */
  .readouts {
    display: contents;
  }

  /* Back on the bottom-right corner. It shares that edge with the centred
     control pill, which is fine while there is room between them — the
     container query below moves it to the top before the two can meet. */
  .readout {
    position: absolute;
    right: 8px;
    bottom: 8px;
    display: grid;
    gap: 2px;
    padding: 8px 10px;
    border-radius: 8px;
    background: rgba(0, 0, 0, 0.55);
    color: #fff;
    backdrop-filter: blur(2px);
    font-variant-numeric: tabular-nums;
  }

  /* The second block takes the opposite corner. Nothing else changes:
     the block that was already there keeps the rule above untouched, so
     adding this one cannot move it. */
  .readout.left {
    right: auto;
    left: 8px;
  }

  /* Folded to the eye alone. The scrim shrinks with it — a block that
     kept its padding would leave a dark square on the picture, which is
     the thing folding it away was meant to clear. */
  .readout.folded {
    padding: 2px;
  }

  /* Heading and fold control on one line. The heading is optional, so
     the row is justified from the end: with no title the eye still
     lands on the block's trailing edge instead of its leading one. */
  .readout-head {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 8px;
    margin-bottom: 2px;
  }

  /* Opt-in heading for the readings block. Only rendered when the config
     carries a non-empty string, so the default look is unchanged. */
  .readout-title {
    font-size: var(--ha-font-size-s, 12px);
    font-weight: var(--ha-font-weight-medium, 500);
    color: rgba(255, 255, 255, 0.95);
    /* Takes the slack so the eye is pushed to the far edge, and keeps
       the heading over the labels it introduces: the block is
       right-aligned against the frame, and a heading that hugged the
       same edge would drift away from them. */
    flex: 1;
    text-align: left;
  }

  /* Sized down hard from the 48px default — this sits inside an overlay
     that is only a few rows tall, and the pill's 40px would dominate the
     block it belongs to. 24px is the WCAG 2.5.8 minimum, and the floor.

     Every icon-button size here is set twice. Home Assistant's
     ha-icon-button moved onto ha-button, which reads
     --ha-icon-button-size; older frontends read --mdc-icon-button-size.
     Setting only the old one left every button at the new 48px default.

     Quiet until wanted: it matches .readout-name's weight so it reads as
     part of the block's furniture rather than competing with the values,
     and comes up to full white on hover and focus like the rows do. */
  .readout-fold {
    flex: none;
    color: rgba(255, 255, 255, 0.75);
    --ha-icon-button-size: 24px;
    --mdc-icon-button-size: 24px;
    --ha-icon-button-padding-inline: 0;
    --mdc-icon-size: 16px;
  }

  /* Overhangs the heading row instead of setting its height. The 24px
     target is what WCAG asks for, not what the row needs: left to size
     the row it made the heading twice as tall as a reading. The negative
     margin stays inside the block's own padding, so nothing it overlaps
     is another control. A folded block is the button alone and keeps
     its full size. */
  .readout-head .readout-fold {
    margin-block: -4px;
    margin-inline-end: -6px;
  }

  /* :focus-within, not :focus-visible. ha-icon-button puts outline:none
     on its host and keeps focus on the button inside its shadow root, so
     a :focus-visible rule aimed at the host never matches. The ring
     itself comes from mwc-icon-button either way — this is only the
     colour coming up to meet the hover state. */
  .readout-fold:hover,
  .readout-fold:focus-within {
    color: #fff;
  }

  .readout-row {
    display: flex;
    align-items: baseline;
    gap: 8px;
    cursor: pointer;
    border-radius: 4px;
    font-size: var(--ha-font-size-s, 12px);
    /* Pinned so the icon has a known box to be centred against. With an
       inherited line-height the row's height varies with the theme, and
       a centred icon drifts off the text by however much it differs. */
    line-height: 1.25;
  }

  /* display is explicit because a custom element is inline by default,
     and width/height on an inline box are ignored — the icon then sized
     itself from --mdc-icon-size alone and sat on the text baseline
     rather than beside it.

     The row is baseline-aligned for the text, so the icon opts out with
     align-self and centres on the line box instead. At 1.25 line-height
     the box is 1.25em and the icon 1.05em, putting its centre 0.625em
     down; the text's optical centre (baseline at ~1.03em, cap height
     ~0.7em) lands at ~0.68em. Close enough to read as aligned, and it
     holds at any font size because every term is in em. */
  .readout-icon {
    display: block;
    --mdc-icon-size: 1.05em;
    width: 1.05em;
    height: 1.05em;
    flex: none;
    align-self: center;
    /* Optical nudge, not geometry. Centring on the line box is correct to
       within half a pixel, but the row's cross size is set by the text's
       descenders, which sit lower than anything in an MDI glyph — so a
       mathematically centred icon still reads slightly low. Bottom margin
       lifts a centre-aligned item by half its value. */
    margin-bottom: 0.16em;
  }

  .readout-name {
    color: rgba(255, 255, 255, 0.75);
  }

  .readout-value {
    margin-left: auto;
    font-weight: var(--ha-font-weight-medium, 500);
  }

  .readout-row.stale .readout-value {
    opacity: 0.55;
  }

  /* Outset here, unlike the layers: the readout sits inside the stage
     with room around it, so the ring reads better outside the text than
     cutting through it. */
  .readout-row:focus-visible {
    outline: 2px solid var(--wtl-accent);
    outline-offset: 1px;
  }

  .readout-row:hover .readout-name {
    color: #fff;
  }

  .spark-wrap {
    margin: 2px 0 4px;
    color: rgba(255, 255, 255, 0.7);
  }

  .spark {
    display: block;
    width: 100%;
    height: 34px;
  }

  /* Night behind the line. Deliberately faint: it is context for the
     reading, not a series of its own, and it has to stay readable over
     an arbitrary photograph in both a bright frame and a dark one.
     currentColor picks up .spark-wrap's white, so it darkens nothing —
     it lifts the night, which is the only direction that works on a
     scrim that is already black. */
  .spark-night {
    fill: currentColor;
    opacity: 0.12;
  }

  /* The chart's units. Lives in HTML rather than inside the SVG because
     the SVG is preserveAspectRatio="none" — an in-chart <text> would be
     stretched horizontally by whatever width the block happens to be, and
     that width is content-driven in the corner layout and near
     full-bleed in the stacked one.

     Ends pushed apart: how far it moved reads against the chart's
     vertical extent, how long over reads against its horizontal one, so
     each label sits on the axis it describes. */
  .spark-scale {
    display: flex;
    justify-content: space-between;
    gap: 8px;
    margin-top: 1px;
    font-size: var(--ha-font-size-xs, 10px);
    line-height: 1.2;
    color: rgba(255, 255, 255, 0.6);
    white-space: nowrap;
  }

  .readout-at {
    font-size: var(--ha-font-size-xs, 10px);
    color: rgba(255, 255, 255, 0.6);
  }

  /* --- controls ---------------------------------------------------- */

  /* A pill over the frame instead of a bar under it. Removing the row
     from the flow is most of the height this card saves, and the
     controls belong to the picture anyway. Same dark scrim as the other
     stage overlays so it stays legible over any frame. */
  .controls {
    position: absolute;
    left: 50%;
    bottom: 8px;
    transform: translateX(-50%);
    display: flex;
    align-items: center;
    gap: 2px;
    padding: 2px 6px;
    border-radius: 999px;
    background: rgba(0, 0, 0, 0.55);
    backdrop-filter: blur(2px);
    color: #fff;
    /* Smaller than the 48px default so the pill stays slim, still well
       over the 24px WCAG 2.5.8 minimum target. */
    --ha-icon-button-size: 40px;
    --mdc-icon-button-size: 40px;
    --mdc-icon-size: 20px;
  }

  /* The one control people reach for without looking, so it carries the
     extra weight. Size is the whole signal — no accent colour, which
     would compete with the LIVE badge for the eye. */
  .controls .play {
    --ha-icon-button-size: 46px;
    --mdc-icon-button-size: 46px;
    --mdc-icon-size: 26px;
  }

  /* Divides transport from the controls that are not transport. A hairline
     rather than a gap: the gap alone reads as a rendering accident at this
     size, and the eye needs the group boundary to be deliberate. */
  .sep {
    width: 1px;
    height: 18px;
    margin: 0 5px;
    background: rgba(255, 255, 255, 0.28);
  }

  .speed {
    min-width: 40px;
    padding: 6px 8px;
    border: 0;
    border-radius: 999px;
    background: transparent;
    color: inherit;
    font: inherit;
    font-variant-numeric: tabular-nums;
    cursor: pointer;
  }

  .speed:hover {
    background: rgba(255, 255, 255, 0.18);
  }

  .speed:focus-visible {
    outline: 2px solid var(--wtl-accent);
    outline-offset: 2px;
  }

  /* --- scrubber ---------------------------------------------------- */

  /* Dates, bar and clock times as one block. The bands are in normal
     flow and the marks live inside the track, so all three are keyed off
     the same percentage and cannot drift apart. */
  /* The top margin is load-bearing: the date band is the first thing
     under the frame, and with no gap the labels read as part of the
     picture rather than as the timeline's heading. */
  .timeline {
    margin: 12px 12px 8px;
  }

  .band {
    position: relative;
    height: 12px;
  }

  .band.dates {
    margin-bottom: 1px;
  }

  .band.times {
    margin-top: 1px;
  }

  .track {
    position: relative;
    height: 40px; /* WCAG 2.5.8 target size, kept even though the bar is thin */
  }

  /* Behind the bar, not beside it. Paint order is DOM order — the marks
     render before the rail — because a z-index here would re-enter the
     stacking competition .layers exists to contain. */
  /* Night behind the scrubber, in the same faint-band language the charts
     use — learned once, read in both places. First child of .track, so
     paint order puts it under the marks, the rail and the fill without
     anyone reaching for z-index.

     Deliberately not a curve of solar elevation. A sine would be prettier
     and would say less: the scrubber is a control, and what it owes the
     viewer is which stretches of the archive are dark frames not worth
     scrubbing to. Elevation is not that, and a ripple through a bar that
     already carries day ticks, gap runs and a fill would read as texture
     rather than as information. */
  .nights {
    position: absolute;
    inset: 0;
    pointer-events: none;
  }

  /* currentColor, not a fixed tone: unlike the overlay bands this sits on
     the card surface, which follows the Home Assistant theme and may be
     light. Tying it to the text colour means night darkens a light theme
     and lifts a dark one, which is the only direction that works on
     each. Fainter than the chart's for the same reason — there is no
     black scrim here to compete with. */
  .night {
    position: absolute;
    top: 0;
    bottom: 0;
    background: currentColor;
    opacity: 0.07;
  }

  /* The stretch of the timeline an export would cover. The same idiom
     as the night bands — a tinted span behind the bar, placed by DOM
     order rather than z-index — but in the accent colour and far
     stronger: night is context, this is a selection the user made and
     has to be able to see while dragging the playhead to its other end. */
  .export-band {
    position: absolute;
    top: 50%;
    height: 20px;
    /* A one-frame selection still has to be findable on the bar. */
    min-width: 3px;
    transform: translateY(-50%);
    border-radius: 3px;
    background: var(--wtl-accent);
    opacity: 0.25;
    pointer-events: none;
  }

  /* Grips on the band's ends. After the scrubber's input in the DOM, so
     they paint over it and take the pointer from it; the band between
     them stays inert, so a press inside the range still scrubs. */
  .export-handle {
    position: absolute;
    top: 50%;
    width: 10px;
    height: 24px;
    transform: translate(-50%, -50%);
    box-sizing: border-box;
    border: 2px solid var(--wtl-surface);
    border-radius: 4px;
    background: var(--wtl-accent);
    cursor: ew-resize;
    touch-action: none;
  }

  /* A 24 x 40 target for a finger, around a grip drawn narrower so it
     does not hide the frames it sits on. */
  .export-handle::before {
    content: "";
    position: absolute;
    inset: -8px -7px;
  }

  .marks {
    position: absolute;
    inset: 0;
    pointer-events: none;
  }

  /* Centred on the rail so each mark reads as a tick the bar runs
     through, showing equally above and below it.

     The marks carry their own colour, deliberately not the rail's. Both
     were --wtl-divider, which is the token for "barely there" — so the
     scale dissolved into the bar it sits behind and read as hidden
     rather than quiet.

     Weight is graded rather than uniform, because the hierarchy is the
     information: minor ticks say the scale is continuous, day boundaries
     are what you actually navigate by, month starts are the rarest and
     strongest. Only 6px of a minor tick clears the 6px rail, so the
     contrast has to do the work the length cannot. */
  .mark {
    position: absolute;
    top: 50%;
    width: 1px;
    height: 18px;
    transform: translate(-50%, -50%);
    background: var(--wtl-muted);
    opacity: 0.5;
  }

  .mark.day {
    height: 26px;
    background: var(--wtl-text);
    opacity: 0.85;
  }

  .mark.month {
    height: 34px;
    width: 2px;
    background: var(--wtl-text);
    opacity: 1;
  }

  .rail,
  .fill,
  .gap-run {
    position: absolute;
    top: 50%;
    height: 6px;
    transform: translateY(-50%);
    border-radius: 3px;
    pointer-events: none;
  }

  .rail {
    left: 0;
    right: 0;
    background: var(--wtl-divider);
  }

  .fill {
    left: 0;
    background: var(--wtl-accent);
    opacity: 0.65;
  }

  .gap-run {
    background: repeating-linear-gradient(
      45deg,
      var(--wtl-gap) 0 3px,
      transparent 3px 6px
    );
    opacity: 0.8;
  }

  input[type="range"] {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    margin: 0;
    background: transparent;
    appearance: none;
    cursor: pointer;
  }

  input[type="range"]:focus-visible {
    outline: 2px solid var(--wtl-accent);
    outline-offset: 2px;
    border-radius: 4px;
  }

  input[type="range"]::-webkit-slider-thumb {
    appearance: none;
    width: 16px;
    height: 16px;
    border: 2px solid var(--wtl-surface);
    border-radius: 50%;
    background: var(--wtl-accent);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.4);
  }

  input[type="range"]::-moz-range-thumb {
    width: 16px;
    height: 16px;
    border: 2px solid var(--wtl-surface);
    border-radius: 50%;
    background: var(--wtl-accent);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.4);
  }

  /* --- ruler labels ------------------------------------------------ */

  /* Two bands, dates above the bar and clock times below, so the label
     families never have to be thinned against each other — each only
     collides with its own kind. Dates go on top because a day boundary
     is the coarser unit: the eye reads them as headings over the scale.

     line-height is pinned rather than inherited. The bands are fixed
     height, so a label's box height has to be known here; inheriting
     HA's 1.5 made the date box 17px tall in a 12px band and it spilled
     into the marks below. */
  .lab {
    position: absolute;
    left: 0;
    transform: translateX(-50%);
    font-size: var(--ha-font-size-xs, 10px);
    line-height: 1;
    color: var(--wtl-muted);
    white-space: nowrap;
    pointer-events: none;
  }

  .lab.time {
    top: 0;
    /* Clock digits must not shuffle the label's centre as they change. */
    font-variant-numeric: tabular-nums;
    opacity: 0.7;
  }

  /* Slightly stronger than the clock row: it is the heading, and it
     appears far less often, so it can afford the weight without turning
     the timeline into noise. */
  .lab.date {
    bottom: 0;
    font-weight: 500;
    color: var(--wtl-text);
  }

  /* --- video export ------------------------------------------------ */

  /* Under the timeline, in normal flow. Deliberately not a button on the
     control pill: the pill's width is what the narrow-layout breakpoints
     above are derived from, and export is a once-in-a-while action that
     does not belong among the transport controls anyway.

     Every control here is a native element. Home Assistant's own
     (ha-button, ha-switch, ha-select) are loaded lazily by whichever
     core panel needs them first, so in a card they may or may not be
     registered — and an unregistered custom element renders as nothing
     at all, with no error. */
  .export {
    margin: 0 12px 10px;
    font-size: var(--ha-font-size-s, 12px);
  }

  .export button,
  .export-download,
  .export-watch {
    font: inherit;
    cursor: pointer;
  }

  .export button:focus-visible,
  .export-download:focus-visible,
  .export-watch:focus-visible,
  .export-browse:focus-visible,
  .export-check input:focus-visible {
    outline: 2px solid var(--wtl-accent);
    outline-offset: 2px;
  }

  .export-panel {
    display: grid;
    gap: 12px;
    margin-top: 4px;
    padding: 12px;
    border: 1px solid var(--wtl-divider);
    border-radius: 8px;
    color: var(--wtl-text);
  }

  /* From and To side by side while there is room, stacked when not. */
  .export-ends {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
    gap: 10px 16px;
  }

  .export-end {
    display: grid;
    gap: 4px;
    justify-items: start;
  }

  .export-label {
    color: var(--wtl-muted);
  }

  /* Digits must not shift width as the range is moved. */
  .export-stamp {
    font-size: var(--ha-font-size-m, 14px);
    font-weight: var(--ha-font-weight-medium, 500);
    font-variant-numeric: tabular-nums;
  }

  .export-row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px 8px;
  }

  .export-chip {
    min-height: 28px;
    padding: 4px 10px;
    border: 1px solid var(--wtl-divider);
    border-radius: 999px;
    background: none;
    color: inherit;
    font-variant-numeric: tabular-nums;
  }

  .export-chip:hover {
    border-color: var(--wtl-muted);
  }

  /* The chosen frame rate. Border and tint, not colour alone, so it
     still reads as selected in forced-colours and to anyone who cannot
     tell the accent from the divider. */
  .export-chip[aria-pressed="true"] {
    border-color: var(--wtl-accent);
    border-width: 2px;
    padding: 3px 9px;
    font-weight: var(--ha-font-weight-medium, 500);
  }

  .export-check {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 28px;
    cursor: pointer;
  }

  .export-check input {
    width: 16px;
    height: 16px;
    margin: 0;
    accent-color: var(--wtl-accent);
  }

  .export-summary {
    color: var(--wtl-muted);
    font-variant-numeric: tabular-nums;
  }

  /* Indented under its checkbox, so the size reads as belonging to it. */
  .export-size {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    margin-left: 8px;
  }

  /* Undoes the scrubber's rules, which style every range input in the
     card: that one is stretched invisibly over the timeline track and
     draws its own thumb. This one is an ordinary slider in a row. */
  .export-size input[type="range"] {
    position: static;
    inset: auto;
    width: 140px;
    height: auto;
    margin: 0;
    background: none;
    appearance: auto;
    accent-color: var(--wtl-accent);
  }

  /* Fixed width, so the slider does not jump as the number grows a digit. */
  .export-size-value {
    min-width: 11ch;
    color: var(--wtl-muted);
    font-variant-numeric: tabular-nums;
  }

  /* The folder is for finding and tidying up old exports, so it is always
     there — but quiet, and free to break anywhere in a long path. The
     link gets a line of its own, so a narrow card never splits it. */
  .export-folder {
    display: grid;
    gap: 4px;
    justify-items: start;
    color: var(--wtl-muted);
    overflow-wrap: anywhere;
  }

  /* A text link, not a button: it leaves the card for another panel, and
     a second filled control here would compete with the export itself. */
  .export-browse {
    color: var(--wtl-accent);
    white-space: nowrap;
  }

  .export-hint {
    margin: -6px 0 0;
    color: var(--wtl-muted);
    line-height: 1.45;
  }

  .export-format {
    display: grid;
    gap: 8px;
  }

  .export-format .export-hint {
    margin: 0;
  }

  .export-tiles {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(84px, 1fr));
    gap: 8px;
  }

  /* Larger than the chips: the format decides the shape of everything
     else, and the icon is the quickest way to read which one is which. */
  .export-tile {
    display: grid;
    justify-items: center;
    gap: 2px;
    min-height: 64px;
    padding: 8px 4px;
    border: 1px solid var(--wtl-divider);
    border-radius: 10px;
    background: none;
    color: inherit;
    --mdc-icon-size: 22px;
  }

  .export-tile:hover {
    border-color: var(--wtl-muted);
  }

  .export-tile[aria-pressed="true"] {
    border: 2px solid var(--wtl-accent);
    padding: 7px 3px;
    font-weight: var(--ha-font-weight-medium, 500);
  }

  .export-tile:disabled {
    opacity: 0.45;
    cursor: default;
  }

  .export-ratio {
    min-height: 1.2em;
    color: var(--wtl-muted);
    font-size: var(--ha-font-size-xs, 10px);
    font-weight: normal;
    font-variant-numeric: tabular-nums;
  }

  .export-crop {
    display: grid;
    grid-template-columns: auto minmax(100px, 1fr) auto;
    align-items: center;
    gap: 4px 10px;
  }

  .export-crop input[type="range"] {
    position: static;
    inset: auto;
    width: 100%;
    height: auto;
    margin: 0;
    background: none;
    appearance: auto;
    accent-color: var(--wtl-accent);
  }

  .export-crop-ends {
    grid-column: 2;
    display: flex;
    justify-content: space-between;
    color: var(--wtl-muted);
    font-size: var(--ha-font-size-xs, 10px);
  }

  .export-note {
    display: flex;
    gap: 8px;
    align-items: flex-start;
    margin: 0;
    padding: 8px 10px;
    border: 1px solid var(--wtl-accent);
    border-radius: 8px;
    line-height: 1.45;
    --mdc-icon-size: 18px;
  }

  .export-note ha-icon {
    flex: none;
    color: var(--wtl-accent);
  }

  .export-stats {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 8px;
    margin: 0;
  }

  .export-stats div {
    display: grid;
    gap: 2px;
  }

  .export-stats dt {
    color: var(--wtl-muted);
  }

  .export-stats dd {
    margin: 0;
    font-size: var(--ha-font-size-m, 14px);
    font-weight: var(--ha-font-weight-medium, 500);
    font-variant-numeric: tabular-nums;
  }

  .export-warning {
    margin: 0;
    padding: 8px 10px;
    border: 1px solid var(--wtl-gap);
    border-radius: 8px;
    color: var(--wtl-gap);
    line-height: 1.45;
  }

  .export-links {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  /* Download stays the filled one; watching is the lighter errand. */
  .export-watch {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 36px;
    padding: 6px 18px;
    border: 1px solid var(--wtl-accent);
    border-radius: 999px;
    color: var(--wtl-accent);
    font-weight: var(--ha-font-weight-medium, 500);
    text-decoration: none;
    --mdc-icon-size: 18px;
  }

  .export-go,
  .export-download {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 36px;
    padding: 6px 18px;
    border: 0;
    border-radius: 999px;
    background: var(--wtl-accent);
    color: var(--text-primary-color, #fff);
    font-weight: var(--ha-font-weight-medium, 500);
    text-decoration: none;
    --mdc-icon-size: 18px;
  }

  /* While an export runs the form is locked, and has to look it:
     a control that ignores a press without saying why reads as a
     broken card. */
  .export-go:disabled,
  .export-chip:disabled {
    opacity: 0.45;
    cursor: default;
  }

  .export-chip:disabled:hover {
    border-color: var(--wtl-divider);
  }

  .export-status {
    display: grid;
    gap: 8px;
    justify-items: start;
  }

  .export-status .detail {
    color: var(--wtl-muted);
    overflow-wrap: anywhere;
  }

  .export-error {
    color: var(--wtl-gap);
  }

  .export-progress {
    width: 100%;
    height: 6px;
    border-radius: 3px;
    background: var(--wtl-divider);
    overflow: hidden;
  }

  .export-progress span {
    display: block;
    height: 100%;
    background: var(--wtl-accent);
  }

  /* --- editor ------------------------------------------------------ */

  .ent-section {
    padding: 8px 0 4px;
  }

  .ent-section h4 {
    margin: 8px 0 2px;
    font-weight: var(--ha-font-weight-medium, 500);
  }

  .ent-hint {
    margin: 0 0 12px;
    color: var(--wtl-muted);
    font-size: var(--ha-font-size-s, 12px);
  }

  /* The heading applies to the whole readings block, not to any one row,
     so it sits above them at full width. ha-form is block-level already;
     the wrapper carries only the spacing. */
  .ent-title {
    display: block;
    margin-bottom: 4px;
  }

  .ent-row {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 8px;
    padding: 12px 0;
    border-top: 1px solid var(--wtl-divider);
  }

  /* The row is a two-column grid and ha-form is a direct child, so
     without this it lands in the narrow auto column beside the entity
     picker instead of under it. */
  .ent-row ha-form {
    grid-column: 1 / -1;
  }

  .ent-controls {
    grid-column: 1 / -1;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
  }

  .ent-actions {
    display: flex;
    align-items: start;
  }

  .swatch {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: var(--ha-font-size-s, 12px);
    color: var(--wtl-muted);
  }

  .swatch input[type="color"] {
    width: 44px;
    height: 32px;
    padding: 0;
    border: 1px solid var(--wtl-divider);
    border-radius: 6px;
    background: none;
    cursor: pointer;
  }

  /* --- version banner ---------------------------------------------- */

  .banner {
    display: flex;
    gap: 8px;
    align-items: center;
    padding: 8px 12px;
    background: var(--warning-color, #ffa726);
    color: #000;
    font-size: var(--ha-font-size-s, 12px);
  }

  .banner button {
    margin-left: auto;
    border: 0;
    border-radius: 4px;
    padding: 4px 8px;
    font: inherit;
    cursor: pointer;
  }

  /* --- responsive -------------------------------------------------- */

  /* Two blocks run out of room sooner than one, so the pair gets its own
     breakpoint rather than inheriting the number below.

     Re-derived rather than reused: the pill is centred at ~212px, so its
     left edge sits at W/2 - 106. The left-hand block starts 8px in and a
     three-sensor block runs ~230px, putting its right edge at ~238. Those
     meet at W ≈ 688 — the single block's 620 would let the pair overlap
     the pill for most of a phone's width.

     Stacked rather than side by side, because below this width there is
     no arrangement of two blocks along the bottom edge that clears the
     centred pill at all. */
  @container (max-width: 700px) {
    /* The wrapper becomes a box only here. Every declaration in this
       block is scoped to .pair, which is what keeps a single block on
       exactly the layout it had before the second one existed. */
    .readouts.pair {
      position: absolute;
      top: 8px;
      left: 8px;
      right: 8px;
      display: flex;
      /* Reversed against DOM order so the right-hand block sits on top.
         It is the block that was there first, and the one a single-block
         card would have shown on its own. */
      flex-direction: column-reverse;
      align-items: center;
      gap: 8px;
    }

    /* Back into normal flow so the column can stack them. The corner pins
       are inert on a static box, but the centring transform below is not
       — left unset it would drag both blocks half their width off centre. */
    .readouts.pair .readout {
      position: static;
      transform: none;
      max-width: 100%;
    }

  }

  /* Breakpoint set by the collision, not by a round number.

     The control pill is centred and the readout is right-aligned, so the
     two close on each other as the card narrows. The pill is ~212px, and
     a three-sensor readout runs ~230px, which puts the meeting point just
     past 600px — hence 620px, with a little margin because the readout's
     width follows its content. Below that the readout moves to the top,
     where nothing else is competing for the space. */
  @container (max-width: 620px) {
    /* Cleared explicitly: the base rule pins the bottom-right corner, and
       an unset side would leave the box anchored to both. */
    .readout {
      right: auto;
      bottom: auto;
      /* Same top edge as the timestamp and the badge, so the three
         overlays read as one row across the top of the frame instead of
         three boxes at unrelated heights. Kept in step with .stamp and
         .badge by a test rather than by memory. */
      top: 8px;
      left: 50%;
      transform: translateX(-50%);
      max-width: calc(100% - 16px);
    }

    /* A card configured with only the left block still gets one centred
       block up here. Without this its edge pin outranks the centring
       above — more specific — and it would sit at left: 8px while the
       transform pulled it half its own width off the frame. */
    .readout.left {
      left: 50%;
    }

  }

  /* prefers-reduced-motion is handled entirely in TypeScript, not here.

     The frame fade's transition is an inline style, and inline beats a
     stylesheet rule regardless of the media query, so a rule in this
     file would look correct and do nothing. fadeDurationMs() returns 0
     instead, and startAutoplayIfRequested() refuses to start playback,
     both via prefersReducedMotion(). */

  @media (forced-colors: active) {
    .fill,
    .gap-run,
    .export-band,
    .export-handle,
    .crop-window,
    .export-progress span {
      forced-color-adjust: none;
    }
  }
`,Ie={en:{empty:{no_frames:`No frames archived yet.`,first_soon:`The first one appears at the next capture.`,frame_failed:`This frame could not be loaded.`,index_failed:`Could not load the timeline.`},badge:{live:`LIVE`,gap:`NO IMAGE`},controls:{play:`Play`,pause:`Pause`,previous:`Previous frame`,next:`Next frame`,speed:`Playback speed {v}x`,now:`Jump to now`},track:{label:`Timeline position`},spark:{range:`Range {v}`,flat:`No change`},error:{no_camera:`You need to pick a camera in the card configuration.`},version_update:`This card was updated to {v}. Reload to pick up the new version.`,version_reload:`Reload`,editor:{camera_entity:`Camera`,title:`Title`,show_dayticks:`Show day markers`,show_graph:`Show graphs`,show_sun:`Mark night`,playback:`Playback`,autoplay:`Play automatically`,speed:`Speed`,graph_hours:`Graph window`,overlay_right:`Overlay readings (right)`,overlay_right_hint:`Values shown over the image are read at the moment you scrub to, not the current ones.`,overlay_left:`Overlay readings (left)`,overlay_left_hint:`A second block on the other side of the picture. Leave it empty for one block on the right.`,add_entity:`Add entity`,entity:`Entity`,name:`Label`,unit:`Unit`,decimals:`Decimals`,color:`Colour`,graph:`Graph`,move_up:`Move up`,move_down:`Move down`,remove:`Remove`,helper:{camera_entity:`Only cameras created by this integration have an archive to scrub.`,graph_hours:`How much history the sparkline shows around the playhead.`,autoplay:`Ignored when your system asks for reduced motion.`,deflicker:`Evens out cloud-driven brightness jumps during playback. 0 turns it off.`,overlay_title:`Shown above the readings. Leave empty for no heading.`,overlay_title_left:`Shown above the readings. Leave empty for no heading.`,show_icon:`Uses the entity's own icon from Home Assistant.`,show_sun:`Shades the hours between sunset and sunrise on the graphs and the scrubber, using your Home Assistant location. Hidden when the bands get too fine to read.`,show_export:`Adds an export button to the player bar. The video is rendered by Home Assistant and saved to the media folder.`},deflicker:`Smooth brightness`,show_icon:`Show icon`,overlay_title:`Heading`,overlay_title_left:`Heading`,show_export:`Offer video export`},actions:{show_camera:`Show camera details`,show_entity:`Show details for {v}`,hide_readings:`Hide readings`,show_readings:`Show readings`},export:{open:`Export video`,close:`Close export`,from:`From`,to:`To`,start_here:`Start at this frame`,end_here:`End at this frame`,preset_hours:`Last {v} h`,preset_days:`Last {v} d`,preset_all:`Everything`,fps:`Frames per second`,timestamp:`Date and time`,readings:`Sensor readings`,summary_empty:`No frames in this range.`,start:`Export`,cancel:`Cancel`,preparing:`Preparing…`,running:`Encoding frame {done} of {total}`,done:`Video ready`,saved:`Saved as {v}`,watch:`Watch`,download:`Download`,cancelled:`Export cancelled.`,band:`Range selected for export`,error:{export_running:`An export is already running for this camera.`,export_no_frames:`There are no frames in that range.`,export_bad_range:`The end of the range is before its start.`,export_cancelled:`Export cancelled.`,export_low_disk:`There is not enough free space in the media folder.`,export_ffmpeg_missing:`ffmpeg was not found on this Home Assistant, so the video could not be encoded.`,export_ffmpeg_failed:`ffmpeg could not encode the video. The Home Assistant log has the details.`,export_failed:`The export failed. The Home Assistant log has the details.`,entry_not_loaded:`This camera is not loaded right now. Try again once it has started.`,unknown:`The export could not be started.`},size:`Size`,size_value:`{v} % of the width`,position:`Position`,block_left:`Left block`,block_right:`Right block`,positions:{left:`Left`,right:`Right`,top:`Top`,bottom:`Bottom`},folder:`Videos are saved in {v}`,browse:`Open in media browser`,every:`Frames used`,every_all:`All`,every_n:`1 in {v}`,every_hint:`The timelapse runs faster, the video gets shorter and the file smaller.`,format:`Format`,aspects:{native:`As camera`,"16_9":`Landscape`,"9_16":`Portrait`,"1_1":`Square`},format_native:`The video keeps the camera's shape.`,format_same:`Matches the camera's shape, so nothing is cropped.`,format_crop:`Only the camera picture is cropped. The date and readings are laid out again in the new shape. Drag the frame in the picture to move the crop.`,crop:`Crop position`,crop_center:`Center`,crop_middle:`Middle`,soft_crop:`This crop is only {v} pixels and looks soft on a phone. For a sharper video, pick a larger width under “Resize to” in the camera's settings.`,sizes_hint:`This format keeps its own sizes, so the readings stay legible on a phone.`,frames:`Frames`,length:`Length`,file_size:`File size`,about:`about {v}`,size_estimate:`Estimated: between {low} and {high}. A lot of movement in the picture makes the file larger.`,low_disk:`Only {v} is free in the media folder. Choose a shorter range or fewer frames.`}},de:{empty:{no_frames:`Noch keine Bilder gespeichert.`,first_soon:`Das erste erscheint bei der nächsten Aufnahme.`,frame_failed:`Dieses Bild konnte nicht geladen werden.`,index_failed:`Die Zeitleiste konnte nicht geladen werden.`},badge:{live:`LIVE`,gap:`KEIN BILD`},controls:{play:`Abspielen`,pause:`Pause`,previous:`Vorheriges Bild`,next:`Nächstes Bild`,speed:`Wiedergabegeschwindigkeit {v}x`,now:`Zur Gegenwart springen`},track:{label:`Position auf der Zeitleiste`},spark:{range:`Spanne {v}`,flat:`Unverändert`},error:{no_camera:`Bitte wähle in der Kartenkonfiguration eine Kamera aus.`},version_update:`Diese Karte wurde auf {v} aktualisiert. Lade neu, um die neue Version zu verwenden.`,version_reload:`Neu laden`,editor:{camera_entity:`Kamera`,title:`Titel`,show_dayticks:`Tagesmarkierungen anzeigen`,show_graph:`Diagramme anzeigen`,show_sun:`Nacht markieren`,playback:`Wiedergabe`,autoplay:`Automatisch abspielen`,speed:`Geschwindigkeit`,graph_hours:`Diagramm-Zeitraum`,overlay_right:`Eingeblendete Messwerte (rechts)`,overlay_right_hint:`Die Werte über dem Bild gehören zu dem Zeitpunkt, zu dem du scrollst – nicht zur Gegenwart.`,overlay_left:`Eingeblendete Messwerte (links)`,overlay_left_hint:`Ein zweiter Block auf der anderen Seite des Bildes. Leer lassen, dann bleibt es bei einem Block rechts.`,add_entity:`Entität hinzufügen`,entity:`Entität`,name:`Bezeichnung`,unit:`Einheit`,decimals:`Nachkommastellen`,color:`Farbe`,graph:`Diagramm`,move_up:`Nach oben`,move_down:`Nach unten`,remove:`Entfernen`,helper:{camera_entity:`Nur Kameras dieser Integration haben ein Archiv zum Durchblättern.`,graph_hours:`Wie viel Verlauf die Sparkline rund um die Position zeigt.`,autoplay:`Wird ignoriert, wenn dein System reduzierte Bewegung anfordert.`,deflicker:`Gleicht wolkenbedingte Helligkeitssprünge bei der Wiedergabe aus. 0 schaltet es ab.`,overlay_title:`Wird über den Messwerten angezeigt. Leer lassen für keine Überschrift.`,overlay_title_left:`Wird über den Messwerten angezeigt. Leer lassen für keine Überschrift.`,show_icon:`Verwendet das Symbol der Entität aus Home Assistant.`,show_sun:`Hinterlegt die Stunden zwischen Sonnenuntergang und Sonnenaufgang in den Diagrammen und in der Zeitleiste, basierend auf deinem Home-Assistant-Standort. Wird ausgeblendet, sobald die Streifen zu fein werden.`,show_export:`Fügt der Wiedergabeleiste eine Export-Schaltfläche hinzu. Das Video wird von Home Assistant gerendert und im Medienordner gespeichert.`},deflicker:`Helligkeit glätten`,show_icon:`Symbol anzeigen`,overlay_title:`Überschrift`,overlay_title_left:`Überschrift`,show_export:`Videoexport anbieten`},actions:{show_camera:`Kameradetails anzeigen`,show_entity:`Details für {v} anzeigen`,hide_readings:`Messwerte ausblenden`,show_readings:`Messwerte einblenden`},export:{open:`Video exportieren`,close:`Export schließen`,from:`Von`,to:`Bis`,start_here:`Bei diesem Bild beginnen`,end_here:`Bei diesem Bild enden`,preset_hours:`Letzte {v} h`,preset_days:`Letzte {v} T`,preset_all:`Alles`,fps:`Bilder pro Sekunde`,timestamp:`Datum und Uhrzeit`,readings:`Sensorwerte`,summary_empty:`Keine Bilder in diesem Zeitraum.`,start:`Exportieren`,cancel:`Abbrechen`,preparing:`Wird vorbereitet…`,running:`Bild {done} von {total} wird kodiert`,done:`Video fertig`,saved:`Gespeichert als {v}`,watch:`Ansehen`,download:`Herunterladen`,cancelled:`Export abgebrochen.`,band:`Für den Export gewählter Zeitraum`,error:{export_running:`Für diese Kamera läuft bereits ein Export.`,export_no_frames:`In diesem Zeitraum gibt es keine Bilder.`,export_bad_range:`Das Ende des Zeitraums liegt vor seinem Anfang.`,export_cancelled:`Export abgebrochen.`,export_low_disk:`Im Medienordner ist nicht genug Speicherplatz frei.`,export_ffmpeg_missing:`ffmpeg wurde auf diesem Home Assistant nicht gefunden, daher konnte das Video nicht kodiert werden.`,export_ffmpeg_failed:`ffmpeg konnte das Video nicht kodieren. Details stehen im Home-Assistant-Protokoll.`,export_failed:`Der Export ist fehlgeschlagen. Details stehen im Home-Assistant-Protokoll.`,entry_not_loaded:`Diese Kamera ist gerade nicht geladen. Versuche es erneut, sobald sie gestartet ist.`,unknown:`Der Export konnte nicht gestartet werden.`},size:`Größe`,size_value:`{v} % der Breite`,position:`Position`,block_left:`Linker Block`,block_right:`Rechter Block`,positions:{left:`Links`,right:`Rechts`,top:`Oben`,bottom:`Unten`},folder:`Videos werden gespeichert in {v}`,browse:`Im Medienbrowser öffnen`,every:`Verwendete Bilder`,every_all:`Alle`,every_n:`Jedes {v}.`,every_hint:`Der Zeitraffer läuft schneller, das Video wird kürzer und die Datei kleiner.`,format:`Format`,aspects:{native:`Wie Kamera`,"16_9":`Querformat`,"9_16":`Hochformat`,"1_1":`Quadrat`},format_native:`Das Video behält das Format der Kamera.`,format_same:`Entspricht dem Format der Kamera, es wird nichts zugeschnitten.`,format_crop:`Nur das Kamerabild wird zugeschnitten. Datum und Sensorwerte ordnen sich im neuen Format neu an. Zieh den Rahmen im Bild, um den Ausschnitt zu verschieben.`,crop:`Bildausschnitt`,crop_center:`Zentrieren`,crop_middle:`Mitte`,soft_crop:`Dieser Ausschnitt hat nur {v} Pixel und wirkt am Handy unscharf. Für schärfere Videos wähle in den Einstellungen der Kamera unter „Verkleinern auf“ eine größere Breite.`,sizes_hint:`Dieses Format merkt sich eigene Größen, damit die Werte auch am Handy lesbar bleiben.`,frames:`Bilder`,length:`Länge`,file_size:`Dateigröße`,about:`etwa {v}`,size_estimate:`Geschätzt: zwischen {low} und {high}. Viel Bewegung im Bild macht die Datei größer.`,low_disk:`Im Medienordner sind nur {v} frei. Wähle einen kürzeren Zeitraum oder weniger Bilder.`}}};function Le(e,t){let n=e.split(`.`).reduce((e,t)=>{if(e&&typeof e==`object`&&t in e)return e[t]},t);return typeof n==`string`?n:void 0}function B(e,t,n=``,r=``){let i=Ie[(t??`en`).toLowerCase().split(/[-_]/)[0]??`en`]??Ie.en??{},a=Ie.en??{},o=Le(e,i);return o===void 0&&(o=Le(e,a)),o===void 0&&(o=e),n!==``&&r!==``&&(o=o.replace(n,r)),o}function V(e,t,n,r){var i=arguments.length,a=i<3?t:r===null?r=Object.getOwnPropertyDescriptor(t,n):r,o;if(typeof Reflect==`object`&&typeof Reflect.decorate==`function`)a=Reflect.decorate(e,t,n,r);else for(var s=e.length-1;s>=0;s--)(o=e[s])&&(a=(i<3?o(a):i>3?o(t,n,a):o(t,n))||a);return i>3&&a&&Object.defineProperty(t,n,a),a}var H,Re=[1,2,4,8,16,32,64],ze=[{name:`overlay_title`,selector:{text:{}}}],Be=[{name:`overlay_title_left`,selector:{text:{}}}],Ve=[{type:`grid`,schema:[{name:`name`,selector:{text:{}}},{name:`unit`,selector:{text:{}}},{name:`decimals`,selector:{number:{min:0,max:4,mode:`box`}}},{name:`graph_hours`,selector:{number:{min:1,max:8760,mode:`box`,unit_of_measurement:`h`}}},{name:`show_icon`,selector:{boolean:{}}},{name:`graph`,selector:{boolean:{}}}]}],U=class extends R{static{H=this}constructor(...e){super(...e),this.computeLabel=e=>this.t(`editor.${e.name}`),this.computeHelper=e=>{let t=this.t(`editor.helper.${e.name}`);return t.startsWith(`editor.`)?void 0:t},this.onFormChange=e=>{e.stopPropagation(),this.emit({...this.config,...e.detail.value})}}static{this.styles=Fe}setConfig(e){this.config=e}get uiLanguage(){return this.hass?.locale?.language??this.hass?.language??`en`}t(e){return B(e,this.uiLanguage)}get schema(){return[{name:`camera_entity`,required:!0,selector:{entity:{filter:{domain:`camera`,integration:`webcam_timelapse`}}}},{name:`title`,selector:{text:{}}},{type:`grid`,schema:[{name:`show_dayticks`,selector:{boolean:{}}},{name:`show_graph`,selector:{boolean:{}}},{name:`show_sun`,selector:{boolean:{}}},{name:`show_export`,selector:{boolean:{}}}]},{type:`expandable`,name:`playback`,icon:`mdi:play-speed`,flatten:!0,schema:[{name:`autoplay`,selector:{boolean:{}}},{name:`speed`,selector:{select:{mode:`dropdown`,options:Re.map(e=>({value:e,label:`${e}x`}))}}},{name:`deflicker`,selector:{number:{min:0,max:100,step:5,mode:`slider`}}},{name:`graph_hours`,selector:{number:{min:1,max:336,mode:`slider`,unit_of_measurement:`h`}}}]}]}emit(e){this.dispatchEvent(new CustomEvent(`config-changed`,{detail:{config:e},bubbles:!0,composed:!0}))}static{this.ENTITY_KEY={right:`entities`,left:`entities_left`}}rows(e){return this.config?.[H.ENTITY_KEY[e]]??[]}updateRows(e,t){this.emit({...this.config,[H.ENTITY_KEY[e]]:t})}addRow(e){this.updateRows(e,[...this.rows(e),{entity:``}])}removeRow(e,t){this.updateRows(e,this.rows(e).filter((e,n)=>n!==t))}moveRow(e,t,n){let r=[...this.rows(e)],i=t+n;i<0||i>=r.length||([r[t],r[i]]=[r[i],r[t]],this.updateRows(e,r))}patchRow(e,t,n){let r=this.rows(e).map((e,r)=>r===t?{...e,...n}:e);this.updateRows(e,r)}renderRow(e,t,n){return M`
      <div class="ent-row" role="group" aria-label=${t.name||t.entity||this.t(`editor.entity`)}>
        <ha-entity-picker
          .hass=${this.hass}
          .value=${t.entity}
          allow-custom-entity
          @value-changed=${t=>{t.stopPropagation(),this.patchRow(e,n,{entity:t.detail.value})}}
        ></ha-entity-picker>

        <ha-form
          .hass=${this.hass}
          .data=${t}
          .schema=${Ve}
          .computeLabel=${this.computeLabel}
          @value-changed=${t=>{t.stopPropagation(),this.patchRow(e,n,t.detail.value)}}
        ></ha-form>

        <div class="ent-controls">
          <!-- The one sanctioned native control: HA ships no colour
               selector. Both @input and @change are wired — @input gives
               a live preview while dragging, @change is what fires on
               some platforms when the picker closes. -->
          <label class="swatch">
            <span>${this.t(`editor.color`)}</span>
            <input
              type="color"
              .value=${t.color??`#3d7ea6`}
              @input=${t=>this.patchRow(e,n,{color:t.target.value})}
              @change=${t=>this.patchRow(e,n,{color:t.target.value})}
            />
          </label>
        </div>

        <div class="ent-actions">
          <ha-icon-button
            .label=${this.t(`editor.move_up`)}
            .disabled=${n===0}
            @click=${()=>this.moveRow(e,n,-1)}
          >
            <ha-icon icon="mdi:arrow-up"></ha-icon>
          </ha-icon-button>
          <ha-icon-button
            .label=${this.t(`editor.move_down`)}
            .disabled=${n===this.rows(e).length-1}
            @click=${()=>this.moveRow(e,n,1)}
          >
            <ha-icon icon="mdi:arrow-down"></ha-icon>
          </ha-icon-button>
          <ha-icon-button
            .label=${this.t(`editor.remove`)}
            @click=${()=>this.removeRow(e,n)}
          >
            <ha-icon icon="mdi:delete-outline"></ha-icon>
          </ha-icon-button>
        </div>
      </div>
    `}render(){return!this.hass||!this.config?M`${P}`:M`
      <ha-form
        .hass=${this.hass}
        .data=${this.config}
        .schema=${this.schema}
        .computeLabel=${this.computeLabel}
        .computeHelper=${this.computeHelper}
        @value-changed=${this.onFormChange}
      ></ha-form>

      ${this.renderSection(`right`,ze)}
      ${this.renderSection(`left`,Be)}
    `}renderSection(e,t){return M`
      <div class="ent-section">
        <h4>${this.t(`editor.overlay_`+e)}</h4>
        <p class="ent-hint">${this.t(`editor.overlay_`+e+`_hint`)}</p>

        <div class="ent-title">
          <ha-form
            .hass=${this.hass}
            .data=${this.config}
            .schema=${t}
            .computeLabel=${this.computeLabel}
            .computeHelper=${this.computeHelper}
            @value-changed=${this.onFormChange}
          ></ha-form>
        </div>

        ${this.rows(e).map((t,n)=>this.renderRow(e,t,n))}
        <ha-button @click=${()=>this.addRow(e)}>
          <ha-icon icon="mdi:plus" slot="icon"></ha-icon>
          ${this.t(`editor.add_entity`)}
        </ha-button>
      </div>
    `}};V([Me({attribute:!1})],U.prototype,`hass`,void 0),V([z()],U.prototype,`config`,void 0),U=H=V([ke(`webcam-timelapse-card-editor`)],U);var He=class{constructor(e){this.task=e,this.running=!1,this.queued=!1,this.waiters=[]}request(){return new Promise(e=>{this.waiters.push(e),this.running?this.queued=!0:this.drain()})}get busy(){return this.running}async drain(){this.running=!0;try{do{this.queued=!1;let e=this.waiters;this.waiters=[];try{await this.task()}catch{}for(let t of e)t()}while(this.queued)}finally{this.running=!1}}},Ue=`0.7.0`,We=`webcam-timelapse-card`,Ge=`webcam_timelapse/index`,Ke=`webcam_timelapse/card_version`,qe=`webcam_timelapse/luma`,Je=`webcam_timelapse/export/start`,Ye=`webcam_timelapse/export/subscribe`,Xe=`webcam_timelapse/export/cancel`,Ze=`media_source/resolve_media`,Qe={radius:6,maxGain:1.5};function $e(e,t=.15){if(e.length===0)return 0;let n=e.toSorted((e,t)=>e-t),r=Math.floor(n.length*t),i=n.length-2*r>=3?n.slice(r,n.length-r):n;return i.reduce((e,t)=>e+t,0)/i.length}function et(e,t=Qe){let n=new Float32Array(e.length).fill(1),{radius:r,maxGain:i}=t;if(r<1||e.length===0)return n;let a=1/i;for(let t=0;t<e.length;t++){let o=e[t];if(o==null||o<8)continue;let s=Math.max(0,t-r),c=Math.min(e.length-1,t+r),l=[];for(let t=s;t<=c;t++){let n=e[t];n!=null&&n>=8&&l.push(n)}if(l.length<3)continue;let u=$e(l);n[t]=Math.min(Math.max(u/o,a),i)}return n}function tt(e){let t=Math.min(Math.max(e,0),100);return t===0?0:Math.max(1,Math.round(t/100*12))}var nt={base:``,ext:`.webp`,step:600,t0:null,count:0,gaps:[],retention_days:0,online:!0,newest_slot:null};function W(e,t){return e.t0===null||t<0||t>=e.count?null:e.t0+t*e.step}function rt(e,t){let n=W(e,t);return n===null?null:`${e.base}${n}${e.ext}`}function it(e){let t=new Uint8Array(e.count).fill(1);for(let[n,r]of e.gaps){let i=Math.max(0,n),a=Math.min(e.count,n+r);for(let e=i;e<a;e++)t[e]=0}return t}function G(e,t,n=1){for(let r=t;r>=0&&r<e.length;r+=n)if(e[r])return r;return null}function K(e){return e.t0!==null&&e.count>0}var at=class{constructor(e){this.size=e,this.cursor=0,this.slots=Array.from({length:e},()=>null)}prefetch(e){let t=new Image;t.decoding=`async`,t.fetchPriority=`low`,t.src=e,this.slots[this.cursor]=t,this.cursor=(this.cursor+1)%this.size}clear(){this.slots.fill(null),this.cursor=0}};function q(e){return Math.min(Math.max(Math.round(4*e),4),16)}var ot=500,st=1e3/33;1e3/ot;function ct(e){let t=Math.max(e,0)*2;if(t<=0)return{stride:1,frameDelay:ot};let n=Math.max(1,Math.round(t/st));return{stride:n,frameDelay:Math.max(1e3*n/t,33)}}function lt(e,t,n){let r=G(e,t+Math.max(1,n));if(r!==null)return r;let i=G(e,e.length-1,-1);return i!==null&&i>t?i:null}function ut(e,t,n,r,i){let a=Math.max(1,r),o=i>t+n*a?t:Math.max(i,t),s=[];for(let r=1;r<=n;r++){let n=t+r*a;if(n<=o)continue;let i=G(e,n);if(i===null)break;i>o&&(s.push(i),o=i)}return s}function dt(e){return e.currentSrc!==e.requested||!e.complete?`pending`:e.naturalWidth>0?`ready`:`failed`}function ft(e){return e.configured&&!e.reducedMotion&&!e.alreadyPlaying}function pt(e,t,n){return n.reducedMotion?0:n.playing?e>4?0:Math.min(120,Math.round(t/2)):120}function mt(e){return e?.trim()||void 0}function ht(e){let t=[],n=e?.entities_left??[];n.length>0&&t.push({side:`left`,title:mt(e?.overlay_title_left),entities:n});let r=e?.entities??[];return r.length>0&&t.push({side:`right`,title:mt(e?.overlay_title),entities:r}),t}function gt(e){return ht(e).flatMap(e=>e.entities)}var _t=[12,24,30,60],vt=[`left`,`right`,`top`,`bottom`],yt={min:10,max:80,step:5,default:30},bt={min:5,max:50,step:5,default:15},xt=[`native`,`16:9`,`9:16`,`1:1`],St={"16:9":16/9,"9:16":9/16,"1:1":1},Ct={native:`mdi:camera-outline`,"16:9":`mdi:crop-landscape`,"9:16":`mdi:crop-portrait`,"1:1":`mdi:crop-square`},wt={native:{timestamp:bt.default,readings:yt.default},"16:9":{timestamp:bt.default,readings:yt.default},"1:1":{timestamp:20,readings:40},"9:16":{timestamp:30,readings:55}},Tt=[1,2,5,10],J=e=>Math.max(2,e-e%2);function Et(e,t,n){let[r,i]=e;if(t===`native`)return[0,0,r,i];let a=St[t],o=Math.min(1,Math.max(0,n/100));if(r/i>a){let e=Math.min(J(Dt(i*a)),J(r)),t=Dt((r-e)*o);return[t,0,t+e,J(i)]}let s=Math.min(J(Dt(r/a)),J(i)),c=Dt((i-s)*o);return[0,c,J(r),c+s]}function Dt(e){let t=Math.floor(e),n=e-t;return n>.5?t+1:n<.5||t%2==0?t:t+1}function Ot(e,t){let[n,r,i,a]=Et(e,t,50);return i-n<J(e[0])?`x`:a-r<J(e[1])?`y`:null}function kt(e,t,n){let[r,i,a,o]=Et(e,t,n),[s,c]=e;return{left:r/s*100,top:i/c*100,width:(a-r)/s*100,height:(o-i)/c*100}}function At(e,t,n){let[r,i,a,o]=Et(e,t,n);return[J(a-r),J(o-i)]}function jt(e,t){return e<=0?0:Math.ceil(e/Math.max(1,t))}var Mt=.1,Nt={low:.7,high:1.3};function Pt(e,t){let n=e*t[0]*t[1]*Mt/8;return{bytes:n,low:n*Nt.low,high:n*Nt.high}}var Ft=[[`16:9`,16/9],[`4:3`,4/3],[`3:2`,3/2],[`5:4`,5/4],[`1:1`,1],[`21:9`,21/9],[`9:16`,9/16],[`3:4`,3/4]];function It(e){let t=e[0]/e[1],n=Ft.find(([,e])=>Math.abs(t/e-1)<.01);return n?n[0]:`${t.toFixed(2)}:1`}var Lt=[24,72,168];function Rt(e){return e.t0===null||e.count===0?null:{start:0,end:e.count-1}}function zt(e,t){let n=Math.max(0,t-1),r=e=>Math.min(Math.max(Math.round(e),0),n),i=r(e.start),a=r(e.end);return i<=a?{start:i,end:a}:{start:a,end:i}}function Bt(e,t,n){let r=zt({start:t,end:t},n).start;return{start:r,end:Math.max(e.end,r)}}function Vt(e,t,n){let r=zt({start:t,end:t},n).end;return{start:Math.min(e.start,r),end:r}}function Ht(e,t){let n=Rt(e);if(n===null)return null;let r=Math.round(t*3600/e.step);return{start:Math.max(0,n.end-r),end:n.end}}function Ut(e,t){return e.count*e.step>t*3600}function Wt(e,t){let n=0,r=Math.min(t.end,e.length-1);for(let i=Math.max(0,t.start);i<=r;i++)e[i]&&n++;return n}function Gt(e,t){let n=W(e,t.start),r=W(e,t.end);return n===null||r===null?null:{start:n,end:r}}function Kt(e,t){let n=Math.max(1,t-1);return{left:e.start/n*100,width:(e.end-e.start)/n*100}}function qt(e){if(!Number.isFinite(e)||e<=0)return`0 s`;if(e<60)return e<10?`${(Math.round(e*10)/10).toString()} s`:`${Math.round(e)} s`;let t=Math.round(e),n=e=>String(e).padStart(2,`0`),r=Math.floor(t/60);return r<60?`${r}:${n(t%60)} min`:`${Math.floor(r/60)}:${n(r%60)}:${n(t%60)} h`}function Jt(e){return`/media-browser/browser/${encodeURIComponent(`,${e}`)}`}function Y(e){if(!Number.isFinite(e)||e<=0)return`0 MB`;let t=e/1e6;return t>=1e3?`${(t/1e3).toFixed(1)} GB`:t>=10?`${Math.round(t)} MB`:`${t.toFixed(1)} MB`}function Yt(e){return!e||e.total<=0?0:Math.min(1,Math.max(0,e.done/e.total))}function Xt(e){let t=/^rgba?\(\s*(\d+)[\s,]+(\d+)[\s,]+(\d+)/.exec(e.trim());return t?`#${t.slice(1,4).map(e=>Math.min(255,Number(e)).toString(16).padStart(2,`0`)).join(``)}`:e}function Zt(e,t){return Number.isFinite(e)?Math.min(t.max,Math.max(t.min,Math.round(e))):t.default}function Qt(e,t){if(gt(e).length===0)return null;let n=e=>(e??[]).map(e=>e.color?{...e,color:Xt(t(e.color))}:e);return{entities:n(e.entities),entities_left:n(e.entities_left),overlay_title:e.overlay_title??``,overlay_title_left:e.overlay_title_left??``,graph_hours:e.graph_hours??24,show_graph:e.show_graph!==!1,show_sun:e.show_sun===!0,accent_color:Xt(t(`var(--wtl-accent)`))}}function $t(e,t,n,r,i,a){let o=Gt(t,n);return o===null?null:{entity_id:e.camera_entity,start:o.start,end:o.end,fps:r.fps,deflicker:Math.min(100,Math.max(0,Math.round(e.deflicker??0))),timestamp:r.timestamp,timestamp_size:Zt(r.timestampSize,bt),overlay:r.readings?Qt(e,a):null,readings_size:Zt(r.readingsSize,yt),readings_position:r.positions.right??null,readings_position_left:r.positions.left??null,aspect:r.aspect,crop_position:Math.min(100,Math.max(0,Math.round(r.cropPosition))),every:Math.min(60,Math.max(1,Math.round(r.every))),language:i}}var en=/* @__PURE__ */ new Map;function X(e,t){let n=`${e}|${JSON.stringify(t)}`,r=en.get(n);return r===void 0&&(r=new Intl.DateTimeFormat(e,t),en.set(n,r)),r}function tn(e,t){return X(`en-CA`,{timeZone:t,year:`numeric`,month:`2-digit`,day:`2-digit`}).format(/* @__PURE__ */ new Date(e*1e3))}function nn(e,t){let n=X(`en-GB`,{timeZone:t,hour:`2-digit`,minute:`2-digit`,second:`2-digit`,hour12:!1}).formatToParts(/* @__PURE__ */ new Date(e*1e3)),r=0,i=0,a=0;for(let e of n)e.type===`hour`?r=Number(e.value):e.type===`minute`?i=Number(e.value):e.type===`second`&&(a=Number(e.value));return r===24&&(r=0),r*3600+i*60+a}function rn(e,t,n,r){let i={timeZone:t,day:`2-digit`,month:`2-digit`};return r===`long`&&(i.weekday=`long`),r===`short`&&(i.weekday=`short`),X(n,i).format(/* @__PURE__ */ new Date(e*1e3))}function an(e){return e>=560?`long`:e>=380?`short`:`date`}function on(e,t,n){let r=Math.max(1,Math.floor(t/n));return Math.max(1,Math.ceil(e/r))}function sn(e,t,n,r){if(e.t0===null||e.count===0)return[];let i=an(r),a=i===`long`?110:i===`short`?78:58,o=[],s=tn(e.t0,t);for(let n=1;n<e.count;n++){let r=W(e,n);if(r===null)continue;let i=tn(r,t);i!==s&&(o.push({position:n,slot:r,date:i}),s=i)}let c=on(o.length,r,a),l=Math.max(1,e.count-1);return o.map((e,r)=>{let a=e.date.endsWith(`-01`),o=a||r%c===0;return{position:e.position,left:e.position/l*100,label:o?rn(e.slot,t,n,i):``,isMonthStart:a}})}var cn=[600,900,1800,3600,7200,10800,21600,43200],ln=9,un=46;function dn(e,t,n){if(e<=0)return null;let r=e/Math.max(2,Math.floor(n/ln));for(let e of cn)if(e>=r&&e>=t)return e;return null}function fn(e,t,n,r){if(e.t0===null||e.count===0)return[];let i=e.t0,a=Math.max(1,e.count-1),o=i+a*e.step,s=dn(o-i,e.step,r);if(s===null)return[];let c=s/(o-i)*r,l=Math.max(1,Math.ceil(un/c)),u=Math.min(43200,s*l),d=[],f=nn(i,t)%s,p=f===0?i:i+(s-f),m=-1/0;for(let c=0;p<=o&&c<4096;c++){let o=nn(p,t),c=o%s;if(c===0){let s=Math.round((p-i)/e.step),c=s/a*100,l=c/100*r,f=``;o%u===0&&l-m>=un&&(f=mn(p,t,n),m=l),d.push({position:s,left:c,label:f})}p+=s-c}return d}function pn(e,t,n){return X(n,{timeZone:t,weekday:`short`,day:`2-digit`,month:`2-digit`,hour:`2-digit`,minute:`2-digit`}).format(/* @__PURE__ */ new Date(e*1e3))}function mn(e,t,n){return X(n,{timeZone:t,hour:`2-digit`,minute:`2-digit`}).format(/* @__PURE__ */ new Date(e*1e3))}var hn=/* @__PURE__ */ new Set([`unknown`,`unavailable`,`none`,``]),gn=/* @__PURE__ */ new Map,_n=/* @__PURE__ */ new Map;function vn(e){if(typeof e.lu==`number`)return Math.round(e.lu*1e3);let t=e.lu??e.last_updated??e.last_changed;return t?new Date(t).getTime():0}function yn(e,t){let n=(e.a??e.attributes)?.[t];if(typeof n!=`string`&&typeof n!=`number`)return null;let r=new Date(n).getTime();return Number.isFinite(r)&&r>0?r:null}async function bn(e,t,n){let r=e?.callWS?.bind(e);if(!r||t.length===0)return/* @__PURE__ */ new Map;let i=n.timeAttributes??{},a=`${t.toSorted().join(`,`)}|${n.days}`,o=_n.get(a);if(o)return o;let s=/* @__PURE__ */ new Date,c=/* @__PURE__ */ new Date(s.getTime()-n.days*864e5),l=Object.keys(i).length>0,u=(async()=>{try{let e=await r({type:`history/history_during_period`,start_time:c.toISOString(),end_time:s.toISOString(),entity_ids:t,minimal_response:!l,no_attributes:!l,significant_changes_only:!0}),n=/* @__PURE__ */ new Map;for(let r of t){let t=i[r],a=(e?.[r]??[]).map(e=>{let n=String(e.s??e.state??``).trim(),r=hn.has(n.toLowerCase())?NaN:parseFloat(n);return{at:(t?yn(e,t):null)??vn(e),value:r}}).filter(e=>Number.isFinite(e.value)&&e.at>0).toSorted((e,t)=>e.at-t.at);n.set(r,a),gn.set(r,a)}return n}catch{return new Map(t.map(e=>[e,gn.get(e)??[]]))}finally{_n.delete(a)}})();return _n.set(a,u),u}function xn(e,t,n){if(e.length===0)return null;let r=0,i=e.length-1,a=-1;for(;r<=i;){let n=r+i>>1;e[n].at<=t?(a=n,r=n+1):i=n-1}if(a===-1)return null;let o=e[a];return{value:o.value,at:o.at,stale:t-o.at>n}}function Sn(e){if(!Number.isFinite(e)||e<=0)return 0;let t=e*(1+1e-9),n=10**Math.floor(Math.log10(t)),r=t/n;return(r>=5?5:r>=2?2:1)*n}var Cn=/* @__PURE__ */ new WeakMap;function wn(e){let t=Cn.get(e);if(t)return t;let n=[];for(let t=1;t<e.length;t++){let r=Math.abs(e[t].value-e[t-1].value);r>0&&n.push(r)}n.sort((e,t)=>e-t);let r=n[Math.floor(n.length*.1)],i={quantum:r===void 0?0:Sn(r),staleAfter:Tn(e)};return Cn.set(e,i),i}function Tn(e,t=54e5){if(e.length<3)return t;let n=[];for(let t=1;t<e.length;t++)n.push(e[t].at-e[t-1].at);n.sort((e,t)=>e-t);let r=n[n.length>>1]??t;return Math.max(r*2,t)}function En(e,t,n){let r=n*36e5/2,i=t-r,a=t+r,o=e.filter(e=>e.at>=i&&e.at<=a);if(o[0]?.at===i)return o;let s;for(let t of e){if(t.at>=i)break;s=t}return s?[{at:i,value:s.value},...o]:o}async function Dn(e,t,n){if(!e?.callWS)return null;try{let r=await e.callWS({type:t});if(r?.version&&r.version!==n)return r.version}catch{}return null}function On(){try{window.caches?.keys?.().then(e=>{e.forEach(e=>window.caches?.delete?.(e))}).catch(()=>{})}catch{}window.location.reload()}function kn(e,t){if(!e)return P;let n=t(`version_update`).replace(`{v}`,e),r=t(`version_reload`);return M`
    <div class="banner" role="alert" aria-live="assertive">
      <span>${n}</span>
      <button
        type="button"
        aria-label=${r}
        @click=${On}
      >
        ${r}
      </button>
    </div>
  `}var An=240,jn=44,Mn=3;function Nn(e){if(!Number.isFinite(e)||e<=0)return 1;let t=10**Math.floor(Math.log10(e)),n=e/t;return(n>5?10:n>2?5:n>1?2:1)*t}function Pn(e){if(e.length===0)return 0;let t=1/0,n=-1/0;for(let r of e)r.value<t&&(t=r.value),r.value>n&&(n=r.value);return n-t}function Fn(e){let{points:t,at:n,hours:r,color:i,label:a,quantum:o=0,nights:s=[]}=e;if(t.length===0)return null;let c=r*36e5/2,l=n-c,u=n+c,d=u-l||1,f=1/0,p=-1/0;for(let e of t)e.value<f&&(f=e.value),e.value>p&&(p=e.value);let m=p-f,h=(f+p)/2,g=Math.max(4*o,Math.abs(h)*1e-9),_=Math.max(m,g)||1,v=h-_/2,y=h+_/2;if(m>0){let e=Nn(_/4);v=Math.floor(v/e)*e,y=Math.ceil(y/e)*e,y>v||(v=h-_/2,y=h+_/2)}let b=y-v||1,x=e=>Mn+(e-l)/d*234,S=e=>41-(e-v)/b*38,C=[];t.forEach((e,t)=>{let n=x(e.at),r=S(e.value);t===0?C.push(`M ${n.toFixed(1)} ${r.toFixed(1)}`):C.push(`H ${n.toFixed(1)}`,`V ${r.toFixed(1)}`)});let ee=t[t.length-1];C.push(`H ${x(u).toFixed(1)}`);let te=s.map(e=>({left:Mn+e.left*234,width:e.width*234})),w=x(n),T=ee;for(let e=t.length-1;e>=0;e--)if(t[e].at<=n){T=t[e];break}return me`
    <svg
      class="spark"
      viewBox="0 0 ${An} ${jn}"
      preserveAspectRatio="none"
      role="img"
      aria-label=${a}
    >
      ${te.map(e=>me`<rect
          class="spark-night"
          x=${e.left.toFixed(1)}
          y="0"
          width=${e.width.toFixed(1)}
          height=${jn}
        />`)}
      <path
        d=${C.join(` `)}
        fill="none"
        stroke=${i}
        stroke-width="1.5"
        stroke-linejoin="round"
        vector-effect="non-scaling-stroke"
      />
      <line
        x1=${w.toFixed(1)}
        y1="0"
        x2=${w.toFixed(1)}
        y2=${jn}
        stroke="currentColor"
        stroke-width="1"
        opacity="0.5"
        vector-effect="non-scaling-stroke"
      />
      <path
        d="M ${w.toFixed(1)} ${S(T.value).toFixed(1)} L ${w.toFixed(1)} ${S(T.value).toFixed(1)}"
        stroke=${i}
        stroke-width="5"
        stroke-linecap="round"
        vector-effect="non-scaling-stroke"
      />
    </svg>
  `}var Z=864e5,In=2440587.5,Ln=2451545,Q=Math.PI/180,Rn=23.4397,zn=-.833;function Bn(e,t,n){let r=2451545.0009-n/360+e,i=Vn(r),a=(357.5291+.98560028*(r-Ln))%360,o=(a+(1.9148*Math.sin(a*Q)+.02*Math.sin(2*a*Q)+3e-4*Math.sin(3*a*Q))+180+102.9372)%360,s=r+.0053*Math.sin(a*Q)-.0069*Math.sin(2*o*Q),c=Math.sin(o*Q)*Math.sin(Rn*Q),l=Math.cos(Math.asin(c)),u=(Math.sin(zn*Q)-Math.sin(t*Q)*c)/(Math.cos(t*Q)*l);if(!Number.isFinite(u)||Math.abs(u)>1)return{noon:i,rise:null,set:null,polarNight:u>1};let d=Math.acos(u)/Q;return{noon:i,rise:Vn(s-d/360),set:Vn(s+d/360),polarNight:!1}}function Vn(e){return(e-In)*Z}function Hn(e,t){return Math.round(e/Z+In-Ln-9e-4+t/360)}function Un(e,t,n,r){if(!Number.isFinite(e)||!Number.isFinite(t)||t<=e||!Number.isFinite(n)||!Number.isFinite(r)||Math.abs(n)>90)return[];let i=Hn(e,r)-1,a=Hn(t,r)+1;if(a-i>800)return[];let o=[];for(let e=i;e<=a;e++){let t=Bn(e,n,r);if(t.set===null){t.polarNight&&Kn(o,t.noon-Z/2,t.noon+Z/2);continue}let i=Bn(e+1,n,r);Kn(o,t.set,i.rise??i.noon-Z/2)}return qn(o,e,t)}var Wn=4/234;function Gn(e,t,n,r){let i=t-e;if(!(i>0))return[];let a=Un(e,t,n,r).map(t=>({left:(t.from-e)/i,width:(t.to-t.from)/i}));return a.reduce((e,t)=>Math.max(e,t.width),0)>=Wn?a:[]}function Kn(e,t,n){if(n<=t)return;let r=e[e.length-1];r&&t<=r.to?r.to=Math.max(r.to,n):e.push({from:t,to:n})}function qn(e,t,n){let r=[];for(let i of e){let e=Math.max(i.from,t),a=Math.min(i.to,n);a>e&&r.push({from:e,to:a})}return r}function Jn(e){if(!e)return;let t=e.trim();if(t.startsWith(`/`)||t.startsWith(`https://`))return t}function Yn(e){if(!Number.isFinite(e)||e<=0)return`0`;if(e>=100)return Math.round(e).toString();let t=e.toPrecision(2);return t.includes(`.`)?t.replace(/0+$/,``).replace(/\.$/,``):t}function Xn(e){return!Number.isFinite(e)||e<=0?``:e<1?`${Math.round(e*60)} min`:e<48?`${Math.round(e)} h`:`${Math.round(e/24)} d`}function Zn(){return typeof window<`u`&&typeof window.matchMedia==`function`&&window.matchMedia(`(prefers-reduced-motion: reduce)`).matches}var Qn=[1,2,4,8,16,32,64],$n=32,er=80,tr=1500,$=class extends R{constructor(...e){super(...e),this.index=nt,this.position=0,this.playing=!1,this.speed=1,this.trackWidth=600,this.versionMismatch=null,this.history=/* @__PURE__ */ new Map,this.folded=/* @__PURE__ */ new Set,this.exportOpen=!1,this.exportRange=null,this.exportFps=24,this.exportStamp=!0,this.exportReadings=!0,this.exportAspect=`native`,this.exportCrop=50,this.exportEvery=1,this.exportSizes={...wt},this.frameSize=null,this.exportPositions={},this.exportStatus=null,this.exportSubscription=0,this.present=/* @__PURE__ */ new Uint8Array,this.ring=new at(q(1)),this.prefetchedThrough=-1,this.useLayerA=!0,this.frameGeneration=0,this.swaps=new He(()=>this.performSwap()),this.gains=/* @__PURE__ */ new Float32Array,this.versionChecked=!1,this.autoplayPending=!0,this.playCounter=0,this.lastScrubAt=0,this.visible=!0,this.onScreen=!0,this.onVisibilityChange=()=>{this.visible=document.visibilityState===`visible`,this.reconcilePlayback(),this.visible&&this.refreshIndex()},this.togglePlay=()=>{if(!this.playing&&this.atLive){let e=G(this.present,0);e!==null&&(this.position=e)}this.playing=!this.playing,this.reconcilePlayback()},this.cycleSpeed=()=>{let e=Qn[(Qn.indexOf(this.speed)+1)%Qn.length];this.speed=e??1,this.ring=new at(q(this.speed)),this.prefetchedThrough=-1},this.onScrub=e=>{this.scrubTo(Number(e.target.value))},this.onScrubCommit=e=>{this.scrubSettle&&window.clearTimeout(this.scrubSettle),this.scrubSettle=void 0,this.pendingPosition=Number(e.target.value),this.loadPendingPosition()},this.jumpToNow=()=>{this.playing=!1,this.stopPlayback(),this.goTo(this.index.count-1)},this.onHandleMove=e=>{let t=this.exportDrag,n=this.exportSelection;if(!t||t.kind===`crop`||n===null||t.track.width<=0)return;let r=Math.max(0,this.index.count-1),i=Math.min(1,Math.max(0,(e.clientX-t.track.left)/t.track.width)),a=Math.round(i*r);this.exportRange=t.kind===`start`?Bt(n,a,this.index.count):Vt(n,a,this.index.count),this.scrubTo(a)},this.onCropDown=e=>{let t=this.exportCropAxis,n=e.currentTarget.parentElement;if(!t||!n||!this.frameSize)return;e.preventDefault(),e.stopPropagation(),e.currentTarget.setPointerCapture(e.pointerId);let r=n.getBoundingClientRect(),i=kt(this.frameSize,this.exportAspect,this.exportCrop),a=t===`x`?r.width*(1-i.width/100):r.height*(1-i.height/100);this.exportDrag={kind:`crop`,from:t===`x`?e.clientX:e.clientY,crop:this.exportCrop,travel:a,axis:t}},this.onCropMove=e=>{let t=this.exportDrag;if(!t||t.kind!==`crop`||t.travel<=0)return;let n=(t.axis===`x`?e.clientX:e.clientY)-t.from;this.exportCrop=Math.min(100,Math.max(0,Math.round(t.crop+n/t.travel*100)))},this.endExportDrag=()=>{this.exportDrag&&this.exportDrag.kind!==`crop`&&this.loadPendingPosition(),this.exportDrag=void 0},this.toggleExport=()=>{this.exportOpen=!this.exportOpen,this.exportError=void 0,this.exportOpen?this.subscribeExport():this.unsubscribeExport()},this.navigateInApp=e=>{if(e.button!==0||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;let t=e.currentTarget.getAttribute(`href`);t&&(e.preventDefault(),history.pushState(null,``,t),window.dispatchEvent(new CustomEvent(`location-changed`,{detail:{replace:!1}})))},this.resolveColor=e=>{let t=document.createElement(`span`);t.style.display=`none`,t.style.color=e,this.renderRoot.appendChild(t);let n=getComputedStyle(t).color;return t.remove(),n||e},this.startExport=async()=>{let e=this.exportSelection;if(!this.hass?.callWS||!this.config||e===null)return;let t=$t(this.config,this.index,e,{fps:this.exportFps,timestamp:this.exportStamp,timestampSize:this.exportSize.timestamp,readings:this.exportReadings,readingsSize:this.exportSize.readings,positions:this.exportPositions,aspect:this.exportAspect,cropPosition:this.exportCrop,every:this.exportEvery},this.language,this.resolveColor);if(t!==null){this.exportError=void 0;try{this.exportStatus=await this.hass.callWS({type:Je,...t})}catch(e){this.exportError=this.exportErrorKey(e)}}},this.cancelExport=async()=>{if(this.hass?.callWS&&this.config)try{await this.hass.callWS({type:Xe,entity_id:this.config.camera_entity})}catch(e){this.exportError=this.exportErrorKey(e)}},this.markExportStart=()=>{let e=this.exportSelection;e&&(this.exportRange=Bt(e,this.position,this.index.count))},this.markExportEnd=()=>{let e=this.exportSelection;e&&(this.exportRange=Vt(e,this.position,this.index.count))},this.onStageClick=e=>{let t=e.composedPath(),n=t.indexOf(e.currentTarget);(n===-1?t:t.slice(0,n)).some(e=>e instanceof HTMLElement&&(e.classList.contains(`controls`)||e.classList.contains(`crop-window`)||e.classList.contains(`readout-row`)||e.classList.contains(`readout-fold`)))||this.config&&this.fireMoreInfo(this.config.camera_entity)}}static{this.styles=Fe}setConfig(e){if(!e?.camera_entity)throw Error(B(`error.no_camera`,this.hass?.locale?.language));this.config={autoplay:!1,speed:$n,show_dayticks:!0,show_graph:!0,show_sun:!1,graph_hours:24,deflicker:50,show_export:!0,...e,entities:(e.entities??[]).filter(e=>e?.entity),entities_left:(e.entities_left??[]).filter(e=>e?.entity)},this.speed=Qn.includes(this.config.speed)?this.config.speed:$n,this.ring=new at(q(this.speed))}static getConfigElement(){return document.createElement(`webcam-timelapse-card-editor`)}static getStubConfig(e){return{camera_entity:Object.keys(e.states).find(t=>t.startsWith(`camera.`)&&e.entities?.[t]?.platform===`webcam_timelapse`)??``}}getCardSize(){return 8}getGridOptions(){return{columns:`full`,rows:`auto`,min_columns:6,min_rows:6}}connectedCallback(){super.connectedCallback(),document.addEventListener(`visibilitychange`,this.onVisibilityChange),this.intersectionObserver=new IntersectionObserver(e=>{this.onScreen=e.some(e=>e.isIntersecting),this.reconcilePlayback()}),this.intersectionObserver.observe(this),this.resizeObserver=new ResizeObserver(e=>{let t=e[0]?.contentRect.width;t&&(this.trackWidth=t-24)}),this.resizeObserver.observe(this),this.exportOpen&&this.subscribeExport()}disconnectedCallback(){super.disconnectedCallback(),document.removeEventListener(`visibilitychange`,this.onVisibilityChange),this.intersectionObserver?.disconnect(),this.resizeObserver?.disconnect(),this.stopPlayback(),this.indexTimer&&window.clearTimeout(this.indexTimer),this.scrubSettle&&window.clearTimeout(this.scrubSettle),this.ring.clear(),this.unsubscribeExport()}willUpdate(e){e.has(`hass`)&&this.hass&&this.index===nt&&(this.refreshIndex(),this.refreshHistory()),e.has(`hass`)&&this.hass&&!this.versionChecked&&(this.versionChecked=!0,Dn(this.hass,Ke,Ue).then(e=>{this.versionMismatch=e}))}reconcilePlayback(){this.playing&&this.visible&&this.onScreen?this.startPlayback():this.stopPlayback()}async refreshIndex(){if(this.hass?.callWS&&this.config){try{let e=await this.hass.callWS({type:Ge,entity_id:this.config.camera_entity}),t=this.position>=this.index.count-1;this.index=e,this.present=it(e),(t||this.position>=e.count)&&(this.position=Math.max(0,e.count-1)),await this.updateComplete,this.startAutoplayIfRequested()||this.swapInFrame(),this.refreshLuma(),this.indexError=void 0}catch(e){this.indexError=e instanceof Error?e.message:`Could not load the timeline.`}this.scheduleIndexRefresh()}}async refreshLuma(){let e=tt(this.config?.deflicker??0);if(!this.hass?.callWS||e===0||!this.config)this.gains=/* @__PURE__ */ new Float32Array;else{try{let t=await this.hass.callWS({type:qe,entity_id:this.config.camera_entity});this.gains=et(t.luma,{...Qe,radius:e})}catch{this.gains=/* @__PURE__ */ new Float32Array}this.requestUpdate()}}async refreshHistory(){let e=gt(this.config);if(!this.hass||e.length===0)return;let t={};for(let n of e)n.time_attribute&&(t[n.entity]=n.time_attribute);let n=Math.max(this.config?.graph_hours??24,...e.map(e=>e.graph_hours??0));this.history=await bn(this.hass,e.map(e=>e.entity),{days:(this.index.retention_days||14)+1+Math.ceil(n/48),timeAttributes:t})}scheduleIndexRefresh(){this.indexTimer&&window.clearTimeout(this.indexTimer);let e=this.index.step*1e3+Math.random()*15e3;this.indexTimer=window.setTimeout(()=>void this.refreshIndex(),e)}get cadence(){return ct(this.speed)}get frameDelay(){return this.cadence.frameDelay}get fadeDuration(){return pt(this.speed,this.frameDelay,{playing:this.playing,reducedMotion:Zn()})}async runPlayback(e){let t=!1;for(;this.playToken===e&&this.playing;){if(t){let e=lt(this.present,this.position,this.cadence.stride);if(e===null){this.playing=!1;break}this.position=e}t=!0;let n=performance.now();if(await this.swapInFrame(),this.prefetchAhead(),this.playToken!==e)return;let r=this.frameDelay-(performance.now()-n);r>0&&await new Promise(e=>window.setTimeout(e,r))}}startPlayback(){if(this.playToken!==void 0)return;let e=++this.playCounter;this.playToken=e,this.runPlayback(e).finally(()=>{this.playToken===e&&(this.playToken=void 0)})}stopPlayback(){this.playToken=void 0}startAutoplayIfRequested(){return!this.autoplayPending||!K(this.index)||(this.autoplayPending=!1,!ft({configured:this.config?.autoplay===!0,reducedMotion:Zn(),alreadyPlaying:this.playing}))?!1:(this.togglePlay(),!0)}goTo(e){this.position=Math.min(Math.max(e,0),Math.max(0,this.index.count-1)),this.swapInFrame(),this.prefetchAhead()}swapInFrame(){return this.swaps.request()}async performSwap(){let e=this.position,t=this.frameSources(e);if(t.length===0)return;let n=++this.frameGeneration,r=this.useLayerA?this.layerB:this.layerA;if(!r)return;let i=!1;for(let a of t){let t=new URL(a,document.baseURI).href;r.src=a;try{await r.decode()}catch{}let o=dt({currentSrc:r.currentSrc,requested:t,complete:r.complete,naturalWidth:r.naturalWidth});if(o===`pending`&&!this.playing&&(await this.awaitLoad(r),o=dt({currentSrc:r.currentSrc,requested:t,complete:r.complete,naturalWidth:r.naturalWidth})),o!==`failed`){if(o===`pending`)i=!0;else{if(n!==this.frameGeneration)return;this.revealFrame(r,this.useLayerA?this.layerA:this.layerB),this.useLayerA=!this.useLayerA,this.noteFrameSize(r.naturalWidth,r.naturalHeight),this.loadedPosition=e,this.frameError=void 0,this.requestUpdate();return}}}n===this.frameGeneration&&(this.playing||i||(this.frameError=t[0],this.requestUpdate()))}awaitLoad(e){return new Promise(t=>{let n,r=()=>{n!==void 0&&window.clearTimeout(n),e.removeEventListener(`load`,r),e.removeEventListener(`error`,r),t()};e.addEventListener(`load`,r),e.addEventListener(`error`,r),n=window.setTimeout(r,tr)})}revealFrame(e,t){let n=this.fadeDuration;t&&(t.style.transition=`none`,t.style.opacity=`1`,t.style.zIndex=`1`),e.style.zIndex=`2`,n===0?(e.style.transition=`none`,e.style.opacity=`1`):(e.style.transition=`none`,e.style.opacity=`0`,e.offsetWidth,e.style.transition=`opacity ${n}ms linear`,e.style.opacity=`1`)}frameSources(e){let t=[],n=Jn(this.hass?.states[this.config.camera_entity]?.attributes.entity_picture);e>=this.index.count-1&&n&&t.push(n);let r=rt(this.index,e);return r&&t.push(r),t}prefetchAhead(){let e=ut(this.present,this.position,q(this.speed),this.cadence.stride,this.prefetchedThrough);for(let t of e){let e=rt(this.index,t);e&&this.ring.prefetch(e),this.prefetchedThrough=t}}scrubTo(e){this.position=e,this.pendingPosition=e;let t=performance.now();t-this.lastScrubAt>=er&&(this.lastScrubAt=t,this.loadPendingPosition()),this.scrubSettle&&window.clearTimeout(this.scrubSettle),this.scrubSettle=window.setTimeout(()=>{this.scrubSettle=void 0,this.loadPendingPosition()},er)}loadPendingPosition(){let e=this.pendingPosition;e!==void 0&&e!==this.loadedPosition&&this.goTo(e)}stepBy(e){let t=G(this.present,this.position+e,e);t!==null&&this.goTo(t)}get exportSelection(){let e=Rt(this.index);return e===null?null:this.exportRange===null?e:zt(this.exportRange,this.index.count)}get exportRunning(){return this.exportStatus?.state===`running`}get exportSize(){return this.exportSizes[this.exportAspect]}setExportSize(e,t){this.exportSizes={...this.exportSizes,[this.exportAspect]:{...this.exportSize,[e]:t}}}noteFrameSize(e,t){e<=0||t<=0||(this.frameSize?.[0]!==e||this.frameSize[1]!==t)&&(this.frameSize=[e,t])}get exportCropAxis(){return this.frameSize?Ot(this.frameSize,this.exportAspect):null}onHandleDown(e,t){let n=e.currentTarget.parentElement;n&&!this.exportRunning&&(e.preventDefault(),e.currentTarget.setPointerCapture(e.pointerId),this.exportDrag={kind:t,track:n.getBoundingClientRect()},this.onHandleMove(e))}async subscribeExport(){this.unsubscribeExport();let e=this.hass?.connection;if(!e||!this.config)return;let t=++this.exportSubscription;try{let n=await e.subscribeMessage(e=>{t===this.exportSubscription&&this.onExportStatus(e)},{type:Ye,entity_id:this.config.camera_entity});if(t!==this.exportSubscription){n();return}this.exportUnsubscribe=n}catch(e){t===this.exportSubscription&&(this.exportError=this.exportErrorKey(e))}}unsubscribeExport(){this.exportSubscription++;let e=this.exportUnsubscribe;this.exportUnsubscribe=void 0,e&&Promise.resolve(e()).catch(()=>void 0)}onExportStatus(e){this.exportStatus=e,e.state!==`done`||!e.result?(this.exportUrl=void 0,this.exportUrlFor=void 0):this.resolveExportUrl(e.result.media_content_id)}async resolveExportUrl(e){if(this.exportUrlFor!==e&&this.hass?.callWS){this.exportUrlFor=e,this.exportUrl=void 0;try{let t=await this.hass.callWS({type:Ze,media_content_id:e});if(this.exportUrlFor!==e)return;this.exportUrl=this.hass.hassUrl?.(t.url)??t.url}catch{}}}exportErrorKey(e){return(typeof e==`object`&&e&&`code`in e?String(e.code):``)||`unknown`}presetExport(e){this.exportRange=e===null?null:Ht(this.index,e)}exportErrorText(e,t){let n=this.t(`export.error.${e}`);return n.startsWith(`export.error.`)?t||this.t(`export.error.unknown`):n}get timeZone(){return this.hass?.config?.time_zone??Intl.DateTimeFormat().resolvedOptions().timeZone}get language(){return this.hass?.locale?.language??this.hass?.language??`en`}t(e,t){return t===void 0?B(e,this.language):B(e,this.language,`{v}`,t)}get atLive(){return this.position>=this.index.count-1}get onGap(){return this.present.length>0&&!this.present[this.position]}render(){if(!this.config||!this.hass)return M`<ha-card></ha-card>`;let e=this.index.t0===null?null:this.index.t0+this.position*this.index.step;return M`
      <ha-card .header=${this.config.title??P}>
        ${kn(this.versionMismatch,e=>this.t(e))}
        ${this.renderStage(e)}
        ${K(this.index)?this.renderTimeline(e):P}
        ${K(this.index)&&this.config.show_export!==!1&&this.exportOpen?this.renderExport():P}
      </ha-card>
    `}renderStage(e){if(!K(this.index))return M`
        <div class="stage">
          <div class="empty">
            ${this.indexError?M`
                  <div>${this.t(`empty.index_failed`)}</div>
                  <div class="detail">${this.indexError}</div>
                `:M`
                  <div>${this.t(`empty.no_frames`)}</div>
                  <div>${this.t(`empty.first_soon`)}</div>
                `}
          </div>
        </div>
      `;let t=this.gains[this.position]??1,n=[];return t!==1&&n.push(`brightness(${t.toFixed(3)})`),this.onGap&&n.push(`grayscale(0.5)`,`brightness(0.5)`),M`
      <div
        class="stage"
        style="--wtl-frame-filter:${n.length>0?n.join(` `):`none`}"
        @click=${this.onStageClick}
      >
        <div
          class="layers"
          role="button"
          tabindex="0"
          aria-label=${this.t(`actions.show_camera`)}
          @keydown=${e=>this.onActivateKey(e,this.config.camera_entity)}
        >
          <img class="layer a" alt="" decoding="async" fetchpriority="high" />
          <img class="layer b" alt="" decoding="async" fetchpriority="high" />
        </div>
        ${this.renderCropMask()}
        ${this.frameError?M`<div class="empty">
              <div>${this.t(`empty.frame_failed`)}</div>
              <div class="detail">${this.frameError}</div>
            </div>`:P}
        ${e===null?P:M`<div class="stamp">
              <time datetime=${(/* @__PURE__ */ new Date(e*1e3)).toISOString()}>
                ${pn(e,this.timeZone,this.language)}
              </time>
            </div>`}
        ${e===null?P:this.renderReadouts(e)}
        ${this.onGap?M`<div class="badge gap">${this.t(`badge.gap`)}</div>`:this.atLive?M`<div class="badge live">${this.t(`badge.live`)}</div>`:P}
        ${this.renderControls()}
      </div>
    `}renderReadouts(e){let t=ht(this.config);return t.length===0?P:M`<div class="readouts ${t.length>1?`pair`:``}">
      ${t.map(t=>this.renderReadout(e,t))}
    </div>`}renderReadout(e,t){let n=`readout ${t.side===`left`?`left`:``}`;if(this.folded.has(t.side))return M`<div class="${n} folded">
        ${this.renderFoldToggle(t.side,!0)}
      </div>`;let r=t.entities,i=e*1e3,a=r.map(e=>{let t=this.history.get(e.entity)??[],n=wn(t),r=xn(t,i,n.staleAfter),a=e.name??this.hass?.states[e.entity]?.attributes.friendly_name??e.entity,o=e.unit??this.hass?.states[e.entity]?.attributes.unit_of_measurement??``,s=e.color??`var(--wtl-accent)`,c=r===null?`—`:`${r.value.toFixed(e.decimals??1)}${o?` ${o}`:``}`,l=e.graph_hours??this.config?.graph_hours??24,u=e.graph===!0&&this.config?.show_graph!==!1,d=u?En(t,i,l):[],f=u&&this.config?.show_sun===!0?this.nightsAround(i,l):[],p=u?Fn({points:d,at:i,hours:l,color:s,label:`${a} history`,quantum:n.quantum,nights:f}):null,m=p===null?0:Pn(d),h=p===null?P:M`<div class="spark-scale">
            <span
              >${m===0?this.t(`spark.flat`):this.t(`spark.range`,`${Yn(m)}${o?` ${o}`:``}`)}</span
            >
            <span>${Xn(l)}</span>
          </div>`,g=this.hass?.states[e.entity],_=e.show_icon&&g?M`<ha-state-icon
              class="readout-icon"
              style="color:${s}"
              .hass=${this.hass}
              .stateObj=${g}
            ></ha-state-icon>`:P;return M`
        <div
          class="readout-row ${r?.stale?`stale`:``}"
          role="button"
          tabindex="0"
          aria-label=${this.t(`actions.show_entity`,a)}
          @click=${()=>this.fireMoreInfo(e.entity)}
          @keydown=${t=>this.onActivateKey(t,e.entity)}
        >
          ${_}
          <span class="readout-name" style="color:${s}">${a}</span>
          <span class="readout-value">${c}</span>
          ${r===null?P:M`<span class="readout-at"
                >${mn(Math.round(r.at/1e3),this.timeZone,this.language)}</span
              >`}
        </div>
        ${p?M`<div class="spark-wrap">${p}${h}</div>`:P}
      `});return M`<div class=${n}>
      <div class="readout-head">
        ${t.title?M`<div class="readout-title">${t.title}</div>`:P}
        ${this.renderFoldToggle(t.side,!1)}
      </div>
      ${a}
    </div>`}nightsAround(e,t){let n=t*36e5/2;return this.nightsBetween(e-n,e+n)}nightsBetween(e,t){let n=this.hass?.config?.latitude,r=this.hass?.config?.longitude;if(n===void 0||r===void 0)return[];let i=`${e}|${t}|${n}|${r}`;return this.nightCache?.key!==i&&(this.nightCache={key:i,bands:Gn(e,t,n,r)}),this.nightCache.bands}renderFoldToggle(e,t){return M`<ha-icon-button
      class="readout-fold"
      .label=${this.t(t?`actions.show_readings`:`actions.hide_readings`)}
      aria-expanded=${t?`false`:`true`}
      @click=${()=>this.toggleFold(e)}
    >
      <ha-icon icon=${t?`mdi:eye-outline`:`mdi:eye-off-outline`}></ha-icon>
    </ha-icon-button>`}toggleFold(e){let t=new Set(this.folded);t.delete(e)||t.add(e),this.folded=t}fireMoreInfo(e){e&&this.dispatchEvent(new CustomEvent(`hass-more-info`,{detail:{entityId:e},bubbles:!0,composed:!0}))}onActivateKey(e,t){(e.key===`Enter`||e.key===` `)&&(e.preventDefault(),this.fireMoreInfo(t))}renderControls(){return M`
      <div class="controls">
        <ha-icon-button .label=${this.t(`controls.previous`)} @click=${()=>this.stepBy(-1)}>
          <ha-icon icon="mdi:skip-previous"></ha-icon>
        </ha-icon-button>
        <ha-icon-button
          class="play"
          .label=${this.playing?this.t(`controls.pause`):this.t(`controls.play`)}
          @click=${this.togglePlay}
        >
          <ha-icon .icon=${this.playing?`mdi:pause`:`mdi:play`}></ha-icon>
        </ha-icon-button>
        <ha-icon-button .label=${this.t(`controls.next`)} @click=${()=>this.stepBy(1)}>
          <ha-icon icon="mdi:skip-next"></ha-icon>
        </ha-icon-button>

        <span class="sep" aria-hidden="true"></span>

        <button
          class="speed"
          @click=${this.cycleSpeed}
          aria-label=${this.t(`controls.speed`,String(this.speed))}
        >
          ${this.speed}×
        </button>
        <ha-icon-button .label=${this.t(`controls.now`)} @click=${this.jumpToNow}>
          <ha-icon icon="mdi:update"></ha-icon>
        </ha-icon-button>
        ${this.config?.show_export===!1?P:M`<ha-icon-button
                .label=${this.t(this.exportOpen?`export.close`:`export.open`)}
                @click=${this.toggleExport}
              >
                <ha-icon .icon=${this.exportOpen?`mdi:close`:`mdi:movie-open-outline`}></ha-icon>
              </ha-icon-button>`}
      </div>
    `}renderTimeline(e){let t=Math.max(1,this.index.count-1),n=this.position/t*100,r=this.config?.show_dayticks!==!1,{days:i,times:a}=r?this.rulerFor():{days:[],times:[]},o=this.config?.show_sun===!0&&this.index.t0!==null?this.nightsBetween(this.index.t0*1e3,(this.index.t0+t*this.index.step)*1e3):[];return M`
      <div class="timeline">
        ${r?M`<div class="band dates" aria-hidden="true">
              ${i.map(e=>e.label?M`<span class="lab date" style="left:${e.left}%"
                      >${e.label}</span
                    >`:P)}
            </div>`:P}

        <div class="track">
          ${o.length>0?M`<div class="nights" aria-hidden="true">
                ${o.map(e=>M`<span
                      class="night"
                      style="left:${(e.left*100).toFixed(3)}%;width:${(e.width*100).toFixed(3)}%"
                    ></span>`)}
              </div>`:P}
          ${this.renderExportBand()}
          ${r?M`<div class="marks" aria-hidden="true">
                ${a.map(e=>M`<span class="mark" style="left:${e.left}%"></span>`)}
                ${i.map(e=>M`<span
                      class="mark ${e.isMonthStart?`month`:`day`}"
                      style="left:${e.left}%"
                    ></span>`)}
              </div>`:P}
          <div class="rail"></div>
        <div class="fill" style="width:${n}%"></div>
        ${this.index.gaps.map(([e,n])=>M`<div
            class="gap-run"
            style="left:${e/t*100}%;width:${n/t*100}%"
          ></div>`)}
        <input
          type="range"
          min="0"
          max=${t}
          step="1"
          .value=${String(this.position)}
          aria-label=${this.t(`track.label`)}
          aria-valuetext=${e===null?``:pn(e,this.timeZone,this.language)}
          @input=${this.onScrub}
          @change=${this.onScrubCommit}
          />
          ${this.renderExportHandles()}
        </div>

        ${r?M`<div class="band times" aria-hidden="true">
              ${a.map(e=>e.label?M`<span class="lab time" style="left:${e.left}%"
                      >${e.label}</span
                    >`:P)}
            </div>`:P}
      </div>
    `}renderExportBand(){let e=this.exportOpen?this.exportSelection:null;if(e===null)return P;let t=Kt(e,this.index.count);return M`<div
      class="export-band"
      role="img"
      aria-label=${this.t(`export.band`)}
      style="left:${t.left.toFixed(3)}%;width:${t.width.toFixed(3)}%"
    ></div>`}renderExport(){return M`<div class="export">${this.renderExportPanel()}</div>`}renderExportPanel(){let e=this.exportSelection;if(e===null)return P;let t=e=>pn(this.index.t0+e*this.index.step,this.timeZone,this.language),n=jt(Wt(this.present,e),this.exportEvery),r=this.exportRunning,i=gt(this.config).length>0,a=Lt.filter(e=>Ut(this.index,e));return M`
      <div class="export-panel">
        <div class="export-ends">
          <div class="export-end">
            <span class="export-label">${this.t(`export.from`)}</span>
            <span class="export-stamp">${t(e.start)}</span>
            <button
              class="export-chip"
              ?disabled=${r}
              @click=${this.markExportStart}
            >
              ${this.t(`export.start_here`)}
            </button>
          </div>
          <div class="export-end">
            <span class="export-label">${this.t(`export.to`)}</span>
            <span class="export-stamp">${t(e.end)}</span>
            <button
              class="export-chip"
              ?disabled=${r}
              @click=${this.markExportEnd}
            >
              ${this.t(`export.end_here`)}
            </button>
          </div>
        </div>

        ${a.length>0?M`<div class="export-row">
              ${a.map(e=>M`<button
                    class="export-chip"
                    ?disabled=${r}
                    @click=${()=>this.presetExport(e)}
                  >
                    ${e<48?this.t(`export.preset_hours`,String(e)):this.t(`export.preset_days`,String(e/24))}
                  </button>`)}
              <button
                class="export-chip"
                ?disabled=${r}
                @click=${()=>this.presetExport(null)}
              >
                ${this.t(`export.preset_all`)}
              </button>
            </div>`:P}

        <div class="export-row" role="group" aria-label=${this.t(`export.fps`)}>
          <span class="export-label">${this.t(`export.fps`)}</span>
          ${_t.map(e=>M`<button
                class="export-chip"
                aria-pressed=${this.exportFps===e?`true`:`false`}
                ?disabled=${r}
                @click=${()=>{this.exportFps=e}}
              >
                ${e}
              </button>`)}
        </div>

        <div class="export-row" role="group" aria-label=${this.t(`export.every`)}>
          <span class="export-label">${this.t(`export.every`)}</span>
          ${Tt.map(e=>M`<button
                class="export-chip"
                aria-pressed=${this.exportEvery===e?`true`:`false`}
                ?disabled=${r}
                @click=${()=>{this.exportEvery=e}}
              >
                ${e===1?this.t(`export.every_all`):this.t(`export.every_n`,String(e))}
              </button>`)}
        </div>
        ${this.exportEvery>1?M`<p class="export-hint">${this.t(`export.every_hint`)}</p>`:P}

        ${this.renderExportFormat(r)}

        ${this.exportAspect===`9:16`||this.exportAspect===`1:1`?M`<p class="export-hint">${this.t(`export.sizes_hint`)}</p>`:P}
        <div class="export-row">
          <label class="export-check">
            <input
              type="checkbox"
              .checked=${this.exportStamp}
              ?disabled=${r}
              @change=${e=>{this.exportStamp=e.target.checked}}
            />
            ${this.t(`export.timestamp`)}
          </label>
          ${this.exportStamp?this.renderExportSize(bt,this.exportSize.timestamp,r,e=>{this.setExportSize(`timestamp`,e)}):P}
        </div>
        ${i?M`<div class="export-row">
                <label class="export-check">
                  <input
                    type="checkbox"
                    .checked=${this.exportReadings}
                    ?disabled=${r}
                    @change=${e=>{this.exportReadings=e.target.checked}}
                  />
                  ${this.t(`export.readings`)}
                </label>
                ${this.exportReadings?this.renderExportSize(yt,this.exportSize.readings,r,e=>{this.setExportSize(`readings`,e)}):P}
              </div>
              ${this.exportReadings?this.renderExportPositions(r):P}`:P}

        ${this.renderExportSummary(n)}

        ${r?P:M`<div class="export-row">
              <button
                class="export-go"
                ?disabled=${n===0}
                @click=${this.startExport}
              >
                <ha-icon icon="mdi:movie-open-outline"></ha-icon>
                ${this.t(`export.start`)}
              </button>
            </div>`}
        ${this.renderExportStatus()}
        ${this.exportStatus?.folder?M`<div class="export-folder">
              <span>${this.t(`export.folder`,this.exportStatus.folder)}</span>
              ${this.exportStatus.folder_media_id?M`<a
                      class="export-browse"
                      href=${Jt(this.exportStatus.folder_media_id)}
                      @click=${this.navigateInApp}
                      >${this.t(`export.browse`)}</a
                    >`:P}
            </div>`:P}
      </div>
    `}renderExportFormat(e){let t=this.frameSize,n=this.exportCropAxis,r=t?At(t,this.exportAspect,this.exportCrop):null,i=this.exportAspect===`native`?this.t(`export.format_native`):n===null?this.t(`export.format_same`):this.t(`export.format_crop`),a=n!==null&&r!==null&&Math.min(...r)<720,o=n===`y`?[`top`,`bottom`]:[`left`,`right`];return M`<div class="export-format">
      <span class="export-label" id="export-format-label">${this.t(`export.format`)}</span>
      <div class="export-tiles" role="group" aria-labelledby="export-format-label">
        ${xt.map(n=>M`<button
              class="export-tile"
              aria-pressed=${this.exportAspect===n?`true`:`false`}
              ?disabled=${e}
              @click=${()=>{this.exportAspect=n,this.exportCrop=50}}
            >
              <ha-icon icon=${Ct[n]}></ha-icon>
              <span>${this.t(`export.aspects.${n===`native`?`native`:n.replace(`:`,`_`)}`)}</span>
              <span class="export-ratio">
                ${n===`native`?t?It(t):``:n}
              </span>
            </button>`)}
      </div>
      <p class="export-hint">${i}</p>
      ${n===null?P:M`<div class="export-crop">
            <label class="export-label" for="export-crop">${this.t(`export.crop`)}</label>
            <input
              id="export-crop"
              type="range"
              min="0"
              max="100"
              step="1"
              .value=${String(this.exportCrop)}
              aria-valuetext=${this.exportCrop===50?this.t(`export.crop_middle`):`${this.t(`export.positions.${this.exportCrop<50?o[0]:o[1]}`)}, ${this.exportCrop} %`}
              ?disabled=${e}
              @input=${e=>{this.exportCrop=Number(e.target.value)}}
            />
            <button
              class="export-chip"
              ?disabled=${e||this.exportCrop===50}
              @click=${()=>{this.exportCrop=50}}
            >
              ${this.t(`export.crop_center`)}
            </button>
            <span class="export-crop-ends" aria-hidden="true">
              <span>${this.t(`export.positions.${o[0]}`)}</span>
              <span>${this.t(`export.positions.${o[1]}`)}</span>
            </span>
          </div>`}
      ${a&&r?M`<p class="export-note" role="status">
            <ha-icon icon="mdi:information-outline"></ha-icon>
            <span>${this.t(`export.soft_crop`,`${r[0]} × ${r[1]}`)}</span>
          </p>`:P}
    </div>`}renderExportSummary(e){if(e===0)return M`<div class="export-summary">${this.t(`export.summary_empty`)}</div>`;let t=this.frameSize,n=t?Pt(e,At(t,this.exportAspect,this.exportCrop)):null,r=this.exportStatus?.free_bytes,i=n!==null&&typeof r==`number`&&r-n.high<524288e3;return M`<dl class="export-stats">
        <div>
          <dt>${this.t(`export.frames`)}</dt>
          <dd>${e.toLocaleString(this.language)}</dd>
        </div>
        <div>
          <dt>${this.t(`export.length`)}</dt>
          <dd>${qt(e/this.exportFps)}</dd>
        </div>
        <div>
          <dt>${this.t(`export.file_size`)}</dt>
          <dd>${n?this.t(`export.about`,Y(n.bytes)):`–`}</dd>
        </div>
      </dl>
      ${n?M`<p class="export-hint">
            ${this.t(`export.size_estimate`).replace(`{low}`,Y(n.low)).replace(`{high}`,Y(n.high))}
          </p>`:P}
      ${i&&typeof r==`number`?M`<p class="export-warning" role="alert">
            ${this.t(`export.low_disk`,Y(r))}
          </p>`:P}`}renderCropMask(){let e=this.frameSize;if(!this.exportOpen||!e||this.exportCropAxis===null)return P;let t=kt(e,this.exportAspect,this.exportCrop);return M`<div
      class="crop-frame"
      aria-hidden="true"
      style="--wtl-frame-ratio:${(e[0]/e[1]).toFixed(4)}"
    >
      <div
        class="crop-window ${this.exportCropAxis}"
        style="left:${t.left.toFixed(3)}%;top:${t.top.toFixed(3)}%;width:${t.width.toFixed(3)}%;height:${t.height.toFixed(3)}%"
        @pointerdown=${this.onCropDown}
        @pointermove=${this.onCropMove}
        @pointerup=${this.endExportDrag}
        @pointercancel=${this.endExportDrag}
        @click=${e=>e.stopPropagation()}
      ></div>
    </div>`}renderExportHandles(){let e=this.exportOpen?this.exportSelection:null;if(e===null||this.exportRunning)return P;let t=Kt(e,this.index.count),n=(e,t)=>M`<span
        class="export-handle ${e}"
        aria-hidden="true"
        style="left:${t.toFixed(3)}%"
        @pointerdown=${t=>this.onHandleDown(t,e)}
        @pointermove=${this.onHandleMove}
        @pointerup=${this.endExportDrag}
        @pointercancel=${this.endExportDrag}
      ></span>`;return M`${n(`start`,t.left)}${n(`end`,t.left+t.width)}`}renderExportSize(e,t,n,r){let i=this.t(`export.size_value`,String(t));return M`<label class="export-size">
      <span class="export-label">${this.t(`export.size`)}</span>
      <input
        type="range"
        min=${e.min}
        max=${e.max}
        step=${e.step}
        .value=${String(t)}
        aria-valuetext=${i}
        ?disabled=${n}
        @input=${e=>r(Number(e.target.value))}
      />
      <span class="export-size-value">${i}</span>
    </label>`}renderExportPositions(e){let t=ht(this.config);return t.map(n=>{let r=this.exportPositions[n.side]??n.side,i=t.length===1?this.t(`export.position`):n.title??this.t(n.side===`left`?`export.block_left`:`export.block_right`);return M`<div class="export-row" role="group" aria-label=${i}>
        <span class="export-label">${i}</span>
        ${vt.map(t=>M`<button
              class="export-chip"
              aria-pressed=${r===t?`true`:`false`}
              ?disabled=${e}
              @click=${()=>{this.exportPositions={...this.exportPositions,[n.side]:t}}}
            >
              ${this.t(`export.positions.${t}`)}
            </button>`)}
      </div>`})}renderExportStatus(){if(this.exportError)return M`<div class="export-status" role="alert">
        <span class="export-error">${this.exportErrorText(this.exportError)}</span>
      </div>`;let e=this.exportStatus;if(!e||e.state===`idle`)return P;if(e.state===`running`){let t=Yt(e);return M`<div class="export-status" role="status">
        <span>
          ${e.total>0?this.t(`export.running`).replace(`{done}`,String(e.done)).replace(`{total}`,String(e.total)):this.t(`export.preparing`)}
        </span>
        <div
          class="export-progress"
          role="progressbar"
          aria-valuemin="0"
          aria-valuemax="100"
          aria-valuenow=${Math.round(t*100)}
        >
          <span style="width:${(t*100).toFixed(1)}%"></span>
        </div>
        <button class="export-chip" @click=${this.cancelExport}>
          ${this.t(`export.cancel`)}
        </button>
      </div>`}if(e.state===`done`&&e.result){let t=e.result;return M`<div class="export-status" role="status">
        <span>
          ${this.t(`export.done`)} · ${qt(t.duration)} ·
          ${Y(t.size_bytes)}
        </span>
        <span class="detail">${this.t(`export.saved`,t.path)}</span>
        ${this.exportUrl?M`<span class="export-links">
              <a class="export-watch" href=${this.exportUrl} target="_blank" rel="noopener">
                <ha-icon icon="mdi:play-circle-outline"></ha-icon>
                ${this.t(`export.watch`)}
              </a>
              <a
                class="export-download"
                href=${this.exportUrl}
                download=${t.file_name}
                target="_blank"
                rel="noopener"
              >
                <ha-icon icon="mdi:download"></ha-icon>
                ${this.t(`export.download`)}
              </a>
            </span>`:P}
      </div>`}return e.state===`cancelled`?M`<div class="export-status" role="status">
        <span class="detail">${this.t(`export.cancelled`)}</span>
      </div>`:M`<div class="export-status" role="alert">
      <span class="export-error"
        >${this.exportErrorText(e.error??`unknown`,e.message)}</span
      >
    </div>`}rulerFor(){let e=[this.index.t0,this.index.count,this.index.step,Math.round(this.trackWidth),this.timeZone,this.language].join(`|`);return this.rulerCache?.key!==e&&(this.rulerCache={key:e,days:sn(this.index,this.timeZone,this.language,this.trackWidth),times:fn(this.index,this.timeZone,this.language,this.trackWidth)}),this.rulerCache}};V([Me({attribute:!1})],$.prototype,`hass`,void 0),V([z()],$.prototype,`config`,void 0),V([z()],$.prototype,`index`,void 0),V([z()],$.prototype,`position`,void 0),V([z()],$.prototype,`playing`,void 0),V([z()],$.prototype,`speed`,void 0),V([z()],$.prototype,`trackWidth`,void 0),V([z()],$.prototype,`versionMismatch`,void 0),V([z()],$.prototype,`indexError`,void 0),V([z()],$.prototype,`frameError`,void 0),V([z()],$.prototype,`history`,void 0),V([z()],$.prototype,`folded`,void 0),V([z()],$.prototype,`exportOpen`,void 0),V([z()],$.prototype,`exportRange`,void 0),V([z()],$.prototype,`exportFps`,void 0),V([z()],$.prototype,`exportStamp`,void 0),V([z()],$.prototype,`exportReadings`,void 0),V([z()],$.prototype,`exportAspect`,void 0),V([z()],$.prototype,`exportCrop`,void 0),V([z()],$.prototype,`exportEvery`,void 0),V([z()],$.prototype,`exportSizes`,void 0),V([z()],$.prototype,`frameSize`,void 0),V([z()],$.prototype,`exportPositions`,void 0),V([z()],$.prototype,`exportStatus`,void 0),V([z()],$.prototype,`exportError`,void 0),V([z()],$.prototype,`exportUrl`,void 0),V([Pe(`img.layer.a`)],$.prototype,`layerA`,void 0),V([Pe(`img.layer.b`)],$.prototype,`layerB`,void 0),$=V([ke(We)],$);var nr=window;nr.customCards=nr.customCards??[],nr.customCards.push({type:We,name:`Webcam Timelapse`,description:`Scrub and play back an archived still-image webcam.`,preview:!0,documentationURL:`https://github.com/rolandzeiner/webcam-timelapse`,getEntitySuggestion:(e,t)=>!t.startsWith(`camera.`)||e.entities?.[t]?.platform!==`webcam_timelapse`?null:{config:{type:`custom:${We}`,camera_entity:t}}});export{$ as WebcamTimelapseCard};