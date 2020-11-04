let HTMLImageElement_ = Image;
type HTMLTouchEvent_ = TouchEvent;

namespace XOF {
    let START_TIME = 0;
    let hashCode_ = 0;
    let loop: Function;
    let frameRate = 30;

    export let stage: Stage;
    export let player: Player;
    export let loader: Loader;
    let graphic: Graphic;
    let touchMgr: TouchManager;

    let requestAnimationFrame: Function;
    let timeAnimationFrame: Function;

    export function hashCode() {
        return ++hashCode_;
    }

    let _document: HTMLDocument;
    let _canvas: HTMLCanvasElement;

    function isFullSceen(): boolean {
        return window.screen.height == window.innerHeight;
        // return (/* document.fullscreenEnabled  */ window["fullScreen"] || document["webkitIsFullScreen"] || document["msFullscreenEnabled"]);    //无效逻辑
    }

    let onTouch = (e) => touchMgr.onTouch(e);

    function setTouchEventListener(mobile: boolean) {
        _canvas.removeEventListener("touchstart", onTouch);
        _canvas.removeEventListener("touchmove", onTouch);
        _canvas.removeEventListener("touchend", onTouch);
        _canvas.removeEventListener("touchcancel", onTouch);
        _canvas.removeEventListener("mousedown", onTouch);
        _canvas.removeEventListener("mousemove", onTouch);
        _canvas.removeEventListener("mouseup", onTouch);
        _canvas.removeEventListener("mouseout", onTouch);
        if (mobile) {
            _canvas.addEventListener("touchstart", onTouch, false);
            _canvas.addEventListener("touchmove", onTouch, false);
            _canvas.addEventListener("touchend", onTouch, false);
            _canvas.addEventListener("touchcancel", onTouch, false);
        } else {
            _canvas.addEventListener("mousedown", onTouch, false);
            _canvas.addEventListener("mousemove", onTouch, false);
            _canvas.addEventListener("mouseup", onTouch, false);
            _canvas.addEventListener("mouseout", onTouch, false)
        }
    }

    export function init(document: HTMLDocument, canvas: HTMLCanvasElement, width: number = 800, height: number = 600) {
        if (player) return warn("已经初始化");
        _document = document;
        _canvas = canvas;
        if (canvas) {
            loop = requestAnimationFrame = window["requestAnimationFrame"] || window["webkitRequestAnimationFrame"] || window["mozRequestAnimationFrame"] || window["oRequestAnimationFrame"] || window["msRequestAnimationFrame"];
            timeAnimationFrame = function (callback) { return window.setTimeout(callback, 1000 / frameRate); };
            if (!loop) loop = timeAnimationFrame;

            player = new Player(canvas.getContext("2d"));
            stage = new Stage().size(width, height);
            loader = new Loader();
            touchMgr = new TouchManager();

            stage.$hasAddToStage = true;

            document.onkeydown = (e) => player.keyboard(e ? e.keyCode : undefined, 1);
            document.onkeyup = (e) => player.keyboard(e ? e.keyCode : undefined, 0);

            let onScroll = (delta) => stage.event(TouchEvent.MOUSE_SCROLL, [delta]);

            //统一处理滚轮滚动事件
            function wheel(event) {
                var delta = 0;
                if (!event) event = window.event;
                if (event.wheelDelta) {//IE、chrome浏览器使用的是wheelDelta，并且值为“正负120”
                    delta = event.wheelDelta / 120;
                    if (window["opera"]) delta = -delta;//因为IE、chrome等向下滚动是负值，FF是正值，为了处理一致性，在此取反处理
                } else if (event.detail) {//FF浏览器使用的是detail,其值为“正负3”
                    delta = -event.detail / 3;
                }
                if (delta) onScroll(delta);
            }

            //FF,火狐浏览器会识别该方法
            canvas?.addEventListener("DOMMouseScroll", wheel, false);
            canvas["onmousewheel"] = wheel;//W3C

            player.setTouchEventListener(1);

            //
            let onFullSceen = (e?) => XOF.stage.event(isFullSceen() ? Event.FULL_SCEEN : Event.FULL_SCEEN_QUIT);
            document.addEventListener("fullscreenchange", onFullSceen, false);
            document.addEventListener("webkitfullscreenchange", onFullSceen, false);
            document.addEventListener("mozfullscreenchange", onFullSceen, false);
            window.addEventListener("resize", onFullSceen, false);

            window.onfocus = () => player.onfocus();
            window.onblur = () => player.onblur();

            onFullSceen();
            START_TIME = Date.now();
            player.loop();
        } else {
            warn("没有canvase");
        }

    }

    export class Event {
        public static KEY_DOWN = "KEY_DOWN";
        public static KEY_UP = "KEY_UP";
        public static MOVE = "MOVE";
        public static COMPLETE = "COMPLETE";
        public static RESIZE = "RESIZE";
        public static ADDED_TO_STAGE = "ADDED_TO_STAGE";
        public static REMOVED_FROM_STAGE = "REMOVED_FROM_STAGE";
        public static FULL_SCEEN = "FULL_SCEEN";
        public static FULL_SCEEN_QUIT = "FULL_SCEEN_QUIT";
    }

    export class TouchEvent {
        public static TOUCH_MOVE = "mousemove";
        public static TOUCH_END = "mouseup";
        public static TOUCH_BEGIN = "mousedown";
        public static MOUSE_RELEASE_OUTSIDE = "MOUSE_RELEASE_OUTSIDE";
        public static TAP = "TAP";
        public static TOUCH_CANCEL = "TOUCH_CANCEL";
        public static TOUCH_ENTER = "TOUCH_ENTER";
        public static TOUCH_OUT = "TOUCH_OUT";

        public static MOUSE_SCROLL = "DOMMouseScroll";

        public static RMOUSE_BEGIN = "RMOUSE_BEGIN";
        public static RMOUSE_END = "RMOUSE_END";
        public static RMOUSE_TAP = "RMOUSE_TAP";
    }

    class Handler {
        public thisObj: any;
        public func: Function;
        public once: boolean;
        public valid: boolean;
        public params: any[];

        constructor(Func: Function, thisObj?: any, params?: any[]) {
            this.thisObj = thisObj;
            this.func = Func;
            this.params = params;
        }

