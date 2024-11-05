/*!
 App Connect Video
 Version: 2.0.1
 (c) 2024 Wappler.io
 @build 2024-05-17 12:49:48
 */
dmx.Component("video",{initialData:{position:0,duration:0,ended:!1,muted:!1,paused:!1,playbackRate:1,volume:1,inView:!1},attributes:{src:{type:String,default:""},autopause:{type:Boolean,default:!1},playinview:{type:Boolean,default:!1}},methods:{position(t){this.$node.currentTime=t},playbackRate(t){this.$node.playbackRate=t},volume(t){this.$node.volume=t},load(t){this.$node.src=t,this.$node.load()},play(){this.$node.play()},pause(){this.$node.pause()}},init(t){this._updateState=dmx.throttle(this._updateState.bind(this)),t.ondurationchange=this._updateState,t.onended=this._updateState,t.onpause=this._updateState,t.onplay=this._updateState,t.onplaying=this._updateState,t.onratechange=this._updateState,t.onseeked=this._updateState,t.ontimeupdate=this._updateState,t.onvolumechange=this._updateState,this._observer=new IntersectionObserver((e=>{e.forEach((e=>{const s=e.isIntersecting;!s&&this.data.inView&&this.props.autopause&&t.pause(),s&&!this.data.inView&&this.props.playinview&&t.play(),this.set("inView",s)}))})),this._observer.observe(t),t.hasAttribute("dmx-bind:src")&&(t.src=this.props.src)},performUpdate(t){t.has("src")&&(this.$node.src=this.props.src,this.$node.load())},destroy(){this._observer.disconnect(),this._observer=null},_updateState:function(){this.set("position",this.$node.currentTime),this.set("duration",NaN==this.$node.duration?0:this.$node.duration),this.set("ended",this.$node.ended),this.set("muted",this.$node.muted),this.set("paused",this.$node.paused),this.set("playbackRate",this.$node.playbackRate),this.set("volume",this.$node.volume)}});
//# sourceMappingURL=dmxVideo.js.map
