/*!
 App Connect Bootstrap 5 Collapse
 Version: 2.0.0
 (c) 2024 Wappler.io
 @build 2024-04-15 17:48:46
 */
dmx.Component("bs5-collapse",{initialData:{collapsed:!0},attributes:{show:{type:Boolean,default:!1}},methods:{toggle(){this._instance.toggle()},show(){this._instance.show()},hide(){this._instance.hide()}},events:{show:Event,shown:Event,hide:Event,hidden:Event},init(s){s.classList.add("collapse"),s.addEventListener("show.bs.collapse",this.dispatchEvent.bind(this,"show")),s.addEventListener("shown.bs.collapse",this.dispatchEvent.bind(this,"shown")),s.addEventListener("hide.bs.collapse",this.dispatchEvent.bind(this,"hide")),s.addEventListener("hidden.bs.collapse",this.dispatchEvent.bind(this,"hidden")),s.addEventListener("shown.bs.collapse",this._shownHandler.bind(this)),s.addEventListener("hidden.bs.collapse",this._hiddenHandler.bind(this));const t={toggle:!1};s.hasAttribute("data-bs-parent")&&(t.parent=s.getAttribute("data-bs-paernt")),this._instance=new bootstrap.Collapse(s,t),this._instance[this.props.show?"show":"hide"]()},destroy(){this._instance.dispose()},performUpdate(s){s.has("show")&&(this._instance[this.props.show?"show":"hide"](),this.set("collapsed",!this.props.show))},_shownHandler(){this.set("collapsed",!1)},_hiddenHandler(){this.set("collapsed",!0)}});
//# sourceMappingURL=dmxBootstrap5Collapse.js.map