        public runWith(params?: any[]) {
            if (params || this.params) {
                if (params && this.params) {
                    this.func.call(this.thisObj, ...this.params, ...params);
                } else if (params) {
                    this.func.call(this.thisObj, ...params);
                } else {
                    this.func.call(this.thisObj, ...this.params);
                }
            } else
                this.func.call(this.thisObj);
        }

        public clear() {
            delete this.thisObj;
            delete this.func;
            delete this.once;
            delete this.valid;
            delete this.params;
        }
    }

    function hitTest_(node: Box, x: number, y: number) {
        if (node.width > 0 && node.height > 0 || node.touchThrough) {
            if (node.touchThrough) {
                return false;
            } else {
                let tx = (x + node.pivotX * node.scaleX) * (1 / node.scaleX);
                let ty = (y + node.pivotY * node.scaleX) * (1 / node.scaleY);
                return node.hitTest_(tx, ty);
            }
        }
        return false;
    }

    export class TouchEventDispatcher {
        private stoped: boolean;
        public mouseX: number;
        public mouseY: number;
        public type: string;
        public target: any;
        public currentTarget: any;
        public touchId: any;

        public stopPropagation() {
            this.stoped = true;
        }

        public set(type: string, currentTarget, target) {
            this.type = type;
            this.currentTarget = currentTarget;
            this.target = target;
            return this;
        }


    }

    class TouchManager {
        public disableMouseEvent: boolean;
        public enableMouseRight: boolean;
        private events_: { type: string, x: number, y: number, key: number }[];
        private event: TouchEventDispatcher;

        private $press: { [id: number]: GameObject };  //默认或者鼠标左键按下列表
        private $hovers: { [id: number]: GameObject };
        private x: number;
        private y: number;
        constructor() {
            this.$press = {};
            this.$hovers = {};
            this.events_ = [];
            this.x = this.y = 0;
            this.disableMouseEvent = false;
            this.enableMouseRight = false;
            this.event = new TouchEventDispatcher();
        }

        public isTouchEvent(event: string) {
            for (let k in TouchEvent)
                if (TouchEvent[k] == event)
                    return true;
            return false;
        }

        public onTouch(e: MouseEvent) {
            if (e) {
                let key;
                let x = 0;
                let y = 0;
                let type = e.type;
                switch (e.type) {
                    case "touchstart":
                    case "touchmove":
                    case "touchend":
                    case "touchcancel": {
                        let list = ((e as any) as HTMLTouchEvent_).changedTouches;
                        for (let i = 0; i < list.length; i++) {
                            let c = list[i];
                            key = c.identifier;
                            x = c.pageX;
                            y = c.pageY;
                            this.addTouchEvent_(type, key, x, y);
                        }
                        e.stopPropagation();
                        e.preventDefault();
                    } break;
                    default: {
                        key = e.button;
                        x = e.offsetX;
                        y = e.offsetY;
                        this.addTouchEvent_(type, key, x, y);
                    }
                }
            }
        }

        public hitTest() {
            this.addTouchEvent_("touchtest", 0, this.x, this.y);
        }

        public check(node: any, x: number, y: number, key: number, callback?: Function) {
            let nx = x - node.x, ny = y - node.y;
            if (node.rotate % 360 != 0) {
                // nx, ny = Utils.rotatePointByZero(nx, ny, -node.rotation)
                // 旋转
            }
            if (!this.disableMouseEvent) {
                node.mouseX = nx;
                node.mouseY = ny;
                if (!node.touchThrough && !hitTest_(node, nx, ny)) {
                    return false;
                }
                let len = node.numChild;
                for (let i = len - 1; i >= 0; i--) {
                    let child = node.getChildAt(i) as Sprite;
                    if (child.visible && child.touchEnabled) {
                        if (this.check(child, (nx + node.pivotX * node.scaleX) * (1 / node.scaleX), (ny + node.pivotY * node.scaleY) * (1 / node.scaleY), key, callback)) {
                            return true;
                        }
                    }
                }

            }

            let hit = false;
            if (!node.touchThrough && !this.disableMouseEvent) {
                hit = true;
            } else {
                hit = hitTest_(node, nx, ny);
            }

            if (hit) {
                callback.call(this, node, key);
            }

            return hit;
        }

        private addTouchEvent_(type, key, x, y) {
            this.events_.push({ type, x, y, key });
            if (type != "touchtest") {
                this.x = x;
                this.y = y;
            }
        }

        private onTouchMove(node: Sprite, key) {
            if (node) {
                let list = this.getNodes(node);
                let old = this.$hovers[key] as Sprite;
                if (!old) {
                    this.sendEvents_(list, TouchEvent.TOUCH_ENTER, key);
                    this.$hovers[key] = node;
                } else if (old != node) {
                    if (old.contains(node)) {
                        let arr = this.getNodes(node, old);
                        this.sendEvents_(arr, TouchEvent.TOUCH_ENTER, key);
                    } else if (node.contains(old)) {
                        let arr = this.getNodes(old, node);
                        this.sendEvents_(arr, TouchEvent.TOUCH_OUT, key);
                    } else {
                        let tar, arr = [];
                        let oldArr = this.getNodes(old);
                        let newArr = this.getNodes(node);
                        let len = oldArr.length;
                        for (let i = 0; i < len; i++) {
                            tar = oldArr[i];
                            let index = newArr.indexOf(tar);
                            if (index >= 0) {
                                newArr.splice(index, 1);
                                break;
                            } else {
                                arr.push(tar);
                            }
                        }
                        if (arr.length) {
                            this.sendEvents_(arr, TouchEvent.TOUCH_OUT, key);
                        }
                        if (newArr) {
                            this.sendEvents_(newArr, TouchEvent.TOUCH_ENTER, key);
                        }
                    }
                    this.$hovers[key] = node;
                }
                this.sendEvents_(list, TouchEvent.TOUCH_MOVE, key);
            }
        }

        private onTouchBegin(node: Sprite, key) {
            if (node) {
                let ir = (this.enableMouseRight ? key == 2 : false)
                let list = this.getNodes(node);
                this.$press[key] = node;
                this.sendEvents_(list, ir ? TouchEvent.RMOUSE_BEGIN : TouchEvent.TOUCH_BEGIN, key);
            }
        }

