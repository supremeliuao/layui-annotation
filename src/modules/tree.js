layui.define('form', function(exports){
    "use strict";
    
    var $ = layui.$;
    var form = layui.form;
    var layer = layui.layer;
    
    // 模块名
    var MOD_NAME = 'tree';
  
    // 外部接口
    var tree = {
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
  
    // 操作当前实例
    var thisModule = function(){
      var that = this;
      var options = that.config
      var id = options.id || that.index;
      
      thisModule.that[id] = that; //记录当前实例对象
      thisModule.config[id] = options; //记录当前实例配置项
      
      return {
        config: options,
        // 重置实例
        reload: function(options){
          that.reload.call(that, options);
        },
        getChecked: function(){
          return that.getChecked.call(that);
        },
        setChecked: function(id){// 设置值
          return that.setChecked.call(that, id);
        }
      }
    }
    
    // 获取当前实例配置项
    var getThisModuleConfig = function(id){
      var config = thisModule.config[id];
      if(!config) hint.error('The ID option was not found in the '+ MOD_NAME +' instance');
      return config || null;
    }
  
    // 字符常量
    var SHOW = 'layui-show';
    var HIDE = 'layui-hide';
    var NONE = 'layui-none';
    var DISABLED = 'layui-disabled';
    
    var ELEM_VIEW = 'layui-tree';
    var ELEM_SET = 'layui-tree-set';
    var ICON_CLICK = 'layui-tree-iconClick';
    var ICON_ADD = 'layui-icon-addition';
    var ICON_SUB = 'layui-icon-subtraction';
    var ELEM_ENTRY = 'layui-tree-entry';
    var ELEM_MAIN = 'layui-tree-main';
    var ELEM_TEXT = 'layui-tree-txt';
    var ELEM_PACK = 'layui-tree-pack';
    var ELEM_SPREAD = 'layui-tree-spread';
    var ELEM_LINE_SHORT = 'layui-tree-setLineShort';
    var ELEM_SHOW = 'layui-tree-showLine';
    var ELEM_EXTEND = 'layui-tree-lineExtend';
   
    /**
     * 构造器
     * options 对象包含一下属性值
     * 参数选项          类型                默认值                       说明
     * elem             String/Object       -                            指向容器选择器
     * data             Array                                            数据源
     * id               String              -                            设定实例唯一索引，用于基础方法传参使用
     * showCheckbox     Boolean             false                        是否显示复选框
     * edit             Boolean/Array       ['update', 'del']            是否开启节点的操作图标。默认 false。若为 true，则默认显示“改删”图标若为 数组，则可自由配置操作图标的显示状态和顺序，目前支持的操作图标有：add、update、del，如：edit: ['add', 'update', 'del']
     * accordion        Boolean             false                        是否开启手风琴模式，默认 false
     * onlyIconControl  Boolean             false                        是否仅允许节点左侧图标控制展开收缩。默认 false（即点击节点本身也可控制）。若为 true，则只能通过节点左侧图标来展开收缩
     * isJump           Boolean             false                        是否允许点击节点时弹出新窗口跳转。默认 false，若开启，需在节点数据中设定 link 参数（值为 url 格式）
     * showLine         Boolean             true                         是否开启连接线。默认 true，若设为 false，则节点左侧出现三角图标。
     * text             Object              -                            自定义各类默认文本              
     */
    var Class = function(options){
      var that = this;
      that.index = ++tree.index;
      that.config = $.extend({}, that.config, tree.config, options); 
      that.render();
    };
  
    // 默认配置
    Class.prototype.config = {
      data: [],  // 数据
      
      showCheckbox: false,  // 是否显示复选框
      showLine: true,  // 是否开启连接线
      accordion: false,  // 是否开启手风琴模式
      onlyIconControl: false,  // 是否仅允许节点左侧图标控制展开收缩
      isJump: false,  // 是否允许点击节点时弹出新窗口跳转
      edit: false,  // 是否开启节点的操作图标
      
      text: {
        defaultNodeName: '未命名' // 节点默认名称
        ,none: '无数据'  // 数据为空时的文本提示
      }
    };
    
    // 重载实例
    Class.prototype.reload = function(options){
      var that = this;
      
      // 对options遍历
      layui.each(options, function(key, item){
        // 如果 item 为数组，则删除原来配置中key对应的数据
        if(layui._typeof(item) === 'array') delete that.config[key];
      });
      
      that.config = $.extend(true, {}, that.config, options);
      that.render(); // 更新渲染
    };
  
    // 主体渲染
    Class.prototype.render = function(){
      var that = this;
      var options = that.config; // 获取配置
      
      that.checkids = [];
      
      // tree 最外层 dom  
      var temp = $('<div class="layui-tree'+ (options.showCheckbox ? " layui-form" : "") + (options.showLine ? " layui-tree-line" : "") +'" lay-filter="LAY-tree-'+ that.index +'"></div>');
      that.tree(temp); // 节点渲染
  
      var othis = options.elem = $(options.elem); // 获取容器 dom 
      if(!othis[0]) return; // 获取不到容器后续不执行
  
      // 索引
      that.key = options.id || that.index;
      
      // 插入组件结构
      that.elem = temp;
      that.elemNone = $('<div class="layui-tree-emptyText">'+ options.text.none +'</div>');
      othis.html(that.elem); // 挂载到容器上
  
      if(that.elem.find('.layui-tree-set').length == 0){  // 挂载无数据dom，后续不执行
        return that.elem.append(that.elemNone);
      };
      
      // 复选框渲染
      if(options.showCheckbox){
        that.renderForm('checkbox');
      };
      
      that.elem.find('.layui-tree-set').each(function(){
        var othis = $(this);
        // 最外层
        if(!othis.parent('.layui-tree-pack')[0]){
          othis.addClass('layui-tree-setHide');
        };
  
        // 没有下一个节点 上一层父级有延伸线
        if(!othis.next()[0] && othis.parents('.layui-tree-pack').eq(1).hasClass('layui-tree-lineExtend')){
          othis.addClass(ELEM_LINE_SHORT);
        };
        
        // 没有下一个节点 外层最后一个
        if(!othis.next()[0] && !othis.parents('.layui-tree-set').eq(0).next()[0]){
          othis.addClass(ELEM_LINE_SHORT);
        };
      });
  
      that.events();
    };
    
    // 渲染表单
    Class.prototype.renderForm = function(type){
      form.render(type, 'LAY-tree-'+ this.index);
    };
  
    // 节点解析
    Class.prototype.tree = function(elem, children){
      var that = this;
      var options = that.config; // 获取配置
      var data = children || options.data; // 默认获取 options中data
  
      // 遍历数据
      layui.each(data, function(index, item){
        var hasChild = item.children && item.children.length > 0; // 判断是否有 children
        var packDiv = $('<div class="layui-tree-pack" '+ (item.spread ? 'style="display: block;"' : '') +'></div>'); // spread 表示节点是否展开，默认不展开
        var entryDiv = $(['<div data-id="'+ item.id +'" class="layui-tree-set'+ (item.spread ? " layui-tree-spread" : "") + (item.checked ? " layui-tree-checkedFirst" : "") +'">', // id: 节点唯一索引值，用于对指定节点进行各类操作
          '<div class="layui-tree-entry">',
            '<div class="layui-tree-main">',
              // 箭头
              function(){ // 立即执行函数
                if(options.showLine){ // 判断是否存在开启连接线
                  if(hasChild){ // 根据有没有子节点显示不同连接线
                    return '<span class="layui-tree-iconClick layui-tree-icon"><i class="layui-icon '+ (item.spread ? "layui-icon-subtraction" : "layui-icon-addition") +'"></i></span>';
                  }else{
                    return '<span class="layui-tree-iconClick"><i class="layui-icon layui-icon-file"></i></span>';
                  };
                }else{ // 默认为三角图标
                  return '<span class="layui-tree-iconClick"><i class="layui-tree-iconArrow '+ (hasChild ? "": HIDE) +'"></i></span>';
                };
              }(),
              
              // 复选框
              function(){
                return options.showCheckbox ? '<input type="checkbox" name="'+ (item.field || ('layuiTreeCheck_'+ item.id)) +'" same="layuiTreeCheck" lay-skin="primary" '+ (item.disabled ? "disabled" : "") +' value="'+ item.id +'">' : '';
              }(),
              
              // 节点
              function(){
                if(options.isJump && item.href){ // 如果允许点击节点时弹出新窗口跳转并且当前节点存在href，则生成带有a标签
                  return '<a href="'+ item.href +'" target="_blank" class="'+ ELEM_TEXT +'">'+ (item.title || item.label || options.text.defaultNodeName) +'</a>';
                }else{
                  return '<span class="'+ ELEM_TEXT + (item.disabled ? ' '+ DISABLED : '') +'">'+ (item.title || item.label || options.text.defaultNodeName) +'</span>';
                }
              }(),
        '</div>',
        
        // 节点操作图标
        function(){
          if(!options.edit) return ''; // 没有开启节点的操作，后续不执行

          var editIcon = {
            add: '<i class="layui-icon layui-icon-add-1"  data-type="add"></i>', // 添加的icon
            update: '<i class="layui-icon layui-icon-edit" data-type="update"></i>', // update icon
            del: '<i class="layui-icon layui-icon-delete" data-type="del"></i>', // 删除的 icon
          };
          var arr = ['<div class="layui-btn-group layui-tree-btnGroup">'];
          
          if(options.edit === true){ // 若为 true，则默认显示“改删”图标
            options.edit = ['update', 'del'];
          }
          
          if(typeof options.edit === 'object'){
            layui.each(options.edit, function(i, val){ // 选择不同功能
              arr.push(editIcon[val] || ''); 
            });
            return arr.join('') + '</div>';
          }
        }(),
        '</div></div>'].join(''));
  
        // 如果有子节点，则递归继续生成树
        if(hasChild){
          entryDiv.append(packDiv);
          that.tree(packDiv, item.children);
        };
  
        elem.append(entryDiv);
        
        // 若有前置节点，前置节点加连接线
        if(entryDiv.prev('.'+ELEM_SET)[0]){
          entryDiv.prev().children('.layui-tree-pack').addClass('layui-tree-showLine');
        };
        
        // 若无子节点，则父节点加延伸线
        if(!hasChild){
          entryDiv.parent('.layui-tree-pack').addClass('layui-tree-lineExtend');
        };
        
        // 展开节点操作
        that.spread(entryDiv, item); // 一个完整节点单元传入

        // 用户设置了显示复选框
        if(options.showCheckbox){
          item.checked && that.checkids.push(item.id); // 当前item被选中就把当前id推入
          that.checkClick(entryDiv, item);
        }
        
        // 操作节点
        options.edit && that.operate(entryDiv, item);
        
      });
    };
  
    // 展开节点
    Class.prototype.spread = function(elem, item){
      var that = this;
      var options = that.config;
      var entry = elem.children('.'+ELEM_ENTRY); // 获取elem的直接子元素 layui-tree-entry 类 dom, 注意使用的是children而children() 方法返回被选元素的所有直接子元素。
      var elemMain = entry.children('.'+ ELEM_MAIN); // 获取 layui-tree-main 类 dom
      var elemIcon = entry.find('.'+ ICON_CLICK); // 获取 layui-tree-iconClick 类 dom, 因为entry是通过查找直接子元素的，所以确保了使用find方法查询元素的唯一性
      var elemText = entry.find('.'+ ELEM_TEXT); // 获取 layui-tree-txt 类 dom
      var touchOpen = options.onlyIconControl ? elemIcon : elemMain; // 判断展开通过节点还是箭头图标
      var state = '';

      // 展开收缩
      touchOpen.on('click', function(e){
        var packCont = elem.children('.'+ELEM_PACK); // 获取elem的直接子元素 layui-tree-pack 类 dom

        // 判断touchOpen直接子元素有没有icon，如果没有则在touchOpen下查找所有子元素并获取icon dom。只对连接线模式下点击iconClick 有值
        var iconClick = touchOpen.children('.layui-icon')[0] ? touchOpen.children('.layui-icon') : touchOpen.find('.layui-tree-icon').children('.layui-icon');
         
        // 若没有子节点
        if(!packCont[0]){
          state = 'normal';
        }else{
          if(elem.hasClass(ELEM_SPREAD)){ // 当前 elem 处于展开状态
            elem.removeClass(ELEM_SPREAD); // 移除展开的类
            packCont.slideUp(200); // 添加收起动画
            iconClick.removeClass(ICON_SUB).addClass(ICON_ADD); // 先移除 layui-icon-subtraction类后添加layui-icon-addition类
          }else{ // 当前 elem 处于闭合状态
            elem.addClass(ELEM_SPREAD); // 添加展开类
            packCont.slideDown(200); // 添加下拉动画
            iconClick.addClass(ICON_SUB).removeClass(ICON_ADD); // 添加layui-icon-subtraction类移除layui-icon-addition类
  
            // 是否手风琴
            if(options.accordion){ // 处于手风琴状态时
              var sibls = elem.siblings('.'+ELEM_SET); // 获取elem所有同级layui-tree-set dom
              sibls.removeClass(ELEM_SPREAD); // 对同级layui-tree-set移除展开类
              sibls.children('.'+ELEM_PACK).slideUp(200); // 对同级下的直接子layui-tree-pack添加收起动画
              sibls.find('.layui-tree-icon').children('.layui-icon').removeClass(ICON_SUB).addClass(ICON_ADD); // 把减号变为加号
            };
          };
        };
      });
      
      // 给文本类添加点击回调
      elemText.on('click', function(){
        var othis = $(this); // 获取当前点击的dom

        // 判断是否禁用状态, 如果禁用后续不执行
        if(othis.hasClass(DISABLED)) return;
        
        // 判断展开收缩状态
        if(elem.hasClass(ELEM_SPREAD)){ // 处于张开状态时
          state = options.onlyIconControl ? 'open' : 'close'; // 如果onlyIconControl为true则为open
        } else {
          state = options.onlyIconControl ? 'close' : 'open';
        }
        
        // 点击产生的回调。判断用户是否设置了节点点击回调
        options.click && options.click({
          elem: elem, // 当前节点元素
          state: state, // 当前节点的展开状态：open、close、normal
          data: item // 当前点击的节点数据
        });
      });
    };
    
    // 计算复选框选中状态
    Class.prototype.setCheckbox = function(elem, item, elemCheckbox){
      var that = this;
      var options = that.config;
      var checked = elemCheckbox.prop('checked'); // 获取 input checked值
      
      // 当前input 复选框处于禁止状态，后续不执行
      if(elemCheckbox.prop('disabled')) return;
    
      // 同步子节点选中状态
      if(typeof item.children === 'object' || elem.find('.'+ELEM_PACK)[0]){ // 如果 item有子元素或者elem下有layui-tree-pack类，则执行下面
        var childs = elem.find('.'+ ELEM_PACK).find('input[same="layuiTreeCheck"]'); // 获取所有layui-tree-pack类下的复选框
        childs.each(function(){
          if(this.disabled) return; // 不可点击则跳过
          this.checked = checked;
        });
      };

      // 同步父节点选中状态
      var setParentsChecked = function(thisNodeElem){
        // 若无父节点，则终止递归
        if(!thisNodeElem.parents('.'+ ELEM_SET)[0]) return; // ELEM_SET:layui-tree-set 类

        var state;
        var parentPack = thisNodeElem.parent('.'+ ELEM_PACK); // 获取直接父级layui-tree-pack类
        var parentNodeElem = parentPack.parent(); // 获取layui-tree-pack类的直接父级layui-tree-set 类
        var parentCheckbox =  parentPack.prev().find('input[same="layuiTreeCheck"]'); // 获取复选框
  
        // 如果子节点有任意一条选中，则父节点为选中状态
        if(checked){
          parentCheckbox.prop('checked', checked);
        } else { // 如果当前节点取消选中，则根据计算“兄弟和子孙”节点选中状态，来同步父节点选中状态
          parentPack.find('input[same="layuiTreeCheck"]').each(function(){
            if(this.checked){
              state = true;
            }
          });
          
          // 如果兄弟子孙节点全部未选中，则父节点也应为非选中状态
          state || parentCheckbox.prop('checked', false);
        }
        
        // 向父节点递归
        setParentsChecked(parentNodeElem);
      };
      
      setParentsChecked(elem);
  
      that.renderForm('checkbox'); // 更新渲染
    };
    
    // 复选框选择
    Class.prototype.checkClick = function(elem, item){
      var that = this;
      var options = that.config;
      var entry = elem.children('.'+ ELEM_ENTRY); // 获取elem的直接子元素 layui-tree-entry 类 dom,
      var elemMain = entry.children('.'+ ELEM_MAIN); // 获取entry直接子元素 layui-tree-main 类 dom
      
      // 复选框添加点击事件
      elemMain.on('click', 'input[same="layuiTreeCheck"]+', function(e){
        layui.stope(e); // 阻止点击节点事件
        
        var elemCheckbox = $(this).prev(); // 获取 input dom
        var checked = elemCheckbox.prop('checked'); // 获取 input checked值
        
        // 当前input 复选框处于禁止状态，后续不执行
        if(elemCheckbox.prop('disabled')) return;
        
        that.setCheckbox(elem, item, elemCheckbox);
  
        // 复选框点击产生的回调
        options.oncheck && options.oncheck({
          elem: elem,// 当前节点元素
          checked: checked, // 当前节点的展开状态：open、close、normal
          data: item // 当前点击的节点数据
        });
      });
    };
  
    // 节点操作
    Class.prototype.operate = function(elem, item){
      var that = this;
      var options = that.config;
      var entry = elem.children('.'+ ELEM_ENTRY); // 获取elem的直接子元素 layui-tree-entry 类 dom,
      var elemMain = entry.children('.'+ ELEM_MAIN); // 获取entry直接子元素 layui-tree-main 类 dom
      
      // 给entry下直接layui-tree-btnGroup类添加click事件
      entry.children('.layui-tree-btnGroup').on('click', '.layui-icon', function(e){
        layui.stope(e);  // 阻止节点操作
  
        var type = $(this).data("type"); // 获取type:add、update、del
        var packCont = elem.children('.'+ELEM_PACK); // 获取elem直接子元素layui-tree-pack类
        var returnObj = {
          data: item,
          type: type,
          elem: elem
        };
        console.log(returnObj,packCont[0]);
        // 增加
        if(type == 'add'){
          // 若节点本身无子节点
          if(!packCont[0]){
            // 若开启连接线，更改图标样式
            if(options.showLine){
              elemMain.find('.'+ICON_CLICK).addClass('layui-tree-icon');
              elemMain.find('.'+ICON_CLICK).children('.layui-icon').addClass(ICON_ADD).removeClass('layui-icon-file');
            // 若未开启连接线，显示箭头
            }else{
              elemMain.find('.layui-tree-iconArrow').removeClass(HIDE);
            };
            // 节点添加子节点容器
            elem.append('<div class="layui-tree-pack"></div>');
          };
  
          // 新增节点
          var key = options.operate && options.operate(returnObj);
          var obj = {};
          obj.title = options.text.defaultNodeName; // 使用节点默认名命名title
          obj.id = key;
          that.tree(elem.children('.'+ELEM_PACK), [obj]); // 节点解析
          
          // 放在新增后面，因为要对元素进行操作
          if(options.showLine){
            // 节点本身无子节点
            if(!packCont[0]){
              // 遍历兄弟节点，判断兄弟节点是否有子节点
              var siblings = elem.siblings('.'+ELEM_SET), num = 1
              ,parentPack = elem.parent('.'+ELEM_PACK);
              layui.each(siblings, function(index, i){
                if(!$(i).children('.'+ELEM_PACK)[0]){
                  num = 0;
                };
              });
  
              // 若兄弟节点都有子节点
              if(num == 1){
                // 兄弟节点添加连接线
                siblings.children('.'+ELEM_PACK).addClass(ELEM_SHOW);
                siblings.children('.'+ELEM_PACK).children('.'+ELEM_SET).removeClass(ELEM_LINE_SHORT);
                elem.children('.'+ELEM_PACK).addClass(ELEM_SHOW);
                // 父级移除延伸线
                parentPack.removeClass(ELEM_EXTEND);
                // 同层节点最后一个更改线的状态
                parentPack.children('.'+ELEM_SET).last().children('.'+ELEM_PACK).children('.'+ELEM_SET).last().addClass(ELEM_LINE_SHORT);
              }else{
                elem.children('.'+ELEM_PACK).children('.'+ELEM_SET).addClass(ELEM_LINE_SHORT);
              };
            }else{
              // 添加延伸线
              if(!packCont.hasClass(ELEM_EXTEND)){
                packCont.addClass(ELEM_EXTEND);
              };
              // 子节点添加延伸线
              elem.find('.'+ELEM_PACK).each(function(){
                $(this).children('.'+ELEM_SET).last().addClass(ELEM_LINE_SHORT);
              });
              // 如果前一个节点有延伸线
              if(packCont.children('.'+ELEM_SET).last().prev().hasClass(ELEM_LINE_SHORT)){
                packCont.children('.'+ELEM_SET).last().prev().removeClass(ELEM_LINE_SHORT);
              }else{
                // 若之前的没有，说明处于连接状态
                packCont.children('.'+ELEM_SET).last().removeClass(ELEM_LINE_SHORT);
              };
              // 若是最外层，要始终保持相连的状态
              if(!elem.parent('.'+ELEM_PACK)[0] && elem.next()[0]){
                packCont.children('.'+ELEM_SET).last().removeClass(ELEM_LINE_SHORT);
              };
            };
          };
          if(!options.showCheckbox) return;
          // 若开启复选框，同步新增节点状态
          if(elemMain.find('input[same="layuiTreeCheck"]')[0].checked){
            var packLast = elem.children('.'+ELEM_PACK).children('.'+ELEM_SET).last();
            packLast.find('input[same="layuiTreeCheck"]')[0].checked = true;
          };
          that.renderForm('checkbox');
        
        // 修改操作
        }else if(type == 'update'){
          var text = elemMain.children('.'+ ELEM_TEXT).html();
          elemMain.children('.'+ ELEM_TEXT).html('');
          // 添加输入框，覆盖在文字上方
          elemMain.append('<input type="text" class="layui-tree-editInput">');
          // 获取焦点
          elemMain.children('.layui-tree-editInput').val(text).focus();
          // 嵌入文字移除输入框
          var getVal = function(input){
            var textNew = input.val().trim();
            textNew = textNew ? textNew : options.text.defaultNodeName;
            input.remove();
            elemMain.children('.'+ ELEM_TEXT).html(textNew);
            
            // 同步数据
            returnObj.data.title = textNew;
            
            // 节点修改的回调
            options.operate && options.operate(returnObj);
          };
          // 失去焦点
          elemMain.children('.layui-tree-editInput').blur(function(){
            getVal($(this));
          });
          // 回车
          elemMain.children('.layui-tree-editInput').on('keydown', function(e){
            if(e.keyCode === 13){
              e.preventDefault();
              getVal($(this));
            };
          });
  
        // 删除
        } else {
          // 删除提示框
          layer.confirm('确认删除该节点 "<span style="color: #999;">'+ (item.title || '') +'</span>" 吗？', function(index){
            options.operate && options.operate(returnObj); // 节点删除的回调
            returnObj.status = 'remove'; // 标注节点删除
            
            layer.close(index);
            
            // 若删除最后一个，显示空数据提示
            if(!elem.prev('.'+ELEM_SET)[0] && !elem.next('.'+ELEM_SET)[0] && !elem.parent('.'+ELEM_PACK)[0]){
              elem.remove();
              that.elem.append(that.elemNone);
              return;
            };
            // 若有兄弟节点
            if(elem.siblings('.'+ELEM_SET).children('.'+ELEM_ENTRY)[0]){
              // 若开启复选框
              if(options.showCheckbox){
                // 若开启复选框，进行下步操作
                var elemDel = function(elem){
                  // 若无父结点，则不执行
                  if(!elem.parents('.'+ELEM_SET)[0]) return;
                  var siblingTree = elem.siblings('.'+ELEM_SET).children('.'+ELEM_ENTRY);
                  var parentTree = elem.parent('.'+ELEM_PACK).prev();
                  var checkState = parentTree.find('input[same="layuiTreeCheck"]')[0];
                  var state = 1, num = 0;
                  // 若父节点未勾选
                  if(checkState.checked == false){
                    // 遍历兄弟节点
                    siblingTree.each(function(i, item1){
                      var input = $(item1).find('input[same="layuiTreeCheck"]')[0]
                      if(input.checked == false && !input.disabled){
                        state = 0;
                      };
                      // 判断是否全为不可勾选框
                      if(!input.disabled){
                        num = 1;
                      };
                    });
                    // 若有可勾选选择框并且已勾选
                    if(state == 1 && num == 1){
                      // 勾选父节点
                      checkState.checked = true;
                      that.renderForm('checkbox');
                      // 向上遍历祖先节点
                      elemDel(parentTree.parent('.'+ELEM_SET));
                    };
                  };
                };
                elemDel(elem);
              };
              // 若开启连接线
              if(options.showLine){
                // 遍历兄弟节点，判断兄弟节点是否有子节点
                var siblings = elem.siblings('.'+ELEM_SET), num = 1
                ,parentPack = elem.parent('.'+ELEM_PACK);
                layui.each(siblings, function(index, i){
                  if(!$(i).children('.'+ELEM_PACK)[0]){
                    num = 0;
                  };
                });
                // 若兄弟节点都有子节点
                if(num == 1){
                  // 若节点本身无子节点
                  if(!packCont[0]){
                    // 父级去除延伸线，因为此时子节点里没有空节点
                    parentPack.removeClass(ELEM_EXTEND);
                    siblings.children('.'+ELEM_PACK).addClass(ELEM_SHOW);
                    siblings.children('.'+ELEM_PACK).children('.'+ELEM_SET).removeClass(ELEM_LINE_SHORT);
                  };
                  // 若为最后一个节点
                  if(!elem.next()[0]){
                    elem.prev().children('.'+ELEM_PACK).children('.'+ELEM_SET).last().addClass(ELEM_LINE_SHORT);
                  }else{
                    parentPack.children('.'+ELEM_SET).last().children('.'+ELEM_PACK).children('.'+ELEM_SET).last().addClass(ELEM_LINE_SHORT);
                  };
                  // 若为最外层最后一个节点，去除前一个结点的连接线
                  if(!elem.next()[0] && !elem.parents('.'+ELEM_SET)[1] && !elem.parents('.'+ELEM_SET).eq(0).next()[0]){
                    elem.prev('.'+ELEM_SET).addClass(ELEM_LINE_SHORT);
                  };
                }else{
                  // 若为最后一个节点且有延伸线
                  if(!elem.next()[0] && elem.hasClass(ELEM_LINE_SHORT)){
                    elem.prev().addClass(ELEM_LINE_SHORT);
                  };
                };
              };
            
            }else{
              // 若无兄弟节点
              var prevDiv = elem.parent('.'+ELEM_PACK).prev();
              // 若开启了连接线
              if(options.showLine){
                prevDiv.find('.'+ICON_CLICK).removeClass('layui-tree-icon');
                prevDiv.find('.'+ICON_CLICK).children('.layui-icon').removeClass(ICON_SUB).addClass('layui-icon-file');
                // 父节点所在层添加延伸线
                var pare = prevDiv.parents('.'+ELEM_PACK).eq(0);
                pare.addClass(ELEM_EXTEND);
  
                // 兄弟节点最后子节点添加延伸线
                pare.children('.'+ELEM_SET).each(function(){
                  $(this).children('.'+ELEM_PACK).children('.'+ELEM_SET).last().addClass(ELEM_LINE_SHORT);
                });
              }else{
              // 父节点隐藏箭头
                prevDiv.find('.layui-tree-iconArrow').addClass(HIDE);
              };
              // 移除展开属性
              elem.parents('.'+ELEM_SET).eq(0).removeClass(ELEM_SPREAD);
              // 移除节点容器
              elem.parent('.'+ELEM_PACK).remove();
            };
  
            elem.remove();
          });
          
        };
      });
    };
  
    // 部分事件
    Class.prototype.events = function(){
      var that = this;
      var options = that.config;
      var checkWarp = that.elem.find('.layui-tree-checkedFirst');
      
      // 初始选中
      that.setChecked(that.checkids);
      
      // 搜索事件
      that.elem.find('.layui-tree-search').on('keyup', function(){
        var input = $(this);
        var val = input.val();
        var pack = input.nextAll();
        var arr = [];
  
        // 遍历所有的值
        pack.find('.'+ ELEM_TEXT).each(function(){
          var entry = $(this).parents('.'+ELEM_ENTRY);
          // 若值匹配，加一个类以作标识
          if($(this).html().indexOf(val) != -1){
            arr.push($(this).parent());
            
            var select = function(div){
              div.addClass('layui-tree-searchShow');
              // 向上父节点渲染
              if(div.parent('.'+ELEM_PACK)[0]){
                select(div.parent('.'+ELEM_PACK).parent('.'+ELEM_SET));
              };
            };
            select(entry.parent('.'+ELEM_SET));
          };
        });
  
        // 根据标志剔除
        pack.find('.'+ELEM_ENTRY).each(function(){
          var parent = $(this).parent('.'+ELEM_SET);
          if(!parent.hasClass('layui-tree-searchShow')){
            parent.addClass(HIDE);
          };
        });
        if(pack.find('.layui-tree-searchShow').length == 0){
          that.elem.append(that.elemNone);
        };
  
        //节点过滤的回调
        options.onsearch && options.onsearch({
          elem: arr
        });
      });
  
      // 还原搜索初始状态
      that.elem.find('.layui-tree-search').on('keydown', function(){
        $(this).nextAll().find('.'+ELEM_ENTRY).each(function(){
          var parent = $(this).parent('.'+ELEM_SET);
          parent.removeClass('layui-tree-searchShow '+ HIDE);
        });
        if($('.layui-tree-emptyText')[0]) $('.layui-tree-emptyText').remove();
      });
    };
  
    // 得到选中节点
    Class.prototype.getChecked = function(){
      var that = this;
      var options = that.config;
      var checkId = [];
      var checkData = [];
      
      // 遍历节点找到选中索引
      that.elem.find('.layui-form-checked').each(function(){
        checkId.push($(this).prev()[0].value);
      });
      
      // 遍历节点
      var eachNodes = function(data, checkNode){
        layui.each(data, function(index, item){
          layui.each(checkId, function(index2, item2){
            if(item.id == item2){
              var cloneItem = $.extend({}, item);
              delete cloneItem.children;
              
              checkNode.push(cloneItem);
              
              if(item.children){
                cloneItem.children = [];
                eachNodes(item.children, cloneItem.children);
              }
              return true
            }
          });
        });
      };
  
      eachNodes($.extend({}, options.data), checkData);
      
      return checkData;
    };
  
    // 设置选中节点
    Class.prototype.setChecked = function(checkedId){
      var that = this;
      var options = that.config;
  
      // 初始选中
      that.elem.find('.'+ELEM_SET).each(function(i, item){ // 遍历elem下所有layui-tree-set类
        var thisId = $(this).data('id');
        var input = $(item).children('.'+ELEM_ENTRY).find('input[same="layuiTreeCheck"]')
        var reInput = input.next();
        
        // 若返回数字
        if(typeof checkedId === 'number'){
          if(thisId == checkedId){
            if(!input[0].checked){ // 如果没有被选中则选中
              reInput.click();
            };
            return false;
          };
        } 

        // 若返回数组
        else if(typeof checkedId === 'object'){
          layui.each(checkedId, function(index, value){ // 遍历数组选中复选框
            if(value == thisId && !input[0].checked){
              reInput.click();
              return true;
            }
          });
        };
      });
    };
  
    // 记录所有实例
    thisModule.that = {}; // 记录所有实例对象
    thisModule.config = {}; // 记录所有实例配置项
    
    // 重载实例
    tree.reload = function(id, options){
      var that = thisModule.that[id]; // 获取对应实例
      that.reload(options); // 重载实例
      
      return thisModule.call(that);
    };
    
    // 获得选中的节点数据
    tree.getChecked = function(id){
      var that = thisModule.that[id];
      return that.getChecked();
    };
    
    // 设置选中节点
    tree.setChecked = function(id, checkedId){
      var that = thisModule.that[id];
      return that.setChecked(checkedId);
    };
      
    // 核心入口
    tree.render = function(options){
      var inst = new Class(options);
      return thisModule.call(inst);
    };
    
    // 导出模块
    exports(MOD_NAME, tree);
})