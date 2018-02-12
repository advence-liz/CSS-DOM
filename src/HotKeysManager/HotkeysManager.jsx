﻿
const activeName = 'hkactive';

/**
 * @class HotkeysManager
 * @param {String} scope 初始化 HotKeysManager 设置 RootScope
 * @desc
 */
function HotKeysManager(scope) {
    var hotkeyMode = false, showGlobal = false;
    this.hotkeys_arr = [];
    this.globalScope = scope;
    this.rootScope = scope;
    this.oldRootScope = scope;
    this.scope = scope;
    this.$globalFlags = new $(),
    this.globalFlagMap = new Map(),
    this.$flags = new $();
    this.flagMap = new Map();
    this.document = $(document);
    this.setScope = function (scope = this.scope) {

        if (this.hotkeyMode()) {
            this.scope = scope;
            this.refreshScope();
            this.flagMap = this.convertFlags2Map(this.$flags);
            if (this.showGlobal()) {
                this.$globalFlags = $(`[data-scope=${this.globalScope}]:visible`);
                this.globalFlagMap = this.convertFlags2Map(this.$globalFlags);
                this.$globalFlags.toggleClass(activeName, true);
            }

            return true;
        } else {
            return false;
        }
    };
    //convert Array to Map
    this.convertFlags2Map = function ($flags) {
        var flagMap = new Map();
        $flags.toArray().map(function (element) {
            var flag = element.dataset.flag.toUpperCase();
            flagMap.set(flag, element);
        });
        return flagMap;

    };
    this.refreshScope = function () {
        //取消上一次DOM
        this.$flags.toggleClass(activeName, false);
        //每次都重新获取DOM 元素，因为DOM元素可能动态渲染
        this.$flags = $(`[data-scope=${this.scope}]:visible`).toggleClass(activeName, true);
        if (!this.$flags.length) {
            console.warn(`makesure ${this.scope} really exist`);
        }
    };
    this.setRootScope = function (scope) {
        this.oldRootScope = this.rootScope;
        this.rootScope = scope;
    };

    this.resetRootScope = function () {
        this.rootScope = this.oldRootScope;
    };
    /**
     * hotkeyMode 读写器
     * @param {Bool} state  读写器
     * @return {Bool} hotKeyMode 
     */
    this.hotkeyMode = function (state) {
        if (state !== undefined) {
            hotkeyMode = state;
        } else {
            return hotkeyMode;
        }
    };
    this.showGlobal = function (state) {
        if (state !== undefined) {
            showGlobal = state;
        } else {
            return showGlobal;
        }
    };
    this._initEvent = function () {

        this.document.on('keydown', keydown.bind(this))
            .on('keyup', keyup.bind(this))
            .on('click', clickDocment.bind(this))
            .on("click", '[data-flag]', clickFlag.bind(this));
        /**
         * 开启hotkeyMode，或者记录按下的快捷键
         * @param {*} e event
         */
        function keydown(e) {
            if (this.hotkeyMode()) {
                this.hotkeys_arr.indexOf(e.key) > -1 ?
                    null :
                    this.hotkeys_arr.push(e.key);
            }
            //开启hotkeyMode 经测试感觉keydown的时候开启hotkeyMode 比较好
            else if (e.keyCode === 90 && e.altKey && e.ctrlKey) {
                this.hotkeyMode(true);

                this.setScope(this.rootScope);

            }
        }
        /**
         * 判断键入的组合键是否匹配预先设置的组合键，如果满足则触发对应元素的 click 事件
         * @param {*} e Event
         * @return {Bool} 阻止事件冒泡 阻止document click 触发
         */
        function keyup(e) {

            if (this.hotkeyMode()) {
                var keyCombination = this.hotkeys_arr.join('').toUpperCase();
                try {

                    if (this.hotkeyMode()) {
                        let cur_element;
                        cur_element = this.flagMap.get(keyCombination) || this.globalFlagMap.get(keyCombination);
                        $(cur_element).hasClass(activeName) && cur_element.click();
                        setTimeout(() => { clickFlag(cur_element); }, 200);//本来想使用 _.throttle 但是目前看起来没必要
                    }


                } catch (error) {
                    console.error(error);
                } finally {
                    this.hotkeys_arr.length = 0;
                }

            }
            return false;
        }
        //当点击页面任何位置移除$flags激活状态
        function clickDocment(e) {
            this.$flags.toggleClass(activeName, false);
            this.$globalFlags.toggleClass(activeName, false);
            this.hotkeyMode(false);
        }
        /**
         * data-flag 元素click触发如果不阻止事件冒泡，那么 docment的click 就会触发hotMode就会变为false
         * 所以只能让大家在自己事件上阻止冒泡，我要是直接阻止冒泡我担心这个元素并不是触发事件的元素
         * 根据属性配置是否阻止事件冒泡
         * @param {*} e Event
         * @return {Bool} 是否阻止事件冒泡
         * @desc 因为 clickFlag是通过 document 委托注册，当 data-flag 所在元素阻止事件冒泡 导致
         * $(cur_element).hasClass(activeName) && cur_element.click();  并不会触发 clickFlage ，所以setTimeout 逻辑必须在keyup 里
         */
        function clickFlag(e) {
            let next = e||e.dataset.next||e.target.dataset.next;
            //TODO 判读next 跟当前是否相等
            if (this.hotkeyMode() && next) {
                 this.setScope(e.target.dataset.next);
              //  setTimeout(() => { this.setScope(e.target.dataset.next); }, 200);//本来想使用 _.throttle 但是目前看起来没必要
            } else {
                this.$flags.toggleClass(activeName, false);
                this.hotkeyMode(false);
            }
            this.$globalFlags.toggleClass(activeName, false);
            return e.target.dataset.bubble === "true" ? true : false;
        }
    };
    this._init = function () {

        this._initEvent();
        this._initEvent = null;
        this.$globalFlags = $(`[data-scope=${this.scope}]:visible`);
        this.globalFlagMap = this.convertFlags2Map(this.$globalFlags);
    };
    this._init();
}

export default HotKeysManager;
//TODO
//1 flag 大小写
//2 add globaRootMap
/**
 * 1 ctrl+alt+z when keyup 展示当前 RootScope
 * 2 键盘输入一个Key 触发对应DOM 元素的click事件 根据next 切换到对应的ChildScope
 */