        private onTouchEnd(node, key) {
            if (node) {
                let ir = (this.enableMouseRight ? key == 2 : false);
                let list = this.getNodes(node);
                this.sendEvents_(list, ir ? TouchEvent.RMOUSE_END : TouchEvent.TOUCH_END, key);
                if (this.$press[key] == node && !node.disabledTap) {
                    this.sendEvents_(list, ir ? TouchEvent.RMOUSE_TAP : TouchEvent.TAP, key);
                }
            }
            if (this.$press[key] != node && this.$press[key] != undefined) {
                this.sendEvents_(this.getNodes(this.$press[key]), TouchEvent.MOUSE_RELEASE_OUTSIDE, key);
            }
            delete this.$press[key];
        }

        private onTouchTest(node, key) {
            if (this.$hovers[key] != node) {    //通过逻辑调整到非碰撞的区域
                this.onTouchMove(node, key);
            }
        }

        private getNodes(start: any, end?: any) {
            let arr: GameObjectContainer[] = [];
            while (start != end) {
                arr.push(start);
                start = start.parent;
            }
            return arr;
        }

        private sendEvents_(arr: any[], type: string, key) {
            let e = this.event as any;
            e.stoped = false;
            e.touchId = key;
            for (let c of arr as Sprite[]) {
                if (e.stoped)
                    return;
                c.event(type, [e.set(type, c, arr[0])]);
            }
        }

        public runEvent() {
            let len = this.events_.length;
            for (let i = 0; i < len; i++) {
                let event = this.events_.shift();
                if (event.type == "touchstart") {
                    this.check(stage, event.x, event.y, event.key, this.onTouchBegin);
                } else if (event.type == "touchmove") {
                    this.check(stage, event.x, event.y, event.key, this.onTouchMove);
                } else if (event.type == "touchend") {
                    this.check(stage, event.x, event.y, event.key, this.onTouchEnd);
                } else if (event.type == TouchEvent.TOUCH_END) {
                    this.check(stage, event.x, event.y, event.key, this.onTouchEnd);
                } else if (event.type == TouchEvent.TOUCH_BEGIN) {
                    this.check(stage, event.x, event.y, event.key, this.onTouchBegin);
                } else if (event.type == TouchEvent.TOUCH_MOVE) {
                    this.check(stage, event.x, event.y, event.key, this.onTouchMove);
                } else if (event.type == "mouseout" || event.type == "touchcancel") {  //鼠标移出了canvas
                    for (let k in this.$press) {
                        let node = this.$press[k];
                        if (node) {
                            this.sendEvents_(this.getNodes(node), TouchEvent.TOUCH_CANCEL, event.key);
                            delete this.$press[k];
                        }
                    }
                } else if (event.type == "touchtest") {
                    this.check(stage, this.x, this.y, event.key, this.onTouchTest);
                }

            }
        }
    }

    export class EventDispatcher {
        private hashCode_: number;
        protected events_: { [type: string]: Handler[] };
        constructor() {
            this.hashCode_ = hashCode();
            this.events_ = {};
        }

        public get hashCode() {
            return this.hashCode_;
        }


        private createListener_(type, func: Function, thisObj?, params?: any[], once?: boolean, offBefore?: boolean) {
            if (type) {
                if (offBefore || this.hasListener(type)) {
                    this.removeListener_(type, func, thisObj);
                }
                let hander = new Handler(func, thisObj, params);
                this.events_ = this.events_ || {};
                this.events_[type] = this.events_[type] || [];
                this.events_[type].push(hander);
            } else {
                log("type不能为空值");
            }
            return this;
        }

        private removeListener_(type, func: Function, thisObj?: any, onceOnly?: boolean) {
            if (this.events_ && this.events_[type]) {
                let len = this.events_[type].length;
                for (let i = len - 1; i >= 0; i--) {
                    let e = this.events_[type][i];
                    if (e.func == func && e.thisObj == thisObj && (onceOnly ? e.once : true)) {
                        let [h] = this.events_[type].splice(i, 1);
                        h.clear();
                        break;//理论不会有相同的
                    }
                }
            }
            return this;
        }

        public hasListener(type: string) {
            if (this.events_ && this.events_[type]) {
                return this.events_[type].length > 0;
            }
            return false;
        }

        public once(type, func: Function, thisObj?, params?: any[]) {
            this.createListener_(type, func, thisObj, params, true);
        }

        public on(type, func: Function, thisObj?, params?: any[], offBefore?: boolean) {
            this.createListener_(type, func, thisObj, params, undefined, offBefore);
        }

        public off(type, func: Function, thisObj?: any, onceOnly?: boolean) {
            this.removeListener_(type, func, thisObj, onceOnly);
            return this;
        }

        public event(type, params?: any[]) {
            if (this.events_ && this.events_[type]) {
                let len = this.events_[type].length;
                for (let i = 0; i < len; i++) {
                    let e = this.events_[type][i];
                    if (e)
                        e.runWith(params);
                }
                for (let i = len - 1; i >= 0; i--) {
                    let e = this.events_[type][i];
                    if (!e || e.once)
                        this.events_[type].splice(i, 1);
                }
            }
            return this;
        }
    }

    export class GameObject extends EventDispatcher {
        public destroyed: boolean;
        public name: string;
        public visible: boolean;
        public touchEnabled: boolean;
        /** 开启后不会将不会接收TAP与RMOUSE_TAP事件 */
        public disabledTap: boolean;

        protected gs: GraphicState;
        private parent_: GameObjectContainer;
        private x_: number;
        private y_: number;
        private scaleX_: number;
        private scaleY_: number;
        protected width_: number;
        protected height_: number;
        public pivotX: number;
        public pivotY: number;
        private $rotate: number;
        private $alpha: number;

        public $hasAddToStage: boolean;
        static $EVENT_ADD_TO_STAGE_LIST: GameObject[] = [];
        static $EVENT_REMOVE_FROM_STAGE_LIST: GameObject[] = [];
        constructor() {
            super();
            this.x_ = 0;
            this.y_ = 0;
            this.pivotX = 0;
            this.pivotY = 0;
            this.scaleX_ = 1;
            this.scaleY_ = 1;
            this.$alpha = 1;
            this.$rotate = 0;
            this.visible = true;
            this.gs = { x: this.x_, y: this.y_, scaleX: this.scaleX_, scaleY: this.scaleY_, rotate: this.rotate, alpha: this.$alpha };
        }

        public set alpha(v: number) {
            this.$alpha = v;
            this.gs = { x: this.x_, y: this.y_, scaleX: this.scaleX_, scaleY: this.scaleY_, rotate: this.rotate, alpha: this.$alpha };
        }

