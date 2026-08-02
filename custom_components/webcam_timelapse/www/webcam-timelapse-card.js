// Webcam Timelapse Card — bundled by Rollup. Edit sources in src/, then `npm run build`.
function t(t,e,i,s){var n,o=arguments.length,r=o<3?e:null===s?s=Object.getOwnPropertyDescriptor(e,i):s;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)r=Reflect.decorate(t,e,i,s);else for(var a=t.length-1;a>=0;a--)(n=t[a])&&(r=(o<3?n(r):o>3?n(e,i,r):n(e,i))||r);return o>3&&r&&Object.defineProperty(e,i,r),r}"function"==typeof SuppressedError&&SuppressedError;const e=globalThis,i=e.ShadowRoot&&(void 0===e.ShadyCSS||e.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,s=Symbol(),n=new WeakMap;let o=class{constructor(t,e,i){if(this._$cssResult$=!0,i!==s)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=t,this.t=e}get styleSheet(){let t=this.o;const e=this.t;if(i&&void 0===t){const i=void 0!==e&&1===e.length;i&&(t=n.get(e)),void 0===t&&((this.o=t=new CSSStyleSheet).replaceSync(this.cssText),i&&n.set(e,t))}return t}toString(){return this.cssText}};const r=i?t=>t:t=>t instanceof CSSStyleSheet?(t=>{let e="";for(const i of t.cssRules)e+=i.cssText;return(t=>new o("string"==typeof t?t:t+"",void 0,s))(e)})(t):t,{is:a,defineProperty:h,getOwnPropertyDescriptor:l,getOwnPropertyNames:c,getOwnPropertySymbols:d,getPrototypeOf:u}=Object,p=globalThis,m=p.trustedTypes,g=m?m.emptyScript:"",f=p.reactiveElementPolyfillSupport,y=(t,e)=>t,b={toAttribute(t,e){switch(e){case Boolean:t=t?g:null;break;case Object:case Array:t=null==t?t:JSON.stringify(t)}return t},fromAttribute(t,e){let i=t;switch(e){case Boolean:i=null!==t;break;case Number:i=null===t?null:Number(t);break;case Object:case Array:try{i=JSON.parse(t)}catch(t){i=null}}return i}},v=(t,e)=>!a(t,e),w={attribute:!0,type:String,converter:b,reflect:!1,useDefault:!1,hasChanged:v};Symbol.metadata??=Symbol("metadata"),p.litPropertyMetadata??=new WeakMap;let $=class extends HTMLElement{static addInitializer(t){this._$Ei(),(this.l??=[]).push(t)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(t,e=w){if(e.state&&(e.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(t)&&((e=Object.create(e)).wrapped=!0),this.elementProperties.set(t,e),!e.noAccessor){const i=Symbol(),s=this.getPropertyDescriptor(t,i,e);void 0!==s&&h(this.prototype,t,s)}}static getPropertyDescriptor(t,e,i){const{get:s,set:n}=l(this.prototype,t)??{get(){return this[e]},set(t){this[e]=t}};return{get:s,set(e){const o=s?.call(this);n?.call(this,e),this.requestUpdate(t,o,i)},configurable:!0,enumerable:!0}}static getPropertyOptions(t){return this.elementProperties.get(t)??w}static _$Ei(){if(this.hasOwnProperty(y("elementProperties")))return;const t=u(this);t.finalize(),void 0!==t.l&&(this.l=[...t.l]),this.elementProperties=new Map(t.elementProperties)}static finalize(){if(this.hasOwnProperty(y("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(y("properties"))){const t=this.properties,e=[...c(t),...d(t)];for(const i of e)this.createProperty(i,t[i])}const t=this[Symbol.metadata];if(null!==t){const e=litPropertyMetadata.get(t);if(void 0!==e)for(const[t,i]of e)this.elementProperties.set(t,i)}this._$Eh=new Map;for(const[t,e]of this.elementProperties){const i=this._$Eu(t,e);void 0!==i&&this._$Eh.set(i,t)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(t){const e=[];if(Array.isArray(t)){const i=new Set(t.flat(1/0).reverse());for(const t of i)e.unshift(r(t))}else void 0!==t&&e.push(r(t));return e}static _$Eu(t,e){const i=e.attribute;return!1===i?void 0:"string"==typeof i?i:"string"==typeof t?t.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$ES=new Promise(t=>this.enableUpdating=t),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach(t=>t(this))}addController(t){(this._$EO??=new Set).add(t),void 0!==this.renderRoot&&this.isConnected&&t.hostConnected?.()}removeController(t){this._$EO?.delete(t)}_$E_(){const t=new Map,e=this.constructor.elementProperties;for(const i of e.keys())this.hasOwnProperty(i)&&(t.set(i,this[i]),delete this[i]);t.size>0&&(this._$Ep=t)}createRenderRoot(){const t=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return((t,s)=>{if(i)t.adoptedStyleSheets=s.map(t=>t instanceof CSSStyleSheet?t:t.styleSheet);else for(const i of s){const s=document.createElement("style"),n=e.litNonce;void 0!==n&&s.setAttribute("nonce",n),s.textContent=i.cssText,t.appendChild(s)}})(t,this.constructor.elementStyles),t}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(!0),this._$EO?.forEach(t=>t.hostConnected?.())}enableUpdating(t){}disconnectedCallback(){this._$EO?.forEach(t=>t.hostDisconnected?.())}attributeChangedCallback(t,e,i){this._$AK(t,i)}_$ET(t,e){const i=this.constructor.elementProperties.get(t),s=this.constructor._$Eu(t,i);if(void 0!==s&&!0===i.reflect){const n=(void 0!==i.converter?.toAttribute?i.converter:b).toAttribute(e,i.type);this._$Em=t,null==n?this.removeAttribute(s):this.setAttribute(s,n),this._$Em=null}}_$AK(t,e){const i=this.constructor,s=i._$Eh.get(t);if(void 0!==s&&this._$Em!==s){const t=i.getPropertyOptions(s),n="function"==typeof t.converter?{fromAttribute:t.converter}:void 0!==t.converter?.fromAttribute?t.converter:b;this._$Em=s;const o=n.fromAttribute(e,t.type);this[s]=o??this._$Ej?.get(s)??o,this._$Em=null}}requestUpdate(t,e,i,s=!1,n){if(void 0!==t){const o=this.constructor;if(!1===s&&(n=this[t]),i??=o.getPropertyOptions(t),!((i.hasChanged??v)(n,e)||i.useDefault&&i.reflect&&n===this._$Ej?.get(t)&&!this.hasAttribute(o._$Eu(t,i))))return;this.C(t,e,i)}!1===this.isUpdatePending&&(this._$ES=this._$EP())}C(t,e,{useDefault:i,reflect:s,wrapped:n},o){i&&!(this._$Ej??=new Map).has(t)&&(this._$Ej.set(t,o??e??this[t]),!0!==n||void 0!==o)||(this._$AL.has(t)||(this.hasUpdated||i||(e=void 0),this._$AL.set(t,e)),!0===s&&this._$Em!==t&&(this._$Eq??=new Set).add(t))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(t){Promise.reject(t)}const t=this.scheduleUpdate();return null!=t&&await t,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(const[t,e]of this._$Ep)this[t]=e;this._$Ep=void 0}const t=this.constructor.elementProperties;if(t.size>0)for(const[e,i]of t){const{wrapped:t}=i,s=this[e];!0!==t||this._$AL.has(e)||void 0===s||this.C(e,void 0,i,s)}}let t=!1;const e=this._$AL;try{t=this.shouldUpdate(e),t?(this.willUpdate(e),this._$EO?.forEach(t=>t.hostUpdate?.()),this.update(e)):this._$EM()}catch(e){throw t=!1,this._$EM(),e}t&&this._$AE(e)}willUpdate(t){}_$AE(t){this._$EO?.forEach(t=>t.hostUpdated?.()),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(t)),this.updated(t)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(t){return!0}update(t){this._$Eq&&=this._$Eq.forEach(t=>this._$ET(t,this[t])),this._$EM()}updated(t){}firstUpdated(t){}};$.elementStyles=[],$.shadowRootOptions={mode:"open"},$[y("elementProperties")]=new Map,$[y("finalized")]=new Map,f?.({ReactiveElement:$}),(p.reactiveElementVersions??=[]).push("2.1.2");const x=globalThis,_=t=>t,k=x.trustedTypes,A=k?k.createPolicy("lit-html",{createHTML:t=>t}):void 0,S="$lit$",E=`lit$${Math.random().toFixed(9).slice(2)}$`,M="?"+E,C=`<${M}>`,P=document,T=()=>P.createComment(""),z=t=>null===t||"object"!=typeof t&&"function"!=typeof t,R=Array.isArray,O="[ \t\n\f\r]",D=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,N=/-->/g,U=/>/g,H=RegExp(`>|${O}(?:([^\\s"'>=/]+)(${O}*=${O}*(?:[^ \t\n\f\r"'\`<>=]|("|')|))|$)`,"g"),L=/'/g,I=/"/g,W=/^(?:script|style|textarea|title)$/i,j=t=>(e,...i)=>({_$litType$:t,strings:e,values:i}),F=j(1),B=j(2),q=Symbol.for("lit-noChange"),G=Symbol.for("lit-nothing"),Z=new WeakMap,V=P.createTreeWalker(P,129);function K(t,e){if(!R(t)||!t.hasOwnProperty("raw"))throw Error("invalid template strings array");return void 0!==A?A.createHTML(e):e}const J=(t,e)=>{const i=t.length-1,s=[];let n,o=2===e?"<svg>":3===e?"<math>":"",r=D;for(let e=0;e<i;e++){const i=t[e];let a,h,l=-1,c=0;for(;c<i.length&&(r.lastIndex=c,h=r.exec(i),null!==h);)c=r.lastIndex,r===D?"!--"===h[1]?r=N:void 0!==h[1]?r=U:void 0!==h[2]?(W.test(h[2])&&(n=RegExp("</"+h[2],"g")),r=H):void 0!==h[3]&&(r=H):r===H?">"===h[0]?(r=n??D,l=-1):void 0===h[1]?l=-2:(l=r.lastIndex-h[2].length,a=h[1],r=void 0===h[3]?H:'"'===h[3]?I:L):r===I||r===L?r=H:r===N||r===U?r=D:(r=H,n=void 0);const d=r===H&&t[e+1].startsWith("/>")?" ":"";o+=r===D?i+C:l>=0?(s.push(a),i.slice(0,l)+S+i.slice(l)+E+d):i+E+(-2===l?e:d)}return[K(t,o+(t[i]||"<?>")+(2===e?"</svg>":3===e?"</math>":"")),s]};class X{constructor({strings:t,_$litType$:e},i){let s;this.parts=[];let n=0,o=0;const r=t.length-1,a=this.parts,[h,l]=J(t,e);if(this.el=X.createElement(h,i),V.currentNode=this.el.content,2===e||3===e){const t=this.el.content.firstChild;t.replaceWith(...t.childNodes)}for(;null!==(s=V.nextNode())&&a.length<r;){if(1===s.nodeType){if(s.hasAttributes())for(const t of s.getAttributeNames())if(t.endsWith(S)){const e=l[o++],i=s.getAttribute(t).split(E),r=/([.?@])?(.*)/.exec(e);a.push({type:1,index:n,name:r[2],strings:i,ctor:"."===r[1]?it:"?"===r[1]?st:"@"===r[1]?nt:et}),s.removeAttribute(t)}else t.startsWith(E)&&(a.push({type:6,index:n}),s.removeAttribute(t));if(W.test(s.tagName)){const t=s.textContent.split(E),e=t.length-1;if(e>0){s.textContent=k?k.emptyScript:"";for(let i=0;i<e;i++)s.append(t[i],T()),V.nextNode(),a.push({type:2,index:++n});s.append(t[e],T())}}}else if(8===s.nodeType)if(s.data===M)a.push({type:2,index:n});else{let t=-1;for(;-1!==(t=s.data.indexOf(E,t+1));)a.push({type:7,index:n}),t+=E.length-1}n++}}static createElement(t,e){const i=P.createElement("template");return i.innerHTML=t,i}}function Y(t,e,i=t,s){if(e===q)return e;let n=void 0!==s?i._$Co?.[s]:i._$Cl;const o=z(e)?void 0:e._$litDirective$;return n?.constructor!==o&&(n?._$AO?.(!1),void 0===o?n=void 0:(n=new o(t),n._$AT(t,i,s)),void 0!==s?(i._$Co??=[])[s]=n:i._$Cl=n),void 0!==n&&(e=Y(t,n._$AS(t,e.values),n,s)),e}class Q{constructor(t,e){this._$AV=[],this._$AN=void 0,this._$AD=t,this._$AM=e}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(t){const{el:{content:e},parts:i}=this._$AD,s=(t?.creationScope??P).importNode(e,!0);V.currentNode=s;let n=V.nextNode(),o=0,r=0,a=i[0];for(;void 0!==a;){if(o===a.index){let e;2===a.type?e=new tt(n,n.nextSibling,this,t):1===a.type?e=new a.ctor(n,a.name,a.strings,this,t):6===a.type&&(e=new ot(n,this,t)),this._$AV.push(e),a=i[++r]}o!==a?.index&&(n=V.nextNode(),o++)}return V.currentNode=P,s}p(t){let e=0;for(const i of this._$AV)void 0!==i&&(void 0!==i.strings?(i._$AI(t,i,e),e+=i.strings.length-2):i._$AI(t[e])),e++}}class tt{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(t,e,i,s){this.type=2,this._$AH=G,this._$AN=void 0,this._$AA=t,this._$AB=e,this._$AM=i,this.options=s,this._$Cv=s?.isConnected??!0}get parentNode(){let t=this._$AA.parentNode;const e=this._$AM;return void 0!==e&&11===t?.nodeType&&(t=e.parentNode),t}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(t,e=this){t=Y(this,t,e),z(t)?t===G||null==t||""===t?(this._$AH!==G&&this._$AR(),this._$AH=G):t!==this._$AH&&t!==q&&this._(t):void 0!==t._$litType$?this.$(t):void 0!==t.nodeType?this.T(t):(t=>R(t)||"function"==typeof t?.[Symbol.iterator])(t)?this.k(t):this._(t)}O(t){return this._$AA.parentNode.insertBefore(t,this._$AB)}T(t){this._$AH!==t&&(this._$AR(),this._$AH=this.O(t))}_(t){this._$AH!==G&&z(this._$AH)?this._$AA.nextSibling.data=t:this.T(P.createTextNode(t)),this._$AH=t}$(t){const{values:e,_$litType$:i}=t,s="number"==typeof i?this._$AC(t):(void 0===i.el&&(i.el=X.createElement(K(i.h,i.h[0]),this.options)),i);if(this._$AH?._$AD===s)this._$AH.p(e);else{const t=new Q(s,this),i=t.u(this.options);t.p(e),this.T(i),this._$AH=t}}_$AC(t){let e=Z.get(t.strings);return void 0===e&&Z.set(t.strings,e=new X(t)),e}k(t){R(this._$AH)||(this._$AH=[],this._$AR());const e=this._$AH;let i,s=0;for(const n of t)s===e.length?e.push(i=new tt(this.O(T()),this.O(T()),this,this.options)):i=e[s],i._$AI(n),s++;s<e.length&&(this._$AR(i&&i._$AB.nextSibling,s),e.length=s)}_$AR(t=this._$AA.nextSibling,e){for(this._$AP?.(!1,!0,e);t!==this._$AB;){const e=_(t).nextSibling;_(t).remove(),t=e}}setConnected(t){void 0===this._$AM&&(this._$Cv=t,this._$AP?.(t))}}class et{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(t,e,i,s,n){this.type=1,this._$AH=G,this._$AN=void 0,this.element=t,this.name=e,this._$AM=s,this.options=n,i.length>2||""!==i[0]||""!==i[1]?(this._$AH=Array(i.length-1).fill(new String),this.strings=i):this._$AH=G}_$AI(t,e=this,i,s){const n=this.strings;let o=!1;if(void 0===n)t=Y(this,t,e,0),o=!z(t)||t!==this._$AH&&t!==q,o&&(this._$AH=t);else{const s=t;let r,a;for(t=n[0],r=0;r<n.length-1;r++)a=Y(this,s[i+r],e,r),a===q&&(a=this._$AH[r]),o||=!z(a)||a!==this._$AH[r],a===G?t=G:t!==G&&(t+=(a??"")+n[r+1]),this._$AH[r]=a}o&&!s&&this.j(t)}j(t){t===G?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,t??"")}}class it extends et{constructor(){super(...arguments),this.type=3}j(t){this.element[this.name]=t===G?void 0:t}}class st extends et{constructor(){super(...arguments),this.type=4}j(t){this.element.toggleAttribute(this.name,!!t&&t!==G)}}class nt extends et{constructor(t,e,i,s,n){super(t,e,i,s,n),this.type=5}_$AI(t,e=this){if((t=Y(this,t,e,0)??G)===q)return;const i=this._$AH,s=t===G&&i!==G||t.capture!==i.capture||t.once!==i.once||t.passive!==i.passive,n=t!==G&&(i===G||s);s&&this.element.removeEventListener(this.name,this,i),n&&this.element.addEventListener(this.name,this,t),this._$AH=t}handleEvent(t){"function"==typeof this._$AH?this._$AH.call(this.options?.host??this.element,t):this._$AH.handleEvent(t)}}class ot{constructor(t,e,i){this.element=t,this.type=6,this._$AN=void 0,this._$AM=e,this.options=i}get _$AU(){return this._$AM._$AU}_$AI(t){Y(this,t)}}const rt=x.litHtmlPolyfillSupport;rt?.(X,tt),(x.litHtmlVersions??=[]).push("3.3.3");const at=globalThis;class ht extends ${constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){const t=super.createRenderRoot();return this.renderOptions.renderBefore??=t.firstChild,t}update(t){const e=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(t),this._$Do=((t,e,i)=>{const s=i?.renderBefore??e;let n=s._$litPart$;if(void 0===n){const t=i?.renderBefore??null;s._$litPart$=n=new tt(e.insertBefore(T(),t),t,void 0,i??{})}return n._$AI(t),n})(e,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return q}}ht._$litElement$=!0,ht.finalized=!0,at.litElementHydrateSupport?.({LitElement:ht});const lt=at.litElementPolyfillSupport;lt?.({LitElement:ht}),(at.litElementVersions??=[]).push("4.2.2");const ct=t=>(e,i)=>{void 0!==i?i.addInitializer(()=>{customElements.define(t,e)}):customElements.define(t,e)},dt={attribute:!0,type:String,converter:b,reflect:!1,hasChanged:v},ut=(t=dt,e,i)=>{const{kind:s,metadata:n}=i;let o=globalThis.litPropertyMetadata.get(n);if(void 0===o&&globalThis.litPropertyMetadata.set(n,o=new Map),"setter"===s&&((t=Object.create(t)).wrapped=!0),o.set(i.name,t),"accessor"===s){const{name:s}=i;return{set(i){const n=e.get.call(this);e.set.call(this,i),this.requestUpdate(s,n,t,!0,i)},init(e){return void 0!==e&&this.C(s,void 0,t,e),e}}}if("setter"===s){const{name:s}=i;return function(i){const n=this[s];e.call(this,i),this.requestUpdate(s,n,t,!0,i)}}throw Error("Unsupported decorator location: "+s)};function pt(t){return(e,i)=>"object"==typeof i?ut(t,e,i):((t,e,i)=>{const s=e.hasOwnProperty(i);return e.constructor.createProperty(i,t),s?Object.getOwnPropertyDescriptor(e,i):void 0})(t,e,i)}function mt(t){return pt({...t,state:!0,attribute:!1})}function gt(t,e){return(e,i,s)=>((t,e,i)=>(i.configurable=!0,i.enumerable=!0,Reflect.decorate&&"object"!=typeof e&&Object.defineProperty(t,e,i),i))(e,i,{get(){return(e=>e.renderRoot?.querySelector(t)??null)(this)}})}const ft=((t,...e)=>{const i=1===t.length?t[0]:e.reduce((e,i,s)=>e+(t=>{if(!0===t._$cssResult$)return t.cssText;if("number"==typeof t)return t;throw Error("Value passed to 'css' function must be a 'css' function result: "+t+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(i)+t[s+1],t[0]);return new o(i,t,s)})`
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

  .stamp,
  .badge {
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

  /* Opt-in heading for the readings block. Only rendered when the config
     carries a non-empty string, so the default look is unchanged. */
  .readout-title {
    font-size: var(--ha-font-size-s, 0.85rem);
    font-weight: var(--ha-font-weight-medium, 600);
    color: rgba(255, 255, 255, 0.95);
    margin-bottom: 2px;
    /* The readout block is right-aligned against the frame; a heading
       that hugged the same edge would drift away from the labels it
       introduces. */
    text-align: left;
  }

  .readout-row {
    display: flex;
    align-items: baseline;
    gap: 8px;
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

  .spark-wrap {
    margin: 2px 0 4px;
    color: rgba(255, 255, 255, 0.7);
  }

  .spark {
    display: block;
    width: 100%;
    height: 34px;
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
  .timeline {
    margin: 0 12px 8px;
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
     through, showing equally above and below it. */
  .mark {
    position: absolute;
    top: 50%;
    width: 1px;
    height: 14px;
    transform: translate(-50%, -50%);
    background: var(--wtl-divider);
  }

  .mark.day {
    height: 22px;
    background: var(--wtl-muted);
  }

  .mark.month {
    height: 30px;
    width: 2px;
    background: var(--wtl-muted);
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
      /* Below the timestamp and badge rather than flush with the top
         edge, so the three overlays do not stack on the same line. */
      top: 44px;
      left: 50%;
      transform: translateX(-50%);
      max-width: calc(100% - 16px);
    }

    /* The numbers are the point; the chart is the first thing that should
       go. A sparkline needs width this card no longer has, and dropping
       it also shortens the block so it covers less of the frame. */
    .spark-wrap {
      display: none;
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
`;var yt={no_frames:"No frames archived yet.",first_soon:"The first one appears at the next capture.",frame_failed:"This frame could not be loaded.",index_failed:"Could not load the timeline."},bt={live:"LIVE",gap:"NO IMAGE"},vt={play:"Play",pause:"Pause",previous:"Previous frame",next:"Next frame",speed:"Playback speed {v}x",now:"Jump to now"},wt={label:"Timeline position"},$t={no_camera:"You need to pick a camera in the card configuration."},xt="This card was updated to {v}. Reload to pick up the new version.",_t="Reload",kt={camera_entity:"Camera",title:"Title",show_dayticks:"Show day markers",show_graph:"Show graphs",playback:"Playback",autoplay:"Play automatically",speed:"Speed",graph_hours:"Graph window",overlay:"Overlay readings",overlay_hint:"Values shown over the image are read at the moment you scrub to, not the current ones.",add_entity:"Add entity",entity:"Entity",name:"Label",unit:"Unit",decimals:"Decimals",color:"Colour",graph:"Graph",move_up:"Move up",move_down:"Move down",remove:"Remove",helper:{camera_entity:"Only cameras created by this integration have an archive to scrub.",graph_hours:"How much history the sparkline shows around the playhead.",autoplay:"Ignored when your system asks for reduced motion.",deflicker:"Evens out cloud-driven brightness jumps during playback. 0 turns it off.",overlay_title:"Shown above the readings. Leave empty for no heading.",show_icon:"Uses the entity's own icon from Home Assistant."},deflicker:"Smooth brightness",show_icon:"Show icon",overlay_title:"Heading"},At={empty:yt,badge:bt,controls:vt,track:wt,error:$t,version_update:xt,version_reload:_t,editor:kt},St={no_frames:"Noch keine Bilder gespeichert.",first_soon:"Das erste erscheint bei der nächsten Aufnahme.",frame_failed:"Dieses Bild konnte nicht geladen werden.",index_failed:"Die Zeitleiste konnte nicht geladen werden."},Et={live:"LIVE",gap:"KEIN BILD"},Mt={play:"Abspielen",pause:"Pause",previous:"Vorheriges Bild",next:"Nächstes Bild",speed:"Wiedergabegeschwindigkeit {v}x",now:"Zur Gegenwart springen"},Ct={label:"Position auf der Zeitleiste"},Pt={no_camera:"Bitte wähle in der Kartenkonfiguration eine Kamera aus."},Tt="Diese Karte wurde auf {v} aktualisiert. Lade neu, um die neue Version zu verwenden.",zt="Neu laden",Rt={camera_entity:"Kamera",title:"Titel",show_dayticks:"Tagesmarkierungen anzeigen",show_graph:"Diagramme anzeigen",playback:"Wiedergabe",autoplay:"Automatisch abspielen",speed:"Geschwindigkeit",graph_hours:"Diagramm-Zeitraum",overlay:"Eingeblendete Messwerte",overlay_hint:"Die Werte über dem Bild gehören zu dem Zeitpunkt, zu dem du scrollst – nicht zur Gegenwart.",add_entity:"Entität hinzufügen",entity:"Entität",name:"Bezeichnung",unit:"Einheit",decimals:"Nachkommastellen",color:"Farbe",graph:"Diagramm",move_up:"Nach oben",move_down:"Nach unten",remove:"Entfernen",helper:{camera_entity:"Nur Kameras dieser Integration haben ein Archiv zum Durchblättern.",graph_hours:"Wie viel Verlauf die Sparkline rund um die Position zeigt.",autoplay:"Wird ignoriert, wenn dein System reduzierte Bewegung anfordert.",deflicker:"Gleicht wolkenbedingte Helligkeitssprünge bei der Wiedergabe aus. 0 schaltet es ab.",overlay_title:"Wird über den Messwerten angezeigt. Leer lassen für keine Überschrift.",show_icon:"Verwendet das Symbol der Entität aus Home Assistant."},deflicker:"Helligkeit glätten",show_icon:"Symbol anzeigen",overlay_title:"Überschrift"},Ot={empty:St,badge:Et,controls:Mt,track:Ct,error:Pt,version_update:Tt,version_reload:zt,editor:Rt};const Dt={en:Object.freeze({__proto__:null,badge:bt,controls:vt,default:At,editor:kt,empty:yt,error:$t,track:wt,version_reload:_t,version_update:xt}),de:Object.freeze({__proto__:null,badge:Et,controls:Mt,default:Ot,editor:Rt,empty:St,error:Pt,track:Ct,version_reload:zt,version_update:Tt})};function Nt(t,e){const i=t.split(".").reduce((t,e)=>{if(t&&"object"==typeof t&&e in t)return t[e]},e);return"string"==typeof i?i:void 0}function Ut(t,e=void 0,i="",s=""){const n=(e??"en").toLowerCase().split(/[-_]/)[0]??"en",o=Dt.en??{};let r=Nt(t,Dt[n]??Dt.en??{});return void 0===r&&(r=Nt(t,o)),void 0===r&&(r=t),""!==i&&""!==s&&(r=r.replace(i,s)),r}const Ht=[1,2,4,8,16,32,64],Lt=[{name:"overlay_title",selector:{text:{}}}],It=[{type:"grid",schema:[{name:"name",selector:{text:{}}},{name:"unit",selector:{text:{}}},{name:"decimals",selector:{number:{min:0,max:4,mode:"box"}}}]}];let Wt=class extends ht{constructor(){super(...arguments),this.computeLabel=t=>this.t(`editor.${t.name}`),this.computeHelper=t=>{const e=this.t(`editor.helper.${t.name}`);return e.startsWith("editor.")?void 0:e}}static{this.styles=ft}setConfig(t){this.config=t}get uiLanguage(){return this.hass?.locale?.language??this.hass?.language??"en"}t(t){return Ut(t,this.uiLanguage)}get schema(){return[{name:"camera_entity",required:!0,selector:{entity:{domain:"camera",integration:"webcam_timelapse"}}},{name:"title",selector:{text:{}}},{type:"grid",schema:[{name:"show_dayticks",selector:{boolean:{}}},{name:"show_graph",selector:{boolean:{}}}]},{type:"expandable",name:"playback",icon:"mdi:play-speed",flatten:!0,schema:[{name:"autoplay",selector:{boolean:{}}},{name:"speed",selector:{select:{mode:"dropdown",options:Ht.map(t=>({value:t,label:`${t}x`}))}}},{name:"deflicker",selector:{number:{min:0,max:100,step:5,mode:"slider"}}},{name:"graph_hours",selector:{number:{min:1,max:336,mode:"slider",unit_of_measurement:"h"}}}]}]}onFormChange(t){t.stopPropagation(),this.emit({...this.config,...t.detail.value})}emit(t){this.dispatchEvent(new CustomEvent("config-changed",{detail:{config:t},bubbles:!0,composed:!0}))}get rows(){return this.config?.entities??[]}updateRows(t){this.emit({...this.config,entities:t})}addRow(){this.updateRows([...this.rows,{entity:""}])}removeRow(t){this.updateRows(this.rows.filter((e,i)=>i!==t))}moveRow(t,e){const i=[...this.rows],s=t+e;s<0||s>=i.length||([i[t],i[s]]=[i[s],i[t]],this.updateRows(i))}patchRow(t,e){const i=this.rows.map((i,s)=>s===t?{...i,...e}:i);this.updateRows(i)}renderRow(t,e){const i=t.name||t.entity||this.t("editor.entity");return F`
      <div class="ent-row" role="group" aria-label=${i}>
        <ha-entity-picker
          .hass=${this.hass}
          .value=${t.entity}
          allow-custom-entity
          @value-changed=${t=>{t.stopPropagation(),this.patchRow(e,{entity:t.detail.value})}}
        ></ha-entity-picker>

        <ha-form
          .hass=${this.hass}
          .data=${t}
          .schema=${It}
          .computeLabel=${this.computeLabel}
          @value-changed=${t=>{t.stopPropagation(),this.patchRow(e,t.detail.value)}}
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
              .value=${t.color??"#3d7ea6"}
              @input=${t=>this.patchRow(e,{color:t.target.value})}
              @change=${t=>this.patchRow(e,{color:t.target.value})}
            />
          </label>

          <ha-formfield .label=${this.t("editor.show_icon")}>
            <ha-switch
              .checked=${t.show_icon??!1}
              @change=${t=>this.patchRow(e,{show_icon:t.target.checked})}
            ></ha-switch>
          </ha-formfield>

          <ha-formfield .label=${this.t("editor.graph")}>
            <ha-switch
              .checked=${t.graph??!1}
              @change=${t=>this.patchRow(e,{graph:t.target.checked})}
            ></ha-switch>
          </ha-formfield>
        </div>

        <div class="ent-actions">
          <ha-icon-button
            .label=${this.t("editor.move_up")}
            .disabled=${0===e}
            @click=${()=>this.moveRow(e,-1)}
          >
            <ha-icon icon="mdi:arrow-up"></ha-icon>
          </ha-icon-button>
          <ha-icon-button
            .label=${this.t("editor.move_down")}
            .disabled=${e===this.rows.length-1}
            @click=${()=>this.moveRow(e,1)}
          >
            <ha-icon icon="mdi:arrow-down"></ha-icon>
          </ha-icon-button>
          <ha-icon-button
            .label=${this.t("editor.remove")}
            @click=${()=>this.removeRow(e)}
          >
            <ha-icon icon="mdi:delete-outline"></ha-icon>
          </ha-icon-button>
        </div>
      </div>
    `}render(){return this.hass&&this.config?F`
      <ha-form
        .hass=${this.hass}
        .data=${this.config}
        .schema=${this.schema}
        .computeLabel=${this.computeLabel}
        .computeHelper=${this.computeHelper}
        @value-changed=${this.onFormChange}
      ></ha-form>

      <div class="ent-section">
        <h4>${this.t("editor.overlay")}</h4>
        <p class="ent-hint">${this.t("editor.overlay_hint")}</p>

        <div class="ent-title">
          <ha-form
            .hass=${this.hass}
            .data=${this.config}
            .schema=${Lt}
            .computeLabel=${this.computeLabel}
            .computeHelper=${this.computeHelper}
            @value-changed=${this.onFormChange}
          ></ha-form>
        </div>

        ${this.rows.map((t,e)=>this.renderRow(t,e))}
        <ha-button @click=${this.addRow}>
          <ha-icon icon="mdi:plus" slot="icon"></ha-icon>
          ${this.t("editor.add_entity")}
        </ha-button>
      </div>
    `:F`${G}`}};t([pt({attribute:!1})],Wt.prototype,"hass",void 0),t([mt()],Wt.prototype,"config",void 0),Wt=t([ct("webcam-timelapse-card-editor")],Wt);const jt="webcam-timelapse-card",Ft={radius:6,maxGain:1.5};function Bt(t,e=.15){if(0===t.length)return 0;const i=[...t].sort((t,e)=>t-e),s=Math.floor(i.length*e),n=i.length-2*s>=3?i.slice(s,i.length-s):i;return n.reduce((t,e)=>t+e,0)/n.length}const qt={base:"",ext:".webp",step:600,t0:null,count:0,gaps:[],retention_days:0,online:!0,newest_slot:null};function Gt(t,e){return null===t.t0||e<0||e>=t.count?null:t.t0+e*t.step}function Zt(t,e){const i=Gt(t,e);return null===i?null:`${t.base}${i}${t.ext}`}function Vt(t,e,i=1){for(let s=e;s>=0&&s<t.length;s+=i)if(t[s])return s;return null}function Kt(t){return null!==t.t0&&t.count>0}class Jt{constructor(t){this.size=t,this.cursor=0,this.slots=new Array(t).fill(null)}prefetch(t){const e=new Image;e.decoding="async",e.fetchPriority="low",e.src=t,this.slots[this.cursor]=e,this.cursor=(this.cursor+1)%this.size}clear(){this.slots.fill(null),this.cursor=0}}function Xt(t){return Math.min(Math.max(Math.round(4*t),4),16)}const Yt=1e3/33;function Qt(t,e,i){const s=Vt(t,e+Math.max(1,i));if(null!==s)return s;const n=Vt(t,t.length-1,-1);return null!==n&&n>e?n:null}const te=new Map;function ee(t,e){const i=`${t}|${JSON.stringify(e)}`;let s=te.get(i);return void 0===s&&(s=new Intl.DateTimeFormat(t,e),te.set(i,s)),s}function ie(t,e){return ee("en-CA",{timeZone:e,year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date(1e3*t))}function se(t,e){const i=ee("en-GB",{timeZone:e,hour:"2-digit",minute:"2-digit",second:"2-digit",hour12:!1}).formatToParts(new Date(1e3*t));let s=0,n=0,o=0;for(const t of i)"hour"===t.type?s=Number(t.value):"minute"===t.type?n=Number(t.value):"second"===t.type&&(o=Number(t.value));return 24===s&&(s=0),3600*s+60*n+o}function ne(t,e,i,s){const n={timeZone:e,day:"2-digit",month:"2-digit"};return"long"===s&&(n.weekday="long"),"short"===s&&(n.weekday="short"),ee(i,n).format(new Date(1e3*t))}function oe(t,e,i,s){if(null===t.t0||0===t.count)return[];const n=function(t){return t>=560?"long":t>=380?"short":"date"}(s),o="long"===n?110:"short"===n?78:58,r=[];let a=ie(t.t0,e);for(let i=1;i<t.count;i++){const s=Gt(t,i);if(null===s)continue;const n=ie(s,e);n!==a&&(r.push({position:i,slot:s,date:n}),a=n)}const h=function(t,e,i){const s=Math.max(1,Math.floor(e/i));return Math.max(1,Math.ceil(t/s))}(r.length,s,o),l=Math.max(1,t.count-1);return r.map((t,s)=>{const o=t.date.endsWith("-01"),r=o||s%h===0;return{position:t.position,left:t.position/l*100,label:r?ne(t.slot,e,i,n):"",isMonthStart:o}})}const re=[600,900,1800,3600,7200,10800,21600,43200];function ae(t,e,i,s){if(null===t.t0||0===t.count)return[];const n=t.t0,o=Math.max(1,t.count-1),r=n+o*t.step,a=function(t,e,i){if(t<=0)return null;const s=t/Math.max(2,Math.floor(i/9));for(const t of re)if(t>=s&&t>=e)return t;return null}(r-n,t.step,s);if(null===a)return[];const h=a/(r-n)*s,l=Math.max(1,Math.ceil(46/h)),c=Math.min(43200,a*l),d=[],u=se(n,e)%a;let p=0===u?n:n+(a-u),m=-1/0;for(let h=0;p<=r&&h<4096;h++){const r=se(p,e),h=r%a;if(0===h){const a=Math.round((p-n)/t.step),h=a/o*100,l=h/100*s;let u="";r%c===0&&l-m>=46&&(u=le(p,e,i),m=l),d.push({position:a,left:h,label:u})}p+=a-h}return d}function he(t,e,i){return ee(i,{timeZone:e,weekday:"short",day:"2-digit",month:"2-digit",hour:"2-digit",minute:"2-digit"}).format(new Date(1e3*t))}function le(t,e,i){return ee(i,{timeZone:e,hour:"2-digit",minute:"2-digit"}).format(new Date(1e3*t))}const ce=new Set(["unknown","unavailable","none",""]),de=new Map,ue=new Map;function pe(t){if("number"==typeof t.lu)return Math.round(1e3*t.lu);const e=t.lu??t.last_updated??t.last_changed;return e?new Date(e).getTime():0}function me(t,e){const i=t.a??t.attributes,s=i?.[e];if("string"!=typeof s&&"number"!=typeof s)return null;const n=new Date(s).getTime();return Number.isFinite(n)&&n>0?n:null}function ge(t,e,i){const s=36e5*i/2;return t.filter(t=>t.at>=e-s&&t.at<=e+s)}function fe(){try{window.caches?.keys?.().then(t=>{t.forEach(t=>window.caches?.delete?.(t))})}catch{}window.location.reload()}function ye(t,e){if(!t)return G;const i=e("version_update").replace("{v}",t),s=e("version_reload");return F`
    <div class="banner" role="alert" aria-live="assertive">
      <span>${i}</span>
      <button
        type="button"
        aria-label=${s}
        @click=${fe}
      >
        ${s}
      </button>
    </div>
  `}function be(){return"undefined"!=typeof window&&"function"==typeof window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches}const ve=[1,2,4,8,16,32,64];let we=class extends ht{constructor(){super(...arguments),this.index=qt,this.position=0,this.playing=!1,this.speed=1,this.trackWidth=600,this.versionMismatch=null,this.history=new Map,this.present=new Uint8Array(0),this.ring=new Jt(Xt(1)),this.prefetchedThrough=-1,this.useLayerA=!0,this.frameGeneration=0,this.swapChain=Promise.resolve(),this.gains=new Float32Array(0),this.versionChecked=!1,this.autoplayPending=!0,this.playCounter=0,this.lastScrubAt=0,this.visible=!0,this.onScreen=!0,this.onVisibilityChange=()=>{this.visible="visible"===document.visibilityState,this.reconcilePlayback(),this.visible&&this.refreshIndex()}}static{this.styles=ft}setConfig(t){if(!t?.camera_entity)throw new Error(Ut("error.no_camera",this.hass?.locale?.language));this.config={autoplay:!1,speed:32,show_dayticks:!0,show_graph:!0,graph_hours:24,deflicker:50,...t,entities:(t.entities??[]).filter(t=>t?.entity)},this.speed=ve.includes(this.config.speed)?this.config.speed:32,this.ring=new Jt(Xt(this.speed))}static getConfigElement(){return document.createElement("webcam-timelapse-card-editor")}static getStubConfig(t){return{camera_entity:Object.keys(t.states).find(e=>e.startsWith("camera.")&&"webcam_timelapse"===t.entities?.[e]?.platform)??""}}getCardSize(){return 8}getGridOptions(){return{columns:"full",rows:"auto",min_columns:6,min_rows:6}}connectedCallback(){super.connectedCallback(),document.addEventListener("visibilitychange",this.onVisibilityChange),this.intersectionObserver=new IntersectionObserver(t=>{this.onScreen=t.some(t=>t.isIntersecting),this.reconcilePlayback()}),this.intersectionObserver.observe(this),this.resizeObserver=new ResizeObserver(t=>{const e=t[0]?.contentRect.width;e&&(this.trackWidth=e-24)}),this.resizeObserver.observe(this)}disconnectedCallback(){super.disconnectedCallback(),document.removeEventListener("visibilitychange",this.onVisibilityChange),this.intersectionObserver?.disconnect(),this.resizeObserver?.disconnect(),this.stopPlayback(),this.indexTimer&&window.clearTimeout(this.indexTimer),this.scrubRaf&&cancelAnimationFrame(this.scrubRaf),this.ring.clear()}willUpdate(t){t.has("hass")&&this.hass&&this.index===qt&&(this.refreshIndex(),this.refreshHistory()),t.has("hass")&&this.hass&&!this.versionChecked&&(this.versionChecked=!0,async function(t,e,i){if(!t?.callWS)return null;try{const s=await t.callWS({type:e});if(s?.version&&s.version!==i)return s.version}catch{}return null}(this.hass,"webcam_timelapse/card_version","0.3.5").then(t=>{this.versionMismatch=t}))}reconcilePlayback(){this.playing&&this.visible&&this.onScreen?this.startPlayback():this.stopPlayback()}async refreshIndex(){if(this.hass?.callWS&&this.config){try{const t=await this.hass.callWS({type:"webcam_timelapse/index",entity_id:this.config.camera_entity}),e=this.position>=this.index.count-1;this.index=t,this.present=function(t){const e=new Uint8Array(t.count).fill(1);for(const[i,s]of t.gaps){const n=Math.max(0,i),o=Math.min(t.count,i+s);for(let t=n;t<o;t++)e[t]=0}return e}(t),(e||this.position>=t.count)&&(this.position=Math.max(0,t.count-1)),await this.updateComplete,this.startAutoplayIfRequested()||this.swapInFrame(),this.refreshLuma(),this.indexError=void 0}catch(t){this.indexError=t instanceof Error?t.message:"Could not load the timeline."}this.scheduleIndexRefresh()}}async refreshLuma(){const t=function(t){const e=Math.min(Math.max(t,0),100);return 0===e?0:Math.max(1,Math.round(e/100*12))}(this.config?.deflicker??0);if(this.hass?.callWS&&0!==t&&this.config){try{const e=await this.hass.callWS({type:"webcam_timelapse/luma",entity_id:this.config.camera_entity});this.gains=function(t,e=Ft){const i=new Float32Array(t.length).fill(1),{radius:s,maxGain:n}=e;if(s<1||0===t.length)return i;const o=1/n;for(let e=0;e<t.length;e++){const r=t[e];if(null==r||r<8)continue;const a=Math.max(0,e-s),h=Math.min(t.length-1,e+s),l=[];for(let e=a;e<=h;e++){const i=t[e];null!=i&&i>=8&&l.push(i)}if(l.length<3)continue;const c=Bt(l);i[e]=Math.min(Math.max(c/r,o),n)}return i}(e.luma,{...Ft,radius:t})}catch{this.gains=new Float32Array(0)}this.requestUpdate()}else this.gains=new Float32Array(0)}async refreshHistory(){const t=this.config?.entities??[];if(!this.hass||0===t.length)return;const e={};for(const i of t)i.time_attribute&&(e[i.entity]=i.time_attribute);this.history=await async function(t,e,i){const s=t?.callWS?.bind(t);if(!s||0===e.length)return new Map;const n=i.timeAttributes??{},o=`${e.slice().sort().join(",")}|${i.days}`,r=ue.get(o);if(r)return r;const a=new Date,h=new Date(a.getTime()-864e5*i.days),l=Object.keys(n).length>0,c=(async()=>{try{const t=await s({type:"history/history_during_period",start_time:h.toISOString(),end_time:a.toISOString(),entity_ids:e,minimal_response:!0,no_attributes:!l,significant_changes_only:!0}),i=new Map;for(const s of e){const e=n[s],o=(t?.[s]??[]).map(t=>{const i=String(t.s??t.state??"").trim(),s=ce.has(i.toLowerCase())?Number.NaN:parseFloat(i);return{at:(e?me(t,e):null)??pe(t),value:s}}).filter(t=>Number.isFinite(t.value)&&t.at>0).sort((t,e)=>t.at-e.at);i.set(s,o),de.set(s,o)}return i}catch{return new Map(e.map(t=>[t,de.get(t)??[]]))}finally{ue.delete(o)}})();return ue.set(o,c),c}(this.hass,t.map(t=>t.entity),{days:(this.index.retention_days||14)+1,timeAttributes:e})}scheduleIndexRefresh(){this.indexTimer&&window.clearTimeout(this.indexTimer);const t=1e3*this.index.step+15e3*Math.random();this.indexTimer=window.setTimeout(()=>{this.refreshIndex()},t)}get cadence(){return function(t){const e=2*Math.max(t,0);if(e<=0)return{stride:1,frameDelay:500};const i=Math.max(1,Math.round(e/Yt));return{stride:i,frameDelay:Math.max(1e3*i/e,33)}}(this.speed)}get frameDelay(){return this.cadence.frameDelay}get fadeDuration(){return t=this.speed,e=this.frameDelay,(i={playing:this.playing,reducedMotion:be()}).reducedMotion?0:i.playing?t>4?0:Math.min(120,Math.round(e/2)):120;var t,e,i}async runPlayback(t){let e=!1;for(;this.playToken===t&&this.playing;){if(e){const t=Qt(this.present,this.position,this.cadence.stride);if(null===t){this.playing=!1;break}this.position=t}e=!0;const i=performance.now();if(await this.swapInFrame(),this.prefetchAhead(),this.playToken!==t)return;const s=this.frameDelay-(performance.now()-i);s>0&&await new Promise(t=>window.setTimeout(t,s))}}startPlayback(){if(void 0!==this.playToken)return;const t=++this.playCounter;this.playToken=t,this.runPlayback(t).finally(()=>{this.playToken===t&&(this.playToken=void 0)})}stopPlayback(){this.playToken=void 0}startAutoplayIfRequested(){return!(!this.autoplayPending||!Kt(this.index))&&(this.autoplayPending=!1,!(!(t={configured:!0===this.config?.autoplay,reducedMotion:be(),alreadyPlaying:this.playing}).configured||t.reducedMotion||t.alreadyPlaying)&&(this.togglePlay(),!0));var t}togglePlay(){if(!this.playing&&this.atLive){const t=Vt(this.present,0);null!==t&&(this.position=t)}this.playing=!this.playing,this.reconcilePlayback()}cycleSpeed(){const t=ve[(ve.indexOf(this.speed)+1)%ve.length];this.speed=t??1,this.ring=new Jt(Xt(this.speed)),this.prefetchedThrough=-1}goTo(t){this.position=Math.min(Math.max(t,0),Math.max(0,this.index.count-1)),this.swapInFrame(),this.prefetchAhead()}swapInFrame(){return this.swapChain=this.swapChain.then(()=>this.performSwap()),this.swapChain}async performSwap(){const t=this.frameSources();if(0===t.length)return;const e=++this.frameGeneration,i=this.useLayerA?this.layerB:this.layerA;if(i){for(const s of t){i.src=s;try{await i.decode()}catch{if(!i.complete||0===i.naturalWidth)continue}if(e!==this.frameGeneration)return;return this.revealFrame(i,this.useLayerA?this.layerA:this.layerB),this.useLayerA=!this.useLayerA,this.frameError=void 0,void this.requestUpdate()}e===this.frameGeneration&&(this.frameError=t[0],this.requestUpdate())}}revealFrame(t,e){const i=this.fadeDuration;if(e&&(e.style.transition="none",e.style.opacity="1",e.style.zIndex="1"),t.style.zIndex="2",0===i)return t.style.transition="none",void(t.style.opacity="1");t.style.transition="none",t.style.opacity="0",t.offsetWidth,t.style.transition=`opacity ${i}ms linear`,t.style.opacity="1"}frameSources(){const t=[],e=function(t){if(!t)return;const e=t.trim();return e.startsWith("/")||e.startsWith("https://")?e:void 0}(this.hass?.states[this.config.camera_entity]?.attributes.entity_picture);this.atLive&&e&&t.push(e);const i=Zt(this.index,this.position);return i&&t.push(i),t}prefetchAhead(){const t=function(t,e,i,s,n){const o=Math.max(1,s);let r=n>e+i*o?e:Math.max(n,e);const a=[];for(let s=1;s<=i;s++){const i=e+s*o;if(i<=r)continue;const n=Vt(t,i);if(null===n)break;n>r&&(a.push(n),r=n)}return a}(this.present,this.position,Xt(this.speed),this.cadence.stride,this.prefetchedThrough);for(const e of t){const t=Zt(this.index,e);t&&this.ring.prefetch(t),this.prefetchedThrough=e}}onScrub(t){const e=Number(t.target.value);this.position=e;const i=performance.now();this.pendingPosition=e,i-this.lastScrubAt<80||(this.lastScrubAt=i,this.scrubRaf&&cancelAnimationFrame(this.scrubRaf),this.scrubRaf=requestAnimationFrame(()=>{this.scrubRaf=void 0,void 0!==this.pendingPosition&&this.goTo(this.pendingPosition)}))}onScrubCommit(t){this.goTo(Number(t.target.value))}jumpToNow(){this.playing=!1,this.stopPlayback(),this.goTo(this.index.count-1)}stepBy(t){const e=Vt(this.present,this.position+t,t);null!==e&&this.goTo(e)}get timeZone(){return this.hass?.config?.time_zone??Intl.DateTimeFormat().resolvedOptions().timeZone}get language(){return this.hass?.locale?.language??this.hass?.language??"en"}t(t,e){return void 0===e?Ut(t,this.language):Ut(t,this.language,"{v}",e)}get atLive(){return this.position>=this.index.count-1}get onGap(){return this.present.length>0&&!this.present[this.position]}render(){if(!this.config||!this.hass)return F`<ha-card></ha-card>`;const t=null===this.index.t0?null:this.index.t0+this.position*this.index.step;return F`
      <ha-card .header=${this.config.title??G}>
        ${ye(this.versionMismatch,t=>this.t(t))}
        ${this.renderStage(t)}
        ${Kt(this.index)?this.renderTimeline(t):G}
      </ha-card>
    `}renderStage(t){if(!Kt(this.index))return F`
        <div class="stage">
          <div class="empty">
            ${this.indexError?F`
                  <div>${this.t("empty.index_failed")}</div>
                  <div class="detail">${this.indexError}</div>
                `:F`
                  <div>${this.t("empty.no_frames")}</div>
                  <div>${this.t("empty.first_soon")}</div>
                `}
          </div>
        </div>
      `;const e=this.gains[this.position]??1,i=[];1!==e&&i.push(`brightness(${e.toFixed(3)})`),this.onGap&&i.push("grayscale(0.5)","brightness(0.5)");const s=i.length>0?i.join(" "):"none";return F`
      <div class="stage" style="--wtl-frame-filter:${s}">
        <div class="layers">
          <img class="layer a" alt="" decoding="async" fetchpriority="high" />
          <img class="layer b" alt="" decoding="async" fetchpriority="high" />
        </div>
        ${this.frameError?F`<div class="empty">
              <div>${this.t("empty.frame_failed")}</div>
              <div class="detail">${this.frameError}</div>
            </div>`:G}
        ${null!==t?F`<div class="stamp">
              <time datetime=${new Date(1e3*t).toISOString()}>
                ${he(t,this.timeZone,this.language)}
              </time>
            </div>`:G}
        ${null!==t?this.renderReadout(t):G}
        ${this.onGap?F`<div class="badge gap">${this.t("badge.gap")}</div>`:this.atLive?F`<div class="badge live">${this.t("badge.live")}</div>`:G}
        ${this.renderControls()}
      </div>
    `}renderReadout(t){const e=this.config?.entities??[];if(0===e.length)return G;const i=1e3*t,s=e.map(t=>{const e=this.history.get(t.entity)??[],s=function(t,e,i){if(0===t.length)return null;let s=0,n=t.length-1,o=-1;for(;s<=n;){const i=s+n>>1;t[i].at<=e?(o=i,s=i+1):n=i-1}if(-1===o)return null;const r=t[o];return{value:r.value,at:r.at,stale:e-r.at>i}}(e,i,function(t,e=54e5){if(t.length<3)return e;const i=[];for(let e=1;e<t.length;e++)i.push(t[e].at-t[e-1].at);i.sort((t,e)=>t-e);const s=i[i.length>>1]??e;return Math.max(2*s,e)}(e)),n=t.name??this.hass?.states[t.entity]?.attributes.friendly_name??t.entity,o=t.unit??this.hass?.states[t.entity]?.attributes.unit_of_measurement??"",r=t.color??"var(--wtl-accent)",a=null===s?"—":`${s.value.toFixed(t.decimals??1)}${o?` ${o}`:""}`,h=t.graph&&!1!==this.config?.show_graph&&null!==s?function(t){const{points:e,at:i,hours:s,color:n,label:o}=t;if(e.length<2)return null;const r=36e5*s/2,a=i-r,h=i+r,l=h-a||1;let c=1/0,d=-1/0;for(const t of e)t.value<c&&(c=t.value),t.value>d&&(d=t.value);const u=d-c||1,p=t=>3+(t-a)/l*234,m=t=>41-(t-c)/u*38,g=[];e.forEach((t,e)=>{const i=p(t.at),s=m(t.value);0===e?g.push(`M ${i.toFixed(1)} ${s.toFixed(1)}`):g.push(`H ${i.toFixed(1)}`,`V ${s.toFixed(1)}`)});const f=e[e.length-1];g.push(`H ${p(h).toFixed(1)}`);const y=p(i),b=e.filter(t=>t.at<=i).pop()??f;return B`
    <svg
      class="spark"
      viewBox="0 0 ${240} ${44}"
      preserveAspectRatio="none"
      role="img"
      aria-label=${o}
    >
      <path
        d=${g.join(" ")}
        fill="none"
        stroke=${n}
        stroke-width="1.5"
        stroke-linejoin="round"
        vector-effect="non-scaling-stroke"
      />
      <line
        x1=${y.toFixed(1)}
        y1="0"
        x2=${y.toFixed(1)}
        y2=${44}
        stroke="currentColor"
        stroke-width="1"
        opacity="0.5"
        vector-effect="non-scaling-stroke"
      />
      <circle
        cx=${y.toFixed(1)}
        cy=${m(b.value).toFixed(1)}
        r="2.5"
        fill=${n}
      />
    </svg>
  `}({points:ge(e,i,this.config?.graph_hours??24),at:i,hours:this.config?.graph_hours??24,color:r,label:`${n} history`}):null,l=this.hass?.states[t.entity],c=t.show_icon&&l?F`<ha-state-icon
              class="readout-icon"
              style="color:${r}"
              .hass=${this.hass}
              .stateObj=${l}
            ></ha-state-icon>`:G;return F`
        <div class="readout-row ${s?.stale?"stale":""}">
          ${c}
          <span class="readout-name" style="color:${r}">${n}</span>
          <span class="readout-value">${a}</span>
          ${null!==s?F`<span class="readout-at"
                >${le(Math.round(s.at/1e3),this.timeZone,this.language)}</span
              >`:G}
        </div>
        ${h?F`<div class="spark-wrap">${h}</div>`:G}
      `}),n=this.config?.overlay_title?.trim();return F`<div class="readout">
      ${n?F`<div class="readout-title">${n}</div>`:G}
      ${s}
    </div>`}renderControls(){return F`
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
        <ha-icon-button .label=${this.t("controls.now")} @click=${this.jumpToNow}>
          <ha-icon icon="mdi:update"></ha-icon>
        </ha-icon-button>
      </div>
    `}renderTimeline(t){const e=Math.max(1,this.index.count-1),i=this.position/e*100,s=!1!==this.config?.show_dayticks,{days:n,times:o}=s?this.rulerFor():{days:[],times:[]};return F`
      <div class="timeline">
        ${s?F`<div class="band dates" aria-hidden="true">
              ${n.map(t=>t.label?F`<span class="lab date" style="left:${t.left}%"
                      >${t.label}</span
                    >`:G)}
            </div>`:G}

        <div class="track">
          ${s?F`<div class="marks" aria-hidden="true">
                ${o.map(t=>F`<span class="mark" style="left:${t.left}%"></span>`)}
                ${n.map(t=>F`<span
                      class="mark ${t.isMonthStart?"month":"day"}"
                      style="left:${t.left}%"
                    ></span>`)}
              </div>`:G}
          <div class="rail"></div>
        <div class="fill" style="width:${i}%"></div>
        ${this.index.gaps.map(([t,i])=>F`<div
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
          aria-valuetext=${null!==t?he(t,this.timeZone,this.language):""}
          @input=${this.onScrub}
          @change=${this.onScrubCommit}
          />
        </div>

        ${s?F`<div class="band times" aria-hidden="true">
              ${o.map(t=>t.label?F`<span class="lab time" style="left:${t.left}%"
                      >${t.label}</span
                    >`:G)}
            </div>`:G}
      </div>
    `}rulerFor(){const t=[this.index.t0,this.index.count,this.index.step,Math.round(this.trackWidth),this.timeZone,this.language].join("|");return this.rulerCache?.key!==t&&(this.rulerCache={key:t,days:oe(this.index,this.timeZone,this.language,this.trackWidth),times:ae(this.index,this.timeZone,this.language,this.trackWidth)}),this.rulerCache}};t([pt({attribute:!1})],we.prototype,"hass",void 0),t([mt()],we.prototype,"config",void 0),t([mt()],we.prototype,"index",void 0),t([mt()],we.prototype,"position",void 0),t([mt()],we.prototype,"playing",void 0),t([mt()],we.prototype,"speed",void 0),t([mt()],we.prototype,"trackWidth",void 0),t([mt()],we.prototype,"versionMismatch",void 0),t([mt()],we.prototype,"indexError",void 0),t([mt()],we.prototype,"frameError",void 0),t([mt()],we.prototype,"history",void 0),t([gt("img.layer.a")],we.prototype,"layerA",void 0),t([gt("img.layer.b")],we.prototype,"layerB",void 0),we=t([ct(jt)],we);const $e=window;$e.customCards=$e.customCards??[],$e.customCards.push({type:jt,name:"Webcam Timelapse",description:"Scrub and play back an archived still-image webcam.",preview:!0,documentationURL:"https://github.com/rolandzeiner/webcam-timelapse",getEntitySuggestion:(t,e)=>e.startsWith("camera.")?"webcam_timelapse"!==t.entities?.[e]?.platform?null:{config:{type:`custom:${jt}`,camera_entity:e}}:null});export{we as WebcamTimelapseCard};
