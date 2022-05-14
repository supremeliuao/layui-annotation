layui.define(['laytpl', 'form'], function(exports){
    "use strict";
    
    var $ = layui.$;
    var laytpl = layui.laytpl;
    var form = layui.form;
    
    // 模块名
    var MOD_NAME = 'transfer';
  
    // 外部接口
    var transfer = {
      config: {},
      index: layui[MOD_NAME] ? (layui[MOD_NAME].index + 10000) : 0,
  
      // 设置全局项
      set: function(options){
        var that = this;
        that.config = $.extend({}, that.config, options); // 设置配置
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
      var options = that.config; // 获取当前配置
      var id = options.id || that.index;

      thisModule.that[id] = that; // 记录当前实例对象
      thisModule.config[id] = options; // 记录当前实例配置项
      
      return {
        config: options,
        // 重置实例
        reload: function(options){
          that.reload.call(that, options);
        },
        // 获取右侧数据
        getData: function(){
          return that.getData.call(that);
        },
      }
    }
    
    // 获取当前实例配置项
    var getThisModuleConfig = function(id){
      var config = thisModule.config[id];
      if(!config) hint.error('The ID option was not found in the '+ MOD_NAME +' instance');
      return config || null;
    }
  
    // 字符常量
    var ELEM = 'layui-transfer';
    var HIDE = 'layui-hide';
    var DISABLED = 'layui-btn-disabled';
    var NONE = 'layui-none';
    var ELEM_BOX = 'layui-transfer-box';
    var ELEM_HEADER = 'layui-transfer-header';
    var ELEM_SEARCH = 'layui-transfer-search';
    var ELEM_ACTIVE = 'layui-transfer-active';
    var ELEM_DATA = 'layui-transfer-data';
    
    // 穿梭框模板
    var TPL_BOX = function(obj){
      obj = obj || {};
      return ['<div class="layui-transfer-box" data-index="'+ obj.index +'">',
        '<div class="layui-transfer-header">',
          '<input type="checkbox" name="'+ obj.checkAllName +'" lay-filter="layTransferCheckbox" lay-type="all" lay-skin="primary" title="{{ d.data.title['+ obj.index +'] || \'list'+ (obj.index + 1) +'\' }}">',
        '</div>',
        '{{# if(d.data.showSearch){ }}',
        '<div class="layui-transfer-search">',
          '<i class="layui-icon layui-icon-search"></i>',
          '<input type="input" class="layui-input" placeholder="关键词搜索">',
        '</div>',
        '{{# } }}',
        '<ul class="layui-transfer-data"></ul>',
      '</div>'].join('');
    };
    
    // 主模板
    var TPL_MAIN = ['<div class="layui-transfer layui-form layui-border-box" lay-filter="LAY-transfer-{{ d.index }}">',
      TPL_BOX({
        index: 0,
        checkAllName: 'layTransferLeftCheckAll'
      }),
      '<div class="layui-transfer-active">',
        '<button type="button" class="layui-btn layui-btn-sm layui-btn-primary layui-btn-disabled" data-index="0">',
          '<i class="layui-icon layui-icon-next"></i>',
        '</button>',
        '<button type="button" class="layui-btn layui-btn-sm layui-btn-primary layui-btn-disabled" data-index="1">',
          '<i class="layui-icon layui-icon-prev"></i>',
        '</button>',
      '</div>',
      TPL_BOX({
        index: 1,
        checkAllName: 'layTransferRightCheckAll'
      }),
    '</div>'].join('');
  
    /**
     * 构造器
     * options 对象包含一下属性值
     * 参数选项          类型                默认值                       说明
     * elem             String/Object       -                            指向容器选择器
     * title            Array               ['标题一', '标题二']          穿梭框上方标题
     * data             Array               [{}, {}, …]                  数据源
     * parseData        Function                                         用于对数据源进行格式解析
     * value            Array               -                            初始选中的数据（右侧列表）
     * id               String              -                            设定实例唯一索引，用于基础方法传参使用
     * showSearch       Boolean             false                        是否开启搜索
     * width            Number              200                          定义左右穿梭框宽度
     * height           Number              340                          定义左右穿梭框高度
     * text             Object              -                            自定义文本，如空数据时的异常提示等
     * onchange         Function                                         左右数据穿梭时的回调                     
     */
    var Class = function(options){
      var that = this;
      that.index = ++transfer.index;
      that.config = $.extend({}, that.config, transfer.config, options);
      that.render();
    };
  
    // 默认配置
    Class.prototype.config = {
      title: ['列表一', '列表二'],
      width: 200,
      height: 360,
      data: [], // 数据源
      value: [], // 选中的数据
      showSearch: false, // 是否开启搜索
      id: '', // 唯一索引，默认自增 index
      text: {
        none: '无数据',
        searchNone: '无匹配数据'
      }
    };
    
    // 重载实例
    Class.prototype.reload = function(options){
      var that = this;
      that.config = $.extend({}, that.config, options);
      that.render();
    };
  
    // 渲染
    Class.prototype.render = function(){
      var that = this;
      var options = that.config; // 获取配置

      // 解析模板, 把渲染的模板挂载到实例上
      var thisElem = that.elem = $(laytpl(TPL_MAIN).render({
        data: options,
        index: that.index //索引
      }));
      
      var othis = options.elem = $(options.elem); // 获取要挂载的容器 dom
      if(!othis[0]) return; // 如果没有指定挂载的 dom, 后续不执行
      
      // 初始化属性
      options.data = options.data || []; // 默认为空数组, 如果用户设置了data就使用设置的
      options.value = options.value || []; // 默认为空数组, 如果用户设置了value就使用设置的
      
      // 索引
      that.key = options.id || that.index; // 用户设置的id优先于本身的index
      
      // 插入组件结构
      othis.html(that.elem); // 向容器中挂载 dom(注意:这时数据还没有渲染到页面)
      
      // 获取各级容器
      that.layBox = that.elem.find('.'+ ELEM_BOX); // 获取 layui-transfer-box类 dom (dom 集合)
      that.layHeader = that.elem.find('.'+ ELEM_HEADER); // 获取 layui-transfer-header类 dom (dom 集合)
      that.laySearch = that.elem.find('.'+ ELEM_SEARCH); // 获取 layui-transfer-search类 dom (dom 集合)
      that.layData = thisElem.find('.'+ ELEM_DATA); // 获取 layui-transfer-data类 dom (dom 集合)
      that.layBtn = thisElem.find('.'+ ELEM_ACTIVE + ' .layui-btn'); // 获取 '.layui-transfer-active .layui-btn' dom (dom 集合)

      // 初始化尺寸
      that.layBox.css({ // 根据用户设置的宽高设置尺寸
        width: options.width,
        height: options.height
      });
      that.layData.css({
        height: function(){
          return options.height - that.layHeader.outerHeight() - that.laySearch.outerHeight() - 2
        }()
      });
      
      that.renderData(); // 渲染数据
      that.events(); // 事件
    };
    
    // 渲染数据
    Class.prototype.renderData = function(){
      var that = this;
      var options = that.config; // 获取配置
      
      // 左右穿梭框差异数据
      var arr = [{
        checkName: 'layTransferLeftCheck',
        views: []
      }, {
        checkName: 'layTransferRightCheck',
        views: []
      }];
      
      // 解析格式
      that.parseData(function(item){

        // 如果item中selected为true，表示该数据在左边已被选中，需要移动到右边
        var _index = item.selected ? 1 : 0; // 0 表示左边， 1 表示右边
        var listElem = ['<li>',
          '<input type="checkbox" name="'+ arr[_index].checkName +'" lay-skin="primary" lay-filter="layTransferCheckbox" title="'+ item.title +'"'+ (item.disabled ? ' disabled' : '') + (item.checked ? ' checked' : '') +' value="'+ item.value +'">',
        '</li>'].join('');
        arr[_index].views.push(listElem); // 把生成的li推入左右views
        delete item.selected; // 删除中间状态 selected字段
      });
      
      // 挂载处理过的数据
      that.layData.eq(0).html(arr[0].views.join(''));
      that.layData.eq(1).html(arr[1].views.join(''));

      that.renderCheckBtn(); // 渲染表单元素
    }
    
    // 渲染表单
    Class.prototype.renderForm = function(type){
      form.render(type, 'LAY-transfer-'+ this.index);
    };
    
    // 同步复选框和按钮状态
    Class.prototype.renderCheckBtn = function(obj){
      var that = this;
      var options = that.config; // 获取配置
      
      obj = obj || {}; // 默认为空对象
      
      // 遍历左右两个穿梭框
      that.layBox.each(function(_index){
        var othis = $(this);
        var thisDataElem = othis.find('.'+ ELEM_DATA); // 获取当前穿梭框下的layui-transfer-data类dom
        var allElemCheckbox = othis.find('.'+ ELEM_HEADER).find('input[type="checkbox"]'); // 获取当前穿梭框layui-transfer-header下的checkbox
        var listElemCheckbox =  thisDataElem.find('input[type="checkbox"]');

        // 同步复选框和按钮状态
        var nums = 0; // 计复选框当前有几个处于选中，禁用和隐藏的状态
        var haveChecked = false; // 标识当前众多复选框中是否有选中的
        listElemCheckbox.each(function(){ // 遍历穿梭框下面的input checkbox
          var isHide = $(this).data('hide'); // 获取当前input是否隐藏
          if(this.checked || this.disabled || isHide){ // 如果已经checked或者disabled或者隐藏
            nums++; // nums自增
          }
          if(this.checked && !isHide){ // 如果被checked并且不是隐藏状态
            haveChecked = true; // 表示选中
          }
        });
        
        allElemCheckbox.prop('checked', haveChecked && nums === listElemCheckbox.length); // 全选复选框状态
        that.layBtn.eq(_index)[haveChecked ? 'removeClass' : 'addClass'](DISABLED); // 对应的按钮状态
        
        // 无数据视图
        if(!obj.stopNone){
          var isNone = thisDataElem.children('li:not(.'+ HIDE +')').length; // 获取layui-transfer-data下li不是layui-hide的length
          that.noneView(thisDataElem, isNone ? '' : options.text.none); // 渲染无数据视图
        }
      });
      
      that.renderForm('checkbox'); // 渲染复选框
    };
    
    // 无数据视图
    Class.prototype.noneView = function(thisDataElem, text){
      var createNoneElem = $('<p class="layui-none">'+ (text || '') +'</p>'); // 创建无数据 dom 字符串
      if(thisDataElem.find('.'+ NONE)[0]){ // 如果已存在无数据dom，则移除
        thisDataElem.find('.'+ NONE).remove();
      }
      text.replace(/\s/g, '') && thisDataElem.append(createNoneElem); // 除去文案中的空白符并挂载
    };
    
    // 同步 value 属性值
    Class.prototype.setValue = function(){
      var that = this;
      var options = that.config;
      var arr = [];

      // 遍历右边穿梭框里的checkbox
      that.layBox.eq(1).find('.'+ ELEM_DATA +' input[type="checkbox"]').each(function(){
        var isHide = $(this).data('hide');
        isHide || arr.push(this.value); // 不是隐藏状态就推入arr
      });
      options.value = arr; // 更新数据
      
      return that;
    };
  
    // 解析数据
    Class.prototype.parseData = function(callback){
      var that = this
      var options = that.config; // 获取配置
      var newData = []; // 存储处理过的数据
      
      // 遍历左侧数据
      layui.each(options.data, function(index, item){
        // 解析格式， 用户是否设置解析数据函数，如果设置了则调用
        item = (typeof options.parseData === 'function' 
          ? options.parseData(item) 
        : item) || item;
        
        newData.push(item = $.extend({}, item)); // 这里不是深复制，因为没有复杂的数据格式
        
        // 遍历右侧数据
        layui.each(options.value, function(index2, item2){
          
          // 如果右侧的值和左侧的值相等，表明已经被选中
          if(item2 == item.value){
            item.selected = true;
          }
        });
        callback && callback(item); // 执行回调
      });
     
      options.data = newData;
      return that;
    };
    
    // 获得右侧面板数据
    Class.prototype.getData = function(value){
      var that = this;
      var options = that.config;
      var selectedData = [];
      
      that.setValue();
      
      layui.each(value || options.value, function(index, item){
        layui.each(options.data, function(index2, item2){
          delete item2.selected;
          if(item == item2.value){
            selectedData.push(item2);
          };
        });
      });
      return selectedData;
    };
    
    // 事件
    Class.prototype.events = function(){
      var that = this;
      var options = that.config; // 获取配置
      
      // 给左右复选框checkbox添加click事件
      that.elem.on('click', 'input[lay-filter="layTransferCheckbox"]+', function(){ 
        var thisElemCheckbox = $(this).prev(); // 获取当前点的input
        var checked = thisElemCheckbox[0].checked; // 获取当前 input 是否checked
        var thisDataElem = thisElemCheckbox.parents('.'+ ELEM_BOX).eq(0).find('.'+ ELEM_DATA); // 获取当前点击input处于的layui-transfer-data类 dom

        // 如果当前点击的input为禁止，后续不执行
        if(thisElemCheckbox[0].disabled) return;
        
        // 判断是否全选
        if(thisElemCheckbox.attr('lay-type') === 'all'){
          thisDataElem.find('input[type="checkbox"]').each(function(){ // 遍历所有checkbox除了disabled状态下的checkbox其余的都选中或者不选中
            if(this.disabled) return;
            this.checked = checked;
          });
        }
        
        that.renderCheckBtn({stopNone: true}); // 渲染更新
      });
      
      // 按钮事件
      that.layBtn.on('click', function(){
        var othis = $(this);
        var _index = othis.data('index'); // 获取当前按钮是向左插入数据的按钮还是向右
        var thisBoxElem = that.layBox.eq(_index); // 根据按钮序号获取穿梭框
        var arr = [];
        if(othis.hasClass(DISABLED)) return; // 如果按钮不可用，后续不执行
        
        that.layBox.eq(_index).each(function(_index){
          var othis = $(this);
          var thisDataElem = othis.find('.'+ ELEM_DATA); // 当前穿梭框下的layui-transfer-data类
          
          // 遍历左右穿梭框下的li
          thisDataElem.children('li').each(function(){
            var thisList = $(this);
            var thisElemCheckbox = thisList.find('input[type="checkbox"]');
            var isHide = thisElemCheckbox.data('hide');

            // 判断当前li是否被选中并且不是隐藏状态
            if(thisElemCheckbox[0].checked && !isHide){
              thisElemCheckbox[0].checked = false; // 选中状态去掉
              thisBoxElem.siblings('.'+ ELEM_BOX).find('.'+ ELEM_DATA).append(thisList.clone()); // checkbox 从一个穿梭框移动到另一个
              thisList.remove(); // 处于当前的穿梭框下的checkbox移除
              
              // 记录当前穿梭的数据
              arr.push(thisElemCheckbox[0].value);
            }
            
            that.setValue();
          });
        });
        
        that.renderCheckBtn(); // 渲染更新
        
        // 穿梭时，如果另外一个框正在搜索，则触发匹配
        var siblingInput = thisBoxElem.siblings('.'+ ELEM_BOX).find('.'+ ELEM_SEARCH +' input');
        siblingInput.val() === '' ||  siblingInput.trigger('keyup');
        
        // 穿梭时的回调
        options.onchange && options.onchange(that.getData(arr), _index);
      });
      
      // 搜索
      that.laySearch.find('input').on('keyup', function(){
        var value = this.value; // 获取搜索的值
        var thisDataElem = $(this).parents('.'+ ELEM_SEARCH).eq(0).siblings('.'+ ELEM_DATA); // 获取当前搜索所处的穿梭框
        var thisListElem = thisDataElem.children('li');
        
        // 遍历穿梭框下的li
        thisListElem.each(function(){
          var thisList = $(this);
          var thisElemCheckbox = thisList.find('input[type="checkbox"]');
          var isMatch = thisElemCheckbox[0].title.indexOf(value) !== -1; // li的值和搜索的值是否一直
  
          thisList[isMatch ? 'removeClass': 'addClass'](HIDE); // 如果不一致则隐藏
          thisElemCheckbox.data('hide', isMatch ? false : true); // 设置data值
        });
  
        that.renderCheckBtn(); // 更新渲染
        
        // 无匹配数据视图
        var isNone = thisListElem.length === thisDataElem.children('li.'+ HIDE).length;
        that.noneView(thisDataElem, isNone ? options.text.searchNone : '');
      });
    };
    
    // 记录所有实例
    thisModule.that = {}; // 记录所有实例对象
    thisModule.config = {}; // 记录所有实例配置项
    
    // 重载实例
    transfer.reload = function(id, options){
      var that = thisModule.that[id];
      that.reload(options);
      
      return thisModule.call(that);
    };
    
    // 获得选中的数据（右侧面板）
    transfer.getData = function(id){
      var that = thisModule.that[id];
      return that.getData();
    };
  
    // 核心入口
    transfer.render = function(options){
      var inst = new Class(options);
      return thisModule.call(inst);
    };
    
    // 导出模块
    exports(MOD_NAME, transfer);
});
  