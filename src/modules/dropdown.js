layui.define(['jquery', 'laytpl', 'lay'], function(exports){
    "use strict";
    
    var $ = layui.$;
    var laytpl = layui.laytpl;
    var hint = layui.hint();
    var device = layui.device();
    var clickOrMousedown = (device.mobile ? 'click' : 'mousedown'); // 判断交互方式
    
    var MOD_NAME = 'dropdown'; // 模块名
    var MOD_INDEX = 'layui_'+ MOD_NAME +'_index'; // 模块索引名
  
    // 外部接口
    var dropdown = {
      config: {},
      index: layui[MOD_NAME] ? (layui[MOD_NAME].index + 10000) : 0,
  
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
    }
  
    //操作当前实例
    var thisModule = function(){
      var that = this;
      var options = that.config; // 获取配置
      var id = options.id; // 获取菜单 ID。用户菜单项唯一索引
  
      thisModule.that[id] = that; // 记录当前实例对象
  
      return {
        config: options,
        // 重置实例
        reload: function(options){
          that.reload.call(that, options);
        }
      }
    }
  
    // 字符常量
    var STR_ELEM = 'layui-dropdown';
    var STR_HIDE = 'layui-hide';
    var STR_DISABLED = 'layui-disabled';
    var STR_NONE = 'layui-none';
    var STR_ITEM_UP = 'layui-menu-item-up';
    var STR_ITEM_DOWN = 'layui-menu-item-down';
    var STR_MENU_TITLE = 'layui-menu-body-title';
    var STR_ITEM_GROUP = 'layui-menu-item-group';
    var STR_ITEM_PARENT = 'layui-menu-item-parent';
    var STR_ITEM_DIV = 'layui-menu-item-divider';
    var STR_ITEM_CHECKED = 'layui-menu-item-checked';
    var STR_ITEM_CHECKED2 = 'layui-menu-item-checked2';
    var STR_MENU_PANEL = 'layui-menu-body-panel';
    var STR_MENU_PANEL_L = 'layui-menu-body-panel-left';
    var STR_GROUP_TITLE = '.'+ STR_ITEM_GROUP + '>.'+ STR_MENU_TITLE;
    
    /**
     * 构造器
     * options 对象包含一下属性值
     * 参数选项          类型                默认值                       说明  
     * elem             String/DOM          -                            绑定触发组件的元素。必填项
     * data             Array               []                           菜单列数据项，其参数详见下文。必填项
     * trigger          String              click                        触发组件的事件类型。支持所有事件，如：click/hover/mousedown/contextmenu 等
     * show             Boolean             false                        是否初始即显示组件面板
     * align            String              left                         下拉面板相对绑定元素的水平对齐方式（支持: left/center/right） v2.6.8 新增
     * isAllowSpread	  Boolean             true                         是否允许菜单组展开收缩
     * isSpreadItem     Boolean             true                         是否初始展开子菜单
     * delay            Number              300                          延迟关闭的毫秒数。当 trigger 为 hover 时才生效
     * className        String              -                            自定义组件的样式类名
     * style            String              -                            设置组件的 style 属性，从而定义新的样式
     * templet          String              -                            全局定义菜单的列表模板，添加任意 html 字符，模版将被 laytpl 组件所转义，因此可通过 {{ d.title }} 的方式得到当前菜单配置的数据。
     * content          String              -                            自定义组件内容，从而替代默认的菜单结构
     * ready            Function            -                            组件成功弹出后的回调，并返回两个参数
     * click            Function            -                            菜单项被点击时的回调，并返回两个参数，
     */
    var Class = function(options){
      var that = this;
      that.index = ++dropdown.index;
      that.config = $.extend({}, that.config, dropdown.config, options);
      that.init();
    };
  
    // 默认配置
    Class.prototype.config = {
      trigger: 'click', // 事件类型
      content: '', // 自定义菜单内容
      className: '', // 自定义样式类名
      style: '', // 设置面板 style 属性
      show: false, // 是否初始即显示菜单面板
      isAllowSpread: true, // 是否允许菜单组展开收缩
      isSpreadItem: true, // 是否初始展开子菜单
      data: [], // 菜单数据结构
      delay: 300, // 延迟关闭的毫秒数，若 trigger 为 hover 时才生效
    };
    
    // 重载实例
    Class.prototype.reload = function(options){
      var that = this;
      that.config = $.extend({}, that.config, options);
      that.init(true);
    };
  
    // 初始化准备
    Class.prototype.init = function(rerender){
      var that = this
      var options = that.config;
      var elem = options.elem = $(options.elem); // 获取容器 dom 
      
      // 若 elem 非唯一
      if(elem.length > 1){
        layui.each(elem, function(){ // 循环渲染
          dropdown.render($.extend({}, options, {
            elem: this
          }));
        });
        return that;
      }
  
      // 若重复执行 render，则视为 reload 处理
      if(!rerender && elem[0] && elem.data(MOD_INDEX)){
        var newThat = thisModule.getThis(elem.data(MOD_INDEX));
        if(!newThat) return; // 不存在当前实例对象后续不执行
  
        return newThat.reload(options);
      };
      
      // 初始化 id 参数
      options.id = ('id' in options) ? options.id : that.index;
      
      if(options.show) that.render(rerender); // 初始即显示
      that.events(); // 事件
    };
    
    // 渲染
    Class.prototype.render = function(rerender){
      var that = this;
      var options = that.config; // 获取配置
      var elemBody = $('body'); // 获取 body dom
      
      // 默认菜单内容
      var getDefaultView = function(){
        var elemUl = $('<ul class="layui-menu layui-dropdown-menu"></ul>');
        if(options.data.length > 0 ){ // 如果菜单列数据项有内容则渲染
          eachItemView(elemUl, options.data)
        } else {
          elemUl.html('<li class="layui-menu-item-none">no menu</li>'); // 显示无菜单
        }
        return elemUl;
      }
      
      // 遍历菜单项
      var eachItemView = function(views, data){
        //var views = [];
        layui.each(data, function(index, item){ // 遍历用户设置的data
          console.log(item);
          // 是否存在子级
          var isChild = item.child && item.child.length > 0; // 判断当前项是否存在child
          var isSpreadItem = ('isSpreadItem' in item) ? item.isSpreadItem : options.isSpreadItem; // 判断是否初始展开子菜单是否存在于item中如果存在则使用item中的，否则使用option中的
          var title = item.templet 
            ? laytpl(item.templet).render(item) 
          : (options.templet ? laytpl(options.templet).render(item) : item.title); // 当前自定义菜单项模板是否存在，如果存在使用item中否则使用options中
          
          // 初始类型
          var type = function(){
            if(isChild){// 存在child时
              item.type = item.type || 'parent'; // 菜单项的类型
            }
            if(item.type){
              return ({
                group: 'group'
                ,parent: 'parent'
                ,'-': '-'
              })[item.type] || 'parent';
            }
            return '';
          }();
          
          // 当type不等于'-'并且title、id和isChild 三者都没有时，后续不执行
          if(type !== '-' && (!item.title && !item.id && !isChild)) return;
          
          // 生成列表元素
          var viewLi = $(['<li'+ function(){
            var className = { // 类名
              group: 'layui-menu-item-group'+ (
                options.isAllowSpread ? (
                  isSpreadItem ? ' layui-menu-item-down' : ' layui-menu-item-up'
                ) : ''
              ),
              parent: STR_ITEM_PARENT,
              '-': 'layui-menu-item-divider'
            };
            if(isChild || type){
              return ' class="'+ className[type] +'"';
            }
            return '';
          }() +'>',
          
            // 标题区
            function(){
              // 是否超文本
              var viewText = ('href' in item) ? (
                '<a href="'+ item.href +'" target="'+ (item.target || '_self') +'">'+ title +'</a>'
              ) : title; // 是超文本则使用a标签，否则使用title
              
              // 是否存在子级
              if(isChild){
                return '<div class="'+ STR_MENU_TITLE +'">'+ viewText + function(){
                  if(type === 'parent'){
                    return '<i class="layui-icon layui-icon-right"></i>';
                  } else if(type === 'group' && options.isAllowSpread){
                    return '<i class="layui-icon layui-icon-'+ (isSpreadItem ? 'up' : 'down') +'"></i>';
                  } else {
                    return '';
                  }
                }() +'</div>'
                
              }
              return '<div class="'+ STR_MENU_TITLE +'">'+ viewText +'</div>';
            }(),
          '</li>'].join(''));
          
          viewLi.data('item', item); // 向li实例附加item数据
          
          // 子级区
          if(isChild){
            var elemPanel = $('<div class="layui-panel layui-menu-body-panel"></div>');
            var elemUl = $('<ul></ul>');
  
            if(type === 'parent'){
              elemPanel.append(eachItemView(elemUl, item.child));
              viewLi.append(elemPanel);
            } else {
              viewLi.append(eachItemView(elemUl, item.child));
            }
          }
  
          views.append(viewLi); // 挂载到ul下
        });
        return views;
      }
      
      // 主模板
      var TPL_MAIN = ['<div class="layui-dropdown layui-border-box layui-panel layui-anim layui-anim-downbit">',
      '</div>'].join('');
      
      // 如果是右键事件，则每次触发事件时，将允许重新渲染
      if(options.trigger === 'contextmenu' || lay.isTopElem(options.elem[0])) rerender = true;
      
      // 判断是否已经打开了下拉菜单面板
      if(!rerender && options.elem.data(MOD_INDEX +'_opened')) return;
  
      // 记录模板对象
      that.elemView = $(TPL_MAIN);
      that.elemView.append(options.content || getDefaultView()); // 挂载到主模板下，并且用户自定义内容优于默认模板
      
      // 初始化某些属性
      if(options.className) that.elemView.addClass(options.className); // 添加自定义类名
      if(options.style) that.elemView.attr('style', options.style); // 添加自定义 style
      
      
      // 记录当前执行的实例索引
      dropdown.thisId = options.id;
      
      // 插入视图
      that.remove(); // 移除非当前绑定元素的面板
      elemBody.append(that.elemView); // 挂载到容器中
      options.elem.data(MOD_INDEX +'_opened', true); // 设置下拉菜单面板已打开
      
      // 坐标定位
      that.position();
      thisModule.prevElem = that.elemView; // 记录当前打开的元素，以便在下次关闭
      thisModule.prevElem.data('prevElem', options.elem); // 将当前绑定的元素，记录在打开元素的 data 对象中
      
      // 阻止全局事件
      that.elemView.find('.layui-menu').on(clickOrMousedown, function(e){
        layui.stope(e);
      });
  
      // 为菜单列表事件添加click事件
      that.elemView.find('.layui-menu li').on('click', function(e){
        var othis = $(this);
        var data = othis.data('item') || {}; // 获取设置在li上的数据，默认空对象
        var isChild = data.child && data.child.length > 0; // 判断是否有child
        
        if(!isChild && data.type !== '-'){ // 不存在child并且菜单类型不为'-'时执行下面操作
          that.remove(); // 删除视图
          typeof options.click === 'function' && options.click(data, othis); // 执行菜单项被点击时的回调
        }
      });
      
      // 触发菜单组展开收缩。 给.layui-menu-item-group > .layui-menu-body-title 添加click 事件
      that.elemView.find(STR_GROUP_TITLE).on('click', function(e){
        var othis = $(this);
        var elemGroup = othis.parent();
        var data = elemGroup.data('item') || {};
  
        if(data.type === 'group' && options.isAllowSpread){ // 当type为group并且用户设置允许菜单组展开收缩
          thisModule.spread(elemGroup); // 执行展开收起
        }
      });
      
      // 如果是鼠标移入事件，则鼠标移出时自动关闭
      if(options.trigger === 'mouseenter'){
        that.elemView.on('mouseenter', function(){
          console.log('mouseenter');
          clearTimeout(thisModule.timer); // 清除定时器
        }).on('mouseleave', function(){
          console.log('mouseleave');
          that.delayRemove(); // 延迟删除视图
        });
      }
  
    };
    
    // 位置定位
    Class.prototype.position = function(obj){
      var that = this;
      var options = that.config;
      
      // 定位
      lay.position(options.elem[0], that.elemView[0], {
        position: options.position,
        e: that.e,
        clickType: options.trigger === 'contextmenu' ? 'right' : null,
        align: options.align || null
      });
    };
    
    // 删除视图
    Class.prototype.remove = function(){
      var that = this
      var options = that.config;
      var elemPrev = thisModule.prevElem;
      
      // 若存在已打开的面板元素，则移除
      if(elemPrev){
        elemPrev.data('prevElem') && (
          elemPrev.data('prevElem').data(MOD_INDEX +'_opened', false) 
        );
        elemPrev.remove();
      }
    };
    
    // 延迟删除视图
    Class.prototype.delayRemove = function(){
      var that = this
      var options = that.config;
      clearTimeout(thisModule.timer); // 清除定时器
  
      thisModule.timer = setTimeout(function(){
        that.remove(); // 根据delay时间触发移除
      }, options.delay);
    };
    
    // 事件
    Class.prototype.events = function(){
      var that = this;
      var options = that.config;
      
      // 如果传入 hover，则解析为 mouseenter
      if(options.trigger === 'hover') options.trigger = 'mouseenter';
  
      // 解除上一个事件
      if(that.prevElem) that.prevElem.off(options.trigger, that.prevElemCallback);
      
      // 记录被绑定的元素及回调
      that.prevElem = options.elem;
      that.prevElemCallback = function(e){
        clearTimeout(thisModule.timer);
        that.e = e;
        that.render();
        e.preventDefault();
        
        // 组件打开完毕的时间
        typeof options.ready === 'function' && options.ready(that.elemView, options.elem, that.e.target);
      };
  
      // 触发元素事件
      options.elem.on(options.trigger, that.prevElemCallback);
      
      // 如果是鼠标移入事件
      if(options.trigger === 'mouseenter'){
        // 直行鼠标移出事件
        options.elem.on('mouseleave', function(){
          that.delayRemove();
        });
      }
    };
    
    // 记录所有实例
    thisModule.that = {}; // 记录所有实例对象
    
    // 获取当前实例对象
    thisModule.getThis = function(id){
      var that = thisModule.that[id];
      if(!that) hint.error(id ? (MOD_NAME +' instance with ID \''+ id +'\' not found') : 'ID argument required');
      return that;
    };
    
    // 设置菜单组展开和收缩状态
    thisModule.spread = function(othis){
      // 菜单组展开和收缩
      var elemIcon = othis.children('.'+ STR_MENU_TITLE).find('.layui-icon');
      if(othis.hasClass(STR_ITEM_UP)){ // 如果处于收缩状态则添加展开
        othis.removeClass(STR_ITEM_UP).addClass(STR_ITEM_DOWN);
        elemIcon.removeClass('layui-icon-down').addClass('layui-icon-up'); // icon更新
      } else { // 添加收缩移除展开
        othis.removeClass(STR_ITEM_DOWN).addClass(STR_ITEM_UP);
        elemIcon.removeClass('layui-icon-up').addClass('layui-icon-down')
      }
    };
    
    // 全局事件
    ;!function(){
      var _WIN = $(window);
      var _DOC = $(document);
      
      // 自适应定位。添加resize事件
      _WIN.on('resize', function(){
        if(!dropdown.thisId) return; // 不存在实例索引，后续不执行
        var that = thisModule.getThis(dropdown.thisId); // 获取当前实例对象
        if(!that) return; // 不存在当前实例对象，后续不执行
        
        if(!that.elemView[0] || !$('.'+ STR_ELEM)[0]){ // 不存在下拉菜单，后续不执行
          return false;
        }
        
        var options = that.config; // 获取配置
        
        if(options.trigger === 'contextmenu'){
          that.remove(); // 右键的话移除视图元素
        } else {
          that.position(); // 调整位置
        }
      });
      
      // 点击任意处关闭
      _DOC.on(clickOrMousedown, function(e){
        if(!dropdown.thisId) return;
        var that = thisModule.getThis(dropdown.thisId)
        if(!that) return;
        
        var options = that.config;
        
        // 如果触发的是绑定的元素，或者属于绑定元素的子元素，则不关闭
        // 满足条件：当前绑定的元素不是 body document，或者不是鼠标右键事件
        if(!(lay.isTopElem(options.elem[0]) || options.trigger === 'contextmenu')){
          if(
            e.target === options.elem[0] || 
            options.elem.find(e.target)[0] ||
            e.target === that.elemView[0] ||
            (that.elemView && that.elemView.find(e.target)[0])
          ) return;
        }
        
        that.remove();
      });
      
      // 基础菜单的静态元素事件
      var ELEM_LI = '.layui-menu:not(.layui-dropdown-menu) li';
      _DOC.on('click', ELEM_LI, function(e){
        var othis = $(this);
        var parent = othis.parents('.layui-menu').eq(0); 
        var isChild = othis.hasClass(STR_ITEM_GROUP) || othis.hasClass(STR_ITEM_PARENT); // 判断是否有child
        var filter = parent.attr('lay-filter') || parent.attr('id');
        var options = lay.options(this); // 获取元素上的参数配置上
        
        // 非触发元素
        if(othis.hasClass(STR_ITEM_DIV)) return;
  
        // 非菜单组
        if(!isChild){
          // 选中
          parent.find('.'+ STR_ITEM_CHECKED).removeClass(STR_ITEM_CHECKED); //清除选中样式
          parent.find('.'+ STR_ITEM_CHECKED2).removeClass(STR_ITEM_CHECKED2); //清除父级菜单选中样式
          othis.addClass(STR_ITEM_CHECKED); //添加选中样式
          othis.parents('.'+ STR_ITEM_PARENT).addClass(STR_ITEM_CHECKED2); //添加父级菜单选中样式
          
          // 触发事件
          layui.event.call(this, MOD_NAME, 'click('+ filter +')', options);
        }
      });
      
      // 基础菜单的展开收缩事件
      _DOC.on('click', (ELEM_LI + STR_GROUP_TITLE), function(e){
        var othis = $(this);
        var elemGroup = othis.parents('.'+ STR_ITEM_GROUP +':eq(0)')
        var options = lay.options(elemGroup[0]);
  
        if(('isAllowSpread' in options) ? options.isAllowSpread : true){
          thisModule.spread(elemGroup); // 展开或收缩
        };
      });
      
      // 判断子级菜单是否超出屏幕
      var ELEM_LI_PAR = '.layui-menu .'+ STR_ITEM_PARENT
      _DOC.on('mouseenter', ELEM_LI_PAR, function(e){
        var othis = $(this);
        var elemPanel = othis.find('.'+ STR_MENU_PANEL);
  
        if(!elemPanel[0]) return;
        var rect = elemPanel[0].getBoundingClientRect();
        
        // 是否超出右侧屏幕
        if(rect.right > _WIN.width()){
          elemPanel.addClass(STR_MENU_PANEL_L); // 超过有屏幕添加左样式
          // 不允许超出左侧屏幕
          rect = elemPanel[0].getBoundingClientRect();
          if(rect.left < 0){
            elemPanel.removeClass(STR_MENU_PANEL_L); // 移除左样式
          }
        }
        
        // 是否超出底部屏幕
        if(rect.bottom > _WIN.height()){
          elemPanel.eq(0).css('margin-top', -(rect.bottom - _WIN.height())); // 添加上样式
        };
      }).on('mouseleave', ELEM_LI_PAR, function(e){
        var othis = $(this);
        var elemPanel = othis.children('.'+ STR_MENU_PANEL);
        
        elemPanel.removeClass(STR_MENU_PANEL_L);
        elemPanel.css('margin-top', 0);
      });
      
    }();
    
    // 重载实例
    dropdown.reload = function(id, options){
      var that = thisModule.getThis(id);
      if(!that) return this;
  
      that.reload(options);
      return thisModule.call(that);
    };
  
    // 核心入口
    dropdown.render = function(options){
      var inst = new Class(options);
      return thisModule.call(inst);
    };
    
    // 导出模块
    exports(MOD_NAME, dropdown);
});
  