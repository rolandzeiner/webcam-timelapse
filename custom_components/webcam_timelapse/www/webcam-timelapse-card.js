/*! Webcam Timelapse Card — bundled by Rolldown. Edit sources in src/, then `npm run build`. */
var e=Object.defineProperty,t=(t,n)=>{let r={};for(var i in t)e(r,i,{get:t[i],enumerable:!0});return n||e(r,Symbol.toStringTag,{value:`Module`}),r};
/**
* @license
* Copyright 2019 Google LLC
* SPDX-License-Identifier: BSD-3-Clause
*/
const n=globalThis,r=n.ShadowRoot&&(n.ShadyCSS===void 0||n.ShadyCSS.nativeShadow)&&`adoptedStyleSheets`in Document.prototype&&`replace`in CSSStyleSheet.prototype,i=Symbol(),a=new WeakMap;var o=class{constructor(e,t,n){if(this._$cssResult$=!0,n!==i)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=e,this.t=t}get styleSheet(){let e=this.o,t=this.t;if(r&&e===void 0){let n=t!==void 0&&t.length===1;n&&(e=a.get(t)),e===void 0&&((this.o=e=new CSSStyleSheet).replaceSync(this.cssText),n&&a.set(t,e))}return e}toString(){return this.cssText}};const s=e=>new o(typeof e==`string`?e:e+``,void 0,i),c=(e,...t)=>new o(e.length===1?e[0]:t.reduce((t,n,r)=>t+(e=>{if(!0===e._$cssResult$)return e.cssText;if(typeof e==`number`)return e;throw Error(`Value passed to 'css' function must be a 'css' function result: `+e+`. Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.`)})(n)+e[r+1],e[0]),e,i),l=(e,t)=>{if(r)e.adoptedStyleSheets=t.map(e=>e instanceof CSSStyleSheet?e:e.styleSheet);else for(let r of t){let t=document.createElement(`style`),i=n.litNonce;i!==void 0&&t.setAttribute(`nonce`,i),t.textContent=r.cssText,e.appendChild(t)}},u=r?e=>e:e=>e instanceof CSSStyleSheet?(e=>{let t=``;for(let n of e.cssRules)t+=n.cssText;return s(t)})(e):e,{is:d,defineProperty:f,getOwnPropertyDescriptor:p,getOwnPropertyNames:m,getOwnPropertySymbols:h,getPrototypeOf:g}=Object,_=globalThis,v=_.trustedTypes,y=v?v.emptyScript:``,ee=_.reactiveElementPolyfillSupport,b=(e,t)=>e,x={toAttribute(e,t){
/**
* @license
* Copyright 2017 Google LLC
* SPDX-License-Identifier: BSD-3-Clause
*/
switch(t){case Boolean:e=e?y:null;break;case Object:case Array:e=e==null?e:JSON.stringify(e)}return e},fromAttribute(e,t){let n=e;switch(t){case Boolean:n=e!==null;break;case Number:n=e===null?null:Number(e);break;case Object:case Array:try{n=JSON.parse(e)}catch{n=null}}return n}},S=(e,t)=>!d(e,t),te={attribute:!0,type:String,converter:x,reflect:!1,useDefault:!1,hasChanged:S};Symbol.metadata??=Symbol(`metadata`),_.litPropertyMetadata??=new WeakMap;var C=class extends HTMLElement{static addInitializer(e){this._$Ei(),(this.l??=[]).push(e)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(e,t=te){if(t.state&&(t.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(e)&&((t=Object.create(t)).wrapped=!0),this.elementProperties.set(e,t),!t.noAccessor){let n=Symbol(),r=this.getPropertyDescriptor(e,n,t);r!==void 0&&f(this.prototype,e,r)}}static getPropertyDescriptor(e,t,n){let{get:r,set:i}=p(this.prototype,e)??{get(){return this[t]},set(e){this[t]=e}};return{get:r,set(t){let a=r?.call(this);i?.call(this,t),this.requestUpdate(e,a,n)},configurable:!0,enumerable:!0}}static getPropertyOptions(e){return this.elementProperties.get(e)??te}static _$Ei(){if(this.hasOwnProperty(b(`elementProperties`)))return;let e=g(this);e.finalize(),e.l!==void 0&&(this.l=[...e.l]),this.elementProperties=new Map(e.elementProperties)}static finalize(){if(this.hasOwnProperty(b(`finalized`)))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(b(`properties`))){let e=this.properties,t=[...m(e),...h(e)];for(let n of t)this.createProperty(n,e[n])}let e=this[Symbol.metadata];if(e!==null){let t=litPropertyMetadata.get(e);if(t!==void 0)for(let[e,n]of t)this.elementProperties.set(e,n)}this._$Eh=new Map;for(let[e,t]of this.elementProperties){let n=this._$Eu(e,t);n!==void 0&&this._$Eh.set(n,e)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(e){let t=[];if(Array.isArray(e)){let n=new Set(e.flat(1/0).reverse());for(let e of n)t.unshift(u(e))}else e!==void 0&&t.push(u(e));return t}static _$Eu(e,t){let n=t.attribute;return!1===n?void 0:typeof n==`string`?n:typeof e==`string`?e.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$ES=new Promise(e=>this.enableUpdating=e),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach(e=>e(this))}addController(e){(this._$EO??=new Set).add(e),this.renderRoot!==void 0&&this.isConnected&&e.hostConnected?.()}removeController(e){this._$EO?.delete(e)}_$E_(){let e=new Map,t=this.constructor.elementProperties;for(let n of t.keys())this.hasOwnProperty(n)&&(e.set(n,this[n]),delete this[n]);e.size>0&&(this._$Ep=e)}createRenderRoot(){let e=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return l(e,this.constructor.elementStyles),e}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(!0),this._$EO?.forEach(e=>e.hostConnected?.())}enableUpdating(e){}disconnectedCallback(){this._$EO?.forEach(e=>e.hostDisconnected?.())}attributeChangedCallback(e,t,n){this._$AK(e,n)}_$ET(e,t){let n=this.constructor.elementProperties.get(e),r=this.constructor._$Eu(e,n);if(r!==void 0&&!0===n.reflect){let i=(n.converter?.toAttribute===void 0?x:n.converter).toAttribute(t,n.type);this._$Em=e,i==null?this.removeAttribute(r):this.setAttribute(r,i),this._$Em=null}}_$AK(e,t){let n=this.constructor,r=n._$Eh.get(e);if(r!==void 0&&this._$Em!==r){let e=n.getPropertyOptions(r),i=typeof e.converter==`function`?{fromAttribute:e.converter}:e.converter?.fromAttribute===void 0?x:e.converter;this._$Em=r;let a=i.fromAttribute(t,e.type);this[r]=a??this._$Ej?.get(r)??a,this._$Em=null}}requestUpdate(e,t,n,r=!1,i){if(e!==void 0){let a=this.constructor;if(!1===r&&(i=this[e]),n??=a.getPropertyOptions(e),!((n.hasChanged??S)(i,t)||n.useDefault&&n.reflect&&i===this._$Ej?.get(e)&&!this.hasAttribute(a._$Eu(e,n))))return;this.C(e,t,n)}!1===this.isUpdatePending&&(this._$ES=this._$EP())}C(e,t,{useDefault:n,reflect:r,wrapped:i},a){n&&!(this._$Ej??=new Map).has(e)&&(this._$Ej.set(e,a??t??this[e]),!0!==i||a!==void 0)||(this._$AL.has(e)||(this.hasUpdated||n||(t=void 0),this._$AL.set(e,t)),!0===r&&this._$Em!==e&&(this._$Eq??=new Set).add(e))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(e){Promise.reject(e)}let e=this.scheduleUpdate();return e!=null&&await e,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(let[e,t]of this._$Ep)this[e]=t;this._$Ep=void 0}let e=this.constructor.elementProperties;if(e.size>0)for(let[t,n]of e){let{wrapped:e}=n,r=this[t];!0!==e||this._$AL.has(t)||r===void 0||this.C(t,void 0,n,r)}}let e=!1,t=this._$AL;try{e=this.shouldUpdate(t),e?(this.willUpdate(t),this._$EO?.forEach(e=>e.hostUpdate?.()),this.update(t)):this._$EM()}catch(t){throw e=!1,this._$EM(),t}e&&this._$AE(t)}willUpdate(e){}_$AE(e){this._$EO?.forEach(e=>e.hostUpdated?.()),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(e)),this.updated(e)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(e){return!0}update(e){this._$Eq&&=this._$Eq.forEach(e=>this._$ET(e,this[e])),this._$EM()}updated(e){}firstUpdated(e){}};C.elementStyles=[],C.shadowRootOptions={mode:`open`},C[b(`elementProperties`)]=new Map,C[b(`finalized`)]=new Map,ee?.({ReactiveElement:C}),(_.reactiveElementVersions??=[]).push(`2.1.2`);
/**
* @license
* Copyright 2017 Google LLC
* SPDX-License-Identifier: BSD-3-Clause
*/
const w=globalThis,T=e=>e,E=w.trustedTypes,ne=E?E.createPolicy(`lit-html`,{createHTML:e=>e}):void 0,re=`$lit$`,D=`lit$${Math.random().toFixed(9).slice(2)}$`,ie=`?`+D,ae=`<${ie}>`,O=document,k=()=>O.createComment(``),A=e=>e===null||typeof e!=`object`&&typeof e!=`function`,j=Array.isArray,oe=e=>j(e)||typeof e?.[Symbol.iterator]==`function`,se=`[ 	
\f\r]`,M=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,ce=/-->/g,le=/>/g,N=RegExp(`>|${se}(?:([^\\s"'>=/]+)(${se}*=${se}*(?:[^ \t\n\f\r"'\`<>=]|("|')|))|$)`,`g`),ue=/'/g,de=/"/g,fe=/^(?:script|style|textarea|title)$/i,pe=e=>(t,...n)=>({_$litType$:e,strings:t,values:n}),P=pe(1),me=pe(2),F=Symbol.for(`lit-noChange`),I=Symbol.for(`lit-nothing`),he=new WeakMap,L=O.createTreeWalker(O,129);function ge(e,t){if(!j(e)||!e.hasOwnProperty(`raw`))throw Error(`invalid template strings array`);return ne===void 0?t:ne.createHTML(t)}const _e=(e,t)=>{let n=e.length-1,r=[],i,a=t===2?`<svg>`:t===3?`<math>`:``,o=M;for(let t=0;t<n;t++){let n=e[t],s,c,l=-1,u=0;for(;u<n.length&&(o.lastIndex=u,c=o.exec(n),c!==null);)u=o.lastIndex,o===M?c[1]===`!--`?o=ce:c[1]===void 0?c[2]===void 0?c[3]!==void 0&&(o=N):(fe.test(c[2])&&(i=RegExp(`</`+c[2],`g`)),o=N):o=le:o===N?c[0]===`>`?(o=i??M,l=-1):c[1]===void 0?l=-2:(l=o.lastIndex-c[2].length,s=c[1],o=c[3]===void 0?N:c[3]===`"`?de:ue):o===de||o===ue?o=N:o===ce||o===le?o=M:(o=N,i=void 0);let d=o===N&&e[t+1].startsWith(`/>`)?` `:``;a+=o===M?n+ae:l>=0?(r.push(s),n.slice(0,l)+re+n.slice(l)+D+d):n+D+(l===-2?t:d)}return[ge(e,a+(e[n]||`<?>`)+(t===2?`</svg>`:t===3?`</math>`:``)),r]};var ve=class e{constructor({strings:t,_$litType$:n},r){let i;this.parts=[];let a=0,o=0,s=t.length-1,c=this.parts,[l,u]=_e(t,n);if(this.el=e.createElement(l,r),L.currentNode=this.el.content,n===2||n===3){let e=this.el.content.firstChild;e.replaceWith(...e.childNodes)}for(;(i=L.nextNode())!==null&&c.length<s;){if(i.nodeType===1){if(i.hasAttributes())for(let e of i.getAttributeNames())if(e.endsWith(re)){let t=u[o++],n=i.getAttribute(e).split(D),r=/([.?@])?(.*)/.exec(t);c.push({type:1,index:a,name:r[2],strings:n,ctor:r[1]===`.`?xe:r[1]===`?`?Se:r[1]===`@`?Ce:z}),i.removeAttribute(e)}else e.startsWith(D)&&(c.push({type:6,index:a}),i.removeAttribute(e));if(fe.test(i.tagName)){let e=i.textContent.split(D),t=e.length-1;if(t>0){i.textContent=E?E.emptyScript:``;for(let n=0;n<t;n++)i.append(e[n],k()),L.nextNode(),c.push({type:2,index:++a});i.append(e[t],k())}}}else if(i.nodeType===8){if(i.data===ie)c.push({type:2,index:a});else{let e=-1;for(;(e=i.data.indexOf(D,e+1))!==-1;)c.push({type:7,index:a}),e+=D.length-1}}a++}}static createElement(e,t){let n=O.createElement(`template`);return n.innerHTML=e,n}};function R(e,t,n=e,r){if(t===F)return t;let i=r===void 0?n._$Cl:n._$Co?.[r],a=A(t)?void 0:t._$litDirective$;return i?.constructor!==a&&(i?._$AO?.(!1),a===void 0?i=void 0:(i=new a(e),i._$AT(e,n,r)),r===void 0?n._$Cl=i:(n._$Co??=[])[r]=i),i!==void 0&&(t=R(e,i._$AS(e,t.values),i,r)),t}var ye=class{constructor(e,t){this._$AV=[],this._$AN=void 0,this._$AD=e,this._$AM=t}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(e){let{el:{content:t},parts:n}=this._$AD,r=(e?.creationScope??O).importNode(t,!0);L.currentNode=r;let i=L.nextNode(),a=0,o=0,s=n[0];for(;s!==void 0;){if(a===s.index){let t;s.type===2?t=new be(i,i.nextSibling,this,e):s.type===1?t=new s.ctor(i,s.name,s.strings,this,e):s.type===6&&(t=new we(i,this,e)),this._$AV.push(t),s=n[++o]}a!==s?.index&&(i=L.nextNode(),a++)}return L.currentNode=O,r}p(e){let t=0;for(let n of this._$AV)n!==void 0&&(n.strings===void 0?n._$AI(e[t]):(n._$AI(e,n,t),t+=n.strings.length-2)),t++}},be=class e{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(e,t,n,r){this.type=2,this._$AH=I,this._$AN=void 0,this._$AA=e,this._$AB=t,this._$AM=n,this.options=r,this._$Cv=r?.isConnected??!0}get parentNode(){let e=this._$AA.parentNode,t=this._$AM;return t!==void 0&&e?.nodeType===11&&(e=t.parentNode),e}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(e,t=this){e=R(this,e,t),A(e)?e===I||e==null||e===``?(this._$AH!==I&&this._$AR(),this._$AH=I):e!==this._$AH&&e!==F&&this._(e):e._$litType$===void 0?e.nodeType===void 0?oe(e)?this.k(e):this._(e):this.T(e):this.$(e)}O(e){return this._$AA.parentNode.insertBefore(e,this._$AB)}T(e){this._$AH!==e&&(this._$AR(),this._$AH=this.O(e))}_(e){this._$AH!==I&&A(this._$AH)?this._$AA.nextSibling.data=e:this.T(O.createTextNode(e)),this._$AH=e}$(e){let{values:t,_$litType$:n}=e,r=typeof n==`number`?this._$AC(e):(n.el===void 0&&(n.el=ve.createElement(ge(n.h,n.h[0]),this.options)),n);if(this._$AH?._$AD===r)this._$AH.p(t);else{let e=new ye(r,this),n=e.u(this.options);e.p(t),this.T(n),this._$AH=e}}_$AC(e){let t=he.get(e.strings);return t===void 0&&he.set(e.strings,t=new ve(e)),t}k(t){j(this._$AH)||(this._$AH=[],this._$AR());let n=this._$AH,r,i=0;for(let a of t)i===n.length?n.push(r=new e(this.O(k()),this.O(k()),this,this.options)):r=n[i],r._$AI(a),i++;i<n.length&&(this._$AR(r&&r._$AB.nextSibling,i),n.length=i)}_$AR(e=this._$AA.nextSibling,t){for(this._$AP?.(!1,!0,t);e!==this._$AB;){let t=T(e).nextSibling;T(e).remove(),e=t}}setConnected(e){this._$AM===void 0&&(this._$Cv=e,this._$AP?.(e))}},z=class{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(e,t,n,r,i){this.type=1,this._$AH=I,this._$AN=void 0,this.element=e,this.name=t,this._$AM=r,this.options=i,n.length>2||n[0]!==``||n[1]!==``?(this._$AH=Array(n.length-1).fill(new String),this.strings=n):this._$AH=I}_$AI(e,t=this,n,r){let i=this.strings,a=!1;if(i===void 0)e=R(this,e,t,0),a=!A(e)||e!==this._$AH&&e!==F,a&&(this._$AH=e);else{let r=e,o,s;for(e=i[0],o=0;o<i.length-1;o++)s=R(this,r[n+o],t,o),s===F&&(s=this._$AH[o]),a||=!A(s)||s!==this._$AH[o],s===I?e=I:e!==I&&(e+=(s??``)+i[o+1]),this._$AH[o]=s}a&&!r&&this.j(e)}j(e){e===I?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,e??``)}},xe=class extends z{constructor(){super(...arguments),this.type=3}j(e){this.element[this.name]=e===I?void 0:e}},Se=class extends z{constructor(){super(...arguments),this.type=4}j(e){this.element.toggleAttribute(this.name,!!e&&e!==I)}},Ce=class extends z{constructor(e,t,n,r,i){super(e,t,n,r,i),this.type=5}_$AI(e,t=this){if((e=R(this,e,t,0)??I)===F)return;let n=this._$AH,r=e===I&&n!==I||e.capture!==n.capture||e.once!==n.once||e.passive!==n.passive,i=e!==I&&(n===I||r);r&&this.element.removeEventListener(this.name,this,n),i&&this.element.addEventListener(this.name,this,e),this._$AH=e}handleEvent(e){typeof this._$AH==`function`?this._$AH.call(this.options?.host??this.element,e):this._$AH.handleEvent(e)}},we=class{constructor(e,t,n){this.element=e,this.type=6,this._$AN=void 0,this._$AM=t,this.options=n}get _$AU(){return this._$AM._$AU}_$AI(e){R(this,e)}};const Te=w.litHtmlPolyfillSupport;Te?.(ve,be),(w.litHtmlVersions??=[]).push(`3.3.3`);const Ee=(e,t,n)=>{let r=n?.renderBefore??t,i=r._$litPart$;if(i===void 0){let e=n?.renderBefore??null;r._$litPart$=i=new be(t.insertBefore(k(),e),e,void 0,n??{})}return i._$AI(e),i},De=globalThis
/**
* @license
* Copyright 2017 Google LLC
* SPDX-License-Identifier: BSD-3-Clause
*/
;var B=class extends C{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){let e=super.createRenderRoot();return this.renderOptions.renderBefore??=e.firstChild,e}update(e){let t=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(e),this._$Do=Ee(t,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return F}};B._$litElement$=!0,B.finalized=!0,De.litElementHydrateSupport?.({LitElement:B});const Oe=De.litElementPolyfillSupport;Oe?.({LitElement:B}),(De.litElementVersions??=[]).push(`4.2.2`);
/**
* @license
* Copyright 2017 Google LLC
* SPDX-License-Identifier: BSD-3-Clause
*/
const ke=e=>(t,n)=>{n===void 0?customElements.define(e,t):n.addInitializer(()=>{customElements.define(e,t)})},Ae={attribute:!0,type:String,converter:x,reflect:!1,hasChanged:S},je=(e=Ae,t,n)=>{
/**
* @license
* Copyright 2017 Google LLC
* SPDX-License-Identifier: BSD-3-Clause
*/
let{kind:r,metadata:i}=n,a=globalThis.litPropertyMetadata.get(i);if(a===void 0&&globalThis.litPropertyMetadata.set(i,a=new Map),r===`setter`&&((e=Object.create(e)).wrapped=!0),a.set(n.name,e),r===`accessor`){let{name:r}=n;return{set(n){let i=t.get.call(this);t.set.call(this,n),this.requestUpdate(r,i,e,!0,n)},init(t){return t!==void 0&&this.C(r,void 0,e,t),t}}}if(r===`setter`){let{name:r}=n;return function(n){let i=this[r];t.call(this,n),this.requestUpdate(r,i,e,!0,n)}}throw Error(`Unsupported decorator location: `+r)};function V(e){return(t,n)=>typeof n==`object`?je(e,t,n):((e,t,n)=>{let r=t.hasOwnProperty(n);return t.constructor.createProperty(n,e),r?Object.getOwnPropertyDescriptor(t,n):void 0})(e,t,n)}
/**
* @license
* Copyright 2017 Google LLC
* SPDX-License-Identifier: BSD-3-Clause
*/function H(e){return V({...e,state:!0,attribute:!1})}
/**
* @license
* Copyright 2017 Google LLC
* SPDX-License-Identifier: BSD-3-Clause
*/
const Me=(e,t,n)=>(n.configurable=!0,n.enumerable=!0,Reflect.decorate&&typeof t!=`object`&&Object.defineProperty(e,t,n),n);
/**
* @license
* Copyright 2017 Google LLC
* SPDX-License-Identifier: BSD-3-Clause
*/function Ne(e,t){return(n,r,i)=>{let a=t=>t.renderRoot?.querySelector(e)??null;if(t){let{get:e,set:t}=typeof r==`object`?n:i??(()=>{let e=Symbol();return{get(){return this[e]},set(t){this[e]=t}}})();return Me(n,r,{get(){let n=e.call(this);return n===void 0&&(n=a(this),(n!==null||this.hasUpdated)&&t.call(this,n)),n}})}return Me(n,r,{get(){return a(this)}})}}const Pe=c`
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
     block it belongs to. 28px still clears the 24px WCAG 2.5.8 minimum.

     Quiet until wanted: it matches .readout-name's weight so it reads as
     part of the block's furniture rather than competing with the values,
     and comes up to full white on hover and focus like the rows do. */
  .readout-fold {
    flex: none;
    color: rgba(255, 255, 255, 0.75);
    --mdc-icon-button-size: 28px;
    --mdc-icon-size: 17px;
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
    --mdc-icon-button-size: 40px;
    --mdc-icon-size: 20px;
  }

  /* The one control people reach for without looking, so it carries the
     extra weight. Size is the whole signal — no accent colour, which
     would compete with the LIVE badge for the eye. */
  .controls .play {
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
    .gap-run {
      forced-color-adjust: none;
    }
  }
`;var Fe=t({actions:()=>Ge,badge:()=>Le,controls:()=>Re,default:()=>Ke,editor:()=>We,empty:()=>Ie,error:()=>Ve,spark:()=>Be,track:()=>ze,version_reload:()=>Ue,version_update:()=>He}),Ie={no_frames:`No frames archived yet.`,first_soon:`The first one appears at the next capture.`,frame_failed:`This frame could not be loaded.`,index_failed:`Could not load the timeline.`},Le={live:`LIVE`,gap:`NO IMAGE`},Re={play:`Play`,pause:`Pause`,previous:`Previous frame`,next:`Next frame`,speed:`Playback speed {v}x`,now:`Jump to now`},ze={label:`Timeline position`},Be={range:`Range {v}`,flat:`No change`},Ve={no_camera:`You need to pick a camera in the card configuration.`},He=`This card was updated to {v}. Reload to pick up the new version.`,Ue=`Reload`,We={camera_entity:`Camera`,title:`Title`,show_dayticks:`Show day markers`,show_graph:`Show graphs`,show_sun:`Mark night`,playback:`Playback`,autoplay:`Play automatically`,speed:`Speed`,graph_hours:`Graph window`,overlay_right:`Overlay readings (right)`,overlay_right_hint:`Values shown over the image are read at the moment you scrub to, not the current ones.`,overlay_left:`Overlay readings (left)`,overlay_left_hint:`A second block on the other side of the picture. Leave it empty for one block on the right.`,add_entity:`Add entity`,entity:`Entity`,name:`Label`,unit:`Unit`,decimals:`Decimals`,color:`Colour`,graph:`Graph`,move_up:`Move up`,move_down:`Move down`,remove:`Remove`,helper:{camera_entity:`Only cameras created by this integration have an archive to scrub.`,graph_hours:`How much history the sparkline shows around the playhead.`,autoplay:`Ignored when your system asks for reduced motion.`,deflicker:`Evens out cloud-driven brightness jumps during playback. 0 turns it off.`,overlay_title:`Shown above the readings. Leave empty for no heading.`,overlay_title_left:`Shown above the readings. Leave empty for no heading.`,show_icon:`Uses the entity's own icon from Home Assistant.`,show_sun:`Shades the hours between sunset and sunrise on the graphs and the scrubber, using your Home Assistant location. Hidden when the bands get too fine to read.`},deflicker:`Smooth brightness`,show_icon:`Show icon`,overlay_title:`Heading`,overlay_title_left:`Heading`},Ge={show_camera:`Show camera details`,show_entity:`Show details for {v}`,hide_readings:`Hide readings`,show_readings:`Show readings`},Ke={empty:Ie,badge:Le,controls:Re,track:ze,spark:Be,error:Ve,version_update:He,version_reload:Ue,editor:We,actions:Ge},qe=t({actions:()=>rt,badge:()=>Ye,controls:()=>Xe,default:()=>it,editor:()=>nt,empty:()=>Je,error:()=>$e,spark:()=>Qe,track:()=>Ze,version_reload:()=>tt,version_update:()=>et}),Je={no_frames:`Noch keine Bilder gespeichert.`,first_soon:`Das erste erscheint bei der nächsten Aufnahme.`,frame_failed:`Dieses Bild konnte nicht geladen werden.`,index_failed:`Die Zeitleiste konnte nicht geladen werden.`},Ye={live:`LIVE`,gap:`KEIN BILD`},Xe={play:`Abspielen`,pause:`Pause`,previous:`Vorheriges Bild`,next:`Nächstes Bild`,speed:`Wiedergabegeschwindigkeit {v}x`,now:`Zur Gegenwart springen`},Ze={label:`Position auf der Zeitleiste`},Qe={range:`Spanne {v}`,flat:`Unverändert`},$e={no_camera:`Bitte wähle in der Kartenkonfiguration eine Kamera aus.`},et=`Diese Karte wurde auf {v} aktualisiert. Lade neu, um die neue Version zu verwenden.`,tt=`Neu laden`,nt={camera_entity:`Kamera`,title:`Titel`,show_dayticks:`Tagesmarkierungen anzeigen`,show_graph:`Diagramme anzeigen`,show_sun:`Nacht markieren`,playback:`Wiedergabe`,autoplay:`Automatisch abspielen`,speed:`Geschwindigkeit`,graph_hours:`Diagramm-Zeitraum`,overlay_right:`Eingeblendete Messwerte (rechts)`,overlay_right_hint:`Die Werte über dem Bild gehören zu dem Zeitpunkt, zu dem du scrollst – nicht zur Gegenwart.`,overlay_left:`Eingeblendete Messwerte (links)`,overlay_left_hint:`Ein zweiter Block auf der anderen Seite des Bildes. Leer lassen, dann bleibt es bei einem Block rechts.`,add_entity:`Entität hinzufügen`,entity:`Entität`,name:`Bezeichnung`,unit:`Einheit`,decimals:`Nachkommastellen`,color:`Farbe`,graph:`Diagramm`,move_up:`Nach oben`,move_down:`Nach unten`,remove:`Entfernen`,helper:{camera_entity:`Nur Kameras dieser Integration haben ein Archiv zum Durchblättern.`,graph_hours:`Wie viel Verlauf die Sparkline rund um die Position zeigt.`,autoplay:`Wird ignoriert, wenn dein System reduzierte Bewegung anfordert.`,deflicker:`Gleicht wolkenbedingte Helligkeitssprünge bei der Wiedergabe aus. 0 schaltet es ab.`,overlay_title:`Wird über den Messwerten angezeigt. Leer lassen für keine Überschrift.`,overlay_title_left:`Wird über den Messwerten angezeigt. Leer lassen für keine Überschrift.`,show_icon:`Verwendet das Symbol der Entität aus Home Assistant.`,show_sun:`Hinterlegt die Stunden zwischen Sonnenuntergang und Sonnenaufgang in den Diagrammen und in der Zeitleiste, basierend auf deinem Home-Assistant-Standort. Wird ausgeblendet, sobald die Streifen zu fein werden.`},deflicker:`Helligkeit glätten`,show_icon:`Symbol anzeigen`,overlay_title:`Überschrift`,overlay_title_left:`Überschrift`},rt={show_camera:`Kameradetails anzeigen`,show_entity:`Details für {v} anzeigen`,hide_readings:`Messwerte ausblenden`,show_readings:`Messwerte einblenden`},it={empty:Je,badge:Ye,controls:Xe,track:Ze,spark:Qe,error:$e,version_update:et,version_reload:tt,editor:nt,actions:rt};const at={en:Fe,de:qe};function ot(e,t){let n=e.split(`.`).reduce((e,t)=>{if(e&&typeof e==`object`&&t in e)return e[t]},t);return typeof n==`string`?n:void 0}function U(e,t=void 0,n=``,r=``){let i=(t??`en`).toLowerCase().split(/[-_]/)[0]??`en`,a=at[i]??at.en??{},o=at.en??{},s=ot(e,a);return s===void 0&&(s=ot(e,o)),s===void 0&&(s=e),n!==``&&r!==``&&(s=s.replace(n,r)),s}function W(e,t,n,r){var i=arguments.length,a=i<3?t:r===null?r=Object.getOwnPropertyDescriptor(t,n):r,o;if(typeof Reflect==`object`&&typeof Reflect.decorate==`function`)a=Reflect.decorate(e,t,n,r);else for(var s=e.length-1;s>=0;s--)(o=e[s])&&(a=(i<3?o(a):i>3?o(t,n,a):o(t,n))||a);return i>3&&a&&Object.defineProperty(t,n,a),a}var G;const st=[1,2,4,8,16,32,64],ct=[{name:`overlay_title`,selector:{text:{}}}],lt=[{name:`overlay_title_left`,selector:{text:{}}}],ut=[{type:`grid`,schema:[{name:`name`,selector:{text:{}}},{name:`unit`,selector:{text:{}}},{name:`decimals`,selector:{number:{min:0,max:4,mode:`box`}}},{name:`graph_hours`,selector:{number:{min:1,max:8760,mode:`box`,unit_of_measurement:`h`}}}]}];let K=class extends B{static{G=this}constructor(...e){super(...e),this.computeLabel=e=>this.t(`editor.${e.name}`),this.computeHelper=e=>{let t=this.t(`editor.helper.${e.name}`);return t.startsWith(`editor.`)?void 0:t}}static{this.styles=Pe}setConfig(e){this.config=e}get uiLanguage(){return this.hass?.locale?.language??this.hass?.language??`en`}t(e){return U(e,this.uiLanguage)}get schema(){return[{name:`camera_entity`,required:!0,selector:{entity:{filter:{domain:`camera`,integration:`webcam_timelapse`}}}},{name:`title`,selector:{text:{}}},{type:`grid`,schema:[{name:`show_dayticks`,selector:{boolean:{}}},{name:`show_graph`,selector:{boolean:{}}},{name:`show_sun`,selector:{boolean:{}}}]},{type:`expandable`,name:`playback`,icon:`mdi:play-speed`,flatten:!0,schema:[{name:`autoplay`,selector:{boolean:{}}},{name:`speed`,selector:{select:{mode:`dropdown`,options:st.map(e=>({value:e,label:`${e}x`}))}}},{name:`deflicker`,selector:{number:{min:0,max:100,step:5,mode:`slider`}}},{name:`graph_hours`,selector:{number:{min:1,max:336,mode:`slider`,unit_of_measurement:`h`}}}]}]}onFormChange(e){e.stopPropagation(),this.emit({...this.config,...e.detail.value})}emit(e){this.dispatchEvent(new CustomEvent(`config-changed`,{detail:{config:e},bubbles:!0,composed:!0}))}static{this.ENTITY_KEY={right:`entities`,left:`entities_left`}}rows(e){return this.config?.[G.ENTITY_KEY[e]]??[]}updateRows(e,t){this.emit({...this.config,[G.ENTITY_KEY[e]]:t})}addRow(e){this.updateRows(e,[...this.rows(e),{entity:``}])}removeRow(e,t){this.updateRows(e,this.rows(e).filter((e,n)=>n!==t))}moveRow(e,t,n){let r=[...this.rows(e)],i=t+n;i<0||i>=r.length||([r[t],r[i]]=[r[i],r[t]],this.updateRows(e,r))}patchRow(e,t,n){let r=this.rows(e).map((e,r)=>r===t?{...e,...n}:e);this.updateRows(e,r)}renderRow(e,t,n){let r=t.name||t.entity||this.t(`editor.entity`);return P`
      <div class="ent-row" role="group" aria-label=${r}>
        <ha-entity-picker
          .hass=${this.hass}
          .value=${t.entity}
          allow-custom-entity
          @value-changed=${t=>{t.stopPropagation(),this.patchRow(e,n,{entity:t.detail.value})}}
        ></ha-entity-picker>

        <ha-form
          .hass=${this.hass}
          .data=${t}
          .schema=${ut}
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

          <ha-formfield .label=${this.t(`editor.show_icon`)}>
            <ha-switch
              .checked=${t.show_icon??!1}
              @change=${t=>this.patchRow(e,n,{show_icon:t.target.checked})}
            ></ha-switch>
          </ha-formfield>

          <ha-formfield .label=${this.t(`editor.graph`)}>
            <ha-switch
              .checked=${t.graph??!1}
              @change=${t=>this.patchRow(e,n,{graph:t.target.checked})}
            ></ha-switch>
          </ha-formfield>
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
    `}render(){return!this.hass||!this.config?P`${I}`:P`
      <ha-form
        .hass=${this.hass}
        .data=${this.config}
        .schema=${this.schema}
        .computeLabel=${this.computeLabel}
        .computeHelper=${this.computeHelper}
        @value-changed=${this.onFormChange}
      ></ha-form>

      ${this.renderSection(`right`,ct)}
      ${this.renderSection(`left`,lt)}
    `}renderSection(e,t){let n=this.t(`editor.overlay_`+e),r=this.t(`editor.overlay_`+e+`_hint`);return P`
      <div class="ent-section">
        <h4>${n}</h4>
        <p class="ent-hint">${r}</p>

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
    `}};W([V({attribute:!1})],K.prototype,`hass`,void 0),W([H()],K.prototype,`config`,void 0),K=G=W([ke(`webcam-timelapse-card-editor`)],K);var dt=class{constructor(e){this.task=e,this.running=!1,this.queued=!1,this.waiters=[]}request(){return new Promise(e=>{if(this.waiters.push(e),this.running){this.queued=!0;return}this.drain()})}get busy(){return this.running}async drain(){this.running=!0;try{do{this.queued=!1;let e=this.waiters;this.waiters=[];try{await this.task()}catch{}for(let t of e)t()}while(this.queued)}finally{this.running=!1}}};const ft=`webcam-timelapse-card`,pt={radius:6,maxGain:1.5};function mt(e,t=.15){if(e.length===0)return 0;let n=[...e].sort((e,t)=>e-t),r=Math.floor(n.length*t),i=n.length-2*r>=3?n.slice(r,n.length-r):n;return i.reduce((e,t)=>e+t,0)/i.length}function ht(e,t=pt){let n=new Float32Array(e.length).fill(1),{radius:r,maxGain:i}=t;if(r<1||e.length===0)return n;let a=1/i;for(let t=0;t<e.length;t++){let o=e[t];if(o==null||o<8)continue;let s=Math.max(0,t-r),c=Math.min(e.length-1,t+r),l=[];for(let t=s;t<=c;t++){let n=e[t];n!=null&&n>=8&&l.push(n)}if(l.length<3)continue;let u=mt(l);n[t]=Math.min(Math.max(u/o,a),i)}return n}function gt(e){let t=Math.min(Math.max(e,0),100);return t===0?0:Math.max(1,Math.round(t/100*12))}function _t(e){return e?.trim()||void 0}function vt(e){let t=[],n=e?.entities_left??[];n.length>0&&t.push({side:`left`,title:_t(e?.overlay_title_left),entities:n});let r=e?.entities??[];return r.length>0&&t.push({side:`right`,title:_t(e?.overlay_title),entities:r}),t}function yt(e){return vt(e).flatMap(e=>e.entities)}const bt={base:``,ext:`.webp`,step:600,t0:null,count:0,gaps:[],retention_days:0,online:!0,newest_slot:null};function xt(e,t){return e.t0===null||t<0||t>=e.count?null:e.t0+t*e.step}function St(e,t){let n=xt(e,t);return n===null?null:`${e.base}${n}${e.ext}`}function Ct(e){let t=new Uint8Array(e.count).fill(1);for(let[n,r]of e.gaps){let i=Math.max(0,n),a=Math.min(e.count,n+r);for(let e=i;e<a;e++)t[e]=0}return t}function q(e,t,n=1){for(let r=t;r>=0&&r<e.length;r+=n)if(e[r])return r;return null}function wt(e){return e.t0!==null&&e.count>0}var Tt=class{constructor(e){this.size=e,this.cursor=0,this.slots=Array(e).fill(null)}prefetch(e){let t=new Image;t.decoding=`async`,t.fetchPriority=`low`,t.src=e,this.slots[this.cursor]=t,this.cursor=(this.cursor+1)%this.size}clear(){this.slots.fill(null),this.cursor=0}};function J(e){return Math.min(Math.max(Math.round(4*e),4),16)}function Et(e){let t=Math.max(e,0)*2;if(t<=0)return{stride:1,frameDelay:500};let n=Math.max(1,Math.round(t/30.303030303030305));return{stride:n,frameDelay:Math.max(1e3*n/t,33)}}function Dt(e,t,n){let r=q(e,t+Math.max(1,n));if(r!==null)return r;let i=q(e,e.length-1,-1);return i!==null&&i>t?i:null}function Ot(e,t,n,r,i){let a=Math.max(1,r),o=i>t+n*a?t:Math.max(i,t),s=[];for(let r=1;r<=n;r++){let n=t+r*a;if(n<=o)continue;let i=q(e,n);if(i===null)break;i>o&&(s.push(i),o=i)}return s}function kt(e){return e.currentSrc!==e.requested||!e.complete?`pending`:e.naturalWidth>0?`ready`:`failed`}function At(e){return e.configured&&!e.reducedMotion&&!e.alreadyPlaying}function jt(e,t,n){return n.reducedMotion?0:n.playing?e>4?0:Math.min(120,Math.round(t/2)):120}const Mt=new Map;function Y(e,t){let n=`${e}|${JSON.stringify(t)}`,r=Mt.get(n);return r===void 0&&(r=new Intl.DateTimeFormat(e,t),Mt.set(n,r)),r}function Nt(e,t){return Y(`en-CA`,{timeZone:t,year:`numeric`,month:`2-digit`,day:`2-digit`}).format(new Date(e*1e3))}function Pt(e,t){let n=Y(`en-GB`,{timeZone:t,hour:`2-digit`,minute:`2-digit`,second:`2-digit`,hour12:!1}).formatToParts(new Date(e*1e3)),r=0,i=0,a=0;for(let e of n)e.type===`hour`?r=Number(e.value):e.type===`minute`?i=Number(e.value):e.type===`second`&&(a=Number(e.value));return r===24&&(r=0),r*3600+i*60+a}function Ft(e,t,n,r){let i={timeZone:t,day:`2-digit`,month:`2-digit`};return r===`long`&&(i.weekday=`long`),r===`short`&&(i.weekday=`short`),Y(n,i).format(new Date(e*1e3))}function It(e){return e>=560?`long`:e>=380?`short`:`date`}function Lt(e,t,n){let r=Math.max(1,Math.floor(t/n));return Math.max(1,Math.ceil(e/r))}function Rt(e,t,n,r){if(e.t0===null||e.count===0)return[];let i=It(r),a=i===`long`?110:i===`short`?78:58,o=[],s=Nt(e.t0,t);for(let n=1;n<e.count;n++){let r=xt(e,n);if(r===null)continue;let i=Nt(r,t);i!==s&&(o.push({position:n,slot:r,date:i}),s=i)}let c=Lt(o.length,r,a),l=Math.max(1,e.count-1);return o.map((e,r)=>{let a=e.date.endsWith(`-01`),o=a||r%c===0;return{position:e.position,left:e.position/l*100,label:o?Ft(e.slot,t,n,i):``,isMonthStart:a}})}const zt=[600,900,1800,3600,7200,10800,21600,43200];function Bt(e,t,n){if(e<=0)return null;let r=e/Math.max(2,Math.floor(n/9));for(let e of zt)if(e>=r&&e>=t)return e;return null}function Vt(e,t,n,r){if(e.t0===null||e.count===0)return[];let i=e.t0,a=Math.max(1,e.count-1),o=i+a*e.step,s=Bt(o-i,e.step,r);if(s===null)return[];let c=s/(o-i)*r,l=Math.max(1,Math.ceil(46/c)),u=Math.min(43200,s*l),d=[],f=Pt(i,t)%s,p=f===0?i:i+(s-f),m=-1/0;for(let c=0;p<=o&&c<4096;c++){let o=Pt(p,t),c=o%s;if(c===0){let s=Math.round((p-i)/e.step),c=s/a*100,l=c/100*r,f=``;o%u===0&&l-m>=46&&(f=Ut(p,t,n),m=l),d.push({position:s,left:c,label:f})}p+=s-c}return d}function Ht(e,t,n){return Y(n,{timeZone:t,weekday:`short`,day:`2-digit`,month:`2-digit`,hour:`2-digit`,minute:`2-digit`}).format(new Date(e*1e3))}function Ut(e,t,n){return Y(n,{timeZone:t,hour:`2-digit`,minute:`2-digit`}).format(new Date(e*1e3))}const Wt=new Set([`unknown`,`unavailable`,`none`,``]),Gt=new Map,Kt=new Map;function qt(e){if(typeof e.lu==`number`)return Math.round(e.lu*1e3);let t=e.lu??e.last_updated??e.last_changed;return t?new Date(t).getTime():0}function Jt(e,t){let n=(e.a??e.attributes)?.[t];if(typeof n!=`string`&&typeof n!=`number`)return null;let r=new Date(n).getTime();return Number.isFinite(r)&&r>0?r:null}async function Yt(e,t,n){let r=e?.callWS?.bind(e);if(!r||t.length===0)return new Map;let i=n.timeAttributes??{},a=`${t.slice().sort().join(`,`)}|${n.days}`,o=Kt.get(a);if(o)return o;let s=new Date,c=new Date(s.getTime()-n.days*864e5),l=Object.keys(i).length>0,u=(async()=>{try{let e=await r({type:`history/history_during_period`,start_time:c.toISOString(),end_time:s.toISOString(),entity_ids:t,minimal_response:!l,no_attributes:!l,significant_changes_only:!0}),n=new Map;for(let r of t){let t=i[r],a=(e?.[r]??[]).map(e=>{let n=String(e.s??e.state??``).trim(),r=Wt.has(n.toLowerCase())?NaN:parseFloat(n);return{at:(t?Jt(e,t):null)??qt(e),value:r}}).filter(e=>Number.isFinite(e.value)&&e.at>0).sort((e,t)=>e.at-t.at);n.set(r,a),Gt.set(r,a)}return n}catch{return new Map(t.map(e=>[e,Gt.get(e)??[]]))}finally{Kt.delete(a)}})();return Kt.set(a,u),u}function Xt(e,t,n){if(e.length===0)return null;let r=0,i=e.length-1,a=-1;for(;r<=i;){let n=r+i>>1;e[n].at<=t?(a=n,r=n+1):i=n-1}if(a===-1)return null;let o=e[a];return{value:o.value,at:o.at,stale:t-o.at>n}}function Zt(e){if(!Number.isFinite(e)||e<=0)return 0;let t=e*(1+1e-9),n=10**Math.floor(Math.log10(t)),r=t/n;return(r>=5?5:r>=2?2:1)*n}const Qt=new WeakMap;function $t(e){let t=Qt.get(e);if(t)return t;let n=[];for(let t=1;t<e.length;t++){let r=Math.abs(e[t].value-e[t-1].value);r>0&&n.push(r)}n.sort((e,t)=>e-t);let r=n[Math.floor(n.length*.1)],i={quantum:r===void 0?0:Zt(r),staleAfter:en(e)};return Qt.set(e,i),i}function en(e,t=54e5){if(e.length<3)return t;let n=[];for(let t=1;t<e.length;t++)n.push(e[t].at-e[t-1].at);n.sort((e,t)=>e-t);let r=n[n.length>>1]??t;return Math.max(r*2,t)}function tn(e,t,n){let r=n*36e5/2,i=t-r,a=t+r,o=e.filter(e=>e.at>=i&&e.at<=a);if(o[0]?.at===i)return o;let s;for(let t of e){if(t.at>=i)break;s=t}return s?[{at:i,value:s.value},...o]:o}async function nn(e,t,n){if(!e?.callWS)return null;try{let r=await e.callWS({type:t});if(r?.version&&r.version!==n)return r.version}catch{}return null}function rn(){try{window.caches?.keys?.().then(e=>{e.forEach(e=>window.caches?.delete?.(e))})}catch{}window.location.reload()}function an(e,t){if(!e)return I;let n=t(`version_update`).replace(`{v}`,e),r=t(`version_reload`);return P`
    <div class="banner" role="alert" aria-live="assertive">
      <span>${n}</span>
      <button
        type="button"
        aria-label=${r}
        @click=${rn}
      >
        ${r}
      </button>
    </div>
  `}function on(e){if(!Number.isFinite(e)||e<=0)return 1;let t=10**Math.floor(Math.log10(e)),n=e/t;return(n>5?10:n>2?5:n>1?2:1)*t}function sn(e){if(e.length===0)return 0;let t=1/0,n=-1/0;for(let r of e)r.value<t&&(t=r.value),r.value>n&&(n=r.value);return n-t}function cn(e){let{points:t,at:n,hours:r,color:i,label:a,quantum:o=0,nights:s=[]}=e;if(t.length===0)return null;let c=r*36e5/2,l=n-c,u=n+c,d=u-l||1,f=1/0,p=-1/0;for(let e of t)e.value<f&&(f=e.value),e.value>p&&(p=e.value);let m=p-f,h=(f+p)/2,g=Math.max(4*o,Math.abs(h)*1e-9),_=Math.max(m,g)||1,v=h-_/2,y=h+_/2;if(m>0){let e=on(_/4);v=Math.floor(v/e)*e,y=Math.ceil(y/e)*e,y>v||(v=h-_/2,y=h+_/2)}let ee=y-v||1,b=e=>3+(e-l)/d*234,x=e=>41-(e-v)/ee*38,S=[];t.forEach((e,t)=>{let n=b(e.at),r=x(e.value);t===0?S.push(`M ${n.toFixed(1)} ${r.toFixed(1)}`):S.push(`H ${n.toFixed(1)}`,`V ${r.toFixed(1)}`)});let te=t[t.length-1];S.push(`H ${b(u).toFixed(1)}`);let C=s.map(e=>({left:3+e.left*234,width:e.width*234})),w=b(n),T=te;for(let e=t.length-1;e>=0;e--)if(t[e].at<=n){T=t[e];break}return me`
    <svg
      class="spark"
      viewBox="0 0 ${240} ${44}"
      preserveAspectRatio="none"
      role="img"
      aria-label=${a}
    >
      ${C.map(e=>me`<rect
          class="spark-night"
          x=${e.left.toFixed(1)}
          y="0"
          width=${e.width.toFixed(1)}
          height=${44}
        />`)}
      <path
        d=${S.join(` `)}
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
        y2=${44}
        stroke="currentColor"
        stroke-width="1"
        opacity="0.5"
        vector-effect="non-scaling-stroke"
      />
      <path
        d="M ${w.toFixed(1)} ${x(T.value).toFixed(1)} L ${w.toFixed(1)} ${x(T.value).toFixed(1)}"
        stroke=${i}
        stroke-width="5"
        stroke-linecap="round"
        vector-effect="non-scaling-stroke"
      />
    </svg>
  `}const X=864e5,ln=2440587.5,un=2451545,Z=Math.PI/180;function dn(e,t,n){let r=2451545.0009-n/360+e,i=fn(r),a=(357.5291+.98560028*(r-un))%360,o=(a+(1.9148*Math.sin(a*Z)+.02*Math.sin(2*a*Z)+3e-4*Math.sin(3*a*Z))+180+102.9372)%360,s=r+.0053*Math.sin(a*Z)-.0069*Math.sin(2*o*Z),c=Math.sin(o*Z)*Math.sin(23.4397*Z),l=Math.cos(Math.asin(c)),u=(Math.sin(-.833*Z)-Math.sin(t*Z)*c)/(Math.cos(t*Z)*l);if(!Number.isFinite(u)||Math.abs(u)>1)return{noon:i,rise:null,set:null,polarNight:u>1};let d=Math.acos(u)/Z;return{noon:i,rise:fn(s-d/360),set:fn(s+d/360),polarNight:!1}}function fn(e){return(e-ln)*X}function pn(e,t){return Math.round(e/X+ln-un-9e-4+t/360)}function mn(e,t,n,r){if(!Number.isFinite(e)||!Number.isFinite(t)||t<=e||!Number.isFinite(n)||!Number.isFinite(r)||Math.abs(n)>90)return[];let i=pn(e,r)-1,a=pn(t,r)+1;if(a-i>800)return[];let o=[];for(let e=i;e<=a;e++){let t=dn(e,n,r);if(t.set===null){t.polarNight&&gn(o,t.noon-X/2,t.noon+X/2);continue}let i=dn(e+1,n,r);gn(o,t.set,i.rise??i.noon-X/2)}return _n(o,e,t)}function hn(e,t,n,r){let i=t-e;if(!(i>0))return[];let a=mn(e,t,n,r).map(t=>({left:(t.from-e)/i,width:(t.to-t.from)/i}));return a.reduce((e,t)=>Math.max(e,t.width),0)>=.017094017094017096?a:[]}function gn(e,t,n){if(n<=t)return;let r=e[e.length-1];if(r&&t<=r.to){r.to=Math.max(r.to,n);return}e.push({from:t,to:n})}function _n(e,t,n){let r=[];for(let i of e){let e=Math.max(i.from,t),a=Math.min(i.to,n);a>e&&r.push({from:e,to:a})}return r}function vn(e){if(!e)return;let t=e.trim();if(t.startsWith(`/`)||t.startsWith(`https://`))return t}function yn(e){if(!Number.isFinite(e)||e<=0)return`0`;if(e>=100)return Math.round(e).toString();let t=e.toPrecision(2);return t.includes(`.`)?t.replace(/0+$/,``).replace(/\.$/,``):t}function bn(e){return!Number.isFinite(e)||e<=0?``:e<1?`${Math.round(e*60)} min`:e<48?`${Math.round(e)} h`:`${Math.round(e/24)} d`}function xn(){return typeof window<`u`&&typeof window.matchMedia==`function`&&window.matchMedia(`(prefers-reduced-motion: reduce)`).matches}const Q=[1,2,4,8,16,32,64];let $=class extends B{constructor(...e){super(...e),this.index=bt,this.position=0,this.playing=!1,this.speed=1,this.trackWidth=600,this.versionMismatch=null,this.history=new Map,this.folded=new Set,this.present=new Uint8Array,this.ring=new Tt(J(1)),this.prefetchedThrough=-1,this.useLayerA=!0,this.frameGeneration=0,this.swaps=new dt(()=>this.performSwap()),this.gains=new Float32Array,this.versionChecked=!1,this.autoplayPending=!0,this.playCounter=0,this.lastScrubAt=0,this.visible=!0,this.onScreen=!0,this.onVisibilityChange=()=>{this.visible=document.visibilityState===`visible`,this.reconcilePlayback(),this.visible&&this.refreshIndex()}}static{this.styles=Pe}setConfig(e){if(!e?.camera_entity)throw Error(U(`error.no_camera`,this.hass?.locale?.language));this.config={autoplay:!1,speed:32,show_dayticks:!0,show_graph:!0,show_sun:!1,graph_hours:24,deflicker:50,...e,entities:(e.entities??[]).filter(e=>e?.entity),entities_left:(e.entities_left??[]).filter(e=>e?.entity)},this.speed=Q.includes(this.config.speed)?this.config.speed:32,this.ring=new Tt(J(this.speed))}static getConfigElement(){return document.createElement(`webcam-timelapse-card-editor`)}static getStubConfig(e){return{camera_entity:Object.keys(e.states).find(t=>t.startsWith(`camera.`)&&e.entities?.[t]?.platform===`webcam_timelapse`)??``}}getCardSize(){return 8}getGridOptions(){return{columns:`full`,rows:`auto`,min_columns:6,min_rows:6}}connectedCallback(){super.connectedCallback(),document.addEventListener(`visibilitychange`,this.onVisibilityChange),this.intersectionObserver=new IntersectionObserver(e=>{this.onScreen=e.some(e=>e.isIntersecting),this.reconcilePlayback()}),this.intersectionObserver.observe(this),this.resizeObserver=new ResizeObserver(e=>{let t=e[0]?.contentRect.width;t&&(this.trackWidth=t-24)}),this.resizeObserver.observe(this)}disconnectedCallback(){super.disconnectedCallback(),document.removeEventListener(`visibilitychange`,this.onVisibilityChange),this.intersectionObserver?.disconnect(),this.resizeObserver?.disconnect(),this.stopPlayback(),this.indexTimer&&window.clearTimeout(this.indexTimer),this.scrubSettle&&window.clearTimeout(this.scrubSettle),this.ring.clear()}willUpdate(e){e.has(`hass`)&&this.hass&&this.index===bt&&(this.refreshIndex(),this.refreshHistory()),e.has(`hass`)&&this.hass&&!this.versionChecked&&(this.versionChecked=!0,nn(this.hass,`webcam_timelapse/card_version`,`0.6.1`).then(e=>{this.versionMismatch=e}))}reconcilePlayback(){this.playing&&this.visible&&this.onScreen?this.startPlayback():this.stopPlayback()}async refreshIndex(){if(this.hass?.callWS&&this.config){try{let e=await this.hass.callWS({type:`webcam_timelapse/index`,entity_id:this.config.camera_entity}),t=this.position>=this.index.count-1;this.index=e,this.present=Ct(e),(t||this.position>=e.count)&&(this.position=Math.max(0,e.count-1)),await this.updateComplete,this.startAutoplayIfRequested()||this.swapInFrame(),this.refreshLuma(),this.indexError=void 0}catch(e){this.indexError=e instanceof Error?e.message:`Could not load the timeline.`}this.scheduleIndexRefresh()}}async refreshLuma(){let e=gt(this.config?.deflicker??0);if(!this.hass?.callWS||e===0||!this.config){this.gains=new Float32Array;return}try{let t=await this.hass.callWS({type:`webcam_timelapse/luma`,entity_id:this.config.camera_entity});this.gains=ht(t.luma,{...pt,radius:e})}catch{this.gains=new Float32Array}this.requestUpdate()}async refreshHistory(){let e=yt(this.config);if(!this.hass||e.length===0)return;let t={};for(let n of e)n.time_attribute&&(t[n.entity]=n.time_attribute);let n=Math.max(this.config?.graph_hours??24,...e.map(e=>e.graph_hours??0));this.history=await Yt(this.hass,e.map(e=>e.entity),{days:(this.index.retention_days||14)+1+Math.ceil(n/48),timeAttributes:t})}scheduleIndexRefresh(){this.indexTimer&&window.clearTimeout(this.indexTimer);let e=this.index.step*1e3+Math.random()*15e3;this.indexTimer=window.setTimeout(()=>void this.refreshIndex(),e)}get cadence(){return Et(this.speed)}get frameDelay(){return this.cadence.frameDelay}get fadeDuration(){return jt(this.speed,this.frameDelay,{playing:this.playing,reducedMotion:xn()})}async runPlayback(e){let t=!1;for(;this.playToken===e&&this.playing;){if(t){let e=Dt(this.present,this.position,this.cadence.stride);if(e===null){this.playing=!1;break}this.position=e}t=!0;let n=performance.now();if(await this.swapInFrame(),this.prefetchAhead(),this.playToken!==e)return;let r=this.frameDelay-(performance.now()-n);r>0&&await new Promise(e=>window.setTimeout(e,r))}}startPlayback(){if(this.playToken!==void 0)return;let e=++this.playCounter;this.playToken=e,this.runPlayback(e).finally(()=>{this.playToken===e&&(this.playToken=void 0)})}stopPlayback(){this.playToken=void 0}startAutoplayIfRequested(){return!this.autoplayPending||!wt(this.index)||(this.autoplayPending=!1,!At({configured:this.config?.autoplay===!0,reducedMotion:xn(),alreadyPlaying:this.playing}))?!1:(this.togglePlay(),!0)}togglePlay(){if(!this.playing&&this.atLive){let e=q(this.present,0);e!==null&&(this.position=e)}this.playing=!this.playing,this.reconcilePlayback()}cycleSpeed(){let e=Q[(Q.indexOf(this.speed)+1)%Q.length];this.speed=e??1,this.ring=new Tt(J(this.speed)),this.prefetchedThrough=-1}goTo(e){this.position=Math.min(Math.max(e,0),Math.max(0,this.index.count-1)),this.swapInFrame(),this.prefetchAhead()}swapInFrame(){return this.swaps.request()}async performSwap(){let e=this.position,t=this.frameSources(e);if(t.length===0)return;let n=++this.frameGeneration,r=this.useLayerA?this.layerB:this.layerA;if(!r)return;let i=!1;for(let a of t){let t=new URL(a,document.baseURI).href;r.src=a;try{await r.decode()}catch{}let o=kt({currentSrc:r.currentSrc,requested:t,complete:r.complete,naturalWidth:r.naturalWidth});if(o===`pending`&&!this.playing&&(await this.awaitLoad(r),o=kt({currentSrc:r.currentSrc,requested:t,complete:r.complete,naturalWidth:r.naturalWidth})),o!==`failed`){if(o===`pending`){i=!0;continue}if(n!==this.frameGeneration)return;this.revealFrame(r,this.useLayerA?this.layerA:this.layerB),this.useLayerA=!this.useLayerA,this.loadedPosition=e,this.frameError=void 0,this.requestUpdate();return}}n===this.frameGeneration&&(this.playing||i||(this.frameError=t[0],this.requestUpdate()))}awaitLoad(e){return new Promise(t=>{let n,r=()=>{n!==void 0&&window.clearTimeout(n),e.removeEventListener(`load`,r),e.removeEventListener(`error`,r),t()};e.addEventListener(`load`,r),e.addEventListener(`error`,r),n=window.setTimeout(r,1500)})}revealFrame(e,t){let n=this.fadeDuration;if(t&&(t.style.transition=`none`,t.style.opacity=`1`,t.style.zIndex=`1`),e.style.zIndex=`2`,n===0){e.style.transition=`none`,e.style.opacity=`1`;return}e.style.transition=`none`,e.style.opacity=`0`,e.offsetWidth,e.style.transition=`opacity ${n}ms linear`,e.style.opacity=`1`}frameSources(e){let t=[],n=vn(this.hass?.states[this.config.camera_entity]?.attributes.entity_picture);e>=this.index.count-1&&n&&t.push(n);let r=St(this.index,e);return r&&t.push(r),t}prefetchAhead(){let e=Ot(this.present,this.position,J(this.speed),this.cadence.stride,this.prefetchedThrough);for(let t of e){let e=St(this.index,t);e&&this.ring.prefetch(e),this.prefetchedThrough=t}}onScrub(e){let t=Number(e.target.value);this.position=t,this.pendingPosition=t;let n=performance.now();n-this.lastScrubAt>=80&&(this.lastScrubAt=n,this.loadPendingPosition()),this.scrubSettle&&window.clearTimeout(this.scrubSettle),this.scrubSettle=window.setTimeout(()=>{this.scrubSettle=void 0,this.loadPendingPosition()},80)}loadPendingPosition(){let e=this.pendingPosition;e!==void 0&&e!==this.loadedPosition&&this.goTo(e)}onScrubCommit(e){this.scrubSettle&&window.clearTimeout(this.scrubSettle),this.scrubSettle=void 0,this.pendingPosition=Number(e.target.value),this.loadPendingPosition()}jumpToNow(){this.playing=!1,this.stopPlayback(),this.goTo(this.index.count-1)}stepBy(e){let t=q(this.present,this.position+e,e);t!==null&&this.goTo(t)}get timeZone(){return this.hass?.config?.time_zone??Intl.DateTimeFormat().resolvedOptions().timeZone}get language(){return this.hass?.locale?.language??this.hass?.language??`en`}t(e,t){return t===void 0?U(e,this.language):U(e,this.language,`{v}`,t)}get atLive(){return this.position>=this.index.count-1}get onGap(){return this.present.length>0&&!this.present[this.position]}render(){if(!this.config||!this.hass)return P`<ha-card></ha-card>`;let e=this.index.t0===null?null:this.index.t0+this.position*this.index.step;return P`
      <ha-card .header=${this.config.title??I}>
        ${an(this.versionMismatch,e=>this.t(e))}
        ${this.renderStage(e)}
        ${wt(this.index)?this.renderTimeline(e):I}
      </ha-card>
    `}renderStage(e){if(!wt(this.index))return P`
        <div class="stage">
          <div class="empty">
            ${this.indexError?P`
                  <div>${this.t(`empty.index_failed`)}</div>
                  <div class="detail">${this.indexError}</div>
                `:P`
                  <div>${this.t(`empty.no_frames`)}</div>
                  <div>${this.t(`empty.first_soon`)}</div>
                `}
          </div>
        </div>
      `;let t=this.gains[this.position]??1,n=[];t!==1&&n.push(`brightness(${t.toFixed(3)})`),this.onGap&&n.push(`grayscale(0.5)`,`brightness(0.5)`);let r=n.length>0?n.join(` `):`none`;return P`
      <div
        class="stage"
        style="--wtl-frame-filter:${r}"
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
        ${this.frameError?P`<div class="empty">
              <div>${this.t(`empty.frame_failed`)}</div>
              <div class="detail">${this.frameError}</div>
            </div>`:I}
        ${e===null?I:P`<div class="stamp">
              <time datetime=${new Date(e*1e3).toISOString()}>
                ${Ht(e,this.timeZone,this.language)}
              </time>
            </div>`}
        ${e===null?I:this.renderReadouts(e)}
        ${this.onGap?P`<div class="badge gap">${this.t(`badge.gap`)}</div>`:this.atLive?P`<div class="badge live">${this.t(`badge.live`)}</div>`:I}
        ${this.renderControls()}
      </div>
    `}renderReadouts(e){let t=vt(this.config);return t.length===0?I:P`<div class="readouts ${t.length>1?`pair`:``}">
      ${t.map(t=>this.renderReadout(e,t))}
    </div>`}renderReadout(e,t){let n=`readout ${t.side===`left`?`left`:``}`;if(this.folded.has(t.side))return P`<div class="${n} folded">
        ${this.renderFoldToggle(t.side,!0)}
      </div>`;let r=t.entities,i=e*1e3,a=r.map(e=>{let t=this.history.get(e.entity)??[],n=$t(t),r=Xt(t,i,n.staleAfter),a=e.name??this.hass?.states[e.entity]?.attributes.friendly_name??e.entity,o=e.unit??this.hass?.states[e.entity]?.attributes.unit_of_measurement??``,s=e.color??`var(--wtl-accent)`,c=r===null?`—`:`${r.value.toFixed(e.decimals??1)}${o?` ${o}`:``}`,l=e.graph_hours??this.config?.graph_hours??24,u=e.graph===!0&&this.config?.show_graph!==!1,d=u?tn(t,i,l):[],f=u&&this.config?.show_sun===!0?this.nightsAround(i,l):[],p=u?cn({points:d,at:i,hours:l,color:s,label:`${a} history`,quantum:n.quantum,nights:f}):null,m=p===null?0:sn(d),h=p===null?I:P`<div class="spark-scale">
            <span
              >${m===0?this.t(`spark.flat`):this.t(`spark.range`,`${yn(m)}${o?` ${o}`:``}`)}</span
            >
            <span>${bn(l)}</span>
          </div>`,g=this.hass?.states[e.entity],_=e.show_icon&&g?P`<ha-state-icon
              class="readout-icon"
              style="color:${s}"
              .hass=${this.hass}
              .stateObj=${g}
            ></ha-state-icon>`:I;return P`
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
          ${r===null?I:P`<span class="readout-at"
                >${Ut(Math.round(r.at/1e3),this.timeZone,this.language)}</span
              >`}
        </div>
        ${p?P`<div class="spark-wrap">${p}${h}</div>`:I}
      `});return P`<div class=${n}>
      <div class="readout-head">
        ${t.title?P`<div class="readout-title">${t.title}</div>`:I}
        ${this.renderFoldToggle(t.side,!1)}
      </div>
      ${a}
    </div>`}nightsAround(e,t){let n=t*36e5/2;return this.nightsBetween(e-n,e+n)}nightsBetween(e,t){let n=this.hass?.config?.latitude,r=this.hass?.config?.longitude;if(n===void 0||r===void 0)return[];let i=`${e}|${t}|${n}|${r}`;return this.nightCache?.key!==i&&(this.nightCache={key:i,bands:hn(e,t,n,r)}),this.nightCache.bands}renderFoldToggle(e,t){let n=this.t(t?`actions.show_readings`:`actions.hide_readings`);return P`<ha-icon-button
      class="readout-fold"
      .label=${n}
      aria-expanded=${t?`false`:`true`}
      @click=${()=>this.toggleFold(e)}
    >
      <ha-icon icon=${t?`mdi:eye-outline`:`mdi:eye-off-outline`}></ha-icon>
    </ha-icon-button>`}toggleFold(e){let t=new Set(this.folded);t.delete(e)||t.add(e),this.folded=t}fireMoreInfo(e){e&&this.dispatchEvent(new CustomEvent(`hass-more-info`,{detail:{entityId:e},bubbles:!0,composed:!0}))}onActivateKey(e,t){(e.key===`Enter`||e.key===` `)&&(e.preventDefault(),this.fireMoreInfo(t))}onStageClick(e){let t=e.composedPath(),n=t.indexOf(e.currentTarget);(n===-1?t:t.slice(0,n)).some(e=>e instanceof HTMLElement&&(e.classList.contains(`controls`)||e.classList.contains(`readout-row`)||e.classList.contains(`readout-fold`)))||this.config&&this.fireMoreInfo(this.config.camera_entity)}renderControls(){return P`
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
      </div>
    `}renderTimeline(e){let t=Math.max(1,this.index.count-1),n=this.position/t*100,r=this.config?.show_dayticks!==!1,{days:i,times:a}=r?this.rulerFor():{days:[],times:[]},o=this.config?.show_sun===!0&&this.index.t0!==null?this.nightsBetween(this.index.t0*1e3,(this.index.t0+t*this.index.step)*1e3):[];return P`
      <div class="timeline">
        ${r?P`<div class="band dates" aria-hidden="true">
              ${i.map(e=>e.label?P`<span class="lab date" style="left:${e.left}%"
                      >${e.label}</span
                    >`:I)}
            </div>`:I}

        <div class="track">
          ${o.length>0?P`<div class="nights" aria-hidden="true">
                ${o.map(e=>P`<span
                      class="night"
                      style="left:${(e.left*100).toFixed(3)}%;width:${(e.width*100).toFixed(3)}%"
                    ></span>`)}
              </div>`:I}
          ${r?P`<div class="marks" aria-hidden="true">
                ${a.map(e=>P`<span class="mark" style="left:${e.left}%"></span>`)}
                ${i.map(e=>P`<span
                      class="mark ${e.isMonthStart?`month`:`day`}"
                      style="left:${e.left}%"
                    ></span>`)}
              </div>`:I}
          <div class="rail"></div>
        <div class="fill" style="width:${n}%"></div>
        ${this.index.gaps.map(([e,n])=>{let r=e/t*100,i=n/t*100;return P`<div
            class="gap-run"
            style="left:${r}%;width:${i}%"
          ></div>`})}
        <input
          type="range"
          min="0"
          max=${t}
          step="1"
          .value=${String(this.position)}
          aria-label=${this.t(`track.label`)}
          aria-valuetext=${e===null?``:Ht(e,this.timeZone,this.language)}
          @input=${this.onScrub}
          @change=${this.onScrubCommit}
          />
        </div>

        ${r?P`<div class="band times" aria-hidden="true">
              ${a.map(e=>e.label?P`<span class="lab time" style="left:${e.left}%"
                      >${e.label}</span
                    >`:I)}
            </div>`:I}
      </div>
    `}rulerFor(){let e=[this.index.t0,this.index.count,this.index.step,Math.round(this.trackWidth),this.timeZone,this.language].join(`|`);return this.rulerCache?.key!==e&&(this.rulerCache={key:e,days:Rt(this.index,this.timeZone,this.language,this.trackWidth),times:Vt(this.index,this.timeZone,this.language,this.trackWidth)}),this.rulerCache}};W([V({attribute:!1})],$.prototype,`hass`,void 0),W([H()],$.prototype,`config`,void 0),W([H()],$.prototype,`index`,void 0),W([H()],$.prototype,`position`,void 0),W([H()],$.prototype,`playing`,void 0),W([H()],$.prototype,`speed`,void 0),W([H()],$.prototype,`trackWidth`,void 0),W([H()],$.prototype,`versionMismatch`,void 0),W([H()],$.prototype,`indexError`,void 0),W([H()],$.prototype,`frameError`,void 0),W([H()],$.prototype,`history`,void 0),W([H()],$.prototype,`folded`,void 0),W([Ne(`img.layer.a`)],$.prototype,`layerA`,void 0),W([Ne(`img.layer.b`)],$.prototype,`layerB`,void 0),$=W([ke(ft)],$);const Sn=window;Sn.customCards=Sn.customCards??[],Sn.customCards.push({type:ft,name:`Webcam Timelapse`,description:`Scrub and play back an archived still-image webcam.`,preview:!0,documentationURL:`https://github.com/rolandzeiner/webcam-timelapse`,getEntitySuggestion:(e,t)=>!t.startsWith(`camera.`)||e.entities?.[t]?.platform!==`webcam_timelapse`?null:{config:{type:`custom:${ft}`,camera_entity:t}}});export{$ as WebcamTimelapseCard};