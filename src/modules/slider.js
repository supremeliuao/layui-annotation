layui.define('jquery', function(exports){
    "use strict";
    var $ = layui.jquery;

    // 外部接口
    var slider = {
        config: {},
        index: layui.slider ? (layui.slider.index + 10000) : 0,

        // 设置全局项
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

    // 操作当前实例
    var thisSlider = function(){
        var that = this;
        var options = that.config;

        return {
            setValue: function(value, index){ // 设置值
                options.value = value;
                return that.slide('set', value, index || 0);
            },
            config: options
        }
    };

    // 字符常量
    var MOD_NAME = 'slider'; // 模块名
    var DISABLED = 'layui-disabled'; // 禁止
    var ELEM_VIEW = 'layui-silder';
    var SLIDER_BAR = 'layui-slider-bar';
    var SLIDER_WRAP = 'layui-slider-wrap';
    var SLIDER_WRAP_BTN = 'layui-slider-wrap-btn';
    var SLIDER_TIPS = 'layui-slider-tips'; // tips 提示类
    var SLIDER_INPUT = 'layui-slider-input'; // input
    var SLIDER_INPUT_TXT = 'layui-slider-input-txt'; // txt
    var SLIDER_INPUT_BTN = 'layui-slider-input-btn'; // btn 类
    var ELEM_HOVER = 'layui-slider-hover'; // hover 类

    /**
     * 构造器
     * options 对象包含一下属性值
     * 参数选项          类型                默认值         说明    
     * elem             string/object       无             指向容器选择器
     * type             string              default        滑块类型，可选值有：default（水平滑块）、vertical（垂直滑块）
     * min              number              0              滑动条最小值，正整数，默认为 0
     * max              number              100            滑动条最大值
     * range            boolean             false          是否开启滑块的范围拖拽，若设为 true，则滑块将出现两个可拖拽的环 
     * value            number/Array        0              滑块初始值，默认为数字，若开启了滑块为范围拖拽（即 range: true），则需赋值数组，异表示开始和结尾的区间，如：value: [30, 60]
     * step             number              1              拖动的步长
     * showstep         boolean             false          是否显示间断点
     * tips             boolean             true           是否显示文字提示
     * input            boolean             false          是否显示输入框（注意：若 range 参数为 true 则强制无效）点击输入框的上下按钮，以及输入任意数字后回车或失去焦点，均可动态改变滑块
     * height           number              200            滑动条高度，需配合 type:"vertical" 参数使用
     * disabled         boolean             false          是否将滑块禁用拖拽
     * theme            string              #009688        主题颜色，以便用在不同的主题风格下          
     */
    var Class = function(options){
        var that = this;
        that.index = ++slider.index;
        that.config = $.extend({}, that.config, slider.config, options);
        that.render();
    };

    // 默认配置
    Class.prototype.config = {
       type: 'default', // 滑块类型，垂直: vertical
       min: 0, // 最小值
       max: 100, // 最大值，默认 100
       value: 0, // 初始值，默认为 0
       step: 1, // 间隔值
       showstep: false, // 间隔点开启
       tips: true, // 文字提示，开启
       input: false, // 输入框， 关闭
       range: false, // 范围选择, 与输入框不能同时开启，默认关闭
       height: 200, // 配合 type:"vertical"使用, 默认 200px
       disabled: false, // 滑块禁用, 默认关闭
       theme: '#009688', // 主题颜色 
    }

    // 滑块渲染
    Class.prototype.render = function(){
        var that = this;
        var  options = that.config; // 获取配置

        // 步长小于 1, 默认为 1
        if(options.step < 1) options.step = 1;

        // 最小值大于最大值时，把最小值赋给最大值
        if(options.max < options.min) options.max = options.min;
        
        // 判断是否开启范围滑动
        if(options.range){
            options.value = typeof(options.value) == 'object' ? options.value : [options.min, options.value];
            
            // 调整用户设置的范围，以及调整范围所在min~max之间的关系
            var minValue = Math.min(options.value[0], options.value[1]); // 获取最小值
            var maxValue = Math.max(options.value[0], options[1]); // 获取最大值
            options.value[0] = minValue > options.min ? minValue : options.min; 
            options.value[1] = maxValue > options.min ? maxValue : options.min;
            options.value[0] = options.value[0] > options.max ? options.max : options.value[0];
            options.value[1] = options.value[1] > options.max ? options.max : options.value[1];
            
            // 第一个值获取占据总的长度的比
            var scaleFir = Math.floor((options.value[0] - options.min) / (options.max - options.min) * 100);
            
            // 第二个值获取占据总的长度的比
            var scaleSec = Math.floor((options.value[1] - options.min) / (options.max - options.min) * 100);
            var scale = scaleSec - scaleFir + '%'; // 获取插值
            scaleFir = scaleFir + '%';
            scaleSec = scaleSec + '%';
        } else {
            
            // 如果初始值是一个数值, 则获取数组的最小值
            if(typeof options.value == 'object'){
                options.value = Math.min.apply(null, options.value);
            };

            // 初始值不能小于最小值且不能大于最大值
            if(options.value < options.min) options.value = options.min;
            if(options.value > options.max) options.value = options.max;

            // 计算值占比
            var scale = Math.floor((options.value - options.min) / (options.max - options.min) * 100) + '%';
        };
        
        // 如果禁用，颜色为统一的灰色
        var theme = options.disabled ? '#c2c2c2' : options.theme;

        // 拼接滑块字符串，用于生成 dom
        var temp = '<div class="layui-slider '+ (options.type === 'vertical' ? 'layui-slider-vertical' : '') +'">'+ (options.tips ? '<div class="layui-slider-tips"></div>' : '') + 
        '<div class="layui-slider-bar" style="background:'+ theme +'; '+ (options.type === 'vertical' ? 'height' : 'width') +':'+ scale +';'+ (options.type === 'vertical' ? 'bottom' : 'left') +':'+ (scaleFir || 0) +';"></div><div class="layui-slider-wrap" style="'+ (options.type === 'vertical' ? 'bottom' : 'left') +':'+ (scaleFir || scale) +';">' +
        '<div class="layui-slider-wrap-btn" style="border: 2px solid '+ theme +';"></div></div>'+ (options.range ? '<div class="layui-slider-wrap" style="'+ (options.type === 'vertical' ? 'bottom' : 'left') +':'+ scaleSec +';"><div class="layui-slider-wrap-btn" style="border: 2px solid '+ theme +';"></div></div>' : '') +'</div>';
    
        var othis = $(options.elem); // 获取 dom 容器
        var hasRender = othis.next('.' + ELEM_VIEW); // 是否已经渲染

        // 生成替代元素
        hasRender[0] && hasRender.remove(); // 如果已经渲染，则删除 dom
        that.elemTemp = $(temp);

        // 把数据缓存到滑块上,为后期显示 tip 值提供基础
        if(options.range) {
            that.elemTemp.find('.' + SLIDER_WRAP).eq(0).data('value', options.value[0]); // data() 函数用于在指定的元素上存取数据，返回设置值
            that.elemTemp.find('.' + SLIDER_WRAP).eq(1).data('value', options.value[1]);
        }else{
            that.elemTemp.find('.' + SLIDER_WRAP).data('value', options.value);
        };

        othis.html(that.elemTemp); // 挂载

        // 设置垂直滑块高度
        if(options.type === 'vertical'){
            that.elemTemp.height(options.height + 'px');
        };

        // 显示间断点
        if(options.showstep){
           var number = (options.max - options.min) / options.step; // 计算间断点数量
           var item = '';
           
           for(var i = 1; i < number + 1; i++){
               var step = i * 100 / number; // 计算 step 偏移量
               if(step < 100){
                
                // 拼接间隔点   
                item += '<div class="layui-slider-step" style="'+ (options.type === 'vertical' ? 'bottom' : 'left') +':'+ step +'%"></div>';
               }
           }
           that.elemTemp.append(item); // 挂载
        };

        // 插入输入框和 range 功能互斥
        if(options.input && !options.range){
           
           // 输入框 dom
           var elemInput = $('<div class="layui-slider-input layui-input"><div class="layui-slider-input-txt"><input type="text" class="layui-input"></div><div class="layui-slider-input-btn"><i class="layui-icon layui-icon-up"></i><i class="layui-icon layui-icon-down"></i></div></div>');
           othis.css("position", "relative"); // 容器设置 position
           othis.append(elemInput); // 挂载
           othis.find('.' + SLIDER_INPUT_TXT).children('input').val(options.value); // input 设置值
           
           if(options.type === 'vertical') {
               elemInput.css({
                left: 0,
                top: -48
               });
           } else {

            // 给输入框设置空间
            that.elemTemp.css("margin-right", elemInput.outerWidth() + 15); 
           }
        }

        // 给未禁止的滑块滑动事件
        if(!options.disabled){
            that.slide();
        } else {
            that.elemTemp.addClass(DISABLED); // 添加禁止类
            that.elemTemp.find('.'+ SLIDER_WRAP_BTN).addClass(DISABLED);
        };

        // 划过滑块显示数值
        that.elemTemp.find('.'+ SLIDER_WRAP_BTN).on('mouseover', function(){
            var sliderWidth = options.type === 'vertical' ? options.height : that.elemTemp[0].offsetWidth;
            var sliderWrap = that.elemTemp.find('.' + SLIDER_WRAP); // 获取 '.layui-slider-wrap' 类 dom 节点
            var tipsLeft = options.type === 'vertical' ? (sliderWidth - $(this).parent()[0].offsetTop - sliderWrap.height()) : $(this).parent()[0].offsetLeft; // $(this).parent()[0] 为 '.layui-slider-wrap' 类节点
            var left = tipsLeft / sliderWidth * 100; // 计算值占比
            var value = $(this).parent().data('value'); // 获取之前存储的值
            
            // 如果用户设置了自定义提示文本，则使用自定义文本函数
            var tipsTxt = options.setTips ? options.setTips(value) : value;
            that.elemTemp.find('.' + SLIDER_TIPS).html(tipsTxt); // 为 '.layui-slider-tips' 类添加提示数值
            if(options.type === 'vertical'){
                that.elemTemp.find('.' + SLIDER_TIPS).css({"bottom":left + '%', "margin-bottom":"20px", "display":"inline-block"}); // 为 tip 类动态添加样式
            } else {
                that.elemTemp.find('.' + SLIDER_TIPS).css({"left":left + '%', "display":"inline-block"});
            }
        }).on('mouseout', function(){
            that.elemTemp.find('.' + SLIDER_TIPS).css("display", "none"); // 移除隐藏 tip
        });
    };

    // 滑块滑动
    Class.prototype.slide = function(setValue, value, i){
        var that = this;
        var options = that.config; // 获取配置
        var sliderAct = that.elemTemp; // 获取滑块 dom
        var sliderWidth = function(){
            return options.type === 'vertical' ? options.height : sliderAct[0].offsetWidth;
        }; // 获取滑块宽度
        var sliderWrap = sliderAct.find('.' + SLIDER_WRAP); // 获取 '.layui-slider-wrap' 类 dom 节点
        var sliderTxt = sliderAct.next('.' + SLIDER_INPUT); // 获取 '.layui-slider-input' 类 dom 节点。next() 方法返回被选元素的后一个同级元素。
        var inputValue = sliderTxt.children('.' + SLIDER_INPUT_TXT).children('input').val(); // 获取 input 值
        var step = 100 / ((options.max - options.min) / Math.ceil(options.step)); // 计算步长
        var change = function(offsetValue, index){
            if(Math.ceil(offsetValue) * step > 100){
                offsetValue = Math.ceil(offsetValue) * step;
            } else {
                offsetValue = Math.round(offsetValue) * step;
            };

            // 如果大于 100，则默认为100，否则赋值原值
            offsetValue = offsetValue > 100 ? 100 : offsetValue;
            sliderWrap.eq(index).css((options.type === 'vertical' ? 'bottom' : 'left'), offsetValue + '%'); // 设置移动到位置
            
            var firLeft = valueTo(sliderWrap[0].offsetLeft); // 获取第一个滑块点居左的位置
            var secLeft = options.range ? valueTo(sliderWrap[1].offsetLeft) : 0; // 获取第二个滑块点居左的位置

            if(options.type === 'vertical'){
                sliderAct.find('.' + SLIDER_TIPS).css({"bottom":offsetValue + '%', "margin-bottom":"20px"}); // 为 tip 设置位置
                firLeft = valueTo(sliderWidth() - sliderWrap[0].offsetTop - sliderWrap.height()); // 重置第一个滑块点位置
                secLeft = options.range ? valueTo(sliderWidth() - sliderWrap[1].offsetTop - sliderWrap.height()) : 0; // 重置第二个滑块点位置
            } else {
                sliderAct.find('.' + SLIDER_TIPS).css("left", offsetValue + '%');
            };

            firLeft = firLeft > 100 ? 100 : firLeft;
            secLeft = secLeft > 100 ? 100 : secLeft;
            var minLeft = Math.min(firLeft, secLeft); // 获取两个滑块点最小值
            var wrapWidth = Math.abs(firLeft - secLeft); // 获取两个滑块点之间的宽度
            
            if(options.type === 'vertical'){
                sliderAct.find('.' + SLIDER_BAR).css({"height":wrapWidth + '%', "bottom":minLeft + '%'});
            } else {
                sliderAct.find('.' + SLIDER_BAR).css({"width":wrapWidth + '%', "left":minLeft + '%'}); // 为 '.layui-slider-bar' 设置样式
            };


            var selfValue = options.min + Math.round((options.max - options.min) * offsetValue / 100);
            inputValue = selfValue; // 更新输入框值
            sliderTxt.children('.' + SLIDER_INPUT_TXT).children('input').val(inputValue); // 更新输入框值
            sliderWrap.eq(index).data('value', selfValue); // 更新滑块上的数值
            sliderAct.find('.' + SLIDER_TIPS).html(options.setTips ? options.setTips(selfValue) : selfValue); // 更新 tip 上的数值
            
            // 如果开启范围选择，返回数组值
            if(options.range){
                var arrValue = [
                    sliderWrap.eq(0).data('value'),
                    sliderWrap.eq(1).data('value')
                ]
                if(arrValue[0] > arrValue[1]) arrValue.reverse(); //如果前面的圆点超过了后面的圆点值，则调换顺序
            }

            // 用户设置的回调
            options.change && options.change(options.range ? arrValue : selfValue);
        };

        var valueTo = function(value){
            var oldLeft = value / sliderWidth() * 100 / step;
            var left = Math.round(oldLeft) * step;

            if(value == sliderWidth()){
                left = Math.ceil(oldLeft) * step;
            }
            return left;
        };

        // 拖拽元素
        var elemMove = $(['<div class="layui-auxiliar-moving" id="LAY-slider-moving"></div>'].join(''));
        var createMoveElem = function(move, up){
            var upCall = function(){
                up && up();
                elemMove.remove(); // 移除拖拽元素
            };

            $('#LAY-slider-moving')[0] || $('body').append(elemMove); // 如果没有拖拽元素就添加
            elemMove.on('mousemove', move); // 添加 mousemove 事件
            elemMove.on('mouseup', upCall).on('mouseleave', upCall);
        }

        // 动态赋值
        if(setValue === 'set') return change(value, i);

        // 为滑块点添加滑动
        sliderAct.find('.' + SLIDER_WRAP_BTN).each(function(index){
            var othis = $(this);
            othis.on('mousedown', function(e){
                e = e || window.event; // 兼容处理

                var oldleft = othis.parent()[0].offsetLeft; // 旧的 left 值
                var oldx = e.clientX; // 当鼠标事件发生时（不管是onclick，还是omousemove，onmouseover等），鼠标相对于浏览器（这里说的是浏览器的有效区域）x轴的位置
                
                // 如果垂直时，重写oldleft，oldx值
                if(options.type === 'vertical'){
                    oldleft = sliderWidth() - othis.parent()[0].offsetTop - sliderWrap.height()
                    oldx = e.clientY;
                }

                var move = function(e){
                   e = e || window.event;
                   var left = oldleft + (options.type === 'vertical' ? (oldx - e.clientY) : (e.clientX - oldx)); // 计算新的 left 值
                    
                   // left 小于0时，默认为 0
                   if(left < 0) left = 0;

                   // left 大于整个宽度时， 默认和整个宽度一样的值
                   if(left > sliderWidth()) left = sliderWidth();
                   
                   // 计算移动后真实 left
                   var reaLeft = left / sliderWidth() * 100 / step;
                   change(reaLeft, index);

                   othis.addClass(ELEM_HOVER); // 添加 '.layui-slider-hover' 类
                   sliderAct.find('.' + SLIDER_TIPS).show(); // 显示 tip
                   e.preventDefault(); // 阻止默认行为 
                }

                var up = function(){
                    othis.removeClass(ELEM_HOVER); // 移除 '.layui-slider-hover' 类
                    sliderAct.find('.' + SLIDER_TIPS).hide(); // 隐藏 tip
                };

                createMoveElem(move, up);
            })
        });

        // 为整个滑动条和滑块添加点击事件 (不包括输入框)
        sliderAct.on('click', function(e){
            var main = $('.' + SLIDER_WRAP_BTN); // 获取 '.layui-slider-wrap-btn' 类 dom 节点
            
            // 当点击的是不是滑块时，执行下列代码 (和滑动事件代码处理逻辑类似)
            if(!main.is(event.target) && main.has(event.target).length === 0 && main.length){
                var left = options.type === 'vertical' ? (sliderWidth() - e.clientY + $(this).offset().top):(e.clientX - $(this).offset().left), index;
                
                if(left < 0)left = 0;
                if(left > sliderWidth())left = sliderWidth();
                
                var reaLeft = left / sliderWidth() * 100 / step;
                
                if(options.range){
                  if(options.type === 'vertical'){
                    index = Math.abs(left - parseInt($(sliderWrap[0]).css('bottom'))) > Math.abs(left -  parseInt($(sliderWrap[1]).css('bottom'))) ? 1 : 0;
                  }else{
                    index = Math.abs(left - sliderWrap[0].offsetLeft) > Math.abs(left - sliderWrap[1].offsetLeft) ? 1 : 0;
                  }
                }else{
                  index = 0;
                };
                
                change(reaLeft, index);
                e.preventDefault();
            };

        });

        // 点击加减输入框
        sliderTxt.children('.' + SLIDER_INPUT_BTN).children('i').each(function(index){
            
            // 为加减 btn 添加 click 事件
            $(this).on('click', function(){

                // 获取 input 值
                inputValue = sliderTxt.children('.' + SLIDER_INPUT_TXT).children('input').val();

                if(index == 1) { // 减
                    inputValue = inputValue - options.step < options.min 
                        ? options.min 
                        : Number(inputValue) - options.step;
                } else {
                    inputValue = Number(inputValue) + options.step > options.max 
                        ? options.max 
                        : Number(inputValue) + options.step;
                };
                var inputScale = (inputValue - options.min) / (options.max - options.min) * 100 / step;
                change(inputScale, 0);

            })
        });

        // 获取输入框值
        var getInputValue = function(){
            var realValue = this.value;

            // 判断是否为非数值
            realValue = isNaN(realValue) ? 0 : realValue;
            
            // realValue 和最小值最大值比较 不能超过最大值和最小值范围
            realValue = realValue < options.min ? options.min : realValue;
            realValue = realValue > options.max ? options.max : realValue;
            
            this.value = realValue;
            var inputScale =  (realValue - options.min) / (options.max - options.min) * 100 / step;
            change(inputScale, 0);
        };


        // 为手动输入 input 值, 添加事件
        sliderTxt.children('.' + SLIDER_INPUT_TXT).children('input').on('keydown', function(e){
            if(e.keyCode === 13){
              e.preventDefault();
              getInputValue.call(this);
            }
          }).on('change', getInputValue);    

    };

    // 事件处理
    Class.prototype.events = function(){
        var that = this;
        var options = that.config;
    };

    // 核心入口
    slider.render = function(options){
        var inst = new Class(options);
        return thisSlider.call(inst);
    }

    exports(MOD_NAME, slider);
});