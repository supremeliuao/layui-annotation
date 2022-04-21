layui.define('jquery', function(exports){
    "use strict"; // 严格模式

    var $ = layui.$;
    var Flow = function(options){}; // 声明 Flow 函数
    var ELEM_MORE = 'layui-flow-more'; // 加载更多类
    var ELEM_LOAD = '<i class="layui-anim layui-anim-rotate layui-anim-loop layui-icon ">&#xe63e;</i>'; // loading

    /**
     * 主方法
     * options 对象包含一下属性值
     * 参数             类型            描述
     * elem             string         指定列表容器的选择器
     * scrollElem       string         滚动条所在元素选择器，默认document。如果你不是通过窗口滚动来触发流加载，而是页面中的某一个容器的滚动条，那么通过该参数指定即可。
     * isAuto           boolean        是否自动加载。默认true。如果设为false，点会在列表底部生成一个“加载更多”的button，则只能点击它才会加载下一页数据。
     * end              string         用于显示末页内容，可传入任意HTML字符。默认为：没有更多了
     * isLazyimg        boolean        是否开启图片懒加载。默认false。如果设为true，则只会对在可视区域的图片进行按需加载。但与此同时，在拼接列表字符的时候，你不能给列表中的img元素赋值src，必须要用lay-src取代
     * mb               number         与底部的临界距离，默认50。即当滚动条与底部产生该距离时，触发加载。注意：只有在isAuto为true时有效。 
     * done             function       到达临界点触发加载的回调。信息流最重要的一个存在。携带两个参数：
     */
    Flow.prototype.load = function(options){
        var that = this; // 保存 this
        var page = 0; // 当前页
        var lock; // 锁
        var isOver;
        var lazyimg;
        var timer; // 定时器 id
        var options = options || {}; // 默认 {}

        var elem = $(options.elem); // 通过 jquery 获取 dom 集合
        if(!elem[0]) return; // 如果数组中第一个元素没有, 则直接 return
        var scrollElem = $(options.scrollElem || document); // 滚动条所在元素, 默认 document
        var mb = options.mb || 50; // 与底部的临界距离
        var isAuto = 'isAuto' in options ? options.isAuto : true; // 是否自动滚动加载
        var end = options.end || '没有更多了'; // “末页”显示文案    
    
        // 滚动条所在元素是否为 document
        var notDocment = options.scrollElem && options.scrollElem !== document;
        
        // 加载更多
        var ELEM_TEXT = '<cite>加载更多</cite>';
        var more = $('<div class="layui-flow-more"><a href="javascript:;">'+ ELEM_TEXT +'</a></div>');
        
        // 当没有 layui-flow-more 类时, 把
        if(!elem.find('.layui-flow-more')[0]){
            elem.append(more); // 在 elem 内最后同级一个元素下插入 more
        }
        
        // 加载下一个元素
        var next = function(html, over){
            html = $(html); // 把传入的内容变为节点
            more.before(html); // before() 方法在被选元素之前插入指定的内容
            over = over == 0 ? true : null; // over == 0 存在隐式转换

            // over 为 true 时, 把 '加载更多' 变为 '没有更多了', 否则还为 '加载更多'
            over ? more.html(end) : more.find('a').html(ELEM_TEXT); // html() 方法设置或返回被选元素的内容（innerHTML）
            isOver = over; // 保存当前 over
            lock = null;
            lazyimg && lazyimg();
        };

        // 触发请求
        var done = function(){
            lock = true; // 加锁, 防止在加载中点击加载图案, 触发不必要行为
            more.find('a').html(ELEM_LOAD); // 显示加载 loading
            typeof options.done === 'function' && options.done(++page, next); // 先执行自加操作，再引用 page 值
        };

        done();

        // 不自动滚动加载
        more.find('a').on('click', function(){
            var othis = $(this);

            // 当底部文案为'没有更多了'时, 直接 return
            if(isOver) return;
            lock || done(); // 加锁时, done 函数不执行
        });

        // 如果允许图片懒加载
        if(options.isLazyimg){
            var lazyimg = that.lazyimg({
                elem: options.elem + ' img',
                scrollElem: options.scrollElem
            })
        }
        
        // 如果为 false 不执行后续自动加载
        if(!isAuto) return that;

        scrollElem.on('scroll', function(){
            var othis = $(this); // 当前 html 元素
            var top = othis.scrollTop(); // scrollTop() 方法设置或返回被选元素的垂直滚动条位置
            
            // 有定时器, 则清除定时器
            if(timer) clearTimeout(timer);

            if(isOver || !elem.width()) return; // 如果已经结束, 或者元素处于隐藏状态, 则不执行加载
            
            timer = setTimeout(function(){

                // 计算滚动所在容器的可视高度
                var height = notDocment ? othis.height() : $(window).height(); // 当没有挂载到 document 上时, 返回当前元素高度
                
                // 计算滚动所在容器的实际高度
                var scrollHeight = notDocment
                ? othis.prop('scrollHeight')
                : document.documentElement.scrollHeight; // 这个只读属性是一个元素内容高度的度量，包括由于溢出导致的视图中不可见内容。
            
                // 临界点
                if(scrollHeight - top - height <= mb){
                    lock || done(); // 加锁时, done 函数不执行
                }
            }, 100);
        });
        
        return that;
    };

    /**
     * 图片懒加载
     * options 对象包含一下属性值
     * 参数             类型            描述
     * elem             string         指定开启懒加载的img元素选择器，如 elem: '.demo img' 或 elem: 'img.load'
     * scrollElem       string         滚动条所在元素选择器，默认document。如果你不是通过窗口滚动来触发流加载，而是页面中的某一个容器的滚动条，那么通过该参数指定即可。
     */
    Flow.prototype.lazyimg = function(options){
        var that = this;
        var index = 0;
        var haveScroll;
        options = options || {};

        var scrollElem = $(options.scrollElem || document); // 滚动条所在元素
        var elem = options.elem || 'img'; // 默认 'img'

        // 滚动条所在元素是否为 document
        var notDocment = options.scrollElem && options.scrollElem !== document;

        // 显示图片
        var show = function(item, height){
            var start = scrollElem.scrollTop(); // 当前容器距离顶部的高度
            var end = start + height; // 当前容器的底的高度

            // 和 render 函数中的一样
            var elemTop = notDocment ? function(){
                return item.offset().top - scrollElem.offset().top + start;
            }() : item.offset().top;

            // 始终只加载在当前屏范围内的图片
            if(elemTop >= start && elemTop <= end){
                if(item.attr('lay-src')){
                    var src = item.attr('lay-src'); // 获取属性值 (也就是图片地址)
                    
                    // 使用layui 图片预加载进行加载
                    layui.img(src, function(){
                        var next = that.lazyimg.elem.eq(index);
                        item.attr('src', src).removeAttr('lay-src'); // 设置 src, 并移除自定义属性

                        // 当前图片加载就绪后, 检测下一个图片是否在当前屏
                        next[0] && render(next);
                        index++;
                    }, function(){
                        var next = that.lazyimg.elem.eq(index);
                        item.removeAttr('lay-src');
                    })
                }
            }
        };
        var render = function(othis, scroll){
            
            // 计算滚动所在容器的可视高度
            var height = notDocment ? (scroll || scrollElem).height() : $(window).height();
            var start = scrollElem.scrollTop(); // 当前容器距离顶部的高度
            var end = start + height; // 当前容器的底的高度

            that.lazyimg.elem = $(elem); // dom 集合

            if(othis) {
                show(othis, height);
            } else {
                
                // 计算未加载过的图片
                for(var i = 0; i< that.lazyimg.elem.length; i++){

                    // 获取当前第 i 循环中的 item
                    var item = that.lazyimg.elem.eq(i); // eq() 方法返回带有被选元素的指定索引号的元素
                    var elemTop = notDocment ? function(){
                        
                        // offset() 方法 用于获得位置是元素相对于document的位置信息，通常可以说是这个元素的坐标值。
                        return item.offset().top - scrollElem.offset().top + start;
                    }() : item.offset().top;

                    show(item, height);
                    index = i;
                    console.log(i, elemTop, end);
                    // 如果图片的 top 坐标, 超过了当前屏, 则终止后续图片的遍历
                    if(elemTop > end) break;
                }
            }
        };
        
        render();

        if(!haveScroll){
            var timer;

            // 添加 scroll 监听
            scrollElem.on('scroll', function(){
                var othis = $(this);
                
                if(timer) clearTimeout(timer);

                timer = setTimeout(function(){
                    render(null, othis);
                }, 50);
            });
            haveScroll = true;
        }

        return render;
    };

    // 暴露接口
    exports('flow', new Flow());
})