layui.define('jquery', function(exports){
    "use strict";

    var $ = layui.$;
    var hint = layui.hint();

    // 外部接口
    var util = {

        /**
         * 固定块
         * options 对象包含一下属性值
         * 参数             类型                   描述
         * bar1             Boolean/String         默认false。如果值为true，则显示第一个bar，带有一个默认图标。如果值为图标字符，则显示第一个bar，并覆盖默认图标 
         * bar2             Boolean/String         默认false。如果值为true，则显示第二个bar，带有一个默认图标。如果值为图标字符，则显示第二个bar，并覆盖默认图标 
         * bgcolor          String                 自定义区块背景色
         * showHeight       Number                 用于控制出现TOP按钮的滚动条高度临界值。默认：200
         * css              Object                 你可以通过重置bar的位置，比如 css: {right: 100, bottom: 100}
         * click            Function               点击bar的回调，函数返回一个type参数，用于区分bar类型。支持的类型有：bar1、bar2、top    
         */
        fixbar: function(options){
            var ELEM = 'layui-fixbar';
            var TOP_BAR = 'layui-fixbar-top';
            var dom = $(document); // 获取 document
            var body = $('body'); // 获取 body
            var is, timer;

            // extend() 函数用于将一个或多个对象的内容合并到目标对象 (深浅拷贝)
            options = $.extend({
                showHeight: 200 // 出现 TOP 的滚动条高度临界值
            }, options);

            // (bar1, bar2, bgcolor) 如果是 true 则使用预设, 不是则使用用户配置的
            options.bar1 = options.bar1 === true ? '&#xe606;' : options.bar1;
            options.bar2 = options.bar2 === true ? '&#xe607;' : options.bar2;
            options.bgcolor = options.bgcolor ? ('background-color:' + options.bgcolor) : '';

            var icon = [options.bar1, options.bar2, '&#xe604;']; // 图标: 信息、问好、TOP
            var elem = $([
                '<ul class="'+ ELEM +'">',
                options.bar1 ? '<li class="layui-icon" lay-type="bar1" style="' + options.bgcolor + '">'+ icon[0] +'</li>': '', // 当用户设置的 bar1 为 false 时, 返回 ''
                options.bar2 ? '<li class="layui-icon" lay-type="bar2" style="'+ options.bgcolor +'">'+ icon[1] +'</li>': '',
                '<li class="layui-icon '+ TOP_BAR + '" lay-type="top" style="'+ options.bgcolor +'">'+ icon[2] +'</li>', // 回到顶部
                '</ul>'
            ].join(''));
            var topBar = elem.find('.'+TOP_BAR); // 获取回到顶部 dom
            var scroll = function(){
                var stop = dom.scrollTop(); // scrollTop() 方法设置或返回被选元素的垂直滚动条位置
                if(stop >= (options.showHeight)) {
                    
                    // 当距离顶部的距离 大于等于 临界点时, 显示回到顶部
                    is || (topBar.show(), is = 1);
                } else {
                    
                    // 否则不显示
                    is && (topBar.hide(), is = 0);
                }
            };

            // 如果没有 layui-fixbar 类, 后续不再执行
            if($('.'+ ELEM)[0]) return;

            // 如果 options.css 为对象, 则添加样式值
            typeof options.css === 'object' && elem.css(options.css); // css() 方法设置或返回被选元素的一个或多个样式属性
            body.append(elem); // 挂载 dom
            scroll(); // 执行 scroll 函数

            elem.find('li').on('click', function(){
                var othis = $(this);
                var type = othis.attr('lay-type');
                
                // 自定义属性值为 'top'
                if(type === 'top'){
                    console.log('top');
                    $('html,body').animate({
                        scrollTop: 0
                    }, 200); // 滚动条滑动到顶部
                }

                //用户设置 click 属性时, 显示绑定并调用函数
                options.click && options.click.call(this, type);
            });

            // TOP 显示控制
            dom.on('scroll', function(){
                clearInterval(timer);
                timer = setTimeout(function(){
                    scroll();
                }, 100);
            });
        },

        /**
         * 倒计时
         * @param {*} endTime 结束时间戳或Date对象，如：4073558400000，或：new Date(2099,1,1).
         * @param {*} serverTime 当前服务器时间戳或Date对象
         * @param {*} callback 回调函数。如果倒计时尚在运行，则每一秒都会执行一次。并且返回三个参数： date（包含天/时/分/秒的对象）、 serverTime（当前服务器时间戳或Date对象）, timer（计时器返回的ID值，用于clearTimeout）
         */
        countdown: function(endTime, serverTime, callback){
            var that = this;
            var type = typeof serverTime === 'function';
            var end = new Date(endTime).getTime(); // getTime() 方法可返回距 1970 年 1 月 1 日之间的毫秒数
            var now = new Date((!serverTime || type) ? new Date().getTime() : serverTime).getTime();
            var count = end - now;

            // 通过 getTime 返回的数值是毫秒, 所以要除以 1000 转为 秒
            // 注意: 秒 % 60 为当前秒数，如果不 % 60 则为总秒数。同样的道理，分钟 %60、小时 %24
            var time = [
                Math.floor(count/(1000*60*60*24)), // 天
                Math.floor(count/(1000*60*60)) % 24, // 时
                Math.floor(count/(1000*60)) % 60, // 分
                Math.floor(count/1000) % 60 // 秒
            ];

            // 如果 serverTime 是函数, 赋值 callback
            if(type) callback = serverTime;

            // 注意: 不是递归 (知识点: 宏任务和微任务)
            var timer = setTimeout(function(){
                that.countdown(endTime, now + 1000, callback);
            }, 1000); // 间隔 1 秒 

            callback && callback(count > 0 ? time : [0,0,0,0], serverTime, timer);
            
            // 截至条件
            if(count <= 0) clearTimeout(timer);
            return timer;
        },

        /**
         * 某个时间在当前时间的多久前
         * @param {*} time 某个时间的时间戳或日期对象
         * @param {*} onlyDate 是否在超过30天后，只返回日期字符，而不返回时分秒
         */
        timeAgo: function(time, onlyDate){
            var that = this;
            var arr = [[], []]; // 二维数组存储时间 (不错的处理形式)
            var stamp = new Date().getTime() - new Date(time).getTime(); // 当前时间戳 - 过去某个时刻时间戳

            // 返回具体时间
            if(stamp > 1000*60*60*24*31){ // 时间戳大于31天
                stamp = new Date(time);

                // 存储 年 月 日
                arr[0][0] = that.digit(stamp.getFullYear(), 4);
                arr[0][1] = that.digit(stamp.getMonth() + 1);
                arr[0][2] = that.digit(stamp.getDate());
                
                // 是否输出时间
                if(!onlyDate){
                    arr[1][0] = that.digit(stamp.getHours());
                    arr[1][1] = that.digit(stamp.getMinutes());
                    arr[1][2] = that.digit(stamp.getSeconds());
                }
                return arr[0].join('-') + ' ' + arr[1].join(':');
            }

            // 30 天以内，返回 "多久前"
            if(stamp >= 1000*60*60*24){
                return ((stamp/1000/60/60/24|0)) + '天前';
            } else if(stamp >= 1000*60*60){
                return ((stamp/1000/60/60)|0)+ '小时前';
            } else if(stamp >= 1000*60*3){ // 3分钟以内为: 刚刚
                return ((stamp/1000/60)|0)+ '分钟前';
            } else if(stamp < 0){
                return '未来';
            } else {
                return '刚刚';
            }
        },

        /**
         * 数字前置补零 (带有小数点的数值不准确)
         * @param {*} num 原始数字
         * @param {*} length 数字长度，如果原始数字长度小于 length，则前面补零，如：util.digit(7, 3) //007
         */
        digit: function(num, length){
           var str = '';
           var num =String(num); // 任何类型转为字符串类型
           var length = length || 2; // 默认 2
           
           // 如果 num 中有小数点, 小数点也是一位
           for(var i = num.length; i < length; i++){
               str += '0';
           } 

           /**
            * 注意: 这是使用了按位运算符
            * 什么是位运算？
            * 位运算是在数字底层（即表示数字的 32 个数位）进行运算的。由于位运算是低级的运算操作，所以速度往往也是最快的（相对其它运算如加减乘除来说），并且借助位运算有时我们还能实现更简单的程序逻辑,缺点是很不直观，许多场合不能够使用。
            * 位运算只对整数起作用，如果一个运算子不是整数，会自动转为整数后再运行。虽然在 JavaScript 内部，数值都是以64位浮点数的形式储存，但是做位运算的时候，是以32位带符号的整数进行运算的，并且返回值也是一个32位带符号的整数。
            * 更多内容查看 https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Operators/Bitwise_OR
            */
           return num < Math.pow(10, length) ? str + (num|0) : num;
        },
        
        /**
         * 转化时间戳或日期对象为日期格式字符
         * @param {*} time 可以是日期对象，也可以是毫秒数
         * @param {*} format 日期字符格式（默认：yyyy-MM-dd HH:mm:ss），可随意定义，如：yyyy年MM月dd日
         * 注意: 该函数只是对时间做了简单的格式化, 比较复杂的并没有支持. 比如 'yyyy-M-dd HH:mm:ss' 这样格式的日期等等
         */
        toDateString: function(time, format){
            
            // 若 null 或空字符, 则返回空字符
            if(time === null || time === '') return '';

            var that = this;
            var date = new Date(function(){
                if(!time) return; // 注意: 对 time 类型并没有全部判断, 如果上面的判断time类型全部通过
                // 就会继续执行, 最后把不符合规定参数(time) 传给 Date, 最后生成的 date 也是不符合预期的。
                
                /**
                 * 判断 time 是否是非数字值
                 * isNaN() 如果参数值为 NaN 或字符串、对象、undefined等非数字值则返回 true, 否则返回 false
                 */
                return isNaN(time) ? time : (typeof time === 'string' ? parseInt(time) : time);
            }() || new Date());
            var ymd = [
                that.digit(date.getFullYear(), 4),
                that.digit(date.getMonth() + 1),
                that.digit(date.getDate())
            ]; // 年 月 日
            var hms = [
                that.digit(date.getHours()),
                that.digit(date.getMinutes()),
                that.digit(date.getSeconds())
            ]; // 时 分 秒

            // 如果当前月不存在这一天, 则报错
            if(!date.getDate()) return hint.error('Invalid Msec for "util.toDateString(Msec)"'),'';
            
            format = format || 'yyyy-MM-dd HH:mm:ss'; // 默认 'yyyy-MM-dd HH:mm:ss' 格式日期
            return format.replace(/yyyy/g, ymd[0])
            .replace(/MM/g, ymd[1])
            .replace(/dd/g, ymd[2])
            .replace(/HH/g, hms[0])
            .replace(/mm/g, hms[1])
            .replace(/ss/g, hms[2]);
        },

        /**
         * 转义 html，防 xss 攻击
         * @param {*} html 任意字符
         */
        escape: function(html){

            // 和 code 模块中转义 html 代码一样这里不再赘述
            return String(html || '')
            .replace(/&(?!#?[a-zA-Z0-9]+;)/g, '&amp;')
            .replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/'/g, '&#39;').replace(/"/g, '&quot;');
        },

        // 还原转义的 html
        unescape: function(str){
            return String(str || '').replace(/\&amp;/g, '&')
            .replace(/\&lt;/g, '<').replace(/\&gt;/g, '>')
            .replace(/\&#39;/, '\'').replace(/\&quot;/, '"');
        },

        // 让指定的元素保持在可视区域 (该函数在官方文档中并没有提到，可能已经弃用)
        toVisibleArea: function(options){
            options = $.extend({
                margin: 160, // 触发动作的边界值
                duration: 200, // 动画持续毫秒数
                type: 'y' // 触发方向，x 水平、y 垂直
            }, options); // 合并对象

            // 当 scrollElem 或者 thisElem 中无值时, 后续不执行
            if(!options.scrollElem[0] || !options.thisElem[0]) return;
            
            var scrollElem = options.scrollElem; // 滚动元素
            var thisElem = options.thisElem; // 目标元素
            var vertical = options.type === 'y'; // 是否垂直方向
            var SCROLL_NAME = vertical ? 'scrollTop' : 'scrollLeft'; // 滚动方法
            var OFFSET_NAME = vertical ? 'top' : 'left'; // 坐标方式
            var scrollValue = scrollElem[SCROLL_NAME](); // 当前滚动距离
            var size = scrollElem[vertical ? 'height' : 'width'](); // 滚动元素的尺寸
            var scrollOffet = scrollElem.offset()[OFFSET_NAME]; // 滚动元素所处的位置
            var thisOffset = thisElem.offset()[OFFSET_NAME] - scrollOffet; // 目标元素当前的所在位置
            var obj = {};

            // 边界满足条件
            if(thisOffset > size - options.margin || thisOffset < options.margin){
                obj[SCROLL_NAME] = thisOffset - size/2 + scrollValue;
                scrollElem.animate(obj, options.duration);
            }
        },

        /**
         * 批量事件
         * @param {*} attr 绑定需要监听事件的元素属性
         * @param {*} obj 事件回调链
         * @param {*} eventType 事件类型（默认 click）
         */
        event: function(attr, obj, eventType){
            var _body = $('body');
            var eventType = eventType || 'click'; // 默认事件类型为 click

            // 记录事件回调集合
            obj = util.event[attr] = $.extend(true, util.event[attr], obj) || {}; // 深拷贝
            
            // 清除委托事件
            util.event.UTIL_EVENT_CALLBACK = util.event.UTIL_EVENT_CALLBACK || {};
            _body.off(eventType, '*['+ attr +']', util.event.UTIL_EVENT_CALLBACK[attr]); // off() 方法通常用于移除通过 on() 方法添加的事件处理程序

            // 绑定委托事件
            util.event.UTIL_EVENT_CALLBACK[attr] = function(){
                var othis = $(this); // 点击的元素
                var key = othis.attr(attr);
                (typeof obj[key] === 'function' && obj[key].call(this, othis));
            };

            /**
             * 清除旧事件, 绑定新事件
             * $(selector).on(event,childSelector,data,function)
             * event            必需      规定要从被选元素添加的一个或多个事件或命名空间。由空格分隔多个事件值，也可以是数组。必须是有效的事件。
             * childSelector    可选      规定只能添加到指定的子元素上的事件处理程序（且不是选择器本身，比如已废弃的 delegate() 方法）。
             * data             可选      规定传递到函数的额外数据。
             * function         可选      规定当事件发生时运行的函数。
             */
            _body.on(eventType, '*['+ attr +']', util.event.UTIL_EVENT_CALLBACK[attr]);  // *[ attr ] 选择所有包含 attr 的元素

            return obj;
        }
    };

    // 导出模块
    exports('util', util);
});