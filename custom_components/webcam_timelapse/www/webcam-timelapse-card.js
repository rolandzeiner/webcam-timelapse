// Webcam Timelapse Card — bundled by Rollup. Edit sources in src/, then `npm run build`.
function t(t,e,i,s){var n,r=arguments.length,o=r<3?e:null===s?s=Object.getOwnPropertyDescriptor(e,i):s;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)o=Reflect.decorate(t,e,i,s);else for(var a=t.length-1;a>=0;a--)(n=t[a])&&(o=(r<3?n(o):r>3?n(e,i,o):n(e,i))||o);return r>3&&o&&Object.defineProperty(e,i,o),o}"function"==typeof SuppressedError&&SuppressedError;const e=globalThis,i=e.ShadowRoot&&(void 0===e.ShadyCSS||e.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,s=Symbol(),n=new WeakMap;let r=class{constructor(t,e,i){if(this._$cssResult$=!0,i!==s)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=t,this.t=e}get styleSheet(){let t=this.o;const e=this.t;if(i&&void 0===t){const i=void 0!==e&&1===e.length;i&&(t=n.get(e)),void 0===t&&((this.o=t=new CSSStyleSheet).replaceSync(this.cssText),i&&n.set(e,t))}return t}toString(){return this.cssText}};const o=i?t=>t:t=>t instanceof CSSStyleSheet?(t=>{let e="";for(const i of t.cssRules)e+=i.cssText;return(t=>new r("string"==typeof t?t:t+"",void 0,s))(e)})(t):t,{is:a,defineProperty:h,getOwnPropertyDescriptor:c,getOwnPropertyNames:l,getOwnPropertySymbols:d,getPrototypeOf:p}=Object,u=globalThis,g=u.trustedTypes,f=g?g.emptyScript:"",m=u.reactiveElementPolyfillSupport,y=(t,e)=>t,v={toAttribute(t,e){switch(e){case Boolean:t=t?f:null;break;case Object:case Array:t=null==t?t:JSON.stringify(t)}return t},fromAttribute(t,e){let i=t;switch(e){case Boolean:i=null!==t;break;case Number:i=null===t?null:Number(t);break;case Object:case Array:try{i=JSON.parse(t)}catch(t){i=null}}return i}},b=(t,e)=>!a(t,e),$={attribute:!0,type:String,converter:v,reflect:!1,useDefault:!1,hasChanged:b};Symbol.metadata??=Symbol("metadata"),u.litPropertyMetadata??=new WeakMap;let _=class extends HTMLElement{static addInitializer(t){this._$Ei(),(this.l??=[]).push(t)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(t,e=$){if(e.state&&(e.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(t)&&((e=Object.create(e)).wrapped=!0),this.elementProperties.set(t,e),!e.noAccessor){const i=Symbol(),s=this.getPropertyDescriptor(t,i,e);void 0!==s&&h(this.prototype,t,s)}}static getPropertyDescriptor(t,e,i){const{get:s,set:n}=c(this.prototype,t)??{get(){return this[e]},set(t){this[e]=t}};return{get:s,set(e){const r=s?.call(this);n?.call(this,e),this.requestUpdate(t,r,i)},configurable:!0,enumerable:!0}}static getPropertyOptions(t){return this.elementProperties.get(t)??$}static _$Ei(){if(this.hasOwnProperty(y("elementProperties")))return;const t=p(this);t.finalize(),void 0!==t.l&&(this.l=[...t.l]),this.elementProperties=new Map(t.elementProperties)}static finalize(){if(this.hasOwnProperty(y("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(y("properties"))){const t=this.properties,e=[...l(t),...d(t)];for(const i of e)this.createProperty(i,t[i])}const t=this[Symbol.metadata];if(null!==t){const e=litPropertyMetadata.get(t);if(void 0!==e)for(const[t,i]of e)this.elementProperties.set(t,i)}this._$Eh=new Map;for(const[t,e]of this.elementProperties){const i=this._$Eu(t,e);void 0!==i&&this._$Eh.set(i,t)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(t){const e=[];if(Array.isArray(t)){const i=new Set(t.flat(1/0).reverse());for(const t of i)e.unshift(o(t))}else void 0!==t&&e.push(o(t));return e}static _$Eu(t,e){const i=e.attribute;return!1===i?void 0:"string"==typeof i?i:"string"==typeof t?t.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$ES=new Promise(t=>this.enableUpdating=t),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach(t=>t(this))}addController(t){(this._$EO??=new Set).add(t),void 0!==this.renderRoot&&this.isConnected&&t.hostConnected?.()}removeController(t){this._$EO?.delete(t)}_$E_(){const t=new Map,e=this.constructor.elementProperties;for(const i of e.keys())this.hasOwnProperty(i)&&(t.set(i,this[i]),delete this[i]);t.size>0&&(this._$Ep=t)}createRenderRoot(){const t=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return((t,s)=>{if(i)t.adoptedStyleSheets=s.map(t=>t instanceof CSSStyleSheet?t:t.styleSheet);else for(const i of s){const s=document.createElement("style"),n=e.litNonce;void 0!==n&&s.setAttribute("nonce",n),s.textContent=i.cssText,t.appendChild(s)}})(t,this.constructor.elementStyles),t}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(!0),this._$EO?.forEach(t=>t.hostConnected?.())}enableUpdating(t){}disconnectedCallback(){this._$EO?.forEach(t=>t.hostDisconnected?.())}attributeChangedCallback(t,e,i){this._$AK(t,i)}_$ET(t,e){const i=this.constructor.elementProperties.get(t),s=this.constructor._$Eu(t,i);if(void 0!==s&&!0===i.reflect){const n=(void 0!==i.converter?.toAttribute?i.converter:v).toAttribute(e,i.type);this._$Em=t,null==n?this.removeAttribute(s):this.setAttribute(s,n),this._$Em=null}}_$AK(t,e){const i=this.constructor,s=i._$Eh.get(t);if(void 0!==s&&this._$Em!==s){const t=i.getPropertyOptions(s),n="function"==typeof t.converter?{fromAttribute:t.converter}:void 0!==t.converter?.fromAttribute?t.converter:v;this._$Em=s;const r=n.fromAttribute(e,t.type);this[s]=r??this._$Ej?.get(s)??r,this._$Em=null}}requestUpdate(t,e,i,s=!1,n){if(void 0!==t){const r=this.constructor;if(!1===s&&(n=this[t]),i??=r.getPropertyOptions(t),!((i.hasChanged??b)(n,e)||i.useDefault&&i.reflect&&n===this._$Ej?.get(t)&&!this.hasAttribute(r._$Eu(t,i))))return;this.C(t,e,i)}!1===this.isUpdatePending&&(this._$ES=this._$EP())}C(t,e,{useDefault:i,reflect:s,wrapped:n},r){i&&!(this._$Ej??=new Map).has(t)&&(this._$Ej.set(t,r??e??this[t]),!0!==n||void 0!==r)||(this._$AL.has(t)||(this.hasUpdated||i||(e=void 0),this._$AL.set(t,e)),!0===s&&this._$Em!==t&&(this._$Eq??=new Set).add(t))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(t){Promise.reject(t)}const t=this.scheduleUpdate();return null!=t&&await t,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(const[t,e]of this._$Ep)this[t]=e;this._$Ep=void 0}const t=this.constructor.elementProperties;if(t.size>0)for(const[e,i]of t){const{wrapped:t}=i,s=this[e];!0!==t||this._$AL.has(e)||void 0===s||this.C(e,void 0,i,s)}}let t=!1;const e=this._$AL;try{t=this.shouldUpdate(e),t?(this.willUpdate(e),this._$EO?.forEach(t=>t.hostUpdate?.()),this.update(e)):this._$EM()}catch(e){throw t=!1,this._$EM(),e}t&&this._$AE(e)}willUpdate(t){}_$AE(t){this._$EO?.forEach(t=>t.hostUpdated?.()),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(t)),this.updated(t)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(t){return!0}update(t){this._$Eq&&=this._$Eq.forEach(t=>this._$ET(t,this[t])),this._$EM()}updated(t){}firstUpdated(t){}};_.elementStyles=[],_.shadowRootOptions={mode:"open"},_[y("elementProperties")]=new Map,_[y("finalized")]=new Map,m?.({ReactiveElement:_}),(u.reactiveElementVersions??=[]).push("2.1.2");const w=globalThis,x=t=>t,A=w.trustedTypes,k=A?A.createPolicy("lit-html",{createHTML:t=>t}):void 0,S="$lit$",E=`lit$${Math.random().toFixed(9).slice(2)}$`,C="?"+E,P=`<${C}>`,T=document,O=()=>T.createComment(""),M=t=>null===t||"object"!=typeof t&&"function"!=typeof t,U=Array.isArray,R="[ \t\n\f\r]",N=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,z=/-->/g,D=/>/g,H=RegExp(`>|${R}(?:([^\\s"'>=/]+)(${R}*=${R}*(?:[^ \t\n\f\r"'\`<>=]|("|')|))|$)`,"g"),I=/'/g,j=/"/g,L=/^(?:script|style|textarea|title)$/i,B=(t=>(e,...i)=>({_$litType$:t,strings:e,values:i}))(1),W=Symbol.for("lit-noChange"),V=Symbol.for("lit-nothing"),Z=new WeakMap,F=T.createTreeWalker(T,129);function q(t,e){if(!U(t)||!t.hasOwnProperty("raw"))throw Error("invalid template strings array");return void 0!==k?k.createHTML(e):e}const G=(t,e)=>{const i=t.length-1,s=[];let n,r=2===e?"<svg>":3===e?"<math>":"",o=N;for(let e=0;e<i;e++){const i=t[e];let a,h,c=-1,l=0;for(;l<i.length&&(o.lastIndex=l,h=o.exec(i),null!==h);)l=o.lastIndex,o===N?"!--"===h[1]?o=z:void 0!==h[1]?o=D:void 0!==h[2]?(L.test(h[2])&&(n=RegExp("</"+h[2],"g")),o=H):void 0!==h[3]&&(o=H):o===H?">"===h[0]?(o=n??N,c=-1):void 0===h[1]?c=-2:(c=o.lastIndex-h[2].length,a=h[1],o=void 0===h[3]?H:'"'===h[3]?j:I):o===j||o===I?o=H:o===z||o===D?o=N:(o=H,n=void 0);const d=o===H&&t[e+1].startsWith("/>")?" ":"";r+=o===N?i+P:c>=0?(s.push(a),i.slice(0,c)+S+i.slice(c)+E+d):i+E+(-2===c?e:d)}return[q(t,r+(t[i]||"<?>")+(2===e?"</svg>":3===e?"</math>":"")),s]};class K{constructor({strings:t,_$litType$:e},i){let s;this.parts=[];let n=0,r=0;const o=t.length-1,a=this.parts,[h,c]=G(t,e);if(this.el=K.createElement(h,i),F.currentNode=this.el.content,2===e||3===e){const t=this.el.content.firstChild;t.replaceWith(...t.childNodes)}for(;null!==(s=F.nextNode())&&a.length<o;){if(1===s.nodeType){if(s.hasAttributes())for(const t of s.getAttributeNames())if(t.endsWith(S)){const e=c[r++],i=s.getAttribute(t).split(E),o=/([.?@])?(.*)/.exec(e);a.push({type:1,index:n,name:o[2],strings:i,ctor:"."===o[1]?tt:"?"===o[1]?et:"@"===o[1]?it:Q}),s.removeAttribute(t)}else t.startsWith(E)&&(a.push({type:6,index:n}),s.removeAttribute(t));if(L.test(s.tagName)){const t=s.textContent.split(E),e=t.length-1;if(e>0){s.textContent=A?A.emptyScript:"";for(let i=0;i<e;i++)s.append(t[i],O()),F.nextNode(),a.push({type:2,index:++n});s.append(t[e],O())}}}else if(8===s.nodeType)if(s.data===C)a.push({type:2,index:n});else{let t=-1;for(;-1!==(t=s.data.indexOf(E,t+1));)a.push({type:7,index:n}),t+=E.length-1}n++}}static createElement(t,e){const i=T.createElement("template");return i.innerHTML=t,i}}function J(t,e,i=t,s){if(e===W)return e;let n=void 0!==s?i._$Co?.[s]:i._$Cl;const r=M(e)?void 0:e._$litDirective$;return n?.constructor!==r&&(n?._$AO?.(!1),void 0===r?n=void 0:(n=new r(t),n._$AT(t,i,s)),void 0!==s?(i._$Co??=[])[s]=n:i._$Cl=n),void 0!==n&&(e=J(t,n._$AS(t,e.values),n,s)),e}class Y{constructor(t,e){this._$AV=[],this._$AN=void 0,this._$AD=t,this._$AM=e}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(t){const{el:{content:e},parts:i}=this._$AD,s=(t?.creationScope??T).importNode(e,!0);F.currentNode=s;let n=F.nextNode(),r=0,o=0,a=i[0];for(;void 0!==a;){if(r===a.index){let e;2===a.type?e=new X(n,n.nextSibling,this,t):1===a.type?e=new a.ctor(n,a.name,a.strings,this,t):6===a.type&&(e=new st(n,this,t)),this._$AV.push(e),a=i[++o]}r!==a?.index&&(n=F.nextNode(),r++)}return F.currentNode=T,s}p(t){let e=0;for(const i of this._$AV)void 0!==i&&(void 0!==i.strings?(i._$AI(t,i,e),e+=i.strings.length-2):i._$AI(t[e])),e++}}class X{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(t,e,i,s){this.type=2,this._$AH=V,this._$AN=void 0,this._$AA=t,this._$AB=e,this._$AM=i,this.options=s,this._$Cv=s?.isConnected??!0}get parentNode(){let t=this._$AA.parentNode;const e=this._$AM;return void 0!==e&&11===t?.nodeType&&(t=e.parentNode),t}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(t,e=this){t=J(this,t,e),M(t)?t===V||null==t||""===t?(this._$AH!==V&&this._$AR(),this._$AH=V):t!==this._$AH&&t!==W&&this._(t):void 0!==t._$litType$?this.$(t):void 0!==t.nodeType?this.T(t):(t=>U(t)||"function"==typeof t?.[Symbol.iterator])(t)?this.k(t):this._(t)}O(t){return this._$AA.parentNode.insertBefore(t,this._$AB)}T(t){this._$AH!==t&&(this._$AR(),this._$AH=this.O(t))}_(t){this._$AH!==V&&M(this._$AH)?this._$AA.nextSibling.data=t:this.T(T.createTextNode(t)),this._$AH=t}$(t){const{values:e,_$litType$:i}=t,s="number"==typeof i?this._$AC(t):(void 0===i.el&&(i.el=K.createElement(q(i.h,i.h[0]),this.options)),i);if(this._$AH?._$AD===s)this._$AH.p(e);else{const t=new Y(s,this),i=t.u(this.options);t.p(e),this.T(i),this._$AH=t}}_$AC(t){let e=Z.get(t.strings);return void 0===e&&Z.set(t.strings,e=new K(t)),e}k(t){U(this._$AH)||(this._$AH=[],this._$AR());const e=this._$AH;let i,s=0;for(const n of t)s===e.length?e.push(i=new X(this.O(O()),this.O(O()),this,this.options)):i=e[s],i._$AI(n),s++;s<e.length&&(this._$AR(i&&i._$AB.nextSibling,s),e.length=s)}_$AR(t=this._$AA.nextSibling,e){for(this._$AP?.(!1,!0,e);t!==this._$AB;){const e=x(t).nextSibling;x(t).remove(),t=e}}setConnected(t){void 0===this._$AM&&(this._$Cv=t,this._$AP?.(t))}}class Q{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(t,e,i,s,n){this.type=1,this._$AH=V,this._$AN=void 0,this.element=t,this.name=e,this._$AM=s,this.options=n,i.length>2||""!==i[0]||""!==i[1]?(this._$AH=Array(i.length-1).fill(new String),this.strings=i):this._$AH=V}_$AI(t,e=this,i,s){const n=this.strings;let r=!1;if(void 0===n)t=J(this,t,e,0),r=!M(t)||t!==this._$AH&&t!==W,r&&(this._$AH=t);else{const s=t;let o,a;for(t=n[0],o=0;o<n.length-1;o++)a=J(this,s[i+o],e,o),a===W&&(a=this._$AH[o]),r||=!M(a)||a!==this._$AH[o],a===V?t=V:t!==V&&(t+=(a??"")+n[o+1]),this._$AH[o]=a}r&&!s&&this.j(t)}j(t){t===V?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,t??"")}}class tt extends Q{constructor(){super(...arguments),this.type=3}j(t){this.element[this.name]=t===V?void 0:t}}class et extends Q{constructor(){super(...arguments),this.type=4}j(t){this.element.toggleAttribute(this.name,!!t&&t!==V)}}class it extends Q{constructor(t,e,i,s,n){super(t,e,i,s,n),this.type=5}_$AI(t,e=this){if((t=J(this,t,e,0)??V)===W)return;const i=this._$AH,s=t===V&&i!==V||t.capture!==i.capture||t.once!==i.once||t.passive!==i.passive,n=t!==V&&(i===V||s);s&&this.element.removeEventListener(this.name,this,i),n&&this.element.addEventListener(this.name,this,t),this._$AH=t}handleEvent(t){"function"==typeof this._$AH?this._$AH.call(this.options?.host??this.element,t):this._$AH.handleEvent(t)}}class st{constructor(t,e,i){this.element=t,this.type=6,this._$AN=void 0,this._$AM=e,this.options=i}get _$AU(){return this._$AM._$AU}_$AI(t){J(this,t)}}const nt=w.litHtmlPolyfillSupport;nt?.(K,X),(w.litHtmlVersions??=[]).push("3.3.3");const rt=globalThis;class ot extends _{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){const t=super.createRenderRoot();return this.renderOptions.renderBefore??=t.firstChild,t}update(t){const e=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(t),this._$Do=((t,e,i)=>{const s=i?.renderBefore??e;let n=s._$litPart$;if(void 0===n){const t=i?.renderBefore??null;s._$litPart$=n=new X(e.insertBefore(O(),t),t,void 0,i??{})}return n._$AI(t),n})(e,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return W}}ot._$litElement$=!0,ot.finalized=!0,rt.litElementHydrateSupport?.({LitElement:ot});const at=rt.litElementPolyfillSupport;at?.({LitElement:ot}),(rt.litElementVersions??=[]).push("4.2.2");const ht={attribute:!0,type:String,converter:v,reflect:!1,hasChanged:b},ct=(t=ht,e,i)=>{const{kind:s,metadata:n}=i;let r=globalThis.litPropertyMetadata.get(n);if(void 0===r&&globalThis.litPropertyMetadata.set(n,r=new Map),"setter"===s&&((t=Object.create(t)).wrapped=!0),r.set(i.name,t),"accessor"===s){const{name:s}=i;return{set(i){const n=e.get.call(this);e.set.call(this,i),this.requestUpdate(s,n,t,!0,i)},init(e){return void 0!==e&&this.C(s,void 0,t,e),e}}}if("setter"===s){const{name:s}=i;return function(i){const n=this[s];e.call(this,i),this.requestUpdate(s,n,t,!0,i)}}throw Error("Unsupported decorator location: "+s)};function lt(t){return(e,i)=>"object"==typeof i?ct(t,e,i):((t,e,i)=>{const s=e.hasOwnProperty(i);return e.constructor.createProperty(i,t),s?Object.getOwnPropertyDescriptor(e,i):void 0})(t,e,i)}function dt(t){return lt({...t,state:!0,attribute:!1})}function pt(t,e){return(e,i,s)=>((t,e,i)=>(i.configurable=!0,i.enumerable=!0,Reflect.decorate&&"object"!=typeof e&&Object.defineProperty(t,e,i),i))(e,i,{get(){return(e=>e.renderRoot?.querySelector(t)??null)(this)}})}const ut=((t,...e)=>{const i=1===t.length?t[0]:e.reduce((e,i,s)=>e+(t=>{if(!0===t._$cssResult$)return t.cssText;if("number"==typeof t)return t;throw Error("Value passed to 'css' function must be a 'css' function result: "+t+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(i)+t[s+1],t[0]);return new r(i,t,s)})`
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

  .layer {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: contain;
    opacity: 0;
    transition: opacity 120ms linear;
  }

  .layer.visible {
    opacity: 1;
  }

  .stage.stale .layer.visible {
    /* Playhead is on a gap: keep the last real frame on screen but make
       it visibly not-current rather than silently lying. */
    opacity: 0.45;
    filter: grayscale(0.5);
  }

  .empty .detail {
    font-size: 0.8rem;
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
    font-size: 0.9rem;
  }

  /* --- overlays ---------------------------------------------------- */

  .stamp,
  .badge {
    position: absolute;
    padding: 4px 8px;
    border-radius: 6px;
    background: rgba(0, 0, 0, 0.55);
    color: #fff;
    font-size: 0.8rem;
    /* Digits must not shift width as the clock ticks. */
    font-variant-numeric: tabular-nums;
    backdrop-filter: blur(2px);
  }

  .stamp {
    left: 8px;
    bottom: 8px;
  }

  .badge {
    right: 8px;
    top: 8px;
    letter-spacing: 0.06em;
    font-weight: 600;
  }

  .badge.live {
    background: var(--wtl-accent);
  }

  .badge.gap {
    background: var(--wtl-gap);
  }

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

  .readout-row {
    display: flex;
    align-items: baseline;
    gap: 8px;
    font-size: 0.85rem;
  }

  .readout-name {
    color: rgba(255, 255, 255, 0.75);
  }

  .readout-value {
    margin-left: auto;
    font-weight: 600;
  }

  .readout-row.stale .readout-value {
    opacity: 0.55;
  }

  .readout-at {
    font-size: 0.7rem;
    color: rgba(255, 255, 255, 0.6);
  }

  /* --- controls ---------------------------------------------------- */

  .controls {
    display: flex;
    align-items: center;
    gap: 2px;
    padding: 4px 8px;
  }

  .spacer {
    flex: 1;
  }

  .speed {
    min-width: 44px;
    padding: 6px 8px;
    border: 0;
    border-radius: 6px;
    background: transparent;
    color: var(--wtl-text);
    font: inherit;
    font-variant-numeric: tabular-nums;
    cursor: pointer;
  }

  .speed:hover {
    background: var(--wtl-divider);
  }

  .speed:focus-visible {
    outline: 2px solid var(--wtl-accent);
    outline-offset: 2px;
  }

  /* --- scrubber ---------------------------------------------------- */

  .track {
    position: relative;
    height: 44px; /* WCAG 2.5.8 target size, kept even though the bar is thin */
    margin: 0 12px;
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

  /* --- day ticks --------------------------------------------------- */

  .dayticks {
    position: relative;
    height: 20px;
    margin: 0 12px 8px;
  }

  .tick {
    position: absolute;
    top: 0;
    transform: translateX(-50%);
    font-size: 0.7rem;
    color: var(--wtl-muted);
    white-space: nowrap;
  }

  .tick::before {
    content: "";
    display: block;
    width: 1px;
    height: 5px;
    margin: 0 auto 2px;
    background: var(--wtl-divider);
  }

  .tick.month::before {
    height: 8px;
    width: 2px;
    background: var(--wtl-muted);
  }

  /* --- version banner ---------------------------------------------- */

  .banner {
    display: flex;
    gap: 8px;
    align-items: center;
    padding: 8px 12px;
    background: var(--warning-color, #ffa726);
    color: #000;
    font-size: 0.85rem;
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

  @container (max-width: 380px) {
    .readout {
      position: static;
      border-radius: 0;
      background: transparent;
      color: var(--wtl-text);
      backdrop-filter: none;
    }

    .readout-name,
    .readout-at {
      color: var(--wtl-muted);
    }
  }

  /* Honour the OS setting. autoplay is also forced off in code — a card
     that starts animating by itself is the exact thing this preference
     exists to prevent. */
  @media (prefers-reduced-motion: reduce) {
    .layer {
      transition: none;
    }
  }

  @media (forced-colors: active) {
    .fill,
    .gap-run {
      forced-color-adjust: none;
    }
  }
`,gt="webcam-timelapse-card";var ft={no_frames:"No frames archived yet.",first_soon:"The first one appears at the next capture.",index_failed:"Could not load the timeline."},mt={live:"LIVE",gap:"NO IMAGE"},yt={play:"Play",pause:"Pause",previous:"Previous frame",next:"Next frame",speed:"Playback speed {v}x",now:"Jump to now"},vt={label:"Timeline position"},bt={no_camera:"You need to pick a camera in the card configuration."},$t="This card was updated to {v}. Reload to pick up the new version.",_t="Reload",wt={empty:ft,badge:mt,controls:yt,track:vt,error:bt,version_update:$t,version_reload:_t},xt={no_frames:"Noch keine Bilder gespeichert.",first_soon:"Das erste erscheint bei der nächsten Aufnahme.",index_failed:"Die Zeitleiste konnte nicht geladen werden."},At={live:"LIVE",gap:"KEIN BILD"},kt={play:"Abspielen",pause:"Pause",previous:"Vorheriges Bild",next:"Nächstes Bild",speed:"Wiedergabegeschwindigkeit {v}x",now:"Zur Gegenwart springen"},St={label:"Position auf der Zeitleiste"},Et={no_camera:"Bitte wähle in der Kartenkonfiguration eine Kamera aus."},Ct="Diese Karte wurde auf {v} aktualisiert. Lade neu, um die neue Version zu verwenden.",Pt="Neu laden",Tt={empty:xt,badge:At,controls:kt,track:St,error:Et,version_update:Ct,version_reload:Pt};const Ot={en:Object.freeze({__proto__:null,badge:mt,controls:yt,default:wt,empty:ft,error:bt,track:vt,version_reload:_t,version_update:$t}),de:Object.freeze({__proto__:null,badge:At,controls:kt,default:Tt,empty:xt,error:Et,track:St,version_reload:Pt,version_update:Ct})};function Mt(t,e){const i=t.split(".").reduce((t,e)=>{if(t&&"object"==typeof t&&e in t)return t[e]},e);return"string"==typeof i?i:void 0}function Ut(t,e=void 0,i="",s=""){const n=(e??"en").toLowerCase().split(/[-_]/)[0]??"en",r=Ot.en??{};let o=Mt(t,Ot[n]??Ot.en??{});return void 0===o&&(o=Mt(t,r)),void 0===o&&(o=t),""!==i&&""!==s&&(o=o.replace(i,s)),o}const Rt={base:"",ext:".webp",step:600,t0:null,count:0,gaps:[],retention_days:0,online:!0,newest_slot:null};function Nt(t,e){return null===t.t0||e<0||e>=t.count?null:t.t0+e*t.step}function zt(t,e){const i=Nt(t,e);return null===i?null:`${t.base}${i}${t.ext}`}function Dt(t,e,i=1){for(let s=e;s>=0&&s<t.length;s+=i)if(t[s])return s;return null}function Ht(t){return null!==t.t0&&t.count>0}class It{constructor(t){this.size=t,this.cursor=0,this.slots=new Array(t).fill(null)}prefetch(t){const e=new Image;e.decoding="async",e.fetchPriority="low",e.src=t,this.slots[this.cursor]=e,this.cursor=(this.cursor+1)%this.size}clear(){this.slots.fill(null),this.cursor=0}}function jt(t){return Math.min(Math.max(Math.round(4*t),4),16)}function Lt(t,e){return new Intl.DateTimeFormat("en-CA",{timeZone:e,year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date(1e3*t))}function Bt(t,e,i,s){const n={timeZone:e,day:"2-digit",month:"2-digit"};return"long"===s&&(n.weekday="long"),"short"===s&&(n.weekday="short"),new Intl.DateTimeFormat(i,n).format(new Date(1e3*t))}function Wt(t,e,i,s){if(null===t.t0||0===t.count)return[];const n=function(t){return t>=560?"long":t>=380?"short":"date"}(s),r="long"===n?110:"short"===n?78:58,o=[];let a=Lt(t.t0,e);for(let i=1;i<t.count;i++){const s=Nt(t,i);if(null===s)continue;const n=Lt(s,e);n!==a&&(o.push({position:i,slot:s,date:n}),a=n)}const h=function(t,e,i){const s=Math.max(1,Math.floor(e/i));return Math.max(1,Math.ceil(t/s))}(o.length,s,r),c=Math.max(1,t.count-1);return o.map((t,s)=>{const r=t.date.endsWith("-01"),o=r||s%h===0;return{position:t.position,left:t.position/c*100,label:o?Bt(t.slot,e,i,n):"",isMonthStart:r}})}function Vt(t,e,i){return new Intl.DateTimeFormat(i,{timeZone:e,weekday:"short",day:"2-digit",month:"2-digit",hour:"2-digit",minute:"2-digit"}).format(new Date(1e3*t))}function Zt(){try{window.caches?.keys?.().then(t=>{t.forEach(t=>window.caches?.delete?.(t))})}catch{}window.location.reload()}function Ft(t,e){if(!t)return V;const i=e("version_update").replace("{v}",t),s=e("version_reload");return B`
    <div class="banner" role="alert" aria-live="assertive">
      <span>${i}</span>
      <button
        type="button"
        aria-label=${s}
        @click=${Zt}
      >
        ${s}
      </button>
    </div>
  `}const qt=[1,2,4,8,16,32];let Gt=class extends ot{constructor(){super(...arguments),this.index=Rt,this.position=0,this.playing=!1,this.speed=1,this.trackWidth=600,this.versionMismatch=null,this.present=new Uint8Array(0),this.ring=new It(jt(1)),this.useLayerA=!0,this.frameGeneration=0,this.versionChecked=!1,this.lastScrubAt=0,this.visible=!0,this.onScreen=!0,this.onVisibilityChange=()=>{this.visible="visible"===document.visibilityState,this.reconcilePlayback(),this.visible&&this.refreshIndex()}}static{this.styles=ut}setConfig(t){if(!t?.camera_entity)throw new Error(Ut("error.no_camera",this.hass?.locale?.language));this.config={autoplay:!1,speed:4,show_dayticks:!0,...t},this.speed=qt.includes(this.config.speed)?this.config.speed:4}static getStubConfig(t){return{camera_entity:Object.keys(t.states).find(e=>e.startsWith("camera.")&&"webcam_timelapse"===t.entities?.[e]?.platform)??""}}getCardSize(){return 8}getGridOptions(){return{columns:"full",rows:"auto",min_columns:6,min_rows:6}}connectedCallback(){super.connectedCallback(),document.addEventListener("visibilitychange",this.onVisibilityChange),this.intersectionObserver=new IntersectionObserver(t=>{this.onScreen=t.some(t=>t.isIntersecting),this.reconcilePlayback()}),this.intersectionObserver.observe(this),this.resizeObserver=new ResizeObserver(t=>{const e=t[0]?.contentRect.width;e&&(this.trackWidth=e-24)}),this.resizeObserver.observe(this)}disconnectedCallback(){super.disconnectedCallback(),document.removeEventListener("visibilitychange",this.onVisibilityChange),this.intersectionObserver?.disconnect(),this.resizeObserver?.disconnect(),this.stopPlayback(),this.indexTimer&&window.clearTimeout(this.indexTimer),this.scrubRaf&&cancelAnimationFrame(this.scrubRaf),this.ring.clear()}willUpdate(t){t.has("hass")&&this.hass&&this.index===Rt&&this.refreshIndex(),t.has("hass")&&this.hass&&!this.versionChecked&&(this.versionChecked=!0,async function(t,e,i){if(!t?.callWS)return null;try{const s=await t.callWS({type:e});if(s?.version&&s.version!==i)return s.version}catch{}return null}(this.hass,"webcam_timelapse/card_version","0.1.0").then(t=>{this.versionMismatch=t}))}reconcilePlayback(){this.playing&&this.visible&&this.onScreen?this.startPlayback():this.stopPlayback()}async refreshIndex(){if(this.hass?.callWS&&this.config){try{const t=await this.hass.callWS({type:"webcam_timelapse/index",entity_id:this.config.camera_entity}),e=this.position>=this.index.count-1;this.index=t,this.present=function(t){const e=new Uint8Array(t.count).fill(1);for(const[i,s]of t.gaps){const n=Math.max(0,i),r=Math.min(t.count,i+s);for(let t=n;t<r;t++)e[t]=0}return e}(t),(e||this.position>=t.count)&&(this.position=Math.max(0,t.count-1)),await this.updateComplete,this.swapInFrame(),this.indexError=void 0}catch(t){this.indexError=t instanceof Error?t.message:"Could not load the timeline."}this.scheduleIndexRefresh()}}scheduleIndexRefresh(){this.indexTimer&&window.clearTimeout(this.indexTimer);const t=1e3*this.index.step+15e3*Math.random();this.indexTimer=window.setTimeout(()=>{this.refreshIndex()},t)}get frameDelay(){return Math.max(500/this.speed,33)}startPlayback(){if(this.playTimer)return;const t=()=>{const e=Dt(this.present,this.position+1);if(null===e)return this.playing=!1,void this.stopPlayback();this.goTo(e),this.playTimer=window.setTimeout(t,this.frameDelay)};this.playTimer=window.setTimeout(t,this.frameDelay)}stopPlayback(){this.playTimer&&window.clearTimeout(this.playTimer),this.playTimer=void 0}togglePlay(){this.playing=!this.playing,this.reconcilePlayback()}cycleSpeed(){const t=qt[(qt.indexOf(this.speed)+1)%qt.length];this.speed=t??1,this.ring=new It(jt(this.speed))}goTo(t){this.position=Math.min(Math.max(t,0),Math.max(0,this.index.count-1)),this.swapInFrame(),this.prefetchAhead()}async swapInFrame(){const t=this.currentSrc();if(!t)return;const e=++this.frameGeneration,i=this.useLayerA?this.layerB:this.layerA;if(i){i.src=t;try{await i.decode()}catch{return}e===this.frameGeneration&&(this.useLayerA=!this.useLayerA,this.requestUpdate())}}currentSrc(){const t=this.hass?.states[this.config.camera_entity]?.attributes.entity_picture;return this.atLive&&t?t:zt(this.index,this.position)??void 0}prefetchAhead(){const t=jt(this.speed);for(let e=1;e<=t;e++){const t=Dt(this.present,this.position+e);if(null===t)break;const i=zt(this.index,t);i&&this.ring.prefetch(i)}}onScrub(t){const e=Number(t.target.value);this.position=e;const i=performance.now();this.pendingPosition=e,i-this.lastScrubAt<80||(this.lastScrubAt=i,this.scrubRaf&&cancelAnimationFrame(this.scrubRaf),this.scrubRaf=requestAnimationFrame(()=>{this.scrubRaf=void 0,void 0!==this.pendingPosition&&this.goTo(this.pendingPosition)}))}onScrubCommit(t){this.goTo(Number(t.target.value))}jumpToNow(){this.playing=!1,this.stopPlayback(),this.goTo(this.index.count-1)}stepBy(t){const e=Dt(this.present,this.position+t,t);null!==e&&this.goTo(e)}get timeZone(){return this.hass?.config?.time_zone??Intl.DateTimeFormat().resolvedOptions().timeZone}get language(){return this.hass?.locale?.language??this.hass?.language??"en"}t(t,e){return void 0===e?Ut(t,this.language):Ut(t,this.language,"{v}",e)}get atLive(){return this.position>=this.index.count-1}get onGap(){return this.present.length>0&&!this.present[this.position]}render(){if(!this.config||!this.hass)return B`<ha-card></ha-card>`;const t=null===this.index.t0?null:this.index.t0+this.position*this.index.step;return B`
      <ha-card .header=${this.config.title??V}>
        ${Ft(this.versionMismatch,t=>this.t(t))}
        ${this.renderStage(t)}
        ${Ht(this.index)?B`
              ${this.renderControls()} ${this.renderTrack(t)}
              ${this.config.show_dayticks?this.renderDayTicks():V}
            `:V}
      </ha-card>
    `}renderStage(t){if(!Ht(this.index))return B`
        <div class="stage">
          <div class="empty">
            ${this.indexError?B`
                  <div>${this.t("empty.index_failed")}</div>
                  <div class="detail">${this.indexError}</div>
                `:B`
                  <div>${this.t("empty.no_frames")}</div>
                  <div>${this.t("empty.first_soon")}</div>
                `}
          </div>
        </div>
      `;const e=this.useLayerA;return B`
      <div class="stage ${this.onGap?"stale":""}">
        <img
          class="layer a ${e?"visible":""}"
          alt=""
          decoding="async"
          fetchpriority="high"
        />
        <img
          class="layer b ${e?"":"visible"}"
          alt=""
          decoding="async"
          fetchpriority="high"
        />
        ${null!==t?B`<div class="stamp">
              <time datetime=${new Date(1e3*t).toISOString()}>
                ${Vt(t,this.timeZone,this.language)}
              </time>
            </div>`:V}
        ${this.onGap?B`<div class="badge gap">${this.t("badge.gap")}</div>`:this.atLive?B`<div class="badge live">${this.t("badge.live")}</div>`:V}
      </div>
    `}renderControls(){return B`
      <div class="controls">
        <ha-icon-button
          .label=${this.playing?this.t("controls.pause"):this.t("controls.play")}
          @click=${this.togglePlay}
        >
          <ha-icon .icon=${this.playing?"mdi:pause":"mdi:play"}></ha-icon>
        </ha-icon-button>
        <ha-icon-button .label=${this.t("controls.previous")} @click=${()=>this.stepBy(-1)}>
          <ha-icon icon="mdi:skip-previous"></ha-icon>
        </ha-icon-button>
        <ha-icon-button .label=${this.t("controls.next")} @click=${()=>this.stepBy(1)}>
          <ha-icon icon="mdi:skip-next"></ha-icon>
        </ha-icon-button>
        <button
          class="speed"
          @click=${this.cycleSpeed}
          aria-label=${this.t("controls.speed",String(this.speed))}
        >
          ${this.speed}×
        </button>
        <span class="spacer"></span>
        <ha-icon-button .label=${this.t("controls.now")} @click=${this.jumpToNow}>
          <ha-icon icon="mdi:update"></ha-icon>
        </ha-icon-button>
      </div>
    `}renderTrack(t){const e=Math.max(1,this.index.count-1),i=this.position/e*100;return B`
      <div class="track">
        <div class="rail"></div>
        <div class="fill" style="width:${i}%"></div>
        ${this.index.gaps.map(([t,i])=>B`<div
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
          aria-valuetext=${null!==t?Vt(t,this.timeZone,this.language):""}
          @input=${this.onScrub}
          @change=${this.onScrubCommit}
        />
      </div>
    `}renderDayTicks(){const t=Wt(this.index,this.timeZone,this.language,this.trackWidth);return B`
      <div class="dayticks" aria-hidden="true">
        ${t.map(t=>B`
            <span
              class="tick ${t.isMonthStart?"month":""}"
              style="left:${t.left}%"
              >${t.label}</span
            >
          `)}
      </div>
    `}};t([lt({attribute:!1})],Gt.prototype,"hass",void 0),t([dt()],Gt.prototype,"config",void 0),t([dt()],Gt.prototype,"index",void 0),t([dt()],Gt.prototype,"position",void 0),t([dt()],Gt.prototype,"playing",void 0),t([dt()],Gt.prototype,"speed",void 0),t([dt()],Gt.prototype,"trackWidth",void 0),t([dt()],Gt.prototype,"versionMismatch",void 0),t([dt()],Gt.prototype,"indexError",void 0),t([pt("img.layer.a")],Gt.prototype,"layerA",void 0),t([pt("img.layer.b")],Gt.prototype,"layerB",void 0),Gt=t([(t=>(e,i)=>{void 0!==i?i.addInitializer(()=>{customElements.define(t,e)}):customElements.define(t,e)})(gt)],Gt);const Kt=window;Kt.customCards=Kt.customCards??[],Kt.customCards.push({type:gt,name:"Webcam Timelapse",description:"Scrub and play back an archived still-image webcam.",preview:!0,documentationURL:"https://github.com/rolandzeiner/webcam-timelapse",getEntitySuggestion:(t,e)=>e.startsWith("camera.")?"webcam_timelapse"!==t.entities?.[e]?.platform?null:{config:{type:`custom:${gt}`,camera_entity:e}}:null});export{Gt as WebcamTimelapseCard};