        public get alpha() {
            return this.$alpha;
        }

        public set rotate(v: number) {
            this.$rotate = v;
            this.gs = { x: this.x_, y: this.y_, scaleX: this.scaleX_, scaleY: this.scaleY_, rotate: this.rotate, alpha: this.$alpha };
        }

        public get rotate() {
            return this.$rotate;
        }

        protected touchEnable_(bool?: boolean) {
            let parent = this;
            while (parent) {
                parent.touchEnabled = bool;
                parent = parent.parent as any;
            }
        }

        public set parent(parent: GameObjectContainer) {
            this.setParent_(parent);
        }

        public get parent(): GameObjectContainer {
            return this.parent_;
        }

        public set x(x: number) {
            this.pos(x);
        }

        public set y(y: number) {
            this.pos(undefined, y);
        }


        public get x() { return this.x_; }
        public get y() { return this.y_; }

        public pos(x?: number, y?: number) {
            if (x == this.x_ && y == this.y_) return this;
            this.setX(x, false);
            this.setY(y, false);
            this.event(Event.MOVE);
            return this;
        }

        protected setX(x: number, e = true) {
            if (x == this.x_) return this;
            this.x_ = x == undefined ? this.x_ : x;
            this.gs = { x: this.x_, y: this.y_, scaleX: this.scaleX_, scaleY: this.scaleY_, rotate: this.rotate, alpha: this.alpha };
            if (e) this.event(Event.MOVE);
            player.mouseTestCount += 1;
            return this;
        }

        protected setY(y: number, e = true) {
            if (y == this.y_) return this;
            this.y_ = y == undefined ? this.y_ : y;
            this.gs = { x: this.x_, y: this.y_, scaleX: this.scaleX_, scaleY: this.scaleY_, rotate: this.rotate, alpha: this.alpha };
            if (e) this.event(Event.MOVE);
            player.mouseTestCount += 1;
            return this;
        }


        public set scaleX(x: number) {
            this.scale(x);
        }

        public set scaleY(y: number) {
            this.scale(undefined, y);
        }

        public get scaleX() { return this.scaleX_; }
        public get scaleY() { return this.scaleY_; }

        public scale(x?: number, y?: number) {
            this.scaleX_ = x === undefined ? this.scaleX_ : x;
            this.scaleY_ = y === undefined ? this.scaleY_ : y;
            this.gs = { x: this.x_, y: this.y_, scaleX: this.scaleX_, scaleY: this.scaleY_, rotate: this.rotate, alpha: this.alpha };
            player.mouseTestCount += 1;
            return this;
        }

        public set width(width: number) {
            this.size(width);
        }

        public set height(height: number) {
            this.size(undefined, height);
        }

        public get width() { return this.getWidth_(); }
        public get height() { return this.getHeight_(); }

        protected getWidth_() {
            return this.width_;
        }

        protected getHeight_() {
            return this.height_;
        }

        public size(width?: number, height?: number) {
            this.width_ = width === undefined ? this.width_ : width;
            this.height_ = height === undefined ? this.height_ : height;
            player.mouseTestCount += 1;
            return this;
        }

        public pivot(x?: number, y?: number) {
            this.pivotX = x;
            this.pivotY = y;
        }

        protected setParent_(parent: GameObjectContainer) {
            this.parent_ = parent;
            return this;
        }

        public $<T = this>(): T {
            return this as any;
        }

        public localToGlobal(x: number, y: number) {
            let rx = 0, ry = 0;
            let p1 = this.localToParent(x, y);
            rx = p1.x;
            ry = p1.y;
            let p = this.parent;
            if (p) {
                p1 = p.localToGlobal(rx, ry);
                rx = p1.x;
                ry = p1.y;
            }
            return { x: rx, y: ry };
        }

        public globalToLocal(x: number, y: number) {
            let p = this.parent;
            let rx = 0, ry = 0;
            if (p) {
                let p1 = p.globalToLocal(x, y);
                rx = p1.x;
                ry = p1.y;
            }
            return this.parentToLocal(rx, ry);
        }

        public parentToLocal(x: number, y: number) {
            // translate
            x = x - this.x;
            y = y - this.y;
            // rotate
            let r = -this.rotate * Math.PI / 180;
            let c = Math.cos(r);
            let s = Math.sin(r);
            let rx = c * x - s * y;
            let ry = s * x + c * y;
            x = rx;
            y = ry;
            // scale
            x = x / this.scaleX;
            y = y / this.scaleY;
            return { x, y }
        }

        public localToParent(x: number, y: number) {
            // scale
            x = x * this.scaleX;
            y = y * this.scaleY;
            // rotate
            let r = this.rotate * Math.PI / 180;
            let c = Math.cos(r);
            let s = Math.sin(r);
            let rx = c * x - s * y;
            let ry = s * x + c * y;
            x = rx;
            y = ry;
            // translate
            x = x + this.x;
            y = y + this.y;
            return { x, y };
        }

        /** 只需要检测原始宽高即可 缩放系数已经在 x,y 中处理 */
        hitTest_(x1: number, y1: number) {
            return x1 > 0 && y1 > 0 && x1 <= this.width && y1 <= this.height;
        }

        $onAddToStage(): void {
            let self = this;
            self.$hasAddToStage = true;
            GameObject.$EVENT_ADD_TO_STAGE_LIST.push(this);
        }

        /**
         * @private
         * 显示对象从舞台移除
         */
        $onRemoveFromStage(): void {
            GameObject.$EVENT_REMOVE_FROM_STAGE_LIST.push(this);
        }

    }

    export class GameObjectContainer extends GameObject {
        public children_: GameObject[];
        constructor() {
            super();
            this.children_ = [];
        }

        public get numChild() {
            return this.children_.length;
        }

        public contains(node: GameObject): boolean {
            while (node) {
                if (node == this)
                    return true;
                node = node.parent;
            }
            return false;
        }

        public on(type, func: Function, thisObj?, params?: any[], offBefore?: boolean) {
            if (touchMgr.isTouchEvent(type))
                this.touchEnable_(true);
            return super.on(type, func, thisObj, params, offBefore);
        }

        public removeSelf() {
            if (this.parent != undefined) {
                this.parent.removeChild(this);
            }
            return this;
        }

        public removeChild(node: GameObject) {
            return this.removeChildAt(this.getChildIndex(node))
        }

