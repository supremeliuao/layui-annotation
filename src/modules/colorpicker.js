layui.define(['jquery', 'lay'], function(exports){
    "use strict";
    
    var $ = layui.jquery;
    var lay = layui.lay;
    var device = layui.device();
    var clickOrMousedown = (device.mobile ? 'click' : 'mousedown');
  
    // 外部接口
    var colorpicker = {
      config: {},
      index: layui.colorpicker ? (layui.colorpicker.index + 10000) : 0,
  
      // 设置全局项
      set: function(options){
        var that = this;
        that.config = $.extend({}, that.config, options);
        return that;
      },
      
      // 事件
      on: function(events, callback){
        return layui.onevent.call(this, 'colorpicker', events, callback);
      }
    }
    
    // 操作当前实例
    var thisColorPicker = function(){
      var that = this;
      var options = that.config;
  
      return { // 返回配置
        config: options
      }
    }
  
    // 字符常量
    var MOD_NAME = 'colorpicker'; // 模块名
    var SHOW = 'layui-show';
    var THIS = 'layui-this';
    var ELEM = 'layui-colorpicker';
    
    var ELEM_MAIN = '.layui-colorpicker-main';
    var ICON_PICKER_DOWN = 'layui-icon-down';
    var ICON_PICKER_CLOSE = 'layui-icon-close';
    var PICKER_TRIG_SPAN = 'layui-colorpicker-trigger-span';
    var PICKER_TRIG_I = 'layui-colorpicker-trigger-i';
    var PICKER_SIDE = 'layui-colorpicker-side'; 
    var PICKER_SIDE_SLIDER = 'layui-colorpicker-side-slider';
    var PICKER_BASIS = 'layui-colorpicker-basis';
    var PICKER_ALPHA_BG = 'layui-colorpicker-alpha-bgcolor';
    var PICKER_ALPHA_SLIDER = 'layui-colorpicker-alpha-slider';
    var PICKER_BASIS_CUR = 'layui-colorpicker-basis-cursor';
    var PICKER_INPUT = 'layui-colorpicker-main-input';
  
    // RGB转HSB 转换公式 点击查看 https://zhuanlan.zhihu.com/p/151863284
    var RGBToHSB = function(rgb){
      var hsb = {h:0, s:0, b:0};
      var min = Math.min(rgb.r, rgb.g, rgb.b);
      var max = Math.max(rgb.r, rgb.g, rgb.b);
      var delta = max - min;
      hsb.b = max;
      hsb.s = max != 0 ? 255*delta/max : 0;
      if(hsb.s != 0){
        if(rgb.r == max){
          hsb.h = (rgb.g - rgb.b) / delta;
        }else if(rgb.g == max){
          hsb.h = 2 + (rgb.b - rgb.r) / delta;
        }else{
          hsb.h = 4 + (rgb.r - rgb.g) / delta;
        }
      }else{
        hsb.h = -1;
      };
      if(max == min){ 
        hsb.h = 0;
      };
      hsb.h *= 60;
      if(hsb.h < 0) {
        hsb.h += 360;
      };
      hsb.s *= 100/255;
      hsb.b *= 100/255;
      return hsb;  
    }
  
    // HEX转HSB
    var HEXToHSB = function(hex){
      var hex = hex.indexOf('#') > -1 ? hex.substring(1) : hex;
      if(hex.length == 3){
        var num = hex.split("");
        hex = num[0]+num[0]+num[1]+num[1]+num[2]+num[2]
      };
      hex = parseInt(hex, 16);
      var rgb = {r:hex >> 16, g:(hex & 0x00FF00) >> 8, b:(hex & 0x0000FF)};
      return RGBToHSB(rgb);
    }
  
    // HSB转RGB
    var HSBToRGB = function(hsb){
      var rgb = {};
      var h = hsb.h;
      var s = hsb.s*255/100;
      var b = hsb.b*255/100;
      if(s == 0){
        rgb.r = rgb.g = rgb.b = b;
      }else{
        var t1 = b;
        var t2 = (255 - s) * b /255;
        var t3 = (t1 - t2) * (h % 60) /60;
        if(h == 360) h = 0;
        if(h < 60) {rgb.r=t1; rgb.b=t2; rgb.g=t2+t3}
        else if(h < 120) {rgb.g=t1; rgb.b=t2; rgb.r=t1-t3}
        else if(h < 180) {rgb.g=t1; rgb.r=t2; rgb.b=t2+t3}
        else if(h < 240) {rgb.b=t1; rgb.r=t2; rgb.g=t1-t3}
        else if(h < 300) {rgb.b=t1; rgb.g=t2; rgb.r=t2+t3}
        else if(h < 360) {rgb.r=t1; rgb.g=t2; rgb.b=t1-t3}
        else {rgb.r=0; rgb.g=0; rgb.b=0}
      }
      return {r:Math.round(rgb.r), g:Math.round(rgb.g), b:Math.round(rgb.b)};
    }
  
    // HSB转HEX
    var HSBToHEX = function(hsb){
      var rgb = HSBToRGB(hsb);
      var hex = [
        rgb.r.toString(16),
        rgb.g.toString(16),
        rgb.b.toString(16)
      ];
      $.each(hex, function(nr, val){
        if(val.length == 1){
          hex[nr] = '0' + val;
        }
      });
      return hex.join('');
    }
  
    // 转化成所需rgb格式
    var RGBSTo = function(rgbs){
      var regexp = /[0-9]{1,3}/g;
      var re = rgbs.match(regexp) || [];
      return {r:re[0], g:re[1], b:re[2]};
    }
    
    var $win = $(window);
    var $doc = $(document);
    
    /**
     * 构造器
     * options 对象包含一下属性值
     * 参数选项          类型                默认值                       说明  
     * elem             String/DOM          -                            绑定触发组件的元素。必填项
     * color            string              -                            默认颜色，不管你是使用 hex、rgb 还是 rgba 的格式输入，最终会以指定的格式显示。
     * format           string              hex（即 16 进制色值）         颜色显示/输入格式，可选值： hex、rgb。若在 rgb 格式下开启了透明度，格式会自动变成 rgba。在没有输入颜色的前提下，组件会默认为 #000 也就是黑色。
     * alpha            boolean             false                        是否开启透明度，若不开启，则不会显示透明框。开启了透明度选项时，当你的默认颜色为 hex 或 rgb 格式，组件会默认加上值为 1 的透明度。相同的，当你没有开启透明度，却以 rgba 格式设置默认颜色时，组件会默认没有透明度。注意：该参数必须配合 rgba 颜色值使用
     * predefine        boolean             false                        预定义颜色是否开启
     * colors           Array               此处列举一部分：               预定义颜色，此参数需配合 predefine: true 使用。  
     *                                      ['#ff4500','#1e90ff',
     *                                      'rgba(255, 69, 0, 0.68)',
     *                                      'rgb(255, 120, 0)'] 
     * size             string              -                            下拉框大小，可以选择：lg、sm、xs。   
     */
    var Class = function(options){
      var that = this;
      that.index = ++colorpicker.index;
      that.config = $.extend({}, that.config, colorpicker.config, options);
      that.render();
    };
  
    // 默认配置
    Class.prototype.config = {
      color: '',  // 默认颜色，默认没有
      size: null,  // 选择器大小
      alpha: false,  // 是否开启透明度
      format: 'hex',  // 颜色显示/输入格式，可选 rgb,hex
      predefine: false, // 预定义颜色是否开启
      colors: [ // 默认预定义颜色列表
        '#009688', '#5FB878', '#1E9FFF', '#FF5722', '#FFB800', '#01AAED', '#999', '#c00', '#ff8c00','#ffd700'
        ,'#90ee90', '#00ced1', '#1e90ff', '#c71585', 'rgb(0, 186, 189)', 'rgb(255, 120, 0)', 'rgb(250, 212, 0)', '#393D49', 'rgba(0,0,0,.5)', 'rgba(255, 69, 0, 0.68)', 'rgba(144, 240, 144, 0.5)', 'rgba(31, 147, 255, 0.73)'
      ]
    };
  
    // 初始颜色选择框
    Class.prototype.render = function(){
      var that = this;
      var options = that.config; // 获取配置
      
      // 颜色选择框对象
      var elemColorBox = $(['<div class="layui-unselect layui-colorpicker">',
        '<span '+ (options.format == 'rgb' && options.alpha
            ? 'class="layui-colorpicker-trigger-bgcolor"'
          : '') +'>',
          '<span class="layui-colorpicker-trigger-span" ',
            'lay-type="'+ (options.format == 'rgb' ? (options.alpha ? 'rgba' : 'torgb') : '') +'" ',
            'style="'+ function(){ // 添加style
              var bgstr = '';
              if(options.color){ // 用户是否设置预定义颜色
                bgstr = options.color;
                
                if((options.color.match(/[0-9]{1,3}/g) || []).length > 3){ // 需要优化
                  if(!(options.alpha && options.format == 'rgb')){
                    bgstr = '#' + HSBToHEX(RGBToHSB(RGBSTo(options.color))); // 颜色转换为HEX格式
                  }
                }
                
                return 'background: '+ bgstr;
              }
              
              return bgstr;
            }() +'">',
            '<i class="layui-icon layui-colorpicker-trigger-i '+ (options.color 
              ? ICON_PICKER_DOWN 
            : ICON_PICKER_CLOSE) +'"></i>', // 图标
          '</span>',
        '</span>',
      '</div>'].join(''));
  
      // 初始化颜色选择框
      var othis = $(options.elem);  
      options.size && elemColorBox.addClass('layui-colorpicker-'+ options.size); // 初始化颜色选择框尺寸
      
      // 插入颜色选择框
      othis.addClass('layui-inline').html( // 挂载
        that.elemColorBox = elemColorBox
      );
      
      // 获取背景色值
      that.color = that.elemColorBox.find('.'+ PICKER_TRIG_SPAN)[0].style.background; // 存储当前背景色
      
      // 相关事件
      that.events();
    };
  
    // 渲染颜色选择器
    Class.prototype.renderPicker = function(){
      var that = this
      var options = that.config;
      var elemColorBox = that.elemColorBox[0]; // 获取颜色选择框对象 dom
      
      // 颜色选择器对象，生成颜色选择器对象dom。这个dom是点击颜色选择框时要挂载的dom，用于用户选择颜色
      var elemPicker = that.elemPicker = $(['<div id="layui-colorpicker'+ that.index +'" data-index="'+ that.index +'" class="layui-anim layui-anim-downbit layui-colorpicker-main">',
        // 颜色面板区 (就是选择器中区域最大的那一块)
        '<div class="layui-colorpicker-main-wrapper">',
          '<div class="layui-colorpicker-basis">',
            '<div class="layui-colorpicker-basis-white"></div>',
            '<div class="layui-colorpicker-basis-black"></div>',
            '<div class="layui-colorpicker-basis-cursor"></div>',
          '</div>',
          '<div class="layui-colorpicker-side">',
            '<div class="layui-colorpicker-side-slider"></div>',
          '</div>',
        '</div>',
        
        // 透明度条块 (颜色面板区右边的垂直带区域，可以用选择不同颜色)
        '<div class="layui-colorpicker-main-alpha '+ (options.alpha ? SHOW : '') +'">',
          '<div class="layui-colorpicker-alpha-bgcolor">',
            '<div class="layui-colorpicker-alpha-slider"></div>',
          '</div>',
        '</div>',
        
        // 预设颜色列表 (颜色面板去下部，一块一块的颜色列表)
        function(){
          if(options.predefine){ // 如果预定义颜色已开启
            var list = ['<div class="layui-colorpicker-main-pre">'];
            layui.each(options.colors, function(i, v){ // 遍历预定义颜色
              list.push(['<div class="layui-colorpicker-pre'+ ((v.match(/[0-9]{1,3}/g) || []).length > 3 
                ? ' layui-colorpicker-pre-isalpha' // 添加透明类
              : '') +'">'
                ,'<div style="background:'+ v +'"></div>'
              ,'</div>'].join(''));
            });
            list.push('</div>');
            return list.join(''); // 字符串拼接
          } else {
            return '';
          }
        }(),
        
        // 底部表单元素区域
        '<div class="layui-colorpicker-main-input">',
          '<div class="layui-inline">',
            '<input type="text" class="layui-input">',
          '</div>',
          '<div class="layui-btn-container">',
            '<button class="layui-btn layui-btn-primary layui-btn-sm" colorpicker-events="clear">清空</button>',
            '<button class="layui-btn layui-btn-sm" colorpicker-events="confirm">确定</button>',
          '</div>',
        '</div>',
      '</div>'].join(''));
      
      var elemColorBoxSpan = that.elemColorBox.find('.' + PICKER_TRIG_SPAN)[0];
      
      // 如果当前点击的颜色盒子已经存在选择器，则关闭
      if($(ELEM_MAIN)[0] && $(ELEM_MAIN).data('index') == that.index){
        that.removePicker(Class.thisElemInd);
      } else { // 插入颜色选择器
        that.removePicker(Class.thisElemInd); 
        $('body').append(elemPicker); // 挂载颜色选择器
      }
      
      Class.thisElemInd = that.index; // 记录最新打开的选择器索引
      Class.thisColor =  elemColorBox.style.background // 记录最新打开的选择器颜色选中值
      
      that.position(); // 颜色选择器位置定位
      that.pickerEvents(); // 给颜色选择器添加相应事件
    };
  
    // 颜色选择器移除
    Class.prototype.removePicker = function(index){
      var that = this;
      var options = that.config;
      $('#layui-colorpicker'+ (index || that.index)).remove(); // 移除颜色选择器
      return that;
    };
    
    // 定位算法
    Class.prototype.position = function(){
      var that = this;
      var options = that.config;
      lay.position(that.bindElem || that.elemColorBox[0], that.elemPicker[0], {
        position: options.position,
        align: 'center'
      });
      return that;
    };
  
    // 颜色选择器赋值
    Class.prototype.val = function(){
      var that = this;
      var options = that.config;
      
      var elemColorBox = that.elemColorBox.find('.' + PICKER_TRIG_SPAN); // 获取颜色选择框下layui-colorpicker-trigger-span dom
      var elemPickerInput = that.elemPicker.find('.' + PICKER_INPUT); // 获取颜色选择器中input值
      var e = elemColorBox[0]; 
      var bgcolor = e.style.backgroundColor; // 获取当前颜色选择框中的颜色
      
      // 判断是否有背景颜色
      if(bgcolor){
        
        // 转化成hsb格式
        var hsb = RGBToHSB(RGBSTo(bgcolor));
        var type = elemColorBox.attr('lay-type'); // 获取当前用户配置的颜色输入输出格式
        
        // 同步滑块的位置及颜色选择器的选择
        that.select(hsb.h, hsb.s, hsb.b);
        
        // 如果格式要求为rgb
        if(type === 'torgb'){
          elemPickerInput.find('input').val(bgcolor);
        };
        
        // 如果格式要求为rgba
        if(type === 'rgba'){
          var rgb = RGBSTo(bgcolor);
          
          // 如果开启透明度而没有设置，则给默认值
          if((bgcolor.match(/[0-9]{1,3}/g) || []).length == 3){
            elemPickerInput.find('input').val('rgba('+ rgb.r +', '+ rgb.g +', '+ rgb.b +', 1)');
            that.elemPicker.find('.'+ PICKER_ALPHA_SLIDER).css("left", 280);
          } else {
            elemPickerInput.find('input').val(bgcolor);
            var left = bgcolor.slice(bgcolor.lastIndexOf(",") + 1, bgcolor.length - 1) * 280;
            that.elemPicker.find('.'+ PICKER_ALPHA_SLIDER).css("left", left);
          };
          
          // 设置span背景色
          that.elemPicker.find('.'+ PICKER_ALPHA_BG)[0].style.background = 'linear-gradient(to right, rgba('+ rgb.r +', '+ rgb.g +', '+ rgb.b +', 0), rgb('+ rgb.r +', '+ rgb.g +', '+ rgb.b +'))';    
        };
  
      }else{
        // 如果没有背景颜色则默认到最初始的状态
        that.select(0,100,100);
        elemPickerInput.find('input').val("");
        that.elemPicker.find('.'+ PICKER_ALPHA_BG)[0].style.background = '';
        that.elemPicker.find('.'+ PICKER_ALPHA_SLIDER).css("left", 280);
      }
    };
  
    // 颜色选择器滑动 / 点击
    Class.prototype.side = function(){
      var that = this;
      var options = that.config
      
      var span = that.elemColorBox.find('.' + PICKER_TRIG_SPAN); // 获取颜色选择框中的 layui-colorpicker-trigger-span dom
      var type = span.attr('lay-type'); // 获取当前用户配置的颜色输入输出格式
  
      var side = that.elemPicker.find('.' + PICKER_SIDE); // 获取颜色选择器右侧的layui-colorpicker-side类
      var slider = that.elemPicker.find('.' + PICKER_SIDE_SLIDER); // 获取颜色选择器右侧的滑动的块 dom
      var basis = that.elemPicker.find('.' + PICKER_BASIS); // 获取颜色选择器layui-colorpicker-basis类 就是颜色面板区中的dom
      var choose = that.elemPicker.find('.' + PICKER_BASIS_CUR); // 获取颜色选择器颜色区中的小圆点
      var alphacolor = that.elemPicker.find('.' + PICKER_ALPHA_BG);
      var alphaslider = that.elemPicker.find('.' + PICKER_ALPHA_SLIDER);
      
      var _h = slider[0].offsetTop/180*360
      ,_b = 100 - (choose[0].offsetTop + 3)/180*100
      ,_s = (choose[0].offsetLeft + 3)/260*100
      ,_a = Math.round(alphaslider[0].offsetLeft/280*100)/100    
      
      var i = that.elemColorBox.find('.' + PICKER_TRIG_I);
      var pre = that.elemPicker.find('.layui-colorpicker-pre').children('div');
  
      var change = function(x,y,z,a){
        that.select(x, y, z);
        var rgb = HSBToRGB({h:x, s:y, b:z});
        i.addClass(ICON_PICKER_DOWN).removeClass(ICON_PICKER_CLOSE);
        span[0].style.background = 'rgb('+ rgb.r +', '+ rgb.g +', '+ rgb.b +')';
        
        if(type === 'torgb'){
          that.elemPicker.find('.' + PICKER_INPUT).find('input').val('rgb('+ rgb.r +', '+ rgb.g +', '+ rgb.b +')');
        };
        
        if(type  === 'rgba'){
          var left = 0;
          left = a * 280;
          alphaslider.css("left", left);
          that.elemPicker.find('.' + PICKER_INPUT).find('input').val('rgba('+ rgb.r +', '+ rgb.g +', '+ rgb.b +', '+ a +')');
          span[0].style.background = 'rgba('+ rgb.r +', '+ rgb.g +', '+ rgb.b +', '+ a +')';
          alphacolor[0].style.background = 'linear-gradient(to right, rgba('+ rgb.r +', '+ rgb.g +', '+ rgb.b +', 0), rgb('+ rgb.r +', '+ rgb.g +', '+ rgb.b +'))'
        };
        
        //回调更改的颜色
        options.change && options.change(that.elemPicker.find('.' + PICKER_INPUT).find('input').val());
      }
  
      // 拖拽元素
      var elemMove = $(['<div class="layui-auxiliar-moving" id="LAY-colorpicker-moving"></div>'].join(''))
      var createMoveElem = function(call){
        $('#LAY-colorpicker-moving')[0] || $('body').append(elemMove);
        elemMove.on('mousemove', call);
        elemMove.on('mouseup', function(){
          elemMove.remove();
        }).on('mouseleave', function(){
          elemMove.remove();
        });
      };
  
      // 右侧主色选择
      slider.on('mousedown', function(e){
        var oldtop = this.offsetTop
        ,oldy = e.clientY;
        var move = function(e){
          var top = oldtop + (e.clientY - oldy)
          ,maxh = side[0].offsetHeight;
          if(top < 0)top = 0;
          if(top > maxh)top = maxh;
          var h = top/180*360;
          _h = h;
          change(h, _s, _b, _a);
          e.preventDefault();
        };
        
        createMoveElem(move);
        //layui.stope(e);
        e.preventDefault();
      });
      
      side.on('click', function(e){
        var top = e.clientY - $(this).offset().top;
        if(top < 0)top = 0;
        if(top > this.offsetHeight)top = this.offsetHeight;     
        var h = top/180*360;
        _h = h;
        change(h, _s, _b, _a); 
        e.preventDefault();
      });
      
      // 中间小圆点颜色选择
      choose.on('mousedown', function(e){
        var oldtop = this.offsetTop
        ,oldleft = this.offsetLeft
        ,oldy = e.clientY
        ,oldx = e.clientX;
        var move = function(e){
          var top = oldtop + (e.clientY - oldy)
          ,left = oldleft + (e.clientX - oldx)
          ,maxh = basis[0].offsetHeight - 3
          ,maxw = basis[0].offsetWidth - 3;
          if(top < -3)top = -3;
          if(top > maxh)top = maxh;
          if(left < -3)left = -3;
          if(left > maxw)left = maxw;
          var s = (left + 3)/260*100
          ,b = 100 - (top + 3)/180*100;
          _b = b;
          _s = s;
          change(_h, s, b, _a); 
          e.preventDefault();
        };
        layui.stope(e);
        createMoveElem(move);
        e.preventDefault();
      });
      
      basis.on('mousedown', function(e){
        var top = e.clientY - $(this).offset().top - 3 + $win.scrollTop()
        ,left = e.clientX - $(this).offset().left - 3 + $win.scrollLeft()
        if(top < -3)top = -3;
        if(top > this.offsetHeight - 3)top = this.offsetHeight - 3;
        if(left < -3)left = -3;
        if(left > this.offsetWidth - 3)left = this.offsetWidth - 3;
        var s = (left + 3)/260*100
        ,b = 100 - (top + 3)/180*100;
        _b = b;
        _s = s;
        change(_h, s, b, _a); 
        layui.stope(e);
        e.preventDefault();
        choose.trigger(e, 'mousedown');
      });
      
      // 底部透明度选择
      alphaslider.on('mousedown', function(e){
        var oldleft = this.offsetLeft
        ,oldx = e.clientX;
        var move = function(e){
          var left = oldleft + (e.clientX - oldx)
          ,maxw = alphacolor[0].offsetWidth;
          if(left < 0)left = 0;
          if(left > maxw)left = maxw;
          var a = Math.round(left /280*100) /100;
          _a = a;
          change(_h, _s, _b, a); 
          e.preventDefault();
        };
        
        createMoveElem(move);
        e.preventDefault();
      });
      alphacolor.on('click', function(e){
        var left = e.clientX - $(this).offset().left
        if(left < 0)left = 0;
        if(left > this.offsetWidth)left = this.offsetWidth;
        var a = Math.round(left /280*100) /100;
        _a = a;
        change(_h, _s, _b, a); 
        e.preventDefault();
      });
      
      // 预定义颜色选择
      pre.each(function(){
        $(this).on('click', function(){
          $(this).parent('.layui-colorpicker-pre').addClass('selected').siblings().removeClass('selected');
          var color = this.style.backgroundColor
          ,hsb = RGBToHSB(RGBSTo(color))
          ,a = color.slice(color.lastIndexOf(",") + 1, color.length - 1),left;
          _h = hsb.h;
          _s = hsb.s;
          _b = hsb.b;
          if((color.match(/[0-9]{1,3}/g) || []).length == 3) a = 1;
          _a = a;
          left = a * 280;
          change(hsb.h, hsb.s, hsb.b, a);
        })
      });
    };
  
    // 颜色选择器hsb转换
    Class.prototype.select = function(h, s, b, type){
      var that = this
      var options = that.config;
      var hex = HSBToHEX({h:h, s:100, b:100}); // hsb转hex函数
      var color = HSBToHEX({h:h, s:s, b:b});
      var sidetop = h/360*180;
      var top = 180 - b/100*180 - 3
      var left = s/100*260 - 3;
      
      that.elemPicker.find('.' + PICKER_SIDE_SLIDER).css("top", sidetop); // 颜色面板区右侧滑块的top
      that.elemPicker.find('.' + PICKER_BASIS)[0].style.background = '#' + hex; // 颜色选择器的背景
      
      // 选择器的top left, 设置颜色面板区中小圆点的位置
      that.elemPicker.find('.' + PICKER_BASIS_CUR).css({ // 设置选择
        "top": top,
        "left": left
      }); 
      
      if(type === 'change') return;
      
      // 选中的颜色
      that.elemPicker.find('.' + PICKER_INPUT).find('input').val('#' + color); // 向input中显示当前颜色值
    };
    
    // 颜色选择器事件
    Class.prototype.pickerEvents = function(){
      var that = this;
      var options = that.config;
      var elemColorBoxSpan = that.elemColorBox.find('.' + PICKER_TRIG_SPAN); // 获取颜色选择框中颜色盒子dom
      var elemPickerInput = that.elemPicker.find('.' + PICKER_INPUT + ' input'); //获取颜色选择器中表单input dom
      
      // 颜色选择器事件
      var pickerEvents = {
        // 清空
        clear: function(othis){ // 清空事件
          elemColorBoxSpan[0].style.background =''; // 清空颜色选择框中的颜色
          that.elemColorBox.find('.' + PICKER_TRIG_I).removeClass(ICON_PICKER_DOWN).addClass(ICON_PICKER_CLOSE); // 更换颜色选择框中的图标
          that.color = ''; // 清空当前实例存储的color
          
          options.done && options.done(''); // 调用回调函数
          that.removePicker(); // 移除颜色选择器
        }, 
        
        // 确认
        confirm: function(othis, change){ // 确定事件
          var value = elemPickerInput.val(); // 获取颜色值
          var colorValue = value, hsb = {};
          
          if(value.indexOf(',') > -1){ // 根据颜色类型进行不同转换，并显示到颜色选择框中
            hsb = RGBToHSB(RGBSTo(value));
            that.select(hsb.h, hsb.s, hsb.b);
            elemColorBoxSpan[0].style.background = (colorValue = '#' + HSBToHEX(hsb)); // 颜色显示到颜色选择框中
            
            if((value.match(/[0-9]{1,3}/g) || []).length > 3 && elemColorBoxSpan.attr('lay-type') === 'rgba'){
              var left = value.slice(value.lastIndexOf(",") + 1, value.length - 1) * 280;
              that.elemPicker.find('.' + PICKER_ALPHA_SLIDER).css("left", left);
              elemColorBoxSpan[0].style.background = value;
              colorValue = value;
            };
          } else {
            hsb = HEXToHSB(value);
            elemColorBoxSpan[0].style.background = (colorValue = '#' + HSBToHEX(hsb)); 
            that.elemColorBox.find('.' + PICKER_TRIG_I).removeClass(ICON_PICKER_CLOSE).addClass(ICON_PICKER_DOWN); // 变换颜色选择框中的 icon
          };
          
          if(change === 'change'){
            that.select(hsb.h, hsb.s, hsb.b, change); // 颜色转换
            options.change && options.change(colorValue); // 调用回调函数
            return;
          }
          that.color = value; // 设置当前颜色值
          
          options.done && options.done(value); // 调用回调函数
          that.removePicker(); // 移除颜色选择器
        }
      };
      
      // 选择器面板点击事件
      that.elemPicker.on('click', '*[colorpicker-events]', function(){
        var othis = $(this)
        var attrEvent = othis.attr('colorpicker-events'); // 获取保存在属性中的事件名
        pickerEvents[attrEvent] && pickerEvents[attrEvent].call(this, othis);
      });
      
      // 输入框事件
      elemPickerInput.on('keyup', function(e){
        var othis = $(this)
        pickerEvents.confirm.call(this, othis, e.keyCode === 13 ?  null : 'change');
      });
    }
  
    // 颜色选择器输入
    Class.prototype.events = function(){
      var that = this
      var options = that.config;
      var elemColorBoxSpan = that.elemColorBox.find('.' + PICKER_TRIG_SPAN); // 获取颜色选择框下的layui-colorpicker-trigger-span类
      
      // 弹出颜色选择器。 为颜色选择框添加click事件
      that.elemColorBox.on('click' , function(){
        that.renderPicker(); // 渲染颜色选择器
        if($(ELEM_MAIN)[0]){ // 如果存在颜色选择器
          that.val(); // 给颜色选择器赋值
          that.side(); // 
        };   
      });
      
      // 如果不存在dom或是eventHandler为true, 后续不执行
      if(!options.elem[0] || that.elemColorBox[0].eventHandler) return;
      
      // 绑定关闭控件事件
      $doc.on(clickOrMousedown, function(e){
        // 如果点击的元素是颜色框
        if($(e.target).hasClass(ELEM) 
          || $(e.target).parents('.'+ELEM)[0]
        ) return; 
        
        // 如果点击的元素是选择器
        if($(e.target).hasClass(ELEM_MAIN.replace(/\./g, '')) 
          || $(e.target).parents(ELEM_MAIN)[0]
        ) return; 
        
        if(!that.elemPicker) return;
        
        if(that.color){
          var hsb = RGBToHSB(RGBSTo(that.color));
          that.select(hsb.h, hsb.s, hsb.b); 
        } else {
          that.elemColorBox.find('.' + PICKER_TRIG_I).removeClass(ICON_PICKER_DOWN).addClass(ICON_PICKER_CLOSE);
        }
        elemColorBoxSpan[0].style.background = that.color || '';
        
        that.removePicker();
      });
  
      //自适应定位
      $win.on('resize', function(){
        if(!that.elemPicker ||  !$(ELEM_MAIN)[0]){
          return false;
        }
        that.position();
      });
      
      that.elemColorBox[0].eventHandler = true;
    };
    
    // 核心入口
    colorpicker.render = function(options){
      var inst = new Class(options);
      return thisColorPicker.call(inst);
    };
    
    exports(MOD_NAME, colorpicker); // 导出模块
});
  