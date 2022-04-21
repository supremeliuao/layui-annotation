!function (win) {
    "use strict"; // 使用严格模式

    var doc = win.document; // 获取docment对象(有利于性能)
    var config = {
        modules: {}, // 记录模块物理路径
        status: {}, // 记录模块加载状态
        timeout: 10, // 符合规范的模块请求最长等待秒数
        event: {} // 记录模块自定义事件
    }
    
    // 使用构造函数模式
    var Layui = function () {
        this.v = '2.6.8'; // 版本号
    }
    
    // 识别预先可能定义的指定全局对象
    var GLOBAL = win.LAYUI_GLOBAL || {};

    // 定义获取 layui 所在目录的函数 getPath
    var getPath = function () {

        // 当前doc中如果有 currentScript 属性, 就返回 src
        // currentScript 更多内容查看 https://developer.mozilla.org/zh-CN/docs/Web/API/Document/currentScript
        var jsPath =  doc.currentScript 
        ? doc.currentScript.src
        : function() {
            var js = doc.scripts; // 获取当前页面所有 script 标签
            var last = js.length - 1;
            var src;

            // 倒叙遍历(有利于性能)
            for(var i = last; i > 0 ;i--){

                // 当前 script 处于可交互状态时,赋值 src
                // 更多 readyState 内容查看 https://developer.mozilla.org/zh-CN/docs/Web/API/Document/readyState
                if(js[i].readyState === 'interactive'){
                    src = js[i].src;
                    break;
                }
            }
            return src || js[last].src; // 默认返回 src, 如果 src 不存在, 则返回数组中最后一个 script 的 src 值
        }();

        // jsPath 是形如'http://127.0.0.1:5500/src/layui.cpy.js'这样的值, 不符合需要，所以进行处理
        return config.dir = GLOBAL.dir || jsPath.substring(0, jsPath.lastIndexOf('/') + 1); 
    }(); // 立即执行函数
    
    // 定义项目中异常提示函数
    var error = function (msg, type) {
        type = type || 'log'; // type 默认值是 'log'

        // 判断当前环境中是否存在 console 和 type
        win.console && console[type] && console[type]('layui error hint: ' + msg);
    }
    
    // 判断当前浏览器是否为 opera
    var isOpera = typeof opera !== 'undefined' && opera.toString() === '[objetc Opera]';
    
    // 内置模块
    var modules = config.builtin = {
        lay: 'lay', // 基础 DOM 操作
        layer: 'layer', // 弹层
        laydate: 'laydate', // 日期
        laypage: 'laypage', // 分页
        laytpl: 'laytpl', // 模板引擎
        layedit: 'layedit', // 富文本编辑器
        form: 'form', // 表单集
        upload: 'upload', // 上传
        dropdown: 'dropdown', // 下拉菜单
        transfer: 'transfer', // 穿梭框
        tree: 'tree', // 树结构
        table: 'table', // 表格
        element: 'element', // 常用元素操作
        rate: 'rate', // 评分组件
        colorpicker: 'colorpicker', // 颜色选择器
        silder: 'slider', // 滑块
        carousel: 'carousel', // 轮播
        flow: 'flow', // 流加载
        util: 'util', // 工具块
        code: 'code', // 代码修饰器
        jquery: 'jquery', // DOM 库
        all: 'all',
        'layui.all': 'layui.all' // 聚合标识
    }

    // 原型模式
    // 记录基础数据
    Layui.prototype.cache = config;
    
    /**
     * layui.define([mods], callback)
     * 通过该方法可定义一个 Layui 模块。
     * 参数mods是可选的，用于声明该模块所依赖的模块。
     * callback即为模块加载完毕的回调函数，它返回一个 exports 参数，用于输出该模块的接口。
     */
    Layui.prototype.define = function(deps, factory) {
        var that = this; // 存储当前 this
        var type = typeof deps === 'function'; // deps 是否为函数
        
        // 定义回调函数
        var callback = function () {

            // setApp 用于把用户自定义导出的模块注册到实例对象 layui 上, 并标记模块已加载
            var setApp = function (app, exports) {
                layui[app] = exports; // layui 为实例对象, 在实例中添加自定义模块
                config.status[app] = true; // 在congfig中设置模块状态
            }
            
            /**
             * factory 工厂模式
             * app 用户自定义导处模块名
             * exports 用户自定义导处的数据
             */
            typeof factory === 'function' && factory(function(app, exports){
                // 当前处于匿名函数内, 该匿名函数就是回调函数 exports
                
                setApp(app, exports);

                // 存储回调函数 (这里的匿名函数和 define 中 callback 一样), 用于后续如果重新执行模块
                config.callback[app] = function(){
                    factory(setApp);
                }
            });
            return this;
        };

        // 第一个参数为函数时, 函数赋给 factory,并置为 []
        type && (
            factory = deps,
            deps = []
        );
       that.use(deps, callback, null, 'define');
       return that;
    }

    // 使用特定模块
    Layui.prototype.use = function(apps, callback, exports, from) {
        var that = this;
        var dir = config.dir = config.dir ? config.dir : getPath; // 获取路径
        var head = doc.getElementsByTagName('head')[0]; // 获取第一个header
        
        // 对传入的 apps 参数进行处理
        apps = function(){
            
            // 传入字符串时, 应转为数组 layui.use('form',...)
            if(typeof apps === 'string'){
                return [apps];
            }

            // 第一个参数为 function 时, 则自动加载所有内置模块，且执行的回调即为该 function 参数
            else if (typeof apps === 'function') {
                callback = apps;
                return ['app'];
            }
            return apps;
        }(); // 立即执行

        // 如果页面已经存在 jQuery 1.7+ 库且所定义的模块依赖 jQuery，则不加载内部 jquery 模块
        if(win.jQuery && jQuery.fn.on) {
            that.each(apps, function(index, item){

                // 找到内部 jquery, 并删除
                if(item === 'jquery'){
                    apps.splice(index, 1);
                }
            });
            layui.jquery = layui.$ = jQuery; // layui 为实例对象
        }

        var item = apps[0]; // 获取 apps 数组第一位元素
        var timeout = 0; // 初始化超时时间为 0
        exports = exports || []; 
        
        // 获取静态资源host
        config.host = config.host || (dir.match(/\/\/([\s\S]+?)\//)||['//'+ location.host +'/'])[0]
        
        // 加载完毕
        function onScriptLoad(e, url){
            var readyRegExp = navigator.platform === 'PLaySTATION 3' ? /^complete$/ : /^(complete|loaded)$/; // 根据平台选择正则表达式
            
            // 当前文件已经加载完毕
            if(e.type === 'load' || (readyRegExp.test(e.currentTarget || e.srcElement).readyState)){
                config.modules[item] = url; // 存储模块真实路径
                head.removeChild(node); // 从 head 中移除 node
                (function poll(){

                    // 判断 timeout > 2500 ?
                    if(++timeout > config.timeout * 1000 / 4) {

                        // 超时报错
                        return error(item + ' is not a valid module', 'error'); // 记得 return, 停止执行
                    }

                    // 判断当前模块状态是否为 true ,为 true 执行 onCallback, 否则轮询
                    config.status[item] ? onCallback() : setTimeout(poll, 4);
                })()
            }
        }

        // 回调函数
        function onCallback(){

            // 向 exports 中推入模块
            exports.push(layui[item]); // layui 为实例对象中除了 v 属性标识版本号, 其余全为模块

            apps.length > 1 
            ? that.use(apps.slice(1), callback, exports, from)
            : ( typeof callback === 'function' && function(){
                
                // 保证文档加载完毕再执行调用
                if(layui.jquery && typeof layui.jquery === 'function' && from !== 'define' ) {
                    return layui.jquery(function (){
                        callback.apply(layui, exports);
                    });
                }
                callback.apply(layui, exports);
            }());
        }

        // 如果引入了聚合板，内置的模块则不必重复加载
        if(apps.length === 0 || (layui['layui.all'] && modules[item])){
            return onCallback(), that;
        }

        // 获取加载的模块 URL
        // 如果是内置模块, 则按照 dir 参数拼接模块路径
        // 如果是扩展模块, 则判断模块路径值是否以 {/} 开头,
        // 如果路径值是 {/} 开头, 则模块路径即为后面紧跟的字符。
        // 否则, 则按照 base 参数拼接模块路径
        var url = (modules[item] ? (dir + 'modules/')
            : (/^\{\/\}/.test(that.modules[item]) ? '' : (config.base || ''))
        ) + (that.modules[item] || item) + '.js';

        url = url.replace(/^\{\/\}/, '');
        
        // 如果扩展模块(即: 非内置模块)对象已经存在, 则不必再加载
        if(!config.modules[item] && layui[item]){
            config.modules[item] = url; // 记录该扩展模块 URL
        }

        // 首次加载模块
        if(!config.modules[item]){
            var node = doc.createElement('script'); // 创建script
            
            node.async = true; // 异步
            node.charset = 'utf-8'; // 文件格式

            // 请求的文件后面添加版本号
            node.src = url + function(){

                // 是否存在版本
                var version = config.version === true
                ? (config.v || (new Date()).getTime())
                : (config.version || '');

                return version ? ('?v=' + version) : '';
            }();

            head.appendChild(node); // 挂载节点

            // 对 IE 添加监听
            if(node.attachEvent && !(node.attachEvent.toString && node.attachEvent.toString().indexOf('[native code') < 0) && !isOpera){
                node.attachEvent('onreadystatechange', function(e){
                    onScriptLoad(e, url);
                });
            } else {
                node.addEventListener('load', function(e){
                    onScriptLoad(e, url);
                }, false)
            }

            config.modules[item] = url;
        } else { // 非首次加载
            (function poll(){
                if(++timeout > config.timeout * 1000 / 4) {
                    return error(item + ' is not a valid module', 'error');
                };

                // 已加载到模块中
                (typeof config.modules[item] === 'string' && config.status[item])
                ? onCallback()
                : setTimeout(poll, 4);
            }()); // 轮询 必须是立即执行函数
        }

        return that;
    }

    // 获取节点的 style 属性值
    Layui.prototype.getStyle = function(node, name){
        
        // currentStyle 仅限 ie 使用, 可以获取 class 或者 id 设置的样式
        // getComputedStyle chrome 使用, 可以获取 class 或者 id 设置的样式
        var style = node.currentStyle ? node.currentStyle : win.getComputedStyle(node, null);
        return style[style.getPropertyValue ? 'getPropertyValue' : 'getAttribute'](name);
    }

    // css 外部加载器
    Layui.prototype.link = function(href, fn, cssname){
        var that = this;
        var head = doc.getElementsByTagName('head')[0];
        var link = doc.createElement('link'); // 创建link

        // fn 为字符串类型时
        if(typeof fn === 'string') cssname = fn;
        
        // cssname 或者 href 中含有'.'或'/'时, 替换为空
        var app = (cssname || href).replace(/\.|\//g, '');
        var id = link.id = 'layuicss-' + app; // 为 link 标签创建 id 属性和值
        var STATUS_NAME = 'creating';
        var timeout = 0;

        link.rel = 'stylesheet';
        link.href = href + (config.debug ? '?v=' + (new Date()).getTime() : '');
        link.media = 'all'; // 设置媒体类型 更多内容查看 https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/link
        
        // doc 中没有相应id 则挂载 link
        if(!doc.getElementById(id)){
            head.appendChild(link);
        }

        // fn 不是函数, 则返回当前this, 后续不执行
        if(typeof fn !== 'function') return that;

        // 轮询监听 css 是否加载完毕
        (function poll(status){
            var delay = 100;
            var getLinkElem = doc.getElementById(id); // 获取动态插入的 link
            
            // 如果轮询超过指定秒数, 则视为请求文件失败或 css 文件不符合规范
            // 这里和之前模块加载轮询同样的道理
            if(++timeout > config.timeout * 1000 / delay){
               return error(href + 'timeout'); 
            }
            
            // 判断 css 是否加载就绪
            if(parseInt(that.getStyle(getLinkElem, 'width') === 1989)) {

                // 如果参数来自于初始轮询（即未加载就绪时的），则移除 link 标签状态
                if(status === STATUS_NAME) getLinkElem.removeAttribute('lay-status');
                
                // 如果 link 标签的状态仍为 '创建中', 则继续进入轮询, 直到状态改变, 则执行回调
                getLinkElem.getAttribute('lay-status') === STATUS_NAME ? setTimeout(poll, delay) : fn();
            } else {
                // css 加载未就绪
                getLinkElem.setAttribute('lay-status', STATUS_NAME); // 对节点设置设置属性和值, 用在 css 就绪时判断
                setTimeout(function(){
                    poll(STATUS_NAME);
                }, delay);
            }
        }());

        return that;
    };

    // css 内部加载器
    Layui.prototype.addcss = function(firename, fn, cssname){
        return layui.link(config.dir + 'css/' + firename, fn, cssname);
    }

    // 存储模块的回调
    config.callback = {};

    // 重新执行模块的工厂函数
    Layui.prototype.factory = function(modName){
        
        // 实例对象中存在 modName
        if(layui[modName]){
            return typeof config.callback[modName] === 'function'
            ? config.callback[modName]
            : null;
        }
    }

    // 图片预加载
    Layui.prototype.img = function(url, callback, error){
        var img = new Image(); // 创建 img
        img.src = url ; // 赋值 url
        
        // complete 更多内容查看 https://developer.mozilla.org/zh-CN/docs/Web/API/HTMLImageElement/complete
        if(img.complete){
            return callback(img);
        }
        
        img.onload = function(){
            img.onload = null ;; // 利于垃圾回收
            typeof callback === 'function' && callback(img);
        }

        img.onerror = function(e){
            img.onerror = null;
            typeof error === 'function' && error(e);
        }
    }

    // 全局配置
    Layui.prototype.config = function(options){
        options = options || {}; // 默认值为空对象
        for(var key in options){
            config[key] = options[key]; // 把 options 中的键值对赋值到 config 中
        }
        return this;
    }

    // 记录全部模块
    Layui.prototype.modules = function(){
        var clone = {};
        for(var o in modules) {
            clone[o] = modules[o];
        }
        return clone; // 返回克隆后的值
    }(); // 立即执行

    // 拓展模块
    Layui.prototype.extend = function(options){
        var that = this;

        // 验证模块是否被占用
        options = options || {};
        for(var o in  options){

            // 如果要拓展的模块已在当前模块中则报错
            if(that[o] || that.modules[o]){
                error(o + ' Module already exists', 'error');
            } else {
                that.modules[o] = options[o];
            }
        }

        return that;
    }

    // location.hash 路由解析 更多内容查看 https://developer.mozilla.org/zh-CN/docs/Web/API/Location/hash
    Layui.prototype.router = function(hash){
        var that = this;
        var hash = hash || location.hash; // 默认当前路由的 hash
        var data = {
            path: [],
            search: {},
            hash: (hash.match(/[^#](#.*$)/) || [])[1] || ''
        };
        // 正则表达式含义
        // [^#] 匹配除 # 之外的字符
        // (#.$) 匹配以 # 开始的字符, . 匹配单个字符，除了换行和行结束符
        
        // hash 中不以 #/ 开头的定为不符合规范
        if(!/^#\//.test(hash)) return data; // 禁止非路由规范
        hash = hash.replace(/^#\//, ''); // 移除以 #/ 开头的hash
        data.href = '/' + hash; // 向 data 对象中添加 href 属性和值
        hash = hash.replace(/([^#])(#.*$)/, '$1').split('/') || [];
        
        // 提取 hash 结构
        that.each(hash, function(index, item){
            /^\w+=/.test(item) ? function(){
                item = item.split('=');
                data.search[item[0]] = item[1];
            }() : data.path.push(item);
        });

        return data;
    }

    // URL 解析
    Layui.prototype.url = function(href){
        var that = this;
        var data = {

            // 提取 url 路径
            pathname: function(){

                // href 没有值, 就获取 pathname 值
                var pathname = href 
                    ? function(){

                        // 匹配形如 '.test/val' 这样的字符串
                        var str = (href.match(/\.[^.]+?\/.+/) || [])[0] || '';
                        return str.replace(/^[^\/]+/, '').replace(/\?.+/, ''); // 最终整理成 location.pathname 格式的字符串
                    }()
                    : location.pathname; // pathname 更多内容查看 https://developer.mozilla.org/en-US/docs/Web/API/Location/pathname
                    
                    /**
                     * 以数组形式返回值
                     * 
                     * 例如 pathname = '/en-US/docs/Web/API/Location/pathname'
                     * 返回的结果为 ['en-US', 'docs', 'Web', 'API', 'Location', 'pathname']
                     */
                    return pathname.replace(/^\//, '').split('/');
            }(),

            // 提取 url 参数
            search: function(){
                var obj = {};
                var search = (href
                    ? function(){
                        var str = (href.match(/\?.+/) || [])[0] || '';
                        return str.replace(/\#.+/, ''); 
                    }()
                    : location.search
                    ).replace(/^\?+/, '').split('&'); // 去除 ?, 按 & 分割参数
                    
                that.each(search, function(index, item){
                    var _index = item.indexOf('=');
                    var key = function(){ // 提取 key
                        if(_index < 0){
                            return item.substr(0, item.length);
                        } else if (_index === 0){
                            return false;
                        } else {
                            return item.substr(0, _index);
                        }
                    }();
                    
                    // 提取 value
                    if(key){
                        obj[key] = _index > 0 ? item.substr(_index + 1) : null;
                    }
                });

                return obj;   
            }(),

            // 提取 Hash
            hash : that.router(function(){
                return href 
                ? ((href.match(/#.+/) || [])[0] || '/')
                : location.hash;
            }())
        };

        return data;
    }

    // 本地持久性存储
    Layui.prototype.data = function(table, settings, storage){
       table = table || 'layui'; // 默认 layui
       storage = storage || localStorage; // 默认 localStorage
       
       // 如果没有 JSON 或者 parse, 则返回
       if(!win.JSON || !win.JSON.parse) return;
       
       // 如果 settings 为 null, 则删除表
       if(settings === null){
           return delete storage[table];
       }

       // 如果 setting 不为对象, 则封装为对象形式
       settings = typeof settings === 'object'
        ? settings
        : { key: settings };

        try {
            var data = JSON.parse(storage[table]);
        } catch (e) {
            var data = {};
        }

        // 如果 'value' 在 settings 对象中
        if('value' in settings) data[settings.key] = settings.value;
        
        // 如果 settings 中有 remove 属性, 则删除数据
        if(settings.remove) delete data[settings.key];

        // 存储数据
        storage[table] = JSON.stringify(data);

        return settings.key ? data[settings.key] : data;
    }

    // 本地会话性存储
    Layui.prototype.sessionData = function(table, settings){
        return this.data(table, settings, sessionStorage);
    }

    // 设备信息
    Layui.prototype.device = function(key){
        var agent = navigator.userAgent.toLowerCase(); // 获取 ua
        
        // 获取版本号
        var getVersion = function(label){
            var exp = new RegExp(label + '/([\^\\s\\_\\-]+)');
            label = (agent.match(exp) || [])[1];
            return label || false;
        }

        // 返回结果集
        var result = {
            os: function(){ // 底层操作系统
               if(/windows/.test(agent)){
                   return 'windows';
               } else if(/linux/.test(agent)){
                   return 'linux';
               } else if(/iphone|ipod|ipad|ios/.test(agent)){
                   return 'ios'; 
               } else if(/mac/.test(agent)){
                   return 'mac';
               }
            }(),
            ie: function(){ // ie 版本
                return (!!win.ActiveXObject || "ActiveXObject" in win) ? (
                    (agent.match(/msie\s(\d+)/) || [])[1] || '11' //由于 ie11 并没有 msie 的标识
                ) : false;
            }(),
            weixin: getVersion('micromessenger') // 是否是微信
        };

        // 任意的 key
        if(key && !result[key]){
            result[key] = getVersion(key);
        }

        // 移动设备
        result.android = /android/.test(agent);
        result.ios = result.os === 'ios';
        result.mobile = (result.android || result.ios) ? true : false;

        return result;
    }

    // 提示
    Layui.prototype.hint= function(){
        return {
            error: error
        }
    };

    // typeof 类型细分 -> string/number/boolean/undefined/null, object/array/function/...
    Layui.prototype._typeof = function(operand){
        
        // 如果是 null,返回字符串 null
        if(operand === null) return String(operand);
        
        return (typeof operand === 'object' || typeof operand === 'function')
        ? function(){
            // 如果 operand 为 object 或者 function
            // Object.prototype.toString 方法返回一个表示该对象的字符串。更多内容查看 https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Object/toString
            var type = Object.prototype.toString.call(operand).match(/\s(.+)\]$/) || []; // 匹配类型字符 例如 [object Object] ->  Object]
            var classType = 'Function|Array|Date|RegExp|Object|Error|Symbol'; // 常见类型字符
            
            type = type[1] || 'Object'; // 默认 Object

            // 除匹配到的类型外, 其他对象均返回 object
            return new RegExp('\\b(' + classType + ')\\b').test(type)
            ? type.toLowerCase()
            : 'object';
        }() : typeof operand;
    };

    // 对象是否具备数组结构 ( 此处为兼容 jQuery 对象)
    Layui.prototype._isArray = function (obj) {
        var that = this;
        var len;
        var type = that._typeof(obj);

        /**
         * 1. obj 为空 或 undefined
         * 2. obj 不为 object
         * 3. obj 为 win
         * 返回 false
         */
        if(!obj || (typeof obj !== 'object') || obj === win) return false;

        len = 'length' in obj && obj.length; // 兼容 ie
        return type === 'array' || len === 0 || (
            typeof len === 'number' && len > 0 && (len - 1) in obj // 兼容 jQuery 对象
        )
    };

    // 遍历 (内部迭代)
    Layui.prototype.each = function (obj, fn) {
        var key;
        var that = this;
        var callFn = function (key, obj) { // 回调函数
            return fn.call(obj[key], key, obj[key]);
        };

        // fn 不为 function 类型, 返回that
        if(typeof fn !== 'function') return that;

        // 优先处理数组结构
        if(that._isArray(obj)){
            for(key = 0; key < obj.length; key++){

                // 返回 true 时, 不执行
                if(callFn(key, obj)) break;
            }
        } else {
            for(key in obj){
                if(callFn(key, obj)) break;
            }
        }
        return that;
    };

    // 将数组中的对象按其某个成员排序
    Layui.prototype.sort = function(obj, key, desc){
        var clone = JSON.parse(
            JSON.stringify(obj || [])
        ); // 深拷贝
        
        // 没有 key 时, 返回 clone
        if(!key) return clone;
        
        // 如果是数字, 按大小排序; 非数字, 则按字典序排序
        // 使用元素 sort
        clone.sort(function(o1,o2){
            var v1 = o1[key];
            var v2 = o2[key];
            var isNum = [
                !isNaN(v1),
                !isNaN(v2)
            ]; // isNaN() 函数用于检查其参数是否是非数字值; 如果参数值为 NaN 或字符串、对象、undefined等非数字值则返回 true, 否则返回 false。

            // 若为数字比较
            if(isNum[0] && isNum[1]){
                if(v1 && (!v2 && v2 !== 0)){ // 数字 vs 空
                    return 1;
                } else if ((!v1 && v1 !== 0) && v2){ // 空 vs 数字 
                    return -1;
                } else { // 数字 vs 数字
                    return v1 - v2;
                }
            };

            // 字典序排序
            if(!isNum[0] && !isNum[1]){
                
                // 字典序比较
                if(v1 > v2){
                    return 1;
                } else if (v1 < v2) {
                    return -1;
                } else {
                    return 0;
                }
            }

            // 混合比较
            if(isNum[0] || !isNum[1]){ // 数字 vs 非数字
                return -1;
            } else if (!isNum[0] || isNum[1]){ // 非数字 vs 数字
                return 1;
            }
        });

        desc && clone.reverse(); // 倒序
        return clone;
    };

    // 阻止事件冒泡
    Layui.prototype.stope = function(thisEvent){
        
        // window.event 是一个由微软IE引入的属性，只有当DOM事件处理程序被调用的时候会被用到。它的值是当前正在处理的事件对象。
        thisEvent = thisEvent || win.event; // 默认 window.event 
        try {
            
            // Event 接口的 stopPropagation() 方法阻止捕获和冒泡阶段中当前事件的进一步传播。但是，它不能防止任何默认行为的发生
            thisEvent.stopPropagation(); // 更多内容查看 https://developer.mozilla.org/zh-CN/docs/Web/API/Event/stopPropagation
        } catch (e) {

            // Event.cancelBubble 属性是 Event.stopPropagation()的一个曾用名。在从事件处理程序返回之前将其值设置为true可阻止事件的传播。
            thisEvent.cancelBubble = true;
        };
    };

    // 字符常理
    var EV_REMOVE = 'LAYUI-EVENT-REMOVE';

    // 自定义模块事件
    Layui.prototype.onevent = function(modName, events, callback){
        
        // modName 不为字符串或者 callback 不为函数, 则返回 this
        if(
            typeof modName !== 'string'
            || typeof callback !== 'function'
        ) return this;
        
        return Layui.event(modName, events, null, callback);
    };

    // 执行自定义模块事件
    // Layui.event 静态属性
    Layui.prototype.event = Layui.event = function(modName, events, params, fn){
        var that = this;
        var result = null;
        var filter = (events || '').match(/\((.*)\)$/) || []; // 提取事件过滤器字符结构, 如: select(xxx)
        var eventName = (modName + '.' + events).replace(filter[0], ''); // 获取事件名称, 如: form.select
        var filterName = filter[1] || ''; // 获取过滤器名称, 如: xxx
        var callback = function(_, item){
            var res = item && item.call(that, params);
            res === false && result === null && (result = false);
        };

        // 如果参数传入特定字符, 则执行移除事件
        if(params === EV_REMOVE){
            delete (that.cache.event[eventName] || {})[filterName];
            return that;
        }

        // 添加事件
        if(fn){
            config.event[eventName] = config.event[eventName] || {};

            // 这里不再对重复事件做支持
            config.event[eventName][filterName] = [fn];
            return this;
        }

        // 执行事件回调
        layui.each(config.event[eventName], function(key, item){

            // 执行当前模块的全部事件
            if(filterName === '{*}'){
                layui.each(item, callback);
                return;
            }

            // 执行指定事件
            key === '' && layui.each(item, callback);
            (filterName && key === filterName) && layui.each(item, callback);
        });

        return result;
    };

    // 新增模块事件
    Layui.prototype.on = function(events, modName, callback){
        var that = this;
        return that.onevent.call(that, modName, events, callback);
    }

    // 移除模块事件
    Layui.prototype.off = function(events, modName){
        var that = this;
        return that.event.call(that, modName, events, EV_REMOVE);
    }
    win.layui = new Layui();
}(window);