        public removeChildren(begin?: number, endl?: number) {
            begin = begin || 0;
            endl = endl || this.numChild - 1;
            for (let i = endl; i >= begin; i--) {
                this.removeChildAt(i);
            }
            return this;
        }

        public removeChildAt(index: number) {
            if (index >= 0 && index < this.children_.length) {
                let [node] = this.children_.splice(index, 1);
                if (node) {
                    // node.event(Event.BEFORE_REMOVE);
                    node.parent = undefined;
                    if (this.$hasAddToStage) {
                        player.mouseTestCount += 1;
                        node.$onRemoveFromStage();
                        let list = GameObjectContainer.$EVENT_REMOVE_FROM_STAGE_LIST;
                        while (list.length > 0) {
                            let childAddToStage = list.shift();
                            if (childAddToStage.$hasAddToStage) {
                                childAddToStage.$hasAddToStage = false;
                                childAddToStage.event(Event.REMOVED_FROM_STAGE);
                            }
                            childAddToStage.$hasAddToStage = false;
                        }
                    }
                    // node.event(Event.REMOVED);
                }
                return node;
            }

        }

        public getChildIndex(node: GameObject) {
            for (let index = this.children_.length - 1; index >= 0; index--) {
                if (node == this.children_[index]) {
                    return index;
                }
            }
            return -1;
        }

        public getChildByName(name: string) {
            let len = this.numChild;
            for (let index = 0; index < len; index++) {
                if (name == this.children_[index].name) {
                    return this.children_[index];
                }
            }
        }

        public removeChildByName(name: string) {
            return this.removeChild(this.getChildByName(name));
        }

        public getChildAt(index: number) {
            return this.children_[index];
        }

        public setChildIndex(child: GameObject, index: number) {
            let li = this.children_.indexOf(child);
            if (li == index)
                return;

            let parent = child.parent;
            if (parent)
                parent.removeChild(child);

            this.addChildAt(child as any, index);
            return child;
        }

        public addChild(node: GameObject) {
            this.addChildAt(node as any, this.children_.length);
            return this;
        }

        public addChildren(...ns: GameObject[]) {
            for (let n of ns)
                this.addChild(n);
            return this;
        }

        public addTo(parent: GameObjectContainer) {
            parent && parent.addChild(this);
            return this;
        }

        public addChildAt(node: GameObjectContainer, index: number) {
            if (this.destroyed || node == undefined || node.destroyed || node == this || stage == node) {
                return this;
            }
            if (node.contains(this)) {
                this.removeSelf();
            }
            if (node.parent) {
                node.parent.removeChild(node);
            }
            index = Math.min(index, this.children_.length);
            this.children_.splice(index, 0, node);
            node.setParent_(this);

            if (this.$hasAddToStage) {
                node.$onAddToStage()
                player.mouseTestCount += 1;
            }

            if (this.$hasAddToStage) {
                let list = GameObjectContainer.$EVENT_ADD_TO_STAGE_LIST;
                while (list.length) {
                    let childAddToStage = list.shift();
                    if (childAddToStage.$hasAddToStage) {
                        childAddToStage.event(Event.ADDED_TO_STAGE);
                    }
                }
            }

            if (node.touchEnabled)
                this.touchEnable_(true);
            // node: event(Event.ADDED);
            return this;
        }

        public replaceChild(node: GameObjectContainer, newNode: GameObjectContainer) {
            let index = this.getChildIndex(node);
            if (index > 0 && newNode) {
                if (newNode.parent) {
                    let nIndex = newNode.parent.getChildIndex(newNode);
                    newNode.parent.addChildAt(node, nIndex);
                } else {
                    node.removeSelf();
                }
                this.addChildAt(newNode, index);
            }
            return this;
        }

        $onAddToStage() {
            super.$onAddToStage();
            let children = this.children_;
            let length = children.length;
            for (let i = 0; i < length; i++) {
                let child: GameObject = children[i];
                child.$onAddToStage();
            }
        }

        $onRemoveFromStage(): void {
            super.$onRemoveFromStage();
            let children = this.children_;
            let length = children.length;
            for (let i = 0; i < length; i++) {
                let child: GameObject = children[i];
                child.$onRemoveFromStage();
            }
        }
    }

    export class Sprite extends GameObjectContainer {
        public mouseX: number;
        public mouseY: number;

        public isUseTransform(): boolean {
            return (this.rotate % 360 != 0) || ((this.scaleX != 1 || this.scaleY != 1) && (this.width + this.height > 0));;
        }

        public render(gr: Graphic) {
            if (this.visible) {
                let useTransform = this.isUseTransform();
                gr.push(this.gs, useTransform);
                this.draw(gr);
                this.renderChildren(gr);
                gr.pop(useTransform);
            }
        }

        protected renderChildren(gr: Graphic) {
            if (this.children_) {
                for (let child of this.children_ as Sprite[]) {
                    if (child.render) {
                        child.render(gr);
                    }
                }
            }
        }

        protected draw(gr: Graphic) {
        }
    }

    export class Box extends Sprite {
        public touchThrough: boolean;

        private $autoSize: boolean;
        constructor() {
            super();
            this.autoSize = true;
        }

        public set autoSize(v: boolean) {
            this.$autoSize = v;
        }

        // public addChildAt(node: GameObjectContainer, index: number) {
        //     let ret = super.addChildAt(node, index);
        //     if (this.autoSize)
        //         this.measure();
        //     return ret;
        // }

        // public removeChildAt(index: number) {
        //     let ret = super.removeChildAt(index);
        //     if (this.autoSize)
        //         this.measure();
        //     return ret;
        // }

        // private measure() {
        //     let maxH = 0;
        //     let minY = 0;

        //     let minX = 0;
        //     let maxW = 0;
        //     for (let i = this.numChild - 1; i >= 0; i--) {
        //         let comp = this.getChildAt(i);
        //         if (comp.visible) {
        //             maxH = Math.max(comp.y + comp.height * comp.scaleY, maxH);
        //             maxW = Math.max(comp.x + comp.width * comp.scaleX, maxW);

        //             minX = Math.min(comp.x, minX);
        //             minY = Math.min(comp.y, minY);
        //         }
        //     }

        //     this.width = maxW;
        //     this.height = maxH;
        // }

        public get autoSize() {
            return this.$autoSize;
        }
    }

