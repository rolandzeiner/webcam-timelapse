// Webcam Timelapse Card — bundled by Rollup. Edit sources in src/, then `npm run build`.
function t(t,e,i,n){var s,o=arguments.length,a=o<3?e:null===n?n=Object.getOwnPropertyDescriptor(e,i):n;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)a=Reflect.decorate(t,e,i,n);else for(var r=t.length-1;r>=0;r--)(s=t[r])&&(a=(o<3?s(a):o>3?s(e,i,a):s(e,i))||a);return o>3&&a&&Object.defineProperty(e,i,a),a}"function"==typeof SuppressedError&&SuppressedError;const e=globalThis,i=e.ShadowRoot&&(void 0===e.ShadyCSS||e.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,n=Symbol(),s=new WeakMap;let o=class{constructor(t,e,i){if(this._$cssResult$=!0,i!==n)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=t,this.t=e}get styleSheet(){let t=this.o;const e=this.t;if(i&&void 0===t){const i=void 0!==e&&1===e.length;i&&(t=s.get(e)),void 0===t&&((this.o=t=new CSSStyleSheet).replaceSync(this.cssText),i&&s.set(e,t))}return t}toString(){return this.cssText}};const a=i?t=>t:t=>t instanceof CSSStyleSheet?(t=>{let e="";for(const i of t.cssRules)e+=i.cssText;return(t=>new o("string"==typeof t?t:t+"",void 0,n))(e)})(t):t,{is:r,defineProperty:h,getOwnPropertyDescriptor:l,getOwnPropertyNames:c,getOwnPropertySymbols:d,getPrototypeOf:u}=Object,p=globalThis,m=p.trustedTypes,g=m?m.emptyScript:"",f=p.reactiveElementPolyfillSupport,y=(t,e)=>t,b={toAttribute(t,e){switch(e){case Boolean:t=t?g:null;break;case Object:case Array:t=null==t?t:JSON.stringify(t)}return t},fromAttribute(t,e){let i=t;switch(e){case Boolean:i=null!==t;break;case Number:i=null===t?null:Number(t);break;case Object:case Array:try{i=JSON.parse(t)}catch(t){i=null}}return i}},w=(t,e)=>!r(t,e),v={attribute:!0,type:String,converter:b,reflect:!1,useDefault:!1,hasChanged:w};Symbol.metadata??=Symbol("metadata"),p.litPropertyMetadata??=new WeakMap;let $=class extends HTMLElement{static addInitializer(t){this._$Ei(),(this.l??=[]).push(t)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(t,e=v){if(e.state&&(e.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(t)&&((e=Object.create(e)).wrapped=!0),this.elementProperties.set(t,e),!e.noAccessor){const i=Symbol(),n=this.getPropertyDescriptor(t,i,e);void 0!==n&&h(this.prototype,t,n)}}static getPropertyDescriptor(t,e,i){const{get:n,set:s}=l(this.prototype,t)??{get(){return this[e]},set(t){this[e]=t}};return{get:n,set(e){const o=n?.call(this);s?.call(this,e),this.requestUpdate(t,o,i)},configurable:!0,enumerable:!0}}static getPropertyOptions(t){return this.elementProperties.get(t)??v}static _$Ei(){if(this.hasOwnProperty(y("elementProperties")))return;const t=u(this);t.finalize(),void 0!==t.l&&(this.l=[...t.l]),this.elementProperties=new Map(t.elementProperties)}static finalize(){if(this.hasOwnProperty(y("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(y("properties"))){const t=this.properties,e=[...c(t),...d(t)];for(const i of e)this.createProperty(i,t[i])}const t=this[Symbol.metadata];if(null!==t){const e=litPropertyMetadata.get(t);if(void 0!==e)for(const[t,i]of e)this.elementProperties.set(t,i)}this._$Eh=new Map;for(const[t,e]of this.elementProperties){const i=this._$Eu(t,e);void 0!==i&&this._$Eh.set(i,t)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(t){const e=[];if(Array.isArray(t)){const i=new Set(t.flat(1/0).reverse());for(const t of i)e.unshift(a(t))}else void 0!==t&&e.push(a(t));return e}static _$Eu(t,e){const i=e.attribute;return!1===i?void 0:"string"==typeof i?i:"string"==typeof t?t.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$ES=new Promise(t=>this.enableUpdating=t),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach(t=>t(this))}addController(t){(this._$EO??=new Set).add(t),void 0!==this.renderRoot&&this.isConnected&&t.hostConnected?.()}removeController(t){this._$EO?.delete(t)}_$E_(){const t=new Map,e=this.constructor.elementProperties;for(const i of e.keys())this.hasOwnProperty(i)&&(t.set(i,this[i]),delete this[i]);t.size>0&&(this._$Ep=t)}createRenderRoot(){const t=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return((t,n)=>{if(i)t.adoptedStyleSheets=n.map(t=>t instanceof CSSStyleSheet?t:t.styleSheet);else for(const i of n){const n=document.createElement("style"),s=e.litNonce;void 0!==s&&n.setAttribute("nonce",s),n.textContent=i.cssText,t.appendChild(n)}})(t,this.constructor.elementStyles),t}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(!0),this._$EO?.forEach(t=>t.hostConnected?.())}enableUpdating(t){}disconnectedCallback(){this._$EO?.forEach(t=>t.hostDisconnected?.())}attributeChangedCallback(t,e,i){this._$AK(t,i)}_$ET(t,e){const i=this.constructor.elementProperties.get(t),n=this.constructor._$Eu(t,i);if(void 0!==n&&!0===i.reflect){const s=(void 0!==i.converter?.toAttribute?i.converter:b).toAttribute(e,i.type);this._$Em=t,null==s?this.removeAttribute(n):this.setAttribute(n,s),this._$Em=null}}_$AK(t,e){const i=this.constructor,n=i._$Eh.get(t);if(void 0!==n&&this._$Em!==n){const t=i.getPropertyOptions(n),s="function"==typeof t.converter?{fromAttribute:t.converter}:void 0!==t.converter?.fromAttribute?t.converter:b;this._$Em=n;const o=s.fromAttribute(e,t.type);this[n]=o??this._$Ej?.get(n)??o,this._$Em=null}}requestUpdate(t,e,i,n=!1,s){if(void 0!==t){const o=this.constructor;if(!1===n&&(s=this[t]),i??=o.getPropertyOptions(t),!((i.hasChanged??w)(s,e)||i.useDefault&&i.reflect&&s===this._$Ej?.get(t)&&!this.hasAttribute(o._$Eu(t,i))))return;this.C(t,e,i)}!1===this.isUpdatePending&&(this._$ES=this._$EP())}C(t,e,{useDefault:i,reflect:n,wrapped:s},o){i&&!(this._$Ej??=new Map).has(t)&&(this._$Ej.set(t,o??e??this[t]),!0!==s||void 0!==o)||(this._$AL.has(t)||(this.hasUpdated||i||(e=void 0),this._$AL.set(t,e)),!0===n&&this._$Em!==t&&(this._$Eq??=new Set).add(t))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(t){Promise.reject(t)}const t=this.scheduleUpdate();return null!=t&&await t,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(const[t,e]of this._$Ep)this[t]=e;this._$Ep=void 0}const t=this.constructor.elementProperties;if(t.size>0)for(const[e,i]of t){const{wrapped:t}=i,n=this[e];!0!==t||this._$AL.has(e)||void 0===n||this.C(e,void 0,i,n)}}let t=!1;const e=this._$AL;try{t=this.shouldUpdate(e),t?(this.willUpdate(e),this._$EO?.forEach(t=>t.hostUpdate?.()),this.update(e)):this._$EM()}catch(e){throw t=!1,this._$EM(),e}t&&this._$AE(e)}willUpdate(t){}_$AE(t){this._$EO?.forEach(t=>t.hostUpdated?.()),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(t)),this.updated(t)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(t){return!0}update(t){this._$Eq&&=this._$Eq.forEach(t=>this._$ET(t,this[t])),this._$EM()}updated(t){}firstUpdated(t){}};$.elementStyles=[],$.shadowRootOptions={mode:"open"},$[y("elementProperties")]=new Map,$[y("finalized")]=new Map,f?.({ReactiveElement:$}),(p.reactiveElementVersions??=[]).push("2.1.2");const x=globalThis,_=t=>t,k=x.trustedTypes,A=k?k.createPolicy("lit-html",{createHTML:t=>t}):void 0,S="$lit$",M=`lit$${Math.random().toFixed(9).slice(2)}$`,E="?"+M,T=`<${E}>`,P=document,C=()=>P.createComment(""),z=t=>null===t||"object"!=typeof t&&"function"!=typeof t,R=Array.isArray,O="[ \t\n\f\r]",L=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,N=/-->/g,D=/>/g,H=RegExp(`>|${O}(?:([^\\s"'>=/]+)(${O}*=${O}*(?:[^ \t\n\f\r"'\`<>=]|("|')|))|$)`,"g"),I=/'/g,U=/"/g,W=/^(?:script|style|textarea|title)$/i,F=t=>(e,...i)=>({_$litType$:t,strings:e,values:i}),j=F(1),B=F(2),q=Symbol.for("lit-noChange"),G=Symbol.for("lit-nothing"),V=new WeakMap,Z=P.createTreeWalker(P,129);function K(t,e){if(!R(t)||!t.hasOwnProperty("raw"))throw Error("invalid template strings array");return void 0!==A?A.createHTML(e):e}const Y=(t,e)=>{const i=t.length-1,n=[];let s,o=2===e?"<svg>":3===e?"<math>":"",a=L;for(let e=0;e<i;e++){const i=t[e];let r,h,l=-1,c=0;for(;c<i.length&&(a.lastIndex=c,h=a.exec(i),null!==h);)c=a.lastIndex,a===L?"!--"===h[1]?a=N:void 0!==h[1]?a=D:void 0!==h[2]?(W.test(h[2])&&(s=RegExp("</"+h[2],"g")),a=H):void 0!==h[3]&&(a=H):a===H?">"===h[0]?(a=s??L,l=-1):void 0===h[1]?l=-2:(l=a.lastIndex-h[2].length,r=h[1],a=void 0===h[3]?H:'"'===h[3]?U:I):a===U||a===I?a=H:a===N||a===D?a=L:(a=H,s=void 0);const d=a===H&&t[e+1].startsWith("/>")?" ":"";o+=a===L?i+T:l>=0?(n.push(r),i.slice(0,l)+S+i.slice(l)+M+d):i+M+(-2===l?e:d)}return[K(t,o+(t[i]||"<?>")+(2===e?"</svg>":3===e?"</math>":"")),n]};class J{constructor({strings:t,_$litType$:e},i){let n;this.parts=[];let s=0,o=0;const a=t.length-1,r=this.parts,[h,l]=Y(t,e);if(this.el=J.createElement(h,i),Z.currentNode=this.el.content,2===e||3===e){const t=this.el.content.firstChild;t.replaceWith(...t.childNodes)}for(;null!==(n=Z.nextNode())&&r.length<a;){if(1===n.nodeType){if(n.hasAttributes())for(const t of n.getAttributeNames())if(t.endsWith(S)){const e=l[o++],i=n.getAttribute(t).split(M),a=/([.?@])?(.*)/.exec(e);r.push({type:1,index:s,name:a[2],strings:i,ctor:"."===a[1]?it:"?"===a[1]?nt:"@"===a[1]?st:et}),n.removeAttribute(t)}else t.startsWith(M)&&(r.push({type:6,index:s}),n.removeAttribute(t));if(W.test(n.tagName)){const t=n.textContent.split(M),e=t.length-1;if(e>0){n.textContent=k?k.emptyScript:"";for(let i=0;i<e;i++)n.append(t[i],C()),Z.nextNode(),r.push({type:2,index:++s});n.append(t[e],C())}}}else if(8===n.nodeType)if(n.data===E)r.push({type:2,index:s});else{let t=-1;for(;-1!==(t=n.data.indexOf(M,t+1));)r.push({type:7,index:s}),t+=M.length-1}s++}}static createElement(t,e){const i=P.createElement("template");return i.innerHTML=t,i}}function X(t,e,i=t,n){if(e===q)return e;let s=void 0!==n?i._$Co?.[n]:i._$Cl;const o=z(e)?void 0:e._$litDirective$;return s?.constructor!==o&&(s?._$AO?.(!1),void 0===o?s=void 0:(s=new o(t),s._$AT(t,i,n)),void 0!==n?(i._$Co??=[])[n]=s:i._$Cl=s),void 0!==s&&(e=X(t,s._$AS(t,e.values),s,n)),e}class Q{constructor(t,e){this._$AV=[],this._$AN=void 0,this._$AD=t,this._$AM=e}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(t){const{el:{content:e},parts:i}=this._$AD,n=(t?.creationScope??P).importNode(e,!0);Z.currentNode=n;let s=Z.nextNode(),o=0,a=0,r=i[0];for(;void 0!==r;){if(o===r.index){let e;2===r.type?e=new tt(s,s.nextSibling,this,t):1===r.type?e=new r.ctor(s,r.name,r.strings,this,t):6===r.type&&(e=new ot(s,this,t)),this._$AV.push(e),r=i[++a]}o!==r?.index&&(s=Z.nextNode(),o++)}return Z.currentNode=P,n}p(t){let e=0;for(const i of this._$AV)void 0!==i&&(void 0!==i.strings?(i._$AI(t,i,e),e+=i.strings.length-2):i._$AI(t[e])),e++}}class tt{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(t,e,i,n){this.type=2,this._$AH=G,this._$AN=void 0,this._$AA=t,this._$AB=e,this._$AM=i,this.options=n,this._$Cv=n?.isConnected??!0}get parentNode(){let t=this._$AA.parentNode;const e=this._$AM;return void 0!==e&&11===t?.nodeType&&(t=e.parentNode),t}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(t,e=this){t=X(this,t,e),z(t)?t===G||null==t||""===t?(this._$AH!==G&&this._$AR(),this._$AH=G):t!==this._$AH&&t!==q&&this._(t):void 0!==t._$litType$?this.$(t):void 0!==t.nodeType?this.T(t):(t=>R(t)||"function"==typeof t?.[Symbol.iterator])(t)?this.k(t):this._(t)}O(t){return this._$AA.parentNode.insertBefore(t,this._$AB)}T(t){this._$AH!==t&&(this._$AR(),this._$AH=this.O(t))}_(t){this._$AH!==G&&z(this._$AH)?this._$AA.nextSibling.data=t:this.T(P.createTextNode(t)),this._$AH=t}$(t){const{values:e,_$litType$:i}=t,n="number"==typeof i?this._$AC(t):(void 0===i.el&&(i.el=J.createElement(K(i.h,i.h[0]),this.options)),i);if(this._$AH?._$AD===n)this._$AH.p(e);else{const t=new Q(n,this),i=t.u(this.options);t.p(e),this.T(i),this._$AH=t}}_$AC(t){let e=V.get(t.strings);return void 0===e&&V.set(t.strings,e=new J(t)),e}k(t){R(this._$AH)||(this._$AH=[],this._$AR());const e=this._$AH;let i,n=0;for(const s of t)n===e.length?e.push(i=new tt(this.O(C()),this.O(C()),this,this.options)):i=e[n],i._$AI(s),n++;n<e.length&&(this._$AR(i&&i._$AB.nextSibling,n),e.length=n)}_$AR(t=this._$AA.nextSibling,e){for(this._$AP?.(!1,!0,e);t!==this._$AB;){const e=_(t).nextSibling;_(t).remove(),t=e}}setConnected(t){void 0===this._$AM&&(this._$Cv=t,this._$AP?.(t))}}class et{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(t,e,i,n,s){this.type=1,this._$AH=G,this._$AN=void 0,this.element=t,this.name=e,this._$AM=n,this.options=s,i.length>2||""!==i[0]||""!==i[1]?(this._$AH=Array(i.length-1).fill(new String),this.strings=i):this._$AH=G}_$AI(t,e=this,i,n){const s=this.strings;let o=!1;if(void 0===s)t=X(this,t,e,0),o=!z(t)||t!==this._$AH&&t!==q,o&&(this._$AH=t);else{const n=t;let a,r;for(t=s[0],a=0;a<s.length-1;a++)r=X(this,n[i+a],e,a),r===q&&(r=this._$AH[a]),o||=!z(r)||r!==this._$AH[a],r===G?t=G:t!==G&&(t+=(r??"")+s[a+1]),this._$AH[a]=r}o&&!n&&this.j(t)}j(t){t===G?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,t??"")}}class it extends et{constructor(){super(...arguments),this.type=3}j(t){this.element[this.name]=t===G?void 0:t}}class nt extends et{constructor(){super(...arguments),this.type=4}j(t){this.element.toggleAttribute(this.name,!!t&&t!==G)}}class st extends et{constructor(t,e,i,n,s){super(t,e,i,n,s),this.type=5}_$AI(t,e=this){if((t=X(this,t,e,0)??G)===q)return;const i=this._$AH,n=t===G&&i!==G||t.capture!==i.capture||t.once!==i.once||t.passive!==i.passive,s=t!==G&&(i===G||n);n&&this.element.removeEventListener(this.name,this,i),s&&this.element.addEventListener(this.name,this,t),this._$AH=t}handleEvent(t){"function"==typeof this._$AH?this._$AH.call(this.options?.host??this.element,t):this._$AH.handleEvent(t)}}class ot{constructor(t,e,i){this.element=t,this.type=6,this._$AN=void 0,this._$AM=e,this.options=i}get _$AU(){return this._$AM._$AU}_$AI(t){X(this,t)}}const at=x.litHtmlPolyfillSupport;at?.(J,tt),(x.litHtmlVersions??=[]).push("3.3.3");const rt=globalThis;class ht extends ${constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){const t=super.createRenderRoot();return this.renderOptions.renderBefore??=t.firstChild,t}update(t){const e=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(t),this._$Do=((t,e,i)=>{const n=i?.renderBefore??e;let s=n._$litPart$;if(void 0===s){const t=i?.renderBefore??null;n._$litPart$=s=new tt(e.insertBefore(C(),t),t,void 0,i??{})}return s._$AI(t),s})(e,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return q}}ht._$litElement$=!0,ht.finalized=!0,rt.litElementHydrateSupport?.({LitElement:ht});const lt=rt.litElementPolyfillSupport;lt?.({LitElement:ht}),(rt.litElementVersions??=[]).push("4.2.2");const ct=t=>(e,i)=>{void 0!==i?i.addInitializer(()=>{customElements.define(t,e)}):customElements.define(t,e)},dt={attribute:!0,type:String,converter:b,reflect:!1,hasChanged:w},ut=(t=dt,e,i)=>{const{kind:n,metadata:s}=i;let o=globalThis.litPropertyMetadata.get(s);if(void 0===o&&globalThis.litPropertyMetadata.set(s,o=new Map),"setter"===n&&((t=Object.create(t)).wrapped=!0),o.set(i.name,t),"accessor"===n){const{name:n}=i;return{set(i){const s=e.get.call(this);e.set.call(this,i),this.requestUpdate(n,s,t,!0,i)},init(e){return void 0!==e&&this.C(n,void 0,t,e),e}}}if("setter"===n){const{name:n}=i;return function(i){const s=this[n];e.call(this,i),this.requestUpdate(n,s,t,!0,i)}}throw Error("Unsupported decorator location: "+n)};function pt(t){return(e,i)=>"object"==typeof i?ut(t,e,i):((t,e,i)=>{const n=e.hasOwnProperty(i);return e.constructor.createProperty(i,t),n?Object.getOwnPropertyDescriptor(e,i):void 0})(t,e,i)}function mt(t){return pt({...t,state:!0,attribute:!1})}function gt(t,e){return(e,i,n)=>((t,e,i)=>(i.configurable=!0,i.enumerable=!0,Reflect.decorate&&"object"!=typeof e&&Object.defineProperty(t,e,i),i))(e,i,{get(){return(e=>e.renderRoot?.querySelector(t)??null)(this)}})}const ft=((t,...e)=>{const i=1===t.length?t[0]:e.reduce((e,i,n)=>e+(t=>{if(!0===t._$cssResult$)return t.cssText;if("number"==typeof t)return t;throw Error("Value passed to 'css' function must be a 'css' function result: "+t+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(i)+t[n+1],t[0]);return new o(i,t,n)})`
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
    container-type: inline-size;
  }

  ha-card {
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
    font-size: var(--ha-font-size-s, 0.8rem);
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
    font-size: var(--ha-font-size-m, 0.9rem);
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
    font-size: var(--ha-font-size-s, 0.8rem);
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
    font-weight: var(--ha-font-weight-medium, 600);
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
    font-size: var(--ha-font-size-s, 0.85rem);
    font-weight: var(--ha-font-weight-medium, 600);
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
    font-size: var(--ha-font-size-s, 0.85rem);
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
    font-weight: var(--ha-font-weight-medium, 600);
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
    font-size: var(--ha-font-size-xs, 0.7rem);
    line-height: 1.2;
    color: rgba(255, 255, 255, 0.6);
    white-space: nowrap;
  }

  .readout-at {
    font-size: var(--ha-font-size-xs, 0.7rem);
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
    font-size: var(--ha-font-size-xs, 0.7rem);
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
    font-size: var(--ha-font-size-s, 0.875rem);
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
    font-size: var(--ha-font-size-s, 0.875rem);
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
    font-size: var(--ha-font-size-s, 0.85rem);
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
`;var yt={no_frames:"No frames archived yet.",first_soon:"The first one appears at the next capture.",frame_failed:"This frame could not be loaded.",index_failed:"Could not load the timeline."},bt={live:"LIVE",gap:"NO IMAGE"},wt={play:"Play",pause:"Pause",previous:"Previous frame",next:"Next frame",speed:"Playback speed {v}x",now:"Jump to now"},vt={label:"Timeline position"},$t={range:"Range {v}",flat:"No change"},xt={no_camera:"You need to pick a camera in the card configuration."},_t="This card was updated to {v}. Reload to pick up the new version.",kt="Reload",At={camera_entity:"Camera",title:"Title",show_dayticks:"Show day markers",show_graph:"Show graphs",playback:"Playback",autoplay:"Play automatically",speed:"Speed",graph_hours:"Graph window",overlay_right:"Overlay readings (right)",overlay_right_hint:"Values shown over the image are read at the moment you scrub to, not the current ones.",overlay_left:"Overlay readings (left)",overlay_left_hint:"A second block on the other side of the picture. Leave it empty for one block on the right.",add_entity:"Add entity",entity:"Entity",name:"Label",unit:"Unit",decimals:"Decimals",color:"Colour",graph:"Graph",move_up:"Move up",move_down:"Move down",remove:"Remove",helper:{camera_entity:"Only cameras created by this integration have an archive to scrub.",graph_hours:"How much history the sparkline shows around the playhead.",autoplay:"Ignored when your system asks for reduced motion.",deflicker:"Evens out cloud-driven brightness jumps during playback. 0 turns it off.",overlay_title:"Shown above the readings. Leave empty for no heading.",overlay_title_left:"Shown above the readings. Leave empty for no heading.",show_icon:"Uses the entity's own icon from Home Assistant."},deflicker:"Smooth brightness",show_icon:"Show icon",overlay_title:"Heading",overlay_title_left:"Heading"},St={show_camera:"Show camera details",show_entity:"Show details for {v}",hide_readings:"Hide readings",show_readings:"Show readings"},Mt={empty:yt,badge:bt,controls:wt,track:vt,spark:$t,error:xt,version_update:_t,version_reload:kt,editor:At,actions:St},Et={no_frames:"Noch keine Bilder gespeichert.",first_soon:"Das erste erscheint bei der nächsten Aufnahme.",frame_failed:"Dieses Bild konnte nicht geladen werden.",index_failed:"Die Zeitleiste konnte nicht geladen werden."},Tt={live:"LIVE",gap:"KEIN BILD"},Pt={play:"Abspielen",pause:"Pause",previous:"Vorheriges Bild",next:"Nächstes Bild",speed:"Wiedergabegeschwindigkeit {v}x",now:"Zur Gegenwart springen"},Ct={label:"Position auf der Zeitleiste"},zt={range:"Spanne {v}",flat:"Unverändert"},Rt={no_camera:"Bitte wähle in der Kartenkonfiguration eine Kamera aus."},Ot="Diese Karte wurde auf {v} aktualisiert. Lade neu, um die neue Version zu verwenden.",Lt="Neu laden",Nt={camera_entity:"Kamera",title:"Titel",show_dayticks:"Tagesmarkierungen anzeigen",show_graph:"Diagramme anzeigen",playback:"Wiedergabe",autoplay:"Automatisch abspielen",speed:"Geschwindigkeit",graph_hours:"Diagramm-Zeitraum",overlay_right:"Eingeblendete Messwerte (rechts)",overlay_right_hint:"Die Werte über dem Bild gehören zu dem Zeitpunkt, zu dem du scrollst – nicht zur Gegenwart.",overlay_left:"Eingeblendete Messwerte (links)",overlay_left_hint:"Ein zweiter Block auf der anderen Seite des Bildes. Leer lassen, dann bleibt es bei einem Block rechts.",add_entity:"Entität hinzufügen",entity:"Entität",name:"Bezeichnung",unit:"Einheit",decimals:"Nachkommastellen",color:"Farbe",graph:"Diagramm",move_up:"Nach oben",move_down:"Nach unten",remove:"Entfernen",helper:{camera_entity:"Nur Kameras dieser Integration haben ein Archiv zum Durchblättern.",graph_hours:"Wie viel Verlauf die Sparkline rund um die Position zeigt.",autoplay:"Wird ignoriert, wenn dein System reduzierte Bewegung anfordert.",deflicker:"Gleicht wolkenbedingte Helligkeitssprünge bei der Wiedergabe aus. 0 schaltet es ab.",overlay_title:"Wird über den Messwerten angezeigt. Leer lassen für keine Überschrift.",overlay_title_left:"Wird über den Messwerten angezeigt. Leer lassen für keine Überschrift.",show_icon:"Verwendet das Symbol der Entität aus Home Assistant."},deflicker:"Helligkeit glätten",show_icon:"Symbol anzeigen",overlay_title:"Überschrift",overlay_title_left:"Überschrift"},Dt={show_camera:"Kameradetails anzeigen",show_entity:"Details für {v} anzeigen",hide_readings:"Messwerte ausblenden",show_readings:"Messwerte einblenden"},Ht={empty:Et,badge:Tt,controls:Pt,track:Ct,spark:zt,error:Rt,version_update:Ot,version_reload:Lt,editor:Nt,actions:Dt};const It={en:Object.freeze({__proto__:null,actions:St,badge:bt,controls:wt,default:Mt,editor:At,empty:yt,error:xt,spark:$t,track:vt,version_reload:kt,version_update:_t}),de:Object.freeze({__proto__:null,actions:Dt,badge:Tt,controls:Pt,default:Ht,editor:Nt,empty:Et,error:Rt,spark:zt,track:Ct,version_reload:Lt,version_update:Ot})};function Ut(t,e){const i=t.split(".").reduce((t,e)=>{if(t&&"object"==typeof t&&e in t)return t[e]},e);return"string"==typeof i?i:void 0}function Wt(t,e=void 0,i="",n=""){const s=(e??"en").toLowerCase().split(/[-_]/)[0]??"en",o=It.en??{};let a=Ut(t,It[s]??It.en??{});return void 0===a&&(a=Ut(t,o)),void 0===a&&(a=t),""!==i&&""!==n&&(a=a.replace(i,n)),a}var Ft;const jt=[1,2,4,8,16,32,64],Bt=[{name:"overlay_title",selector:{text:{}}}],qt=[{name:"overlay_title_left",selector:{text:{}}}],Gt=[{type:"grid",schema:[{name:"name",selector:{text:{}}},{name:"unit",selector:{text:{}}},{name:"decimals",selector:{number:{min:0,max:4,mode:"box"}}},{name:"graph_hours",selector:{number:{min:1,max:8760,mode:"box",unit_of_measurement:"h"}}}]}];let Vt=class extends ht{constructor(){super(...arguments),this.computeLabel=t=>this.t(`editor.${t.name}`),this.computeHelper=t=>{const e=this.t(`editor.helper.${t.name}`);return e.startsWith("editor.")?void 0:e}}static{Ft=this}static{this.styles=ft}setConfig(t){this.config=t}get uiLanguage(){return this.hass?.locale?.language??this.hass?.language??"en"}t(t){return Wt(t,this.uiLanguage)}get schema(){return[{name:"camera_entity",required:!0,selector:{entity:{domain:"camera",integration:"webcam_timelapse"}}},{name:"title",selector:{text:{}}},{type:"grid",schema:[{name:"show_dayticks",selector:{boolean:{}}},{name:"show_graph",selector:{boolean:{}}}]},{type:"expandable",name:"playback",icon:"mdi:play-speed",flatten:!0,schema:[{name:"autoplay",selector:{boolean:{}}},{name:"speed",selector:{select:{mode:"dropdown",options:jt.map(t=>({value:t,label:`${t}x`}))}}},{name:"deflicker",selector:{number:{min:0,max:100,step:5,mode:"slider"}}},{name:"graph_hours",selector:{number:{min:1,max:336,mode:"slider",unit_of_measurement:"h"}}}]}]}onFormChange(t){t.stopPropagation(),this.emit({...this.config,...t.detail.value})}emit(t){this.dispatchEvent(new CustomEvent("config-changed",{detail:{config:t},bubbles:!0,composed:!0}))}static{this.ENTITY_KEY={right:"entities",left:"entities_left"}}rows(t){return this.config?.[Ft.ENTITY_KEY[t]]??[]}updateRows(t,e){this.emit({...this.config,[Ft.ENTITY_KEY[t]]:e})}addRow(t){this.updateRows(t,[...this.rows(t),{entity:""}])}removeRow(t,e){this.updateRows(t,this.rows(t).filter((t,i)=>i!==e))}moveRow(t,e,i){const n=[...this.rows(t)],s=e+i;s<0||s>=n.length||([n[e],n[s]]=[n[s],n[e]],this.updateRows(t,n))}patchRow(t,e,i){const n=this.rows(t).map((t,n)=>n===e?{...t,...i}:t);this.updateRows(t,n)}renderRow(t,e,i){const n=e.name||e.entity||this.t("editor.entity");return j`
      <div class="ent-row" role="group" aria-label=${n}>
        <ha-entity-picker
          .hass=${this.hass}
          .value=${e.entity}
          allow-custom-entity
          @value-changed=${e=>{e.stopPropagation(),this.patchRow(t,i,{entity:e.detail.value})}}
        ></ha-entity-picker>

        <ha-form
          .hass=${this.hass}
          .data=${e}
          .schema=${Gt}
          .computeLabel=${this.computeLabel}
          @value-changed=${e=>{e.stopPropagation(),this.patchRow(t,i,e.detail.value)}}
        ></ha-form>

        <div class="ent-controls">
          <!-- The one sanctioned native control: HA ships no colour
               selector. Both @input and @change are wired — @input gives
               a live preview while dragging, @change is what fires on
               some platforms when the picker closes. -->
          <label class="swatch">
            <span>${this.t("editor.color")}</span>
            <input
              type="color"
              .value=${e.color??"#3d7ea6"}
              @input=${e=>this.patchRow(t,i,{color:e.target.value})}
              @change=${e=>this.patchRow(t,i,{color:e.target.value})}
            />
          </label>

          <ha-formfield .label=${this.t("editor.show_icon")}>
            <ha-switch
              .checked=${e.show_icon??!1}
              @change=${e=>this.patchRow(t,i,{show_icon:e.target.checked})}
            ></ha-switch>
          </ha-formfield>

          <ha-formfield .label=${this.t("editor.graph")}>
            <ha-switch
              .checked=${e.graph??!1}
              @change=${e=>this.patchRow(t,i,{graph:e.target.checked})}
            ></ha-switch>
          </ha-formfield>
        </div>

        <div class="ent-actions">
          <ha-icon-button
            .label=${this.t("editor.move_up")}
            .disabled=${0===i}
            @click=${()=>this.moveRow(t,i,-1)}
          >
            <ha-icon icon="mdi:arrow-up"></ha-icon>
          </ha-icon-button>
          <ha-icon-button
            .label=${this.t("editor.move_down")}
            .disabled=${i===this.rows(t).length-1}
            @click=${()=>this.moveRow(t,i,1)}
          >
            <ha-icon icon="mdi:arrow-down"></ha-icon>
          </ha-icon-button>
          <ha-icon-button
            .label=${this.t("editor.remove")}
            @click=${()=>this.removeRow(t,i)}
          >
            <ha-icon icon="mdi:delete-outline"></ha-icon>
          </ha-icon-button>
        </div>
      </div>
    `}render(){return this.hass&&this.config?j`
      <ha-form
        .hass=${this.hass}
        .data=${this.config}
        .schema=${this.schema}
        .computeLabel=${this.computeLabel}
        .computeHelper=${this.computeHelper}
        @value-changed=${this.onFormChange}
      ></ha-form>

      ${this.renderSection("right",Bt)}
      ${this.renderSection("left",qt)}
    `:j`${G}`}renderSection(t,e){const i=this.t("editor.overlay_"+t),n=this.t("editor.overlay_"+t+"_hint");return j`
      <div class="ent-section">
        <h4>${i}</h4>
        <p class="ent-hint">${n}</p>

        <div class="ent-title">
          <ha-form
            .hass=${this.hass}
            .data=${this.config}
            .schema=${e}
            .computeLabel=${this.computeLabel}
            .computeHelper=${this.computeHelper}
            @value-changed=${this.onFormChange}
          ></ha-form>
        </div>

        ${this.rows(t).map((e,i)=>this.renderRow(t,e,i))}
        <ha-button @click=${()=>this.addRow(t)}>
          <ha-icon icon="mdi:plus" slot="icon"></ha-icon>
          ${this.t("editor.add_entity")}
        </ha-button>
      </div>
    `}};t([pt({attribute:!1})],Vt.prototype,"hass",void 0),t([mt()],Vt.prototype,"config",void 0),Vt=Ft=t([ct("webcam-timelapse-card-editor")],Vt);class Zt{constructor(t){this.task=t,this.running=!1,this.queued=!1,this.waiters=[]}request(){return new Promise(t=>{this.waiters.push(t),this.running?this.queued=!0:this.drain()})}get busy(){return this.running}async drain(){this.running=!0;try{do{this.queued=!1;const t=this.waiters;this.waiters=[];try{await this.task()}catch{}for(const e of t)e()}while(this.queued)}finally{this.running=!1}}}const Kt="webcam-timelapse-card",Yt={radius:6,maxGain:1.5};function Jt(t,e=.15){if(0===t.length)return 0;const i=[...t].sort((t,e)=>t-e),n=Math.floor(i.length*e),s=i.length-2*n>=3?i.slice(n,i.length-n):i;return s.reduce((t,e)=>t+e,0)/s.length}function Xt(t){const e=t?.trim();return e||void 0}function Qt(t){const e=[],i=t?.entities_left??[];i.length>0&&e.push({side:"left",title:Xt(t?.overlay_title_left),entities:i});const n=t?.entities??[];return n.length>0&&e.push({side:"right",title:Xt(t?.overlay_title),entities:n}),e}const te={base:"",ext:".webp",step:600,t0:null,count:0,gaps:[],retention_days:0,online:!0,newest_slot:null};function ee(t,e){return null===t.t0||e<0||e>=t.count?null:t.t0+e*t.step}function ie(t,e){const i=ee(t,e);return null===i?null:`${t.base}${i}${t.ext}`}function ne(t,e,i=1){for(let n=e;n>=0&&n<t.length;n+=i)if(t[n])return n;return null}function se(t){return null!==t.t0&&t.count>0}class oe{constructor(t){this.size=t,this.cursor=0,this.slots=new Array(t).fill(null)}prefetch(t){const e=new Image;e.decoding="async",e.fetchPriority="low",e.src=t,this.slots[this.cursor]=e,this.cursor=(this.cursor+1)%this.size}clear(){this.slots.fill(null),this.cursor=0}}function ae(t){return Math.min(Math.max(Math.round(4*t),4),16)}const re=1e3/33;function he(t,e,i){const n=ne(t,e+Math.max(1,i));if(null!==n)return n;const s=ne(t,t.length-1,-1);return null!==s&&s>e?s:null}function le(t){return t.currentSrc!==t.requested?"pending":t.complete?t.naturalWidth>0?"ready":"failed":"pending"}const ce=new Map;function de(t,e){const i=`${t}|${JSON.stringify(e)}`;let n=ce.get(i);return void 0===n&&(n=new Intl.DateTimeFormat(t,e),ce.set(i,n)),n}function ue(t,e){return de("en-CA",{timeZone:e,year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date(1e3*t))}function pe(t,e){const i=de("en-GB",{timeZone:e,hour:"2-digit",minute:"2-digit",second:"2-digit",hour12:!1}).formatToParts(new Date(1e3*t));let n=0,s=0,o=0;for(const t of i)"hour"===t.type?n=Number(t.value):"minute"===t.type?s=Number(t.value):"second"===t.type&&(o=Number(t.value));return 24===n&&(n=0),3600*n+60*s+o}function me(t,e,i,n){const s={timeZone:e,day:"2-digit",month:"2-digit"};return"long"===n&&(s.weekday="long"),"short"===n&&(s.weekday="short"),de(i,s).format(new Date(1e3*t))}function ge(t,e,i,n){if(null===t.t0||0===t.count)return[];const s=function(t){return t>=560?"long":t>=380?"short":"date"}(n),o="long"===s?110:"short"===s?78:58,a=[];let r=ue(t.t0,e);for(let i=1;i<t.count;i++){const n=ee(t,i);if(null===n)continue;const s=ue(n,e);s!==r&&(a.push({position:i,slot:n,date:s}),r=s)}const h=function(t,e,i){const n=Math.max(1,Math.floor(e/i));return Math.max(1,Math.ceil(t/n))}(a.length,n,o),l=Math.max(1,t.count-1);return a.map((t,n)=>{const o=t.date.endsWith("-01"),a=o||n%h===0;return{position:t.position,left:t.position/l*100,label:a?me(t.slot,e,i,s):"",isMonthStart:o}})}const fe=[600,900,1800,3600,7200,10800,21600,43200];function ye(t,e,i,n){if(null===t.t0||0===t.count)return[];const s=t.t0,o=Math.max(1,t.count-1),a=s+o*t.step,r=function(t,e,i){if(t<=0)return null;const n=t/Math.max(2,Math.floor(i/9));for(const t of fe)if(t>=n&&t>=e)return t;return null}(a-s,t.step,n);if(null===r)return[];const h=r/(a-s)*n,l=Math.max(1,Math.ceil(46/h)),c=Math.min(43200,r*l),d=[],u=pe(s,e)%r;let p=0===u?s:s+(r-u),m=-1/0;for(let h=0;p<=a&&h<4096;h++){const a=pe(p,e),h=a%r;if(0===h){const r=Math.round((p-s)/t.step),h=r/o*100,l=h/100*n;let u="";a%c===0&&l-m>=46&&(u=we(p,e,i),m=l),d.push({position:r,left:h,label:u})}p+=r-h}return d}function be(t,e,i){return de(i,{timeZone:e,weekday:"short",day:"2-digit",month:"2-digit",hour:"2-digit",minute:"2-digit"}).format(new Date(1e3*t))}function we(t,e,i){return de(i,{timeZone:e,hour:"2-digit",minute:"2-digit"}).format(new Date(1e3*t))}const ve=new Set(["unknown","unavailable","none",""]),$e=new Map,xe=new Map;function _e(t){if("number"==typeof t.lu)return Math.round(1e3*t.lu);const e=t.lu??t.last_updated??t.last_changed;return e?new Date(e).getTime():0}function ke(t,e){const i=t.a??t.attributes,n=i?.[e];if("string"!=typeof n&&"number"!=typeof n)return null;const s=new Date(n).getTime();return Number.isFinite(s)&&s>0?s:null}function Ae(t){if(!Number.isFinite(t)||t<=0)return 0;const e=t*(1+1e-9),i=Math.pow(10,Math.floor(Math.log10(e))),n=e/i;return(n>=5?5:n>=2?2:1)*i}const Se=new WeakMap;function Me(t,e=54e5){if(t.length<3)return e;const i=[];for(let e=1;e<t.length;e++)i.push(t[e].at-t[e-1].at);i.sort((t,e)=>t-e);const n=i[i.length>>1]??e;return Math.max(2*n,e)}function Ee(){try{window.caches?.keys?.().then(t=>{t.forEach(t=>window.caches?.delete?.(t))})}catch{}window.location.reload()}function Te(t,e){if(!t)return G;const i=e("version_update").replace("{v}",t),n=e("version_reload");return j`
    <div class="banner" role="alert" aria-live="assertive">
      <span>${i}</span>
      <button
        type="button"
        aria-label=${n}
        @click=${Ee}
      >
        ${n}
      </button>
    </div>
  `}function Pe(t){const{points:e,at:i,hours:n,color:s,label:o,quantum:a=0}=t;if(0===e.length)return null;const r=36e5*n/2,h=i-r,l=i+r,c=l-h||1;let d=1/0,u=-1/0;for(const t of e)t.value<d&&(d=t.value),t.value>u&&(u=t.value);const p=u-d,m=(d+u)/2,g=Math.max(4*a,1e-9*Math.abs(m)),f=Math.max(p,g)||1;let y=m-f/2,b=m+f/2;if(p>0){const t=function(t){if(!Number.isFinite(t)||t<=0)return 1;const e=Math.pow(10,Math.floor(Math.log10(t))),i=t/e;return(i>5?10:i>2?5:i>1?2:1)*e}(f/4);y=Math.floor(y/t)*t,b=Math.ceil(b/t)*t,b>y||(y=m-f/2,b=m+f/2)}const w=b-y||1,v=t=>3+(t-h)/c*234,$=t=>41-(t-y)/w*38,x=[];e.forEach((t,e)=>{const i=v(t.at),n=$(t.value);0===e?x.push(`M ${i.toFixed(1)} ${n.toFixed(1)}`):x.push(`H ${i.toFixed(1)}`,`V ${n.toFixed(1)}`)});const _=e[e.length-1];x.push(`H ${v(l).toFixed(1)}`);const k=v(i);let A=_;for(let t=e.length-1;t>=0;t--)if(e[t].at<=i){A=e[t];break}return B`
    <svg
      class="spark"
      viewBox="0 0 ${240} ${44}"
      preserveAspectRatio="none"
      role="img"
      aria-label=${o}
    >
      <path
        d=${x.join(" ")}
        fill="none"
        stroke=${s}
        stroke-width="1.5"
        stroke-linejoin="round"
        vector-effect="non-scaling-stroke"
      />
      <line
        x1=${k.toFixed(1)}
        y1="0"
        x2=${k.toFixed(1)}
        y2=${44}
        stroke="currentColor"
        stroke-width="1"
        opacity="0.5"
        vector-effect="non-scaling-stroke"
      />
      <path
        d="M ${k.toFixed(1)} ${$(A.value).toFixed(1)} L ${k.toFixed(1)} ${$(A.value).toFixed(1)}"
        stroke=${s}
        stroke-width="5"
        stroke-linecap="round"
        vector-effect="non-scaling-stroke"
      />
    </svg>
  `}function Ce(){return"undefined"!=typeof window&&"function"==typeof window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches}const ze=[1,2,4,8,16,32,64];let Re=class extends ht{constructor(){super(...arguments),this.index=te,this.position=0,this.playing=!1,this.speed=1,this.trackWidth=600,this.versionMismatch=null,this.history=new Map,this.folded=new Set,this.present=new Uint8Array(0),this.ring=new oe(ae(1)),this.prefetchedThrough=-1,this.useLayerA=!0,this.frameGeneration=0,this.swaps=new Zt(()=>this.performSwap()),this.gains=new Float32Array(0),this.versionChecked=!1,this.autoplayPending=!0,this.playCounter=0,this.lastScrubAt=0,this.visible=!0,this.onScreen=!0,this.onVisibilityChange=()=>{this.visible="visible"===document.visibilityState,this.reconcilePlayback(),this.visible&&this.refreshIndex()}}static{this.styles=ft}setConfig(t){if(!t?.camera_entity)throw new Error(Wt("error.no_camera",this.hass?.locale?.language));this.config={autoplay:!1,speed:32,show_dayticks:!0,show_graph:!0,graph_hours:24,deflicker:50,...t,entities:(t.entities??[]).filter(t=>t?.entity),entities_left:(t.entities_left??[]).filter(t=>t?.entity)},this.speed=ze.includes(this.config.speed)?this.config.speed:32,this.ring=new oe(ae(this.speed))}static getConfigElement(){return document.createElement("webcam-timelapse-card-editor")}static getStubConfig(t){return{camera_entity:Object.keys(t.states).find(e=>e.startsWith("camera.")&&"webcam_timelapse"===t.entities?.[e]?.platform)??""}}getCardSize(){return 8}getGridOptions(){return{columns:"full",rows:"auto",min_columns:6,min_rows:6}}connectedCallback(){super.connectedCallback(),document.addEventListener("visibilitychange",this.onVisibilityChange),this.intersectionObserver=new IntersectionObserver(t=>{this.onScreen=t.some(t=>t.isIntersecting),this.reconcilePlayback()}),this.intersectionObserver.observe(this),this.resizeObserver=new ResizeObserver(t=>{const e=t[0]?.contentRect.width;e&&(this.trackWidth=e-24)}),this.resizeObserver.observe(this)}disconnectedCallback(){super.disconnectedCallback(),document.removeEventListener("visibilitychange",this.onVisibilityChange),this.intersectionObserver?.disconnect(),this.resizeObserver?.disconnect(),this.stopPlayback(),this.indexTimer&&window.clearTimeout(this.indexTimer),this.scrubSettle&&window.clearTimeout(this.scrubSettle),this.ring.clear()}willUpdate(t){t.has("hass")&&this.hass&&this.index===te&&(this.refreshIndex(),this.refreshHistory()),t.has("hass")&&this.hass&&!this.versionChecked&&(this.versionChecked=!0,async function(t,e,i){if(!t?.callWS)return null;try{const n=await t.callWS({type:e});if(n?.version&&n.version!==i)return n.version}catch{}return null}(this.hass,"webcam_timelapse/card_version","0.6.0").then(t=>{this.versionMismatch=t}))}reconcilePlayback(){this.playing&&this.visible&&this.onScreen?this.startPlayback():this.stopPlayback()}async refreshIndex(){if(this.hass?.callWS&&this.config){try{const t=await this.hass.callWS({type:"webcam_timelapse/index",entity_id:this.config.camera_entity}),e=this.position>=this.index.count-1;this.index=t,this.present=function(t){const e=new Uint8Array(t.count).fill(1);for(const[i,n]of t.gaps){const s=Math.max(0,i),o=Math.min(t.count,i+n);for(let t=s;t<o;t++)e[t]=0}return e}(t),(e||this.position>=t.count)&&(this.position=Math.max(0,t.count-1)),await this.updateComplete,this.startAutoplayIfRequested()||this.swapInFrame(),this.refreshLuma(),this.indexError=void 0}catch(t){this.indexError=t instanceof Error?t.message:"Could not load the timeline."}this.scheduleIndexRefresh()}}async refreshLuma(){const t=function(t){const e=Math.min(Math.max(t,0),100);return 0===e?0:Math.max(1,Math.round(e/100*12))}(this.config?.deflicker??0);if(this.hass?.callWS&&0!==t&&this.config){try{const e=await this.hass.callWS({type:"webcam_timelapse/luma",entity_id:this.config.camera_entity});this.gains=function(t,e=Yt){const i=new Float32Array(t.length).fill(1),{radius:n,maxGain:s}=e;if(n<1||0===t.length)return i;const o=1/s;for(let e=0;e<t.length;e++){const a=t[e];if(null==a||a<8)continue;const r=Math.max(0,e-n),h=Math.min(t.length-1,e+n),l=[];for(let e=r;e<=h;e++){const i=t[e];null!=i&&i>=8&&l.push(i)}if(l.length<3)continue;const c=Jt(l);i[e]=Math.min(Math.max(c/a,o),s)}return i}(e.luma,{...Yt,radius:t})}catch{this.gains=new Float32Array(0)}this.requestUpdate()}else this.gains=new Float32Array(0)}async refreshHistory(){const t=Qt(this.config).flatMap(t=>t.entities);if(!this.hass||0===t.length)return;const e={};for(const i of t)i.time_attribute&&(e[i.entity]=i.time_attribute);const i=Math.max(this.config?.graph_hours??24,...t.map(t=>t.graph_hours??0));this.history=await async function(t,e,i){const n=t?.callWS?.bind(t);if(!n||0===e.length)return new Map;const s=i.timeAttributes??{},o=`${e.slice().sort().join(",")}|${i.days}`,a=xe.get(o);if(a)return a;const r=new Date,h=new Date(r.getTime()-864e5*i.days),l=Object.keys(s).length>0,c=(async()=>{try{const t=await n({type:"history/history_during_period",start_time:h.toISOString(),end_time:r.toISOString(),entity_ids:e,minimal_response:!l,no_attributes:!l,significant_changes_only:!0}),i=new Map;for(const n of e){const e=s[n],o=(t?.[n]??[]).map(t=>{const i=String(t.s??t.state??"").trim(),n=ve.has(i.toLowerCase())?Number.NaN:parseFloat(i);return{at:(e?ke(t,e):null)??_e(t),value:n}}).filter(t=>Number.isFinite(t.value)&&t.at>0).sort((t,e)=>t.at-e.at);i.set(n,o),$e.set(n,o)}return i}catch{return new Map(e.map(t=>[t,$e.get(t)??[]]))}finally{xe.delete(o)}})();return xe.set(o,c),c}(this.hass,t.map(t=>t.entity),{days:(this.index.retention_days||14)+1+Math.ceil(i/48),timeAttributes:e})}scheduleIndexRefresh(){this.indexTimer&&window.clearTimeout(this.indexTimer);const t=1e3*this.index.step+15e3*Math.random();this.indexTimer=window.setTimeout(()=>{this.refreshIndex()},t)}get cadence(){return function(t){const e=2*Math.max(t,0);if(e<=0)return{stride:1,frameDelay:500};const i=Math.max(1,Math.round(e/re));return{stride:i,frameDelay:Math.max(1e3*i/e,33)}}(this.speed)}get frameDelay(){return this.cadence.frameDelay}get fadeDuration(){return t=this.speed,e=this.frameDelay,(i={playing:this.playing,reducedMotion:Ce()}).reducedMotion?0:i.playing?t>4?0:Math.min(120,Math.round(e/2)):120;var t,e,i}async runPlayback(t){let e=!1;for(;this.playToken===t&&this.playing;){if(e){const t=he(this.present,this.position,this.cadence.stride);if(null===t){this.playing=!1;break}this.position=t}e=!0;const i=performance.now();if(await this.swapInFrame(),this.prefetchAhead(),this.playToken!==t)return;const n=this.frameDelay-(performance.now()-i);n>0&&await new Promise(t=>window.setTimeout(t,n))}}startPlayback(){if(void 0!==this.playToken)return;const t=++this.playCounter;this.playToken=t,this.runPlayback(t).finally(()=>{this.playToken===t&&(this.playToken=void 0)})}stopPlayback(){this.playToken=void 0}startAutoplayIfRequested(){return!(!this.autoplayPending||!se(this.index))&&(this.autoplayPending=!1,!(!(t={configured:!0===this.config?.autoplay,reducedMotion:Ce(),alreadyPlaying:this.playing}).configured||t.reducedMotion||t.alreadyPlaying)&&(this.togglePlay(),!0));var t}togglePlay(){if(!this.playing&&this.atLive){const t=ne(this.present,0);null!==t&&(this.position=t)}this.playing=!this.playing,this.reconcilePlayback()}cycleSpeed(){const t=ze[(ze.indexOf(this.speed)+1)%ze.length];this.speed=t??1,this.ring=new oe(ae(this.speed)),this.prefetchedThrough=-1}goTo(t){this.position=Math.min(Math.max(t,0),Math.max(0,this.index.count-1)),this.swapInFrame(),this.prefetchAhead()}swapInFrame(){return this.swaps.request()}async performSwap(){const t=this.position,e=this.frameSources(t);if(0===e.length)return;const i=++this.frameGeneration,n=this.useLayerA?this.layerB:this.layerA;if(!n)return;let s=!1;for(const o of e){const e=new URL(o,document.baseURI).href;n.src=o;try{await n.decode()}catch{}let a=le({currentSrc:n.currentSrc,requested:e,complete:n.complete,naturalWidth:n.naturalWidth});if("pending"!==a||this.playing||(await this.awaitLoad(n),a=le({currentSrc:n.currentSrc,requested:e,complete:n.complete,naturalWidth:n.naturalWidth})),"failed"!==a){if("pending"!==a){if(i!==this.frameGeneration)return;return this.revealFrame(n,this.useLayerA?this.layerA:this.layerB),this.useLayerA=!this.useLayerA,this.loadedPosition=t,this.frameError=void 0,void this.requestUpdate()}s=!0}}i===this.frameGeneration&&(this.playing||s||(this.frameError=e[0],this.requestUpdate()))}awaitLoad(t){return new Promise(e=>{let i;const n=()=>{void 0!==i&&window.clearTimeout(i),t.removeEventListener("load",n),t.removeEventListener("error",n),e()};t.addEventListener("load",n),t.addEventListener("error",n),i=window.setTimeout(n,1500)})}revealFrame(t,e){const i=this.fadeDuration;if(e&&(e.style.transition="none",e.style.opacity="1",e.style.zIndex="1"),t.style.zIndex="2",0===i)return t.style.transition="none",void(t.style.opacity="1");t.style.transition="none",t.style.opacity="0",t.offsetWidth,t.style.transition=`opacity ${i}ms linear`,t.style.opacity="1"}frameSources(t){const e=[],i=function(t){if(!t)return;const e=t.trim();return e.startsWith("/")||e.startsWith("https://")?e:void 0}(this.hass?.states[this.config.camera_entity]?.attributes.entity_picture);t>=this.index.count-1&&i&&e.push(i);const n=ie(this.index,t);return n&&e.push(n),e}prefetchAhead(){const t=function(t,e,i,n,s){const o=Math.max(1,n);let a=s>e+i*o?e:Math.max(s,e);const r=[];for(let n=1;n<=i;n++){const i=e+n*o;if(i<=a)continue;const s=ne(t,i);if(null===s)break;s>a&&(r.push(s),a=s)}return r}(this.present,this.position,ae(this.speed),this.cadence.stride,this.prefetchedThrough);for(const e of t){const t=ie(this.index,e);t&&this.ring.prefetch(t),this.prefetchedThrough=e}}onScrub(t){const e=Number(t.target.value);this.position=e,this.pendingPosition=e;const i=performance.now();i-this.lastScrubAt>=80&&(this.lastScrubAt=i,this.loadPendingPosition()),this.scrubSettle&&window.clearTimeout(this.scrubSettle),this.scrubSettle=window.setTimeout(()=>{this.scrubSettle=void 0,this.loadPendingPosition()},80)}loadPendingPosition(){const t=this.pendingPosition;void 0!==t&&t!==this.loadedPosition&&this.goTo(t)}onScrubCommit(t){this.scrubSettle&&window.clearTimeout(this.scrubSettle),this.scrubSettle=void 0,this.pendingPosition=Number(t.target.value),this.loadPendingPosition()}jumpToNow(){this.playing=!1,this.stopPlayback(),this.goTo(this.index.count-1)}stepBy(t){const e=ne(this.present,this.position+t,t);null!==e&&this.goTo(e)}get timeZone(){return this.hass?.config?.time_zone??Intl.DateTimeFormat().resolvedOptions().timeZone}get language(){return this.hass?.locale?.language??this.hass?.language??"en"}t(t,e){return void 0===e?Wt(t,this.language):Wt(t,this.language,"{v}",e)}get atLive(){return this.position>=this.index.count-1}get onGap(){return this.present.length>0&&!this.present[this.position]}render(){if(!this.config||!this.hass)return j`<ha-card></ha-card>`;const t=null===this.index.t0?null:this.index.t0+this.position*this.index.step;return j`
      <ha-card .header=${this.config.title??G}>
        ${Te(this.versionMismatch,t=>this.t(t))}
        ${this.renderStage(t)}
        ${se(this.index)?this.renderTimeline(t):G}
      </ha-card>
    `}renderStage(t){if(!se(this.index))return j`
        <div class="stage">
          <div class="empty">
            ${this.indexError?j`
                  <div>${this.t("empty.index_failed")}</div>
                  <div class="detail">${this.indexError}</div>
                `:j`
                  <div>${this.t("empty.no_frames")}</div>
                  <div>${this.t("empty.first_soon")}</div>
                `}
          </div>
        </div>
      `;const e=this.gains[this.position]??1,i=[];1!==e&&i.push(`brightness(${e.toFixed(3)})`),this.onGap&&i.push("grayscale(0.5)","brightness(0.5)");const n=i.length>0?i.join(" "):"none";return j`
      <div
        class="stage"
        style="--wtl-frame-filter:${n}"
        @click=${this.onStageClick}
      >
        <div
          class="layers"
          role="button"
          tabindex="0"
          aria-label=${this.t("actions.show_camera")}
          @keydown=${t=>this.onActivateKey(t,this.config.camera_entity)}
        >
          <img class="layer a" alt="" decoding="async" fetchpriority="high" />
          <img class="layer b" alt="" decoding="async" fetchpriority="high" />
        </div>
        ${this.frameError?j`<div class="empty">
              <div>${this.t("empty.frame_failed")}</div>
              <div class="detail">${this.frameError}</div>
            </div>`:G}
        ${null!==t?j`<div class="stamp">
              <time datetime=${new Date(1e3*t).toISOString()}>
                ${be(t,this.timeZone,this.language)}
              </time>
            </div>`:G}
        ${null!==t?this.renderReadouts(t):G}
        ${this.onGap?j`<div class="badge gap">${this.t("badge.gap")}</div>`:this.atLive?j`<div class="badge live">${this.t("badge.live")}</div>`:G}
        ${this.renderControls()}
      </div>
    `}renderReadouts(t){const e=Qt(this.config);return 0===e.length?G:j`<div class="readouts ${e.length>1?"pair":""}">
      ${e.map(e=>this.renderReadout(t,e))}
    </div>`}renderReadout(t,e){const i="readout "+("left"===e.side?"left":"");if(this.folded.has(e.side))return j`<div class="${i} folded">
        ${this.renderFoldToggle(e.side,!0)}
      </div>`;const n=e.entities,s=1e3*t,o=n.map(t=>{const e=this.history.get(t.entity)??[],i=function(t){const e=Se.get(t);if(e)return e;const i=[];for(let e=1;e<t.length;e++){const n=Math.abs(t[e].value-t[e-1].value);n>0&&i.push(n)}i.sort((t,e)=>t-e);const n=i[Math.floor(.1*i.length)],s={quantum:void 0===n?0:Ae(n),staleAfter:Me(t)};return Se.set(t,s),s}(e),n=function(t,e,i){if(0===t.length)return null;let n=0,s=t.length-1,o=-1;for(;n<=s;){const i=n+s>>1;t[i].at<=e?(o=i,n=i+1):s=i-1}if(-1===o)return null;const a=t[o];return{value:a.value,at:a.at,stale:e-a.at>i}}(e,s,i.staleAfter),o=t.name??this.hass?.states[t.entity]?.attributes.friendly_name??t.entity,a=t.unit??this.hass?.states[t.entity]?.attributes.unit_of_measurement??"",r=t.color??"var(--wtl-accent)",h=null===n?"—":`${n.value.toFixed(t.decimals??1)}${a?` ${a}`:""}`,l=t.graph_hours??this.config?.graph_hours??24,c=!0===t.graph&&!1!==this.config?.show_graph,d=c?function(t,e,i){const n=36e5*i/2,s=e-n,o=e+n,a=t.filter(t=>t.at>=s&&t.at<=o);if(a[0]?.at===s)return a;let r;for(const e of t){if(e.at>=s)break;r=e}return r?[{at:s,value:r.value},...a]:a}(e,s,l):[],u=c?Pe({points:d,at:s,hours:l,color:r,label:`${o} history`,quantum:i.quantum}):null,p=null===u?0:function(t){if(0===t.length)return 0;let e=1/0,i=-1/0;for(const n of t)n.value<e&&(e=n.value),n.value>i&&(i=n.value);return i-e}(d),m=null===u?G:j`<div class="spark-scale">
            <span
              >${0===p?this.t("spark.flat"):this.t("spark.range",`${function(t){if(!Number.isFinite(t)||t<=0)return"0";if(t>=100)return Math.round(t).toString();const e=t.toPrecision(2);return e.includes(".")?e.replace(/0+$/,"").replace(/\.$/,""):e}(p)}${a?` ${a}`:""}`)}</span
            >
            <span>${g=l,!Number.isFinite(g)||g<=0?"":g<1?`${Math.round(60*g)} min`:g<48?`${Math.round(g)} h`:`${Math.round(g/24)} d`}</span>
          </div>`;var g;const f=this.hass?.states[t.entity],y=t.show_icon&&f?j`<ha-state-icon
              class="readout-icon"
              style="color:${r}"
              .hass=${this.hass}
              .stateObj=${f}
            ></ha-state-icon>`:G;return j`
        <div
          class="readout-row ${n?.stale?"stale":""}"
          role="button"
          tabindex="0"
          aria-label=${this.t("actions.show_entity",o)}
          @click=${()=>this.fireMoreInfo(t.entity)}
          @keydown=${e=>this.onActivateKey(e,t.entity)}
        >
          ${y}
          <span class="readout-name" style="color:${r}">${o}</span>
          <span class="readout-value">${h}</span>
          ${null!==n?j`<span class="readout-at"
                >${we(Math.round(n.at/1e3),this.timeZone,this.language)}</span
              >`:G}
        </div>
        ${u?j`<div class="spark-wrap">${u}${m}</div>`:G}
      `});return j`<div class=${i}>
      <div class="readout-head">
        ${e.title?j`<div class="readout-title">${e.title}</div>`:G}
        ${this.renderFoldToggle(e.side,!1)}
      </div>
      ${o}
    </div>`}renderFoldToggle(t,e){const i=this.t(e?"actions.show_readings":"actions.hide_readings");return j`<ha-icon-button
      class="readout-fold"
      .label=${i}
      aria-expanded=${e?"false":"true"}
      @click=${()=>this.toggleFold(t)}
    >
      <ha-icon icon=${e?"mdi:eye-outline":"mdi:eye-off-outline"}></ha-icon>
    </ha-icon-button>`}toggleFold(t){const e=new Set(this.folded);e.delete(t)||e.add(t),this.folded=e}fireMoreInfo(t){t&&this.dispatchEvent(new CustomEvent("hass-more-info",{detail:{entityId:t},bubbles:!0,composed:!0}))}onActivateKey(t,e){"Enter"!==t.key&&" "!==t.key||(t.preventDefault(),this.fireMoreInfo(e))}onStageClick(t){const e=t.composedPath(),i=e.indexOf(t.currentTarget);(-1===i?e:e.slice(0,i)).some(t=>t instanceof HTMLElement&&(t.classList.contains("controls")||t.classList.contains("readout-row")||t.classList.contains("readout-fold")))||this.config&&this.fireMoreInfo(this.config.camera_entity)}renderControls(){return j`
      <div class="controls">
        <ha-icon-button .label=${this.t("controls.previous")} @click=${()=>this.stepBy(-1)}>
          <ha-icon icon="mdi:skip-previous"></ha-icon>
        </ha-icon-button>
        <ha-icon-button
          class="play"
          .label=${this.playing?this.t("controls.pause"):this.t("controls.play")}
          @click=${this.togglePlay}
        >
          <ha-icon .icon=${this.playing?"mdi:pause":"mdi:play"}></ha-icon>
        </ha-icon-button>
        <ha-icon-button .label=${this.t("controls.next")} @click=${()=>this.stepBy(1)}>
          <ha-icon icon="mdi:skip-next"></ha-icon>
        </ha-icon-button>

        <span class="sep" aria-hidden="true"></span>

        <button
          class="speed"
          @click=${this.cycleSpeed}
          aria-label=${this.t("controls.speed",String(this.speed))}
        >
          ${this.speed}×
        </button>
        <ha-icon-button .label=${this.t("controls.now")} @click=${this.jumpToNow}>
          <ha-icon icon="mdi:update"></ha-icon>
        </ha-icon-button>
      </div>
    `}renderTimeline(t){const e=Math.max(1,this.index.count-1),i=this.position/e*100,n=!1!==this.config?.show_dayticks,{days:s,times:o}=n?this.rulerFor():{days:[],times:[]};return j`
      <div class="timeline">
        ${n?j`<div class="band dates" aria-hidden="true">
              ${s.map(t=>t.label?j`<span class="lab date" style="left:${t.left}%"
                      >${t.label}</span
                    >`:G)}
            </div>`:G}

        <div class="track">
          ${n?j`<div class="marks" aria-hidden="true">
                ${o.map(t=>j`<span class="mark" style="left:${t.left}%"></span>`)}
                ${s.map(t=>j`<span
                      class="mark ${t.isMonthStart?"month":"day"}"
                      style="left:${t.left}%"
                    ></span>`)}
              </div>`:G}
          <div class="rail"></div>
        <div class="fill" style="width:${i}%"></div>
        ${this.index.gaps.map(([t,i])=>j`<div
            class="gap-run"
            style="left:${t/e*100}%;width:${i/e*100}%"
          ></div>`)}
        <input
          type="range"
          min="0"
          max=${e}
          step="1"
          .value=${String(this.position)}
          aria-label=${this.t("track.label")}
          aria-valuetext=${null!==t?be(t,this.timeZone,this.language):""}
          @input=${this.onScrub}
          @change=${this.onScrubCommit}
          />
        </div>

        ${n?j`<div class="band times" aria-hidden="true">
              ${o.map(t=>t.label?j`<span class="lab time" style="left:${t.left}%"
                      >${t.label}</span
                    >`:G)}
            </div>`:G}
      </div>
    `}rulerFor(){const t=[this.index.t0,this.index.count,this.index.step,Math.round(this.trackWidth),this.timeZone,this.language].join("|");return this.rulerCache?.key!==t&&(this.rulerCache={key:t,days:ge(this.index,this.timeZone,this.language,this.trackWidth),times:ye(this.index,this.timeZone,this.language,this.trackWidth)}),this.rulerCache}};t([pt({attribute:!1})],Re.prototype,"hass",void 0),t([mt()],Re.prototype,"config",void 0),t([mt()],Re.prototype,"index",void 0),t([mt()],Re.prototype,"position",void 0),t([mt()],Re.prototype,"playing",void 0),t([mt()],Re.prototype,"speed",void 0),t([mt()],Re.prototype,"trackWidth",void 0),t([mt()],Re.prototype,"versionMismatch",void 0),t([mt()],Re.prototype,"indexError",void 0),t([mt()],Re.prototype,"frameError",void 0),t([mt()],Re.prototype,"history",void 0),t([mt()],Re.prototype,"folded",void 0),t([gt("img.layer.a")],Re.prototype,"layerA",void 0),t([gt("img.layer.b")],Re.prototype,"layerB",void 0),Re=t([ct(Kt)],Re);const Oe=window;Oe.customCards=Oe.customCards??[],Oe.customCards.push({type:Kt,name:"Webcam Timelapse",description:"Scrub and play back an archived still-image webcam.",preview:!0,documentationURL:"https://github.com/rolandzeiner/webcam-timelapse",getEntitySuggestion:(t,e)=>e.startsWith("camera.")?"webcam_timelapse"!==t.entities?.[e]?.platform?null:{config:{type:`custom:${Kt}`,camera_entity:e}}:null});export{Re as WebcamTimelapseCard};
