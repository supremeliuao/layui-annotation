layui.define(function(exports){
    "use strict";
    
    var doc = document; // 获取 document
    var id = 'getElementById';
    var tag = 'getElementsByTagName';
    
    // 字符常量
    var MOD_NAME = 'laypage'; // 模块名
    var DISABLED = 'layui-disabled'; // disabled 类
    
    /**
     * 构造器
     * options 对象包含一下属性值
     * 参数选项          类型                默认值                       说明     
     * elem             String/Object       -                           指向存放分页的容器，值可以是容器ID、DOM对象。如：1. elem: 'id' 注意：这里不能加 # 号。2. elem: document.getElementById('id') 
     * count            Number              -                           数据总数。一般通过服务端得到
     * limit            Number              10             	            每页显示的条数。laypage将会借助 count 和 limit 计算出分页数。
     * limits           Array               [10, 20, 30, 40, 50]        每页条数的选择项。如果 layout 参数开启了 limit，则会出现每页条数的select选择框
     * curr             Number              1                           起始页。一般用于刷新类型的跳页以及HASH跳页。
     * groups           Number              5                           连续出现的页码个数
     * prev             String              上一页                      自定义“上一页”的内容，支持传入普通文本和HTML
     * next             String              下一页                      自定义“下一页”的内容，同上
     * first            String              1                           自定义“首页”的内容，同上
     * last             String              总页数值                    自定义“尾页”的内容，同上
     * layout           Array               ['prev', 'page', 'next']     自定义排版。可选值有：count（总条目输区域）、prev（上一页区域）、page（分页区域）、next（下一页区域）、limit（条目选项区域）、refresh（页面刷新区域。注意：layui 2.3.0 新增） 、skip（快捷跳页区域）
     * theme            String              -                           自定义主题。支持传入：颜色值，或任意普通字符
     * hash             String/Boolean	    false                       开启location.hash，并自定义 hash 值。如果开启，在触发分页时，会自动对url追加：#!hash值={curr} 利用这个，可以在页面载入时就定位到指定页     
     */
    var Class = function(options){
      var that = this;
      that.config = options || {}; // 获取配置，默认空对象。 注意：该模块和其他模块不一样。它没有默认配置，直接使用用户传入的配置
      that.config.index = ++laypage.index;
      
      that.render(true); // 渲染
    };
  
    // 判断传入的容器类型
    Class.prototype.type = function(){
      var config = this.config; // 获取配置

      // 判断存放分页的容器字段值是否是 object 类型
      if(typeof config.elem === 'object'){
        
        // 当通过 getElementById 方式获取 dom时, length 为 undefined, 
        // 通过 getElementsByClassName 这种方式获取 dom 或者通过jquery $('#xx') 获取时，会是一个类数据结构，是存在length的
        return config.elem.length === undefined ? 2 : 3;
      }
    };
  
    // 分页视图
    Class.prototype.view = function(){
      var that = this;
      var config = that.config; // 获取配置

      // 判断是否设置连续出现页码，如果设置则使用用户设置的(和0按位运算，获取整数)，否则默认 5
      var groups = config.groups = 'groups' in config ? ( config.groups | 0 ) : 5; // 连续页码个数
      
      // 判断用户是否自定义排版，如果自定义排版则使用用户设置的，否则默认 ['prev', 'page', 'next']
      config.layout = typeof config.layout === 'object' 
        ? config.layout 
        : ['prev', 'page', 'next'];
      
      config.count = config.count | 0; //数据总数
      config.curr = ( config.curr | 0 ) || 1; //当前页
  
      // 判断用户是否设置了每页条数的选择项, 如果设置则使用用户设置的，否则默认[10, 20, 30, 40, 50]
      config.limits = typeof config.limits === 'object'
        ? config.limits
        : [10, 20, 30, 40, 50];

      config.limit = ( config.limit | 0 ) || 10; // 默认每页显示条数, 默认 10 条
      
      // 总页数 = 向上取整(数据总数 / 每页显示条数) || 1
      config.pages = Math.ceil(config.count/config.limit) || 1;
      
      // 判断当前页是否超过总页数, 如果超过赋值总页数
      if(config.curr > config.pages){
        config.curr = config.pages;
      }
      
      // 连续分页个数不能低于0且不能大于总页数
      if(groups < 0){
        groups = 1;
      } else if (groups > config.pages){
        groups = config.pages;
      }
      
      // 判断用户是否自定义设置上一页或者下一页内容， 如果设置则用用户设置的，否则使用默认
      config.prev = 'prev' in config ? config.prev : '&#x4E0A;&#x4E00;&#x9875;'; //上一页文本
      config.next = 'next' in config ? config.next : '&#x4E0B;&#x4E00;&#x9875;'; //下一页文本

      /**
       * 计算当前组
       * 这里的计算当前组类似于取余%循环操作，举例说明
       * limit = 10, count = 100, pages = 10, groups = 5,
       * 
       * index 变化如下(因为config.pages > groups)
       * config.curr = 1, index = Math.ceil(( 1 + 1 ) / 5) = 1;
       * config.curr = 2, index = Math.ceil(( 2 + 1 ) / 5) = 1;
       * config.curr = 3, index = Math.ceil(( 3 + 1 ) / 5) = 1;
       * config.curr = 4, index = Math.ceil(( 4 + 1 ) / 5) = 1;
       * config.curr = 5, index = Math.ceil(( 5 + 1 ) / 5) = 2;
       * config.curr = 6, index = Math.ceil(( 6 + 1 ) / 5) = 2;
       * ...
       * config.curr = 10, index = Math.ceil(( 10 + 1 ) / 5) = 3;
       */
      var index = config.pages > groups 
        ? Math.ceil( (config.curr + (groups > 1 ? 1 : 0)) / (groups > 0 ? groups : 1) )
        : 1;

      // 视图片段
      var views = {

        // 上一页
        prev: function(){
          
          // 如果 config.prev 有配置，则返回 '上一页' dom 字符串
          return config.prev 
            ? '<a href="javascript:;" class="layui-laypage-prev'+ (config.curr == 1 ? (' ' + DISABLED) : '') +'" data-page="'+ (config.curr - 1) +'">'+ config.prev +'</a>'
            : '';
        }(),
        
        //页码
        page: function(){
          var pager = [];
          
          // 数据量为0时，不输出页码
          if(config.count < 1){
            return '';
          }
          
          // 首页
          if(index > 1 && config.first !== false && groups !== 0){
            pager.push('<a href="javascript:;" class="layui-laypage-first" data-page="1"  title="&#x9996;&#x9875;">'+ (config.first || 1) +'</a>');
          }
          
          // 计算当前页码组的起始页
          var halve = Math.floor((groups-1)/2); // 页码数等分
          
          // 这里 index 大于1，说明 curr已经大于等于 pages
          var start = index > 1 ? config.curr - halve : 1;
          
          // 判断当前index组是否大于1，如果不大于默认 groups
          var end = index > 1 ? (function(){
            var max = config.curr + (groups - halve - 1);
            return max > config.pages ? config.pages : max;
          }()) : groups;
          
          // 防止最后一组出现“不规定”的连续页码数
          if(end - start < groups - 1){
            start = end - groups + 1;
          }
  
          // 输出左分割符(分隔符为...)
          if(config.first !== false && start > 2){
            pager.push('<span class="layui-laypage-spr">&#x2026;</span>')
          }
          
          // 输出连续页码
          for(; start <= end; start++){
            
            if(start === config.curr){
              //当前页
              pager.push('<span class="layui-laypage-curr"><em class="layui-laypage-em" '+ (/^#/.test(config.theme) ? 'style="background-color:'+ config.theme +';"' : '') +'></em><em>'+ start +'</em></span>');
            } else {
              
              // 这里的 data-page 用于以后跳转时，获取当前页面
              pager.push('<a href="javascript:;" data-page="'+ start +'">'+ start +'</a>');
            }

          }
          
          // 输出输出右分隔符 & 末页
          if(config.pages > groups && config.pages > end && config.last !== false){
            if(end + 1 < config.pages){
              pager.push('<span class="layui-laypage-spr">&#x2026;</span>');
            }
            if(groups !== 0){
              pager.push('<a href="javascript:;" class="layui-laypage-last" title="&#x5C3E;&#x9875;"  data-page="'+ config.pages +'">'+ (config.last || config.pages) +'</a>');
            }
          }
  
          return pager.join('');
        }(),
        
        // 下一页
        next: function(){

          // 如果 config.next 有配置，则返回 '下一页' dom 字符串
          return config.next 
            ? '<a href="javascript:;" class="layui-laypage-next'+ (config.curr == config.pages ? (' ' + DISABLED) : '') +'" data-page="'+ (config.curr + 1) +'">'+ config.next +'</a>'
          : '';
        }(),
        
        // 数据总数 dom 字符串
        count: '<span class="layui-laypage-count">共 '+ config.count +' 条</span>',
        
        // 显示每页条数 select 框
        limit: function(){
          var options = ['<span class="layui-laypage-limits"><select lay-ignore>'];
          
          // 循环数组结构，输出不同页面条数选项
          layui.each(config.limits, function(index, item){
            options.push(
              '<option value="'+ item +'"'
              +(item === config.limit ? 'selected' : '') 
              +'>'+ item +' 条/页</option>'
            );
          });
          return options.join('') +'</select></span>';
        }(),
        
        // 刷新当前页 dom 字符串结构
        refresh: ['<a href="javascript:;" data-page="'+ config.curr +'" class="layui-laypage-refresh">'
          ,'<i class="layui-icon layui-icon-refresh"></i>'
        ,'</a>'].join(''),
  
        // 跳页区域 dom 字符串结构
        skip: function(){
          return ['<span class="layui-laypage-skip">&#x5230;&#x7B2C;'
            ,'<input type="text" min="1" value="'+ config.curr +'" class="layui-input">'
            ,'&#x9875;<button type="button" class="layui-laypage-btn">&#x786e;&#x5b9a;</button>'
          ,'</span>'].join('');
        }()
      };
      
      // 返回拼接完毕的分页 dom 字符串
      return ['<div class="layui-box layui-laypage layui-laypage-'+ (config.theme ? (
        /^#/.test(config.theme) ? 'molv' : config.theme
      ) : 'default') +'" id="layui-laypage-'+ config.index +'">',
        function(){
          var plate = [];

          // 根据排版配置选择不同组件，拼接完毕返回
          layui.each(config.layout, function(index, item){
            
            // 如果 item 在 views 中(模块中)，则使用该模块
            if(views[item]){
              plate.push(views[item])
            }
          });
          return plate.join('');
        }(),
      '</div>'].join('');
    };
  
    // 跳页的回调
    Class.prototype.jump = function(elem, isskip){
      if(!elem) return; 

      var that = this;
      var config = that.config;
      var childs = elem.children;
      var btn = elem[tag]('button')[0]; // 获取 button dom
      var input = elem[tag]('input')[0]; // 获取 input dom
      var select = elem[tag]('select')[0]; // 获取 select dom

      var skip = function(){ // 跳转函数
        // 获取 input 值，对\s:空白字符或\D:非数字字符进行处理。和 0 按位操作，得到整数
        var curr = input.value.replace(/\s|\D/g, '')|0; 
        
        if(curr){
          config.curr = curr; // 更新当前位置
          that.render(); // 重新渲染
        }
      };
      
      if(isskip) return skip();
      
      //页码
      for(var i = 0, len = childs.length; i < len; i++){

        // 给 a 标签添加 click 事件
        if(childs[i].nodeName.toLowerCase() === 'a'){
          laypage.on(childs[i], 'click', function(){

            // 获取当前页值
            var curr = this.getAttribute('data-page')|0;
            
            // 如果当前页小于1或者大于总页数，后续都不执行
            if(curr < 1 || curr > config.pages) return;
            config.curr = curr; // 更新当前位置
            that.render(); // 重新渲染
          });
        }
      }
      
      //条数
      if(select){
        
        // 给 select 添加 change 事件
        laypage.on(select, 'change', function(){
          var value = this.value;

          // 如果当前页乘上页面条数大于数据总数，则 curr = 向上取整(数据总数/每页条数)
          if(config.curr*value > config.count){
            config.curr = Math.ceil(config.count/value);
          }
          config.limit = value; // 更新每页显示条数
          that.render(); // 重新渲染
        });
      }
      
      //确定
      if(btn){
        
        // 给确定按钮添加 click 事件
        laypage.on(btn, 'click', function(){
          skip();
        });
      }
    };
    
    // 输入页数字控制
    Class.prototype.skip = function(elem){
      if(!elem) return;

      var that = this;
      var input = elem[tag]('input')[0];
      if(!input) return;

      // 给 input 添加 keyup 事件
      laypage.on(input, 'keyup', function(e){
        var value = this.value;
        var keyCode = e.keyCode; // 获取键盘键对应的值
        
        // 37：Left
        // 38：Up
        // 39 Right
        // 40 Down
        // 上诉集中情况后续代码均不执行
        if(/^(37|38|39|40)$/.test(keyCode)) return;
        
        // value中包含非数字字符时, 对 value 进行处理
        if(/\D/.test(value)){
          this.value = value.replace(/\D/, '');
        }

        // 当为 enter 时进行跳转
        if(keyCode === 13){
          that.jump(elem, true)
        }
      });
    };
  
    // 渲染分页
    Class.prototype.render = function(load){
      var that = this;
      var config = that.config;
      var type = that.type(); // type值分别为: undefined, 2, 3
      var view = that.view();

      if(type === 2){ // 当 elem 是对象并且没有 length 属性时
        config.elem && (config.elem.innerHTML = view); // 直接通过 innerHTML 赋值
      } else if(type === 3){ // 虽然通过 getElementsByClassName 这种方式获取 dom，是 type，但是并没有html()方法。所以这里是通过jquery $('#xx') 获取的
        config.elem.html(view);
      } else {

        // 字符串类型
        if(doc[id](config.elem)){
          doc[id](config.elem).innerHTML = view;
        }
      }
      
      // 如果用户配置切换分页回调，则调用
      config.jump && config.jump(config, load); // 传入参数 config:当前分页的所有选项值。 load: 是否首次，一般用于初始加载的判断
      
      // 获取当前分页 dom
      var elem = doc[id]('layui-laypage-' + config.index);
      that.jump(elem);
      
      if(config.hash && !load){
        location.hash = '!'+ config.hash +'='+ config.curr;
      }
      
      that.skip(elem);
    };
    
    // 外部接口
    var laypage = {

      // 分页渲染
      render: function(options){
        var o = new Class(options);
        return o.index;
      },
      
      index: layui.laypage ? (layui.laypage.index + 10000) : 0,
      
      on: function(elem, even, fn){
        elem.attachEvent ? elem.attachEvent('on'+ even, function(e){ //for ie
          e.target = e.srcElement;
          fn.call(elem, e);
        }) : elem.addEventListener(even, fn, false);
        return this;
      }
    };
    
    // 导出模块
    exports(MOD_NAME, laypage);
});