    export class Label extends Sprite {
        protected text_: string;
        public stroke: number;
        public strokeColor: string;
        public textAlign: string;
        public lineSpacing: number;
        public fontSize: number;
        public textColor: string;

        protected texts: string[];
        constructor() {
            super();
            this.textColor = "#ffffff";
            this.textAlign = "left";
            this.lineSpacing = 0;
            this.fontSize = 12;
        }

        public set text(str: string) {
            if (str == this.text_) return;
            this.texts = undefined;
            this.text_ = str;
            this.$setText(str);
        }

        public get text() {
            return this.text_;
        }

        /**
         * @version 1.0
         * @param text 
         */
        protected $setText(text: string) {
            let lines: string[];
            let texts: string[] = [];
            if (text && (text.indexOf("\n") >= 0 || text.indexOf("\r") >= 0)) {
                lines = text.split(/(?:\r\n|\r|\n)/);
            } else {
                lines = [text];
            }

            let width_ = this.width_;
            if (width_) { //主动设置过宽度
                lines.forEach(str => {
                    if (Label.measureText(this, str).width > width_) {
                        let chars: string[] = str.split("");
                        let newstr = "";
                        let ww: number = 0;
                        for (let word of chars) {
                            let cw = Label.measureText(this, word).width;
                            if (ww + cw > width_) {
                                if (ww == 0) {//一个字就超长 
                                    texts.push(newstr);
                                } else {
                                    texts.push(newstr);
                                    newstr = word;
                                    ww = 0;
                                }
                            } else {
                                newstr += word;
                            }
                            ww += cw;
                        }
                        if (newstr)
                            texts.push(newstr);
                    } else {
                        texts.push(str);
                    }
                });

            } else
                texts = lines;

            this.texts = texts;
        }

        /**
         * 渲染内容
         * @version 1.0
         * @param gr 
         */
        public draw(gr: Graphic) {
            super.draw(gr);
            if (this.text) {
                let index = 0;
                let len = this.texts ? this.texts.length : 0;
                let str: string = this.text_;
                let al = gr.$.textAlign, oc = gr.$.fillStyle, ol = gr.$.lineWidth;
                gr.$.textAlign = this.textAlign as any;
                gr.$.font = `${this.fontSize}px simsun`;
                do {
                    if (this.texts) str = this.texts[index];
                    let x = 0;
                    let y = index * (this.lineSpacing + this.fontSize);
                    let w = this.width || 0;
                    if (this.textAlign == "center") {
                        x = w / 2;
                    } else if (this.textAlign == "right") {
                        x = w;
                    }

                    if (this.stroke) {
                        gr.setColor(this.strokeColor);
                        if (1) {
                            gr.print(str, x - 1 - this.pivotX, + y - this.pivotY);
                            gr.print(str, x + 1 - this.pivotX, + y - this.pivotY);
                            gr.print(str, x - this.pivotX, -1 + y - this.pivotY);
                            gr.print(str, x - this.pivotX, 1 + y - this.pivotY);
                        } else {
                            gr.$.lineWidth = this.stroke;
                            gr.print2(str, x - this.pivotX, y - this.pivotY);
                        }
                    }
                    gr.$.fillStyle = this.textColor;
                    gr.print(str, x - this.pivotX, y - this.pivotY);
                    gr.$.fillStyle = oc;

                } while (++index < len);
                gr.$.lineWidth = ol;
                gr.$.textAlign = al;

            }
        }

        public static measureText(lab: Label, text: string) {
            graphic.$.font = `${lab.fontSize}px simsun`;
            return graphic.$.measureText(text);
        }
    }

    export class Image extends Sprite {
        private skin_: string;
        protected texture_: any;
        public blendMode: string;
        /** repeat、clip、scale 默认是 repeat */
        public fillMode: string;
        public set skin(skin: string) {
            if (skin == this.skin_) return;
            this.skin_ = skin;
            this.texture_ = undefined;
            if (this.skin) {
                if (player.preLoadImage) loader.loadImage(this.skin_);
                let image = loader.get<Image>(this.skin_);
                if (image) {
                    this.texture_ = image;
                }
            }
        }

        private $setTexture() {
            if (this.skin && !this.texture_) {
                this.texture_ = loader.get(this.skin);
            }
        }

        protected getWidth_() {
            if (this.width_ != undefined) {
                return this.width_;
            }
            this.$setTexture();
            if (this.texture_) {
                return this.texture_.width;
            }
            return super.getWidth_();
        }

        protected getHeight_() {
            if (this.height_ != undefined) {
                return this.height_;
            }
            this.$setTexture();
            if (this.texture_) {
                return this.texture_.height;
            }
            return super.getHeight_();
        }

        public get skin() {
            return this.skin_ || this.texture_;
        }

        public draw(gr: Graphic) {
            super.draw(gr);
            gr.setBlendMode(this.blendMode);
            if (this.skin_ || this.texture_) {
                this.$setTexture();
                if (this.texture_) {
                    gr.draw(this.texture_, -this.pivotX, -this.pivotY, this.width, this.height, this.fillMode);
                }
            }
            gr.setBlendMode(undefined);
        }
    }


    class Stage extends Sprite {

        /** 某个按键是否按下 */
        public isDown(keyCode: number) {
            return player.keyboards[keyCode] == 1;
        }
    }

    export class Timer {
        public static dt: number;
        static callLater(func: Function, thisObj?: any, params?: any[]) {
            callLaters_.push(new Handler(func, thisObj, params));
        }

        static startTimer(func: Function, thisObj?: any) {
            if (timers_) {
                this.stopTimer(func, thisObj);
                let timer = new Handler(func, thisObj);
                timer.valid = true;
                timers_.push(timer);
            } else {
                log("需要先启动引擎");
            }
        }

        static stopTimer(func: Function, thisObj?: any) {
            if (timers_) {
                let index = this.getTimerIndex(func, thisObj);
                if (index >= 0) {
                    timers_[index].valid = false;
                    return;
                }
            }
        }

        private static getTimerIndex(func: Function, thisObj?: any) {
            if (timers_) {
                let len = timers_.length;
                for (let i = len - 1; i >= 0; i--) {
                    let e = timers_[i];
                    if (func == e.func && thisObj == e.thisObj) {
                        return i;
                    }
                }
            }
        }

    }


    let timers_: Handler[];
    let callLaters_: Handler[];

