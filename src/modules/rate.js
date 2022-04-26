layui.define('jquery', function(exports){
    "use strict"; // 严格模式
    var $ = layui.jquery; // 获取 jquery

    // 外部接口
    var rate = {
        config: {},
        index: layui.rate ? (layui.rate.index + 10000) : 0,

        // 设置全局项
        set: function(options){
            var that = this;

            // 这里是重新指定了对象
            that.config = $.extend({}, that.config, options);
            return that;
        },
        
        // 事件
        on: function(events, callback){
            return layui.onevent.call(this, MOD_NAME, events, callback);
        }
    };

    // 操作当前实例
    var thisRate = function(){
        var that = this;
        var options = that.config;

        return {
            setvalue: function(value){
                that.setvalue.call(that, value); // 评分重置
            },
            config: options
        }
    };

    // 字符常量
    var MOD_NAME = 'rate'; // 模块名
    var ELEM_VIEW = 'layui-rate'; 
    var ICON_RATE = 'layui-icon-rate'; // 空心星星
    var ICON_RATE_SOLID = 'layui-icon-rate-solid'; // 实心星星
    var ICON_RATE_HALF = 'layui-icon-rate-half'; // 半实心星星
    var ICON_SOLID_HALF = 'layui-icon-rate-solid layui-icon-rate-half';
    var ICON_SOLID_RATE = 'layui-icon-rate-solid layui-icon-rate';
    var ICON_HALF_RATE = 'layui-icon-rate layui-icon-rate-half';

    /**
     * 构造器
     * options 对象包含一下属性值
     * 参数选项          类型                默认值         说明    
     * elem             string/object       -              指向容器选择器 
     * length           number              5              评分组件中具体星星的个数。个数当然是整数啦，残缺的星星很可怜的，所以设置了小数点的组件我们会默认向下取整 
     * value            number              0              评分的初始值  
     * theme            string              #FFB800        主题颜色。我们默认的组件颜色是#FFB800，你可以根据自身喜好来更改组件的颜色，以适用不同场景
     * half             boolean             false          设定组件是否可以选择半星
     * text             boolean             false          是否显示评分对应的内容
     * readonly         boolean             false          是否只读，即只用于展示而不可点      
     */
    var Class = function(options){ // 模板方法模式
        var that = this;
        that.index = ++rate.index; // 自增 index

        // 重新设置 config
        that.config = $.extend({}, that.config, rate.config, options); // extend() 函数用于将一个或多个对象的内容合并到目标对象
        that.render();
    };

    // 默认配置
    Class.prototype.config = {
        length: 5, // 初始长度
        text: false, // 是否显示评分等级
        readonly: false, // 是否只读
        half: false, // 是否可以半星
        value: 0, // 星星选中个数
        theme: '', // 主题
    };

    // 评分渲染
    Class.prototype.render = function(){
        var that = this;
        var options = that.config; // 获取 config

        // 如果用户设置主题, 则使用用户设置的主题, 否则为 ''
        var style = options.theme ? ('style="color: '+ options.theme + ';"') : '';
        options.elem = $(options.elem); // 获取 dom

        // 如果选中的星星个数大于总的星星个数, 则赋值总的星星个数
        if(options.value > options.length) {
            options.value = options.length;
        }

        // 如果没有选择半星的属性，却给了小数的数值，统一向上或向下取整
        if(parseInt(options.value) !== options.value){
            if(!options.half){

                // 对 value 向上取整之后和原来的值做差和 0.5 比较. 如果小于 0.5，则向上取整否则向下取整
                options.value = (Math.ceil(options.value) - options.value) < 0.5 ? Math.ceil(options.value) : Math.floor(options.value);
            }
        }

        // 组件模板
        var temp = '<ul class="layui-rate" '+ (options.readonly ? 'readonly' : '') + '>'; // 是否设置只读标识
        
        // 循环生成几颗星星
        for(var i = 1; i <= options.length; i++){
            var item = '<li class="layui-inline"><i class="layui-icon '
                + (i>Math.floor(options.value)?ICON_RATE:ICON_RATE_SOLID)
                + '" '+ style +'></i></li>';

            // 处理半个星星
            if(options.half) {
                if(parseInt(options.value) !== options.value){
                    
                    // i 等于向上取整的 options.value 时
                    if(i == Math.ceil(options.value)){

                        // 半星拼接到 temp 上
                        temp = temp + '<li><i class="layui-icon layui-icon-rate-half" '+ style + '></i></li>';
                    } else {
                        temp = temp + item; // 字符串拼接
                    }
                } else {
                    temp = temp + item; // 字符串拼接
                }
            }  else {
                temp = temp + item; // 字符串拼接
            } 
        }

        // 拼接结尾
        temp += '</ul>' + (options.text ? ('<span class="layui-inline">'+ options.value + '星'): '')+ '</span>'; // 这里 源码中确实是多了个 '</span>', 但是在 html 因为是不符合规范的所以就没有显示或者报错
    
        // 开始插入替代元素
        var othis = options.elem; // 获取 dom
        var hasRender = othis.next('.' + ELEM_VIEW); // 获取容器同级下是否有 layui-rate 类名的节点

        // 生成替代元素
        hasRender[0] && hasRender.remove(); // 如果已经有渲染了，则删除已存在的节点

        that.elemTemp = $(temp); // 获取拼接完毕的 dom

        options.span = that.elemTemp.next('span'); // 添加 span 属性

        options.setText && options.setText(options.value); // 自定义文本

        othis.html(that.elemTemp); // 向中容器挂载拼接好的 html 标签

        othis.addClass('layui-inline'); // 向容器上添加类

        // 如果不是只读，那么进行触控事件
        if(!options.readonly) that.action();
    };

    // 评分重置
    Class.prototype.setvalue = function(value){
        var that = this;
        var options = that.config;

        options.value = value; // 重置评分
        that.render(); // 重新渲染
    };
    
    // li 触控事件
    Class.prototype.action = function(){
        var that = this;
        var options = that.config; // 获取当前配置
        var _ul = that.elemTemp; // 获取字符串拼接完毕 _ul
        var wide = _ul.find("i").width(); // width() 方法设置或返回被选元素的宽度。 当该方法用于返回宽度时， 则返回第一个匹配元素的宽度。
        
        // children() 方法返回被选元素的所有直接子元素
        _ul.children("li").each(function(index){
            var ind = index + 1; // 加 1 是为了和日常思维一致
            var othis = $(this);

            // 为每个 li 添加 click 事件
            othis.on('click', function(e){
                // 将当前点击 li 的索引值赋给 value
                options.value = ind; // 标识用户设置了当前评分
                
                // 当用户设置允许半颗星时
                if(options.half){
                    
                    // 获取鼠标在 li 上的位置
                    var x = e.pageX - $(this).offset().left; // 点击的 x 坐标 - 图像的 x 坐标
                    
                    // 如果未超过一半
                    if(x <= wide / 2){
                        options.value = options.value - 0.5;
                    }
                }

                // 用户提供显示评分等级
                if(options.text) _ul.next("span").text(options.value + "星"); // 更新评分等级
                
                // 用户设置的点击回调
                options.choose && options.choose(options.value);
                
                // 用户设置的自定义文本的回调
                options.setText && options.setText(options.value);
            })

            // 为每个 li 添加 mousemove 事件
            othis.on('mousemove', function(e){
                _ul.find("i").each(function(){

                    // 添加 '空心星星'
                    $(this).addClass(ICON_RATE).removeClass(ICON_SOLID_HALF);
                });

                // lt() 匹配所有小于给定索引值的元素,索引从0开始
                _ul.find("i:lt("+ ind + ")").each(function(){

                    // 添加 实心星星
                    $(this).addClass(ICON_RATE_SOLID).removeClass(ICON_HALF_RATE);
                })

                // 如果设置可选半星，那么哦按段鼠标相对 li 的位置
                if(options.half){
                    var x = e.pageX - $(this).offset().left;
                    if(x <= wide / 2){

                        // 添加半星
                        othis.children("i").addClass(ICON_RATE_HALF).removeClass(ICON_RATE_SOLID)
                    }
                }
            })

            // 为每个 li 添加 mouseleave 事件
            othis.on('mouseleave', function(){
                _ul.find("i").each(function(){
                    $(this).addClass(ICON_RATE).removeClass(ICON_SOLID_HALF);
                });

                _ul.find("i:lt("+ Math.floor(options.value) + ")").each(function(){
                    $(this).addClass(ICON_RATE_SOLID).removeClass(ICON_HALF_RATE);
                });

                // 如果设置可选半星， 根据分数判断是否有半星
                if(options.half){
                    if(parseInt(options.value) !== options.value){
                        _ul.children("li:eq(" + Math.floor(options.value) + ")").children("i").addClass(ICON_RATE_HALF).removeClass(ICON_SOLID_RATE)             
                    }
                }
            })
        })
    };

    // 事件处理
    Class.prototype.events = function(){
        var that = this;
        var options = that.config;
    }

    // 核心入口
    rate.render = function(options){
        var inst = new Class(options);
        return thisRate.call(inst); // this 显示绑定为实例对象
    }

    // 模块导出
    exports(MOD_NAME, rate);
})