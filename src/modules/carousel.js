layui.define('jquery', function(exports){
    "use strict"; // 严格模式

    var $ = layui.$;
    var hint = layui.hint();

    // 外部接口
    var carousel = {
        config: {}, // 全局配置
        
        // set 函数 设置全局项
        set: function(options){
            var that = this;
            that.config = $.extend({}, that.config, options);
            
            return that;
        },

        // 事件
        on: function(events, callback){
            return layui.onevent.call(this, MOD_NAME, events, callback);
        }
    };

    // 字符常量
    var MOD_NAME = 'carousel'; // 模块名
    var ELEM = '.layui-carousel'; // 元素
    var THIS = 'layui-this';
    var SHOW = 'layui-show'; // 显示 类名
    var HIDE = 'layui-hide'; // 隐藏 类名
    var DISABLED = 'layui-disabled'; // 无效 类名
    var ELEM_ITEM = '>*[carousel-item]>*'; // 轮播 item 
    var ELEM_LEFT = 'layui-carousel-left'; // 元素左边
    var ELEM_RIGHT = 'layui-carousel-right'; // 元素右边
    var ELEM_PREV = 'layui-carousel-prev'; // 元素上一个
    var ELEM_NEXT = 'layui-carousel-next'; // 元素下一个
    var ELEM_ARROW = 'layui-carousel-arrow'; // 元素箭头
    var ELEM_IND = 'layui-carousel-ind'; // 元素序号

    /**
     * 构造器
     * options 对象包含一下属性值
     * 参数选项          类型                默认值         说明    
     * elem             string/object       无             指向容器选择器
     * width            string              '600px'        设定轮播容器宽度，支持像素和百分比
     * height           string              '280px'        设定轮播容器高度，支持像素和百分比
     * full             boolean             false          是否全屏轮播
     * anim             string              'default'      轮播切换动画方式，可选值为：default（左右切换）、updown（上下切换）、fade（渐隐渐显切换）
     * autoplay         boolean             true           是否自动切换                            
     * interval         number              3000           自动切换的时间间隔，单位：ms（毫秒），不能低于800
     * index            number              0              初始开始的条目索引
     * arrow            string              'hover'        切换箭头默认显示状态，可选值为：hover（悬停显示）、always（始终显示）、none（始终不显示）
     * indicator        string              'inside'       指示器位置，可选值为：inside（容器内部）、outside（容器外部）、none（不显示）注意：如果设定了 anim:'updown'，该参数将无效
     * trigger          string              'click'        指示器的触发事件 
     */
    var Class = function(options){
        var that = this;
        that.config = $.extend({}, that.config, carousel.config, options);
        that.render();
    };

    // 默认配置
    Class.prototype.config = {
        width: '600px',
        height: '280px',
        full: false, // 是否全屏
        arrow: 'hover', // 切换箭头默认显示状态：hover/always/none
        indicator: 'inside', // 指示器位置: inside/outside/none
        autoplay: true, // 是否自动切换
        interval: 3000, // 自动切换的时间间隔，不能低于800ms
        anim: '', // 动画类型: default/updown/fade
        trigger: 'click', // 指示器的触发方式: click/hover
        index: 0 // 初始开始的索引
    };

    // 轮播渲染
    Class.prototype.render = function(){
        var that = this;
        var options = that.config; // 获取当前配置
        options.elem = $(options.elem); // 获取 dom

        // 如果获取不到 dom 时, 后续不执行
        if(!options.elem[0]) return;
        that.elemItem = options.elem.find(ELEM_ITEM); // 获取轮播 item
        
        // 如果索引小于 0, 默认索引为 0
        if(options.index < 0) options.index = 0;

        // 如果索引大于轮播总的 item, 默认总的 item - 1;
        if(options.index >= that.elemItem.length) options.index = that.elemItem.length - 1;
        
        // 自动切换间隙小于 800，默认 800
        if(options.interval < 800) options.interval = 800;

        // 是否全屏模式
        if(options.full){
            
            // 添加全屏样式
            options.elem.css({
                position: 'fixed',
                width: '100%',
                height: '100%',
                zIndex: 9999
            });
        } else {

            // 添加用户设置宽高
            options.elem.css({
                width: options.width,
                height: options.height
            });
        }

        // 设置动画类型
        options.elem.attr('lay-anim', options.anim);

        // 初始焦点状态
        that.elemItem.eq(options.index).addClass(THIS);

        // 当总的 item小于等于 1 时, 后续不执行
        if(that.elemItem.length <= 1) return; // 指示器等动作
        that.indicator();
        that.arrow();
        that.autoplay();
        that.events();
    };

    // 重置轮播
    Class.prototype.reload = function(options){
       var that = this;
       clearInterval(that.timer); // 清除定时器
       that.config = $.extend({}, that.config, options);
       that.render(); // 重置执行 render     
    };

    // 获取上一个等待条目的索引
    Class.prototype.prevIndex = function(){
       var that = this;
       var options = that.config; // 获取配置
       
       var prevIndex = options.index - 1; // 获取上个条目
       
       // 如果上个条目索引小于 0，获取上轮轮播最后一个条目索引赋值给 prevIndex
       if(prevIndex < 0){
           prevIndex = that.elemItem.length - 1;
       }
       return prevIndex;
    };

    // 获取下一个等待条目的索引
    Class.prototype.nextIndex = function(){
        var that = this;
        var options = that.config; // 获取配置

        // 获取下个条目索引
        var nextIndex = options.index + 1;

        // 如果下个条目大于总的 item 长度, 则赋值为 0
        if(nextIndex >= that.elemItem.length){
           nextIndex = 0; 
        }
        return nextIndex;
    };

    // 索引递增
    Class.prototype.addIndex = function(num){
        var that = this;
        var options = that.config; // 获取配置

        num = num || 1; // 默认为 1
        options.index = options.index + num;

        // index 不能超过轮播总数量
        if(options.index >= that.elemItem.length){
            options.index = 0;
        }
    };

    // 索引递减
    Class.prototype.subIndex = function(num){
        var that = this;
        var options = that.config;

        num = num || 1; 
        options.index = options.index - num;

        // index 不能超过轮播总数量
        if(options.index < 0) {
            options.index = that.elemItem.length - 1;
        }
    };

    // 自动轮播
    Class.prototype.autoplay = function(){
       var that = this;
       var options = that.config;
       
       // 如果用户没有设置轮播，后续不执行
       if(!options.autoplay) return;
       clearInterval(that.timer); // 清除定时器

       // 设置定时器
       that.timer = setInterval(function(){
        that.slide();
       }, options.interval);
    };

    // 箭头
    Class.prototype.arrow = function(){
        var that = this;
        var options = that.config;

        // 箭头模板
        var tplArrow = $([
           '<button class="layui-icon '+ ELEM_ARROW +'" lay-type="sub">'+ (options.anim === 'updown' ? '&#xe619;' : '&#xe603;') + '</button>',
           '<button class="layui-icon '+ ELEM_ARROW + '" lay-type="add">'+ (options.anim === 'updown' ? '&#xe61a;' : '&#xe602;') + '</button>'
        ].join(''));

        // 设置切换箭头默认显示状态
        options.elem.attr('lay-arrow', options.arrow);

        // 防止重复插入箭头
        if(options.elem.find('.'+ELEM_ARROW)[0]){
            options.elem.find('.'+ELEM_ARROW).remove(); // 移除重复的箭头 dom
        }
        options.elem.append(tplArrow); // 挂载

        // 为箭头添加 click 事件
        tplArrow.on('click', function(){
            var othis = $(this);
            var type = othis.attr('lay-type');
            that.slide(type);
        })
    };

    // 指示器
    Class.prototype.indicator = function(){
        var that = this;
        var options = that.config; // 获取配置

        // 生成指示器模板
        var tplInd = that.elemInd = $([
            '<div class="'+ ELEM_IND +'"><ul>',
            function(){
                var li = [];
                layui.each(that.elemItem, function(index){

                    // 生成 li
                    li.push('<li'+ (options.index === index ? ' class="layui-this"' : '') +'></li>');
                });
                return li.join('');
            }(),
            '</ul></div>'
        ].join(''));

        // 设置指示器位置
        options.elem.attr('lay-indicator', options.indicator);

        // 防止重复插入指示器
        if(options.elem.find('.'+ELEM_IND)[0]){
            options.elem.find('.'+ELEM_IND).remove();
        };
        options.elem.append(tplInd); // 挂载

        if(options.anim === 'updown'){
            tplInd.css('margin-top', -(tplInd.height()/2));
        }

        // 为指示器每个 li 添加事件
        tplInd.find('li').on(options.trigger === 'hover' ? 'mouseover' : options.trigger, function(){
            var othis = $(this);
            var index = othis.index(); // index() 方法返回指定元素相对于其他指定元素的 index 位置

            // 点击的条目索引大于条目索引(动态变化)
            if(index > options.index){
                that.slide('add', index - options.index);
            } else if(index < options.index){
                that.slide('sub', options.index - index);
            }
        });
    };

    // 滑动切换
    Class.prototype.slide = function(type, num){
        var that = this;
        var elemItem = that.elemItem; // 获取轮播 item
        var options = that.config; // 获取配置
        var thisIndex = options.index; // 获取当前索引
        var filter = options.elem.attr('lay-filter'); // 获取自定义属性

        // 处于滑动时，后续不执行
        if(that.haveSlide) return;

        // 滑动方向
        if(type === 'sub'){ // 递减
            that.subIndex(num);

            // 添加过度类
            elemItem.eq(thisIndex).addClass(ELEM_PREV);
            setTimeout(function(){
                elemItem.eq(thisIndex).addClass(ELEM_RIGHT);
                elemItem.eq(options.index).addClass(ELEM_RIGHT);
            }, 50)
        } else {
            that.addIndex(num);

            // 添加过度类
            elemItem.eq(options.index).addClass(ELEM_NEXT);
            setTimeout(function(){
                elemItem.eq(thisIndex).addClass(ELEM_LEFT);
                elemItem.eq(options.index).addClass(ELEM_LEFT);
            }, 50);
        };

        // 移除过度类
        setTimeout(function(){
            elemItem.removeClass(THIS + ' ' + ELEM_PREV + ' ' + ELEM_NEXT + ' ' + ELEM_LEFT + ' ' + ELEM_RIGHT);
            elemItem.eq(options.index).addClass(THIS);
            that.haveSlide = false; //解锁
        }, 300);

        // 指示器焦点变化
        that.elemInd.find('li').eq(options.index).addClass(THIS)
        .siblings().removeClass(THIS);

        that.haveSlide = true;

        // 添加自定义模块事件
        layui.event.call(this, MOD_NAME, 'change('+ filter +')', {
            index: options.index,
            prevIndex: thisIndex,
            item: elemItem.eq(options.index)
        });
    };

    // 事件处理
    Class.prototype.events = function(){
        var that = this;
        var options = that.config;

        if(options.elem.data('havaEvents')) return;

        // 移入移出容器
        options.elem.on('mouseenter', function(){
            clearInterval(that.timer);
        }).on('mouseleave', function(){
            that.autoplay();
        });

        options.elem.data('haveEvents', true);
    };

    // 核心入口
    carousel.render = function(options){
        var inst = new Class(options);
        return inst;
    };

    // 模块导出
    exports(MOD_NAME, carousel);
});