    export class Player extends EventDispatcher {
        public paused: boolean;
        public backgroundColor: string = "#444";
        /** 重算鼠标碰撞 大于1 将会计算*/
        public mouseTestCount: number;
        /** 当程序运行时未移动鼠标而执行逻辑中有更改x、y、w、h、visible或调用addChild、removeChild时，无法得到TOUCH_ENTER、TOUCH_OUT等事件的问题.. 开启此选项后可以解决*/
        public enableAutoTestMouse: boolean;
        /** 在你设置Image或者部分需要图片资源的组件时 是否自动加载图片 默认不开启*/
        public preLoadImage: boolean = false;
        public keyboards: { [keyCode: number]: number };
        private gr: Graphic;
        constructor(c: any,) {
            super();
            timers_ = [];
            callLaters_ = [];
            this.keyboards = {};
            this.gr = graphic = new Graphic(c);
            this.mouseTestCount = 0;
        }

        public get isFullSceen() {
            return isFullSceen();
        }

        get canvas() {
            return _canvas;
        }

        /** 启用后鼠标左右键将使用不同的事件类型 */
        public set enableMouseMode(v: boolean) {
            touchMgr.enableMouseRight = v;
        }

        /** 根据电脑端或者手机端选择，默认为鼠标操作
         * @param type 1鼠标 2移动触屏
         */
        public setTouchEventListener(type: number = 1) {
            setTouchEventListener(type == 2);
        }

        public get enableMouseMode() {
            return touchMgr.enableMouseRight;
        }

        public keyboard(keyCode: number, state: number) {
            if (keyCode >= 0 && state >= 0 && this.keyboards[keyCode] != state) {
                this.keyboards[keyCode] = state;
                if (this.keyboards[keyCode] == 1) {
                    stage.event(Event.KEY_DOWN, [keyCode]);
                } else /* if (this.keyboards[keyCode] == 0)*/ {
                    stage.event(Event.KEY_UP, [keyCode]);
                }
            }
        }

        /** 进入网页全屏 */
        public requestFullScreen() {
            let de = document.documentElement;
            let func: Function = de.requestFullscreen || de["mozRequestFullScreen"] || de["webkitRequestFullScreen"];
            func && func.call(de);
        }

        /** 退出网页全屏 */
        public exitFullscreen() {
            var de = document;
            let func: Function = de.exitFullscreen || de["mozCancelFullScreen"] || de["webkitCancelFullScreen"];
            func && func.call(de);
        }

        public onfocus() {

        }

        public onblur() {
            for (let k in this.keyboards) { //弹起全部按下的键
                if (this.keyboards[k] == 1) {
                    this.keyboard(parseInt(k), 0);
                }
            }
        }

        private update(dt: number) {
            Timer.dt = dt;
            let len = timers_.length;
            for (let i = 0; i < len; i++) {
                let timer = timers_[i];
                if (timer && timer.valid)
                    timer.runWith();
            }
            for (let i = len - 1; i >= 0; i--) {
                let timer = timers_[i];
                if (!timer || !timer.valid) {
                    let [h] = timers_.splice(i, 1);
                    h.clear();
                }
            }
            while (callLaters_.length) {
                let handler = callLaters_.shift();
                handler.runWith();
                handler.clear();
            }
            if (this.enableAutoTestMouse && this.mouseTestCount > 0) {
                this.mouseTestCount = 0
                touchMgr.hitTest();
            }
            touchMgr.runEvent();
        }

        public draw() {
            this.gr.reset();
            stage.render(this.gr);
        }

        public fillBackground(color?: string) {
            var style = this.gr.$.fillStyle;
            this.gr.$.fillStyle = color || this.backgroundColor;
            this.gr.$.fillRect(0, 0, stage.width, stage.height); //用了填充 上面的清除就形同虚设了
            this.gr.$.fillStyle = style;
        }

        /** 由于使用requestAnimationFrame能达到的最高FPS是60 */
        private lastTime: number = 0;
        private totalTime: number = 0;
        private totalTick: number = 0;
        private $fps: number = 0;

        private delta: number = 0;
        private then: number = 0;
        private now: number = 0;
        public loop() {
            let self = this;
            if (loop) {
                self.update(self.delta);

                self.fillBackground();
                self.draw()
                let frameRate_ = frameRate;

                /// 计算FPS(参考egret)
                let current = now();
                this.totalTime += current - this.lastTime;
                this.lastTime = current;
                this.totalTick += 1;

                if (this.totalTime >= 1000) {
                    let lastFPS = Math.min(Math.ceil(this.totalTick * 1000 / this.totalTime), frameRate_);
                    this.$fps = lastFPS;
                    this.totalTime = this.totalTime % 1000;
                    this.totalTick = 0;
                }
                ///
                while ((self.then = now()) - self.now <= 1000 / frameRate_); // 更新并渲染完了之后 再补时间...
                self.delta = (self.then - self.now) / 1000;
                self.now = now();

                loop(function () { self.loop() });
            }
        }

        public set frameRate(v: number) {
            frameRate = v;
            if (frameRate <= 0) frameRate = 300;
            if (frameRate > 0 && frameRate <= 60) {
                loop = requestAnimationFrame || timeAnimationFrame;
            } else {
                loop = timeAnimationFrame;
            }
        }
        public get frameRate() { return frameRate; }
        public get fps() { return this.$fps; }
    }

    type GraphicState = {
        x: number,
        y: number,
        scaleX: number,
        scaleY: number,
        rotate: number,
        alpha: number,
    }

    export class Graphic {
        private states: GraphicState[];
        private cur: GraphicState;

        /** 不能在外部做出更改 */
        public useTransform: boolean;
        public globalTransformCount: number;
        public $: CanvasRenderingContext2D;
        constructor(c: CanvasRenderingContext2D) {
            this.$ = c;
            this.states = [];
            if (!c.resetTransform) {
                c.resetTransform = function () { c.setTransform(1, 0, 0, 1, 0, 0); }
            }
            this.reset();

        }

        public get globalTransform() {
            return this.globalTransformCount > 0;
        }

        public get x() { return this.cur ? this.cur.x : 0; }
        public get y() { return this.cur ? this.cur.y : 0; }
        public get scaleX() { return this.cur ? this.cur.scaleX : 1; }
        public get scaleY() { return this.cur ? this.cur.scaleY : 1; }
        public get alpha() { return this.cur ? this.cur.alpha : 1; }

