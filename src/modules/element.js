layui.define('jquery', function(exports){
    "use strict";

    var $ = layui.$;
    var hint = layui.hint();
    var device = layui.device();

    var MOD_NAME = 'element'; // 模块名
    var THIS = 'layui-this';
    var SHOW = 'layui-show';

    var Element = function(){
        this.config = {};
    };
    
    // 全局设置
    Element.prototype.set = function(options){
        var that = this;
        $.extend(true, that.config, options); // 深拷贝
        return that;
    };

    // 表单事件
    Element.prototype.on = function(events, callback){
        return layui.onevent.call(this, MOD_NAME, events, callback);
    };

    /**
     * 外部 Tab 新增
     * @param {*} filter tab元素的 lay-filter="value" 过滤器的值（value）
     * @param {*} options 设定可选值的对象，目前支持的选项如下述示例:element.tabAdd('demo', {title: '选项卡的标题',content: '选项卡的内容' //支持传入html ,id: '选项卡标题的lay-id属性值'});
     */
    Element.prototype.tabAdd = function(filter, options){
        var TITLE = '.layui-tab-title'; // tab title 类
        var tabElem = $('.layui-tab[lay-filter='+ filter +']'); // 获取 tab dom
        var titElem = tabElem.children(TITLE); // 获取 tab title dom
        var barElem = titElem.children('.layui-tab-bar'); // 获取含有 '.layui-tab-bar' 类的 dom
        var contElem = tabElem.children('.layui-tab-content'); // 获取含有 '.layui-tab-content' 类的 dom (内容展示容器)
        var li = '<li'+ function(){
            var layAttr = []; // 存储属性
            layui.each(options, function(key, value){

                // 如果 key 中存在 'title|content', 后续不执行
                if(/^(title|content)$/.test(key)) return; // 排除 title|content 字段是为了在下面该出现的地方使用
                layAttr.push('lay-'+ key + '="'+ value + '"');
            });

            if(layAttr.length > 0) layAttr.unshift(''); // 向数组开头插入空格
            return layAttr.join(' '); // 以 ' ' 拼接字符串
        }() + '>'+(options.title || 'unnaming') + '</li>'; // 拼接完即将插入的 tab
        
        // 存在 '.layui-tab-bar' 就把 li 元素插入 barElem 前面，否则插入 titElem 中最后面
        barElem[0] ? barElem.before(li) : titElem.append(li);
        contElem.append('<div class="layui-tab-item">'+ (options.content || '') + '</div>'); // 添加 tab 对应的内容
        
        call.hideTabMore(true);
        call.tabAuto();

        return this;
    };

    /**
     * 外部 Tab 删除
     * @param {*} filter tab元素的 lay-filter="value" 过滤器的值（value）
     * @param {*} layid 选项卡标题列表的 属性 lay-id 的值
     */
    Element.prototype.tabDelete = function(filter, layid){
        var TITLE = '.layui-tab-title'; 
        var tabElem = $('.layui-tab[lay-filter='+ filter +']');
        var titElem = tabElem.children(TITLE);
        var liElem = titElem.find('>li[lay-id="'+ layid +'"]');
        
        call.tabDelete(null, liElem);
        return this;
    }; 

    /**
     * 外部 Tab 切换 用于外部切换到指定的Tab项上
     * @param {*} filter tab元素的 lay-filter="value" 过滤器的值（value）
     * @param {*} layid 选项卡标题列表的 属性 lay-id 的值
     * @returns 
     */
    Element.prototype.tabChange = function(filter, layid){
        var TITLE = '.layui-tab-title'; // tab title 类
        var tabElem = $('.layui-tab[lay-filter='+ filter +']'); // 获取 tab dom
        var titElem = tabElem.children(TITLE); // 获取 tab title dom
        var liElem = titElem.find('>li[lay-id="'+ layid +'"]'); // 获取带有 layid='xx' 自定义属性的 dom li
        
        call.tabClick.call(liElem[0], null, null, liElem); // 调用 tab click
        return this;
    };

    /**
     * 自定义 Tab 选项卡 用于绑定自定义 Tab 元素（即非 layui 自带的 tab 结构）
     * @param {*} options 设定可选值的对象
     */
    Element.prototype.tab = function(options){
        options = options || {}; // 默认 {}
        
        // 为 document 添加 click 事件
        dom.on('click', options.headerElem, function(e){
            var index = $(this).index(); // 获取当前 index
            call.tabClick.call(this, e, index, null, options);
        })
    };

    /**
     * 用于设置动态进度条百分比
     * @param {*} filter 过滤器
     * @param {*} percent 百分比
     */
    Element.prototype.progress = function(filter, percent){
        var ELEM = 'layui-progress';
        var elem = $('.'+ ELEM + '[lay-filter='+ filter +']'); // 获取带有指定 filter 的进度条 dom
        var elemBar = elem.find('.'+ ELEM + '-bar'); // 获取 .layui-progress-bar dom
        var text = elemBar.find('.'+ ELEM + '-text'); // 获取 .layui-progress-text dom
        elemBar.css('width', percent).attr('lay-percent', percent); // 更新百分比值
        text.text(percent); // 更新文本

        return this;
    };

    var NAV_ELEM = '.layui-nav'; // 导航类
    var NAV_ITEM = 'layui-nav-item';
    var NAV_BAR = 'layui-nav-bar';
    var NAV_TREE = 'layui-nav-tree';
    var NAV_CHILD = 'layui-nav-child';
    var NAV_CHILD_C = 'layui-nav-child-c';
    var NAV_MORE = 'layui-nav-more';
    var NAV_DOWN = 'layui-icon-down';
    var NAV_ANIM = 'layui-anim layui-anim-upbit';

    // 基础事件体
    var call = {
        
        // Tab 点击
        tabClick: function(e, index, liElem, options){
            options = options || {};
            var othis = liElem || $(this); 
            var index = index || othis.parent().children('li').index(othis);
            var parents = options.headerElem ? othis.parent() : othis.parents('.layui-tab').eq(0);
            var item = options.bodyElem ? $(options.bodyElem) : parents.children('.lauui-tab-content').children('.layui-tab-item'); // 获取的 item 是个数组集合
            var elemA = othis.find('a'); // 查找 a 标签
            var isJump = elemA.attr('href') !== 'javascript:;' && elemA.attr('target') === '_blank'; // 判断是否存在跳转
            var unselect = typeof othis.attr('lay-unselect') === 'string'; // 是否禁用选中
            var filter = parents.attr('lay-filter'); // 获取自定义属性值

            // 当 isJump 和 unselect 同为 false，则执行切换
            if(!(isJump || unselect)){
                othis.addClass(THIS).siblings().removeClass(THIS); // 当前点击项添加 THIS, 其余同级元素删除 THIS
                item.eq(index).addClass(SHOW).siblings().removeClass(SHOW);
            };
            
            // 执行自定义模块
            layui.event.call(this, MOD_NAME, 'tab('+ filter +')', {
                elem: parents,
                index: index
            })
        },

        // Tab 删除
        tabDelete: function(e, othis){
            var li = othis || $(this).parent();
            var index = li.index();
            var parents = li.parents('.layui-tab').eq(0);
            var item = parents.children('.layui-tab-content').children('.layui-tab-item');
            var filter = parents.attr('lay-filter');

            if(li.hasClass(THIS)){
                if(li.next()[0]){ // 如果 li 下一个存在元素，则显示下一个元素
                    call.tabClick.call(li.next()[0], null, index + 1);
                } else if(li.prev()[0]){ // 如果 li 下一个元素没有，上一个元素存在，则显示上一个
                    call.tabClick.call(li.prev()[0], null, index - 1);
                };
            };

            li.remove(); // 移除 tab
            item.eq(index).remove(); // 移除 tab 对应的 content
            
            setTimeout(function(){
                call.tabAuto(); // tab 自适应
            }, 50);

            // 执行自定义模块
            layui.event.call(this, MOD_NAME, 'tabDelete('+ filter +')', {
                elem: parents,
                index: index
            });
        },

        // Tab 自适应
        tabAuto: function(){
            var SCROLL = 'layui-tab-scroll';
            var MORE = 'layui-tab-more';
            var BAR = 'layui-tab-bar'; 
            var CLOSE = 'layui-tab-close'; // 关闭图标
            var that = this;

            $('.layui-tab').each(function(){
                var othis = $(this);
                var title = othis.children('.layui-tab-title');
                var item = othis.children('.layui-tab-content').children('.layui-tab-item');
                var STOPE = 'lay-stope="tabmore"'    
                var span = $('<span class="layui-unselect layui-tab-bar" '+ STOPE +'><i '+ STOPE+ ' class="layui-icon">&#xe61a;</i></span>'); // tab more dom 节点

                if(that === window && device.ie != 8){
                    call.hideTabMore(true);
                }

                // 当有关闭选项卡属性时, 执行下面操作
                if(othis.attr('lay-allowClose')) {
                    title.find('li').each(function(){
                        var li = $(this);

                        // 如果找不到带有关闭图标的 dom, 则添加 dom
                        if(!li.find('.'+CLOSE)[0]){
                            var close = $('<i class="layui-icon layui-icon-close layui-unselect '+ CLOSE +'"></i>'); // 关闭图标 dom
                            close.on('click', call.tabDelete); // 点击 click 关闭图标事件    
                            li.append(close);
                        }
                    })
                };
                 
                // 带有 lay-unauto 自定义属性值类型为字符串的，后续不执行
                if(typeof othis.attr('lay-unauto') === 'string') return;

                // 响应式
                if(title.prop('scrollWidth') > title.outerWidth()+1){ // 实际宽度 > 可视宽度
                    
                    // 如果有 'layui-tab-bar' 类，后续不执行
                    if(title.find('.'+BAR)[0]) return;
                    title.append(span); // 挂载 更多 dom
                    othis.attr('overflow', '');
                    span.on('click', function(e){
                      title[this.title ? 'removeClass' : 'addClass'](MORE);  
                      this.title = this.title ? '' : '收缩'; // 添加 title 属性和值
                    });
                } else {
                    title.find('.'+BAR).remove(); // 移除 更多
                    othis.removeAttr('overflow');
                }
            })
        },

        // 隐藏更多 Tab
        hideTabMore: function(e){
            var tsbTitle = $('.layui-tab-title');
            
            if(
                e === true 
                || $(e.target).attr('lay-stope') !== 'tabmore'
            ){
               tsbTitle.removeClass('layui-tab-more');
               tsbTitle.find('.layui-tab-bar').attr('title', ''); 
            }
        },

        // 折叠面板
        collapse: function(){
            var othis = $(this); // 获取当前 this
            var icon = othis.find('.layui-colla-icon'); // 获取折叠图标 icon
            var elemCont = othis.siblings('.layui-colla-content'); // 获取折叠的内容 dom
            var parents = othis.parents('.layui-collapse').eq(0); // 获取 '.layui-collapse' 类 dom 容器
            var filter = parents.attr('lay-filter'); // 获取过滤器值
            var isNone = elemCont.css('display') === 'none'; // 判断内容是否折叠
        
            // 判断是否是手风琴
            if(typeof parents.attr('lay-accordion') === 'string'){
                var show = parents.children('.layui-colla-item').children('.'+SHOW); // 获取带有 '.layui-show' dom
                show.siblings('.layui-colla-title').children('.layui-colla-icon').html('&#xe602;');
                show.removeClass(SHOW); // 移除 '.layui-show'
            }

            // 如果 '.layui-colla-content' 类是隐藏的状态, 则调用addClass 否则 removeClass
            elemCont[isNone ? 'addClass' : 'removeClass'](SHOW);
            icon.html(isNone ? '&#xe61a;' : '&#xe602;'); // 根据显示和隐藏状态显示不同图标

            // 执行自定义模块
            layui.event.call(this, MOD_NAME, 'collapse('+ filter +')', {
                title: othis,
                content: elemCont,
                show: isNone,
            });
        }

    };
    
    /**
     * 初始化元素操作
     * 跟表单元素一样，很多时候你的页面元素可能是动态生成的，这时element的相关功能将不会对其有效，你必须手工执行 element.init(type, filter) 方法即可。注意：2.1.6 开始，可以用 element.render(type, filter); 方法替代
     * @param {*} type 为表单的type类型，可选。默认对全部类型的表单进行一次更新。
     * @param {*} filter 
     * 
     * 参数type值          描述
     * tab                 重新对tab选项卡进行初始化渲染
     * nav                 重新对导航进行渲染
     * breadcrumb          重新对面包屑进行渲染
     * progress            重新对进度条进行渲染
     * collapse            重新对折叠面板进行渲染     
     */
    Element.prototype.init = function(type, filter){
        var that = this;
        var elemFilter = function(){ // 默认为空
            return filter ? ('[lay-filter="' + filter + '"]') : '';
        }();
        var items = {

            // Tab 选项卡标题列表的
            tab: function(){
                call.tabAuto.call({});
            },
             
            // 导航菜单
            nav: function(){
                var TIME = 200; // bar 跟随定时器时间
                var timer = {};
                var timerMore = {};
                var timeEnd = {};
                var NAV_TITLE = 'layui-nav-title';
                
                // 滑块跟随
                var follow = function(bar, nav, index){
                    var othis = $(this);
                    var child = othis.find('.'+NAV_CHILD); // 获取 layui-nav-child

                    // 存在 layui-nav-tree 类时(是否是垂直导航)
                    if(nav.hasClass(NAV_TREE)) {
                        
                        // 无子菜单时跟随
                        if(!child[0]){
                            var thisA = othis.children('.'+ NAV_TITLE);

                            // 添加样式
                            bar.css({
                                top: othis.offset().top - nav.offset().top,
                                height: (thisA[0] ? thisA : othis).outerHeight(),
                                opacity: 1
                            })
                        }
                    } else {
                        child.addClass(NAV_ANIM);
                        
                        // 若居中对齐
                        if(child.hasClass(NAV_CHILD_C)) child.css({
                            left: -(child.outerWidth() - othis.width())/2
                        });

                        // 滑块定位
                        if(child[0]){ // 若有子菜单，滑块消失
                           
                            // 隐藏滑块
                            bar.css({
                              left: bar.position().left + bar.width()/2,
                              width: 0,
                              opacity: 0
                           });
                        } else { // bar 跟随
                            
                            // 为跟随的 bar 设置位置
                            bar.css({
                                left: othis.position().left + parseFloat(othis.css('marginLeft')),
                                top: othis.position().top + othis.height() - bar.height()
                            });
                        };

                        // 渐显滑块并适配宽度
                        timer[index] = setTimeout(function(){
                            
                            // 为跟随的 bar 设置宽度
                            bar.css({
                                width: child[0] ? 0 : othis.width(),
                                opacity: child[0] ? 0 : 1
                            });
                        }, device.ie && device.ie < 10 ? 0 : TIME);
                    
                        // 显示子菜单
                        clearTimeout(timeEnd[index]); // 清除定时器

                        // 子菜单显示，则清除定时器
                        if(child.css('display') === 'block') {
                            clearTimeout(timerMore[index]);
                        }

                        timerMore[index] = setTimeout(function(){
                            child.addClass(SHOW); // 显示子菜单
                            othis.find('.'+NAV_MORE).addClass(NAV_MORE+'d'); // 更新图标
                        }, 300);
                    }

                }

                // 遍历导航
                $(NAV_ELEM + elemFilter).each(function(index){
                    var othis = $(this);
                    var bar = $('<span class="'+ NAV_BAR +'"></span>'); // 底部 bar 
                    var itemElem = othis.find('.'+NAV_ITEM); // 获取 nav item
                    
                    // hover 滑动效果
                    if(!othis.find('.'+NAV_BAR)[0]){ // 找不到 layui-nav-bar 类时，执行下面代码
                        othis.append(bar); // 挂载 bar
                        
                        // 判断 layui-nav-tree 类是否存在
                        (othis.hasClass(NAV_TREE)
                          ? itemElem.find('dd,>.'+ NAV_TITLE)
                          : itemElem).on('mouseenter', function(){ // 鼠标移入
                            follow.call(this, bar, othis, index);
                          }).on('mouseleave', function(){ // 鼠标移出

                            // 是否为垂直导航
                            if(othis.hasClass(NAV_TREE)){
                                
                                // 隐藏 bar
                                bar.css({
                                    height: 0,
                                    opacity: 0
                                });
                            } else {
                                // 隐藏子菜单
                                clearTimeout(timerMore[index]);
                                timerMore[index] = setTimeout(function(){
                                    othis.find('.'+NAV_CHILD).removeClass(SHOW); // 隐藏子菜单
                                    othis.find('.'+NAV_MORE).removeClass(NAV_MORE+'d');
                                }, 300); // 隐藏需要时间, 如果不指定，当下拉菜单显示时还没移动到下拉菜单时，就隐藏了
                            }
                          });
                          othis.on('mouseleave', function(){
                            clearTimeout(timer[index]); // 清除滑块渐变定时器
                            timeEnd[index] = setTimeout(function(){
                                if(!othis.hasClass(NAV_TREE)){
                                    bar.css({
                                      width: 0
                                      ,left: bar.position().left + bar.width()/2
                                      ,opacity: 0
                                    });
                                }
                            }, TIME);
                        });
                    }

                    // 展开子菜单
                    itemElem.find('a').each(function(){
                        var thisA = $(this);
                        var parent = thisA.parent();
                        var child = thisA.siblings('.'+NAV_CHILD);

                        // 输出小箭头
                        if(child[0] && !thisA.children('.'+NAV_MORE)[0]){
                            thisA.append('<i class="layui-icon '+ NAV_DOWN +' '+ NAV_MORE +'"></i>');
                        }

                        thisA.off('click', call.clickThis).on('click', call.clickThis); //点击菜单
                    })

                });

            },

            // 面包屑
            breadcrumb: function(){
                var ELEM = '.layui-breadcrumb';

                $(ELEM + elemFilter).each(function(){
                    var othis = $(this);
                    var ATTE_SPR = 'lay-separator';
                    var separator = othis.attr(ATTE_SPR) || '/'; // 默认分隔符 '/'
                    var aNode = othis.find('a'); // 获取 a 标签 dom
                    
                    // 判断是否存在分割符
                    if(aNode.next('span[' + ATTE_SPR + ']')[0]) return;
                
                    aNode.each(function(index){

                        // 因为分隔符在两个元素中间，所以判断条件为 index === aNode.length - 1 
                        if(index === aNode.length - 1) return;
                        $(this).after('<span '+ ATTE_SPR +'>'+ separator +'</span>'); // 添加分割线
                    });
                    othis.css('visibility', 'visible'); // 显示
                });
            },
            
            // 进度条
            progress: function(){
                var ELEM = 'layui-progress';
                $('.' + ELEM + elemFilter).each(function(){
                    var othis = $(this);
                    var elemBar = othis.find('.layui-progress-bar'); // 获取 .layui-progress-bar dom
                    var percent = elemBar.attr('lay-percent'); // 获取 lay-percent 属性值

                    elemBar.css('width', function(){

                        // 对小数转为百分制
                        return /^.+\/.+$/.test(percent)
                            ? (new Function('return '+ percent)() * 100) + '%'
                            : percent;
                    }());
                    
                    // 如果设置显示百分比文本，则执行下面
                    if(othis.attr('lay-showPercent')){
                        setTimeout(function(){
                           elemBar.html('<span class="'+ ELEM +'-text">'+ percent +'</span>'); 
                        }, 350);
                    };
                });
            },

            // 折叠面板
            collapse: function(){
                var ELEM = 'layui-collapse';
            
                $('.' + ELEM + elemFilter).each(function(){
                    var elemItem = $(this).find('.layui-colla-item'); // 获取 '.layui-colla-item' dom (数组集合)
                    elemItem.each(function(){
                        var othis = $(this); // 获取每个 elemItem
                        var elemTitle = othis.find('.layui-colla-title'); // 获取 title
                        var elemCont = othis.find('.layui-colla-content'); // 获取内容
                        var isNone = elemCont.css('display') === 'none';

                        // 初始状态
                        elemTitle.find('.layui-colla-icon').remove(); // 移除折叠 icon
                        elemTitle.append('<i class="layui-icon layui-colla-icon">'+ (isNone ? '&#xe602;' : '&#xe61a;') +'</i>'); // 添加折叠 icon

                        // 添加点击标题事件
                        elemTitle.off('click', call.collapse).on('click', call.collapse);
                    })
                })
            }
        };

        // 如果 items 中不存在 type，则对全部类型的表单进行一次更新
        return items[type] ? items[type]() : layui.each(items, function(index, item){
            item();
        })
    }

    Element.prototype.render = Element.prototype.init;
    
    var element = new Element();
    var dom = $(document);

    $(function(){
        element.render();
    });

    var TITLE = '.layui-tab-title li';

    dom.on('click', TITLE, call.tabClick); // Tab 切换
    dom.on('click', call.hideTabMore); // 隐藏展开的 Tab

    // 添加 resize 事件, 用于监听尺寸变化, 对tab样式做调整
    $(window).on('resize', call.tabAuto);

    // 导出模块
    exports(MOD_NAME, element);
})