        public reset() {
            this.useTransform = false;
            this.$.resetTransform();
            this.$.fillStyle = this.$.strokeStyle = "#fff";
            this.$.font = "12px simsun";
            this.$.textBaseline = "top";
            this.$.globalCompositeOperation = "source-over";
            this.$.lineWidth = 1;
            this.$.globalAlpha = 1;
            this.globalTransformCount = 0;
        }

        public push(state: GraphicState, useTransform?: boolean) {
            this.useTransform = useTransform;
            if (useTransform) {
                this.globalTransformCount += 1;
                this.$.save();
                this.$.translate(this.x + state.x, this.y + state.y);
                this.$.scale(state.scaleX, state.scaleY);
                this.$.rotate(state.rotate * Math.PI / 180);
                this.states.push({ x: 0, y: 0, scaleX: 1, scaleY: 1, rotate: 0, alpha: this.alpha * state.alpha });
            } else {
                let x = this.x + state.x;
                let y = this.y + state.y;
                let scaleX = this.scaleX * state.scaleX;
                let scaleY = this.scaleY * state.scaleY;
                let alpha = this.alpha * state.alpha;
                this.states.push({ x, y, scaleX, scaleY, rotate: 0, alpha });
            }
            let len = this.states.length;
            this.cur = len ? this.states[len - 1] : undefined;
            this.$.globalAlpha = this.alpha;
        }

        public pop(useTransform?: boolean) {
            this.useTransform = useTransform;
            this.states.pop();
            let len = this.states.length;
            this.cur = len ? this.states[len - 1] : undefined;
            this.$.globalAlpha = this.alpha;
            if (this.useTransform) {
                this.globalTransformCount -= 1;
                this.$.restore();
            }
        }

        public draw(tex: any, x: number, y: number, width?: number, height?: number, mode?: string | "repeat" | "scale" | "clip") {
            let sw_ = tex.width, sh_ = tex.height;
            width = width == undefined ? sw_ : width;
            height = height == undefined ? sh_ : height;
            let dw = false;
            if (mode == "repeat") {
                if ((width > sw_ || height > sh_)) {
                    dw = true;
                    let x_ = 0, y_ = 0;
                    do {
                        do {
                            if (width >= sw_)
                                this.$.drawImage(tex, this.x + x + x_, this.y + y + y_, Math.min(sw_, width), Math.min(sh_, height));
                            else
                                this.$.drawImage(tex, 0, 0, width, height, this.x + x + x_, this.y + y + y_, width, height);
                            x_ += sw_;
                            width -= sw_;
                        } while (width >= 0)
                        y_ += sh_;
                        height -= sh_;
                    } while (height >= 0)
                }
            } else if (mode == "clip") {
                dw = true;
                this.$.drawImage(tex, 0, 0, width, height, this.x + x, this.y + y, width, height);
            } else if (mode == "scale") {

            }

            if (!dw) {
                this.$.drawImage(tex, this.x + x, this.y + y, width, height);
            }
        }

        public draw2(tex: any, x: number, y: number, width?: number, height?: number, dx?, dy?, dw?, dh?) {
            this.$.drawImage(tex, x, y, width, height, this.x + dx, this.y + dy, dw, dh);
        }

        public createImageData(x: any, y?: number) {
            if (typeof x == "number") {
                return this.$.createImageData(x, y);
            }
            return this.$.createImageData(x);
        }


        public putImageData(img, x, y, w, h, a?) {
            this.$.putImageData(img, this.x + x, this.y + y);
        }


        public print(tex: any, x, y, ...args) {
            this.$.fillText(tex, this.x + x, this.y + y);
        }

        public print2(tex: any, x, y, ...args) {
            this.$.strokeText(tex, this.x + x, this.y + y);
        }

        public rect(x: number, y: number, w: number, h: number, mode?: "fill" | "stroke") {
            if (mode == "fill") {
                this.$.fillRect(this.x + x, this.y + y, w * this.scaleX, h * this.scaleY);
            } else {
                this.$.strokeRect(this.x + x, this.y + y, w * this.scaleX, h * this.scaleY);
            }
        }

        public setColor(color: string) {
            this.$.strokeStyle = this.$.fillStyle = color;
        }

        public setBlendMode(blendMode?: string) {
            this.$.globalCompositeOperation = "source-over";
            if (blendMode == "add") {
                this.$.globalCompositeOperation = "lighter";
            }
        }


    }

    export class Loader extends EventDispatcher {
        private res_: { [name: string]: any };
        private loadings_: { [url: string]: number };
        public prefix: string;
        constructor() {
            super();
            this.loadings_ = {};
            this.res_ = {}
            this.prefix = "";
        }

        public cache(data: any, name: string) {
            if (this.res_[name]) {
                warn("已经存在的数据", name);
            }
            this.res_[name] = data;
        }

        public remove(name: string) {
            this.res_[name] = undefined;
            delete this.res_[name];
        }

        /**
         * 获取缓存的资源
         * @param name url、alias
         * @param defaults 缺省值
         */
        public get<T = ImageData>(name: string, defaults?: any): T {
            return this.res_[name] || defaults;
        }

        public loadImage(url: string, alias?: string, group?: string, callback?: Function, thisObj?: any): void {
            let selfs = this;
            if (selfs.res_[url]) {
                callback && callback.apply(thisObj, [selfs.res_[url]]);
                // callback && selfs.event(url, [selfs.res_[url]]);
            } else {
                callback && selfs.once(url, callback, thisObj);
                if (selfs.loadings_[url] > 0) {
                    selfs.loadings_[url] += 1;
                    // console.log("试图重复加载:" + url);
                    return;
                } else {
                    selfs.loadings_[url] = 1;
                    let onLoad = function (e?) {
                        if (!selfs.res_[url]) {
                            XOF.loader.cache(img, url);
                            alias && XOF.loader.cache(img, alias);
                        }
                        // do {
                        selfs.event(url, [selfs.res_[url]]);
                        // } while (--selfs.loadings_[url]);
                        delete selfs.loadings_[url];
                    }
                    let img = new HTMLImageElement_();
                    img.onload = onLoad;
                    img.src = selfs.prefix + url;
                }
            }
        }

    }

    // common
    export function now() { return Date.now() - START_TIME; }
    export function log(...args: any[]) { console.log(...args); }
    export function warn(...args: any[]) { console.warn(...args); }
}