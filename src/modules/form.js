layui.define('layer', function(exports){
    "use strict";
    
    var $ = layui.$;
    var layer = layui.layer;
    var hint = layui.hint();
    var device = layui.device();
    
    var MOD_NAME = 'form'; // 模块名
    var ELEM = '.layui-form'; // 表单页面
    var THIS = 'layui-this';
    var SHOW = 'layui-show'; // 显示
    var HIDE = 'layui-hide'; // 隐藏
    var DISABLED = 'layui-disabled'; // 禁用
    
    var Form = function(){
      
      // 配置
      this.config = {
        verify: { // 验证配置
          required: [
            /[\S]+/, // \S 查找非空白字符
            '必填项不能为空'
          ],
          phone: [
            /^1\d{10}$/, // \d 查找数字
            '请输入正确的手机号'
          ],
          email: [
            /^([a-zA-Z0-9_\.\-])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/,
            '邮箱格式不正确'
          ],
          url: [
            /^(#|(http(s?)):\/\/|\/\/)[^\s]+\.[^\s]+$/,
            '链接格式不正确'
          ],
          number: function(value){
            if(!value || isNaN(value)) return '只能填写数字'
          },
          date: [
            /^(\d{4})[-\/](\d{1}|0\d{1}|1[0-2])([-\/](\d{1}|0\d{1}|[1-2][0-9]|3[0-1]))*$/,
            '日期格式不正确'
          ],
          identity: [
            /(^\d{15}$)|(^\d{17}(x|X|\d)$)/,
            '请输入正确的身份证号'
          ]
        },
        autocomplete: null // 全局 autocomplete 状态。null 表示不干预
      };
    };
    
    // 全局设置
    Form.prototype.set = function(options){
      var that = this;
      $.extend(true, that.config, options); // 设置配置
      return that;
    };
    
    // 验证规则设定。verify 函数可用于用户自定义复杂验证
    Form.prototype.verify = function(settings){
      var that = this;
      $.extend(true, that.config.verify, settings);
      return that;
    };
    
    // 表单事件
    Form.prototype.on = function(events, callback){
      return layui.onevent.call(this, MOD_NAME, events, callback);
    };
    
    // val 函数用于给指定表单集合的元素赋值和取值。如果 object 参数存在，则为赋值；如果 object 参数不存在，则为取值。
    Form.prototype.val = function(filter, object){
      var that = this;
      var formElem = $(ELEM + '[lay-filter="' + filter +'"]'); // 获取 .layui-form[lay-filter='xxx'] dom

      // 遍历获取到的 dom
      formElem.each(function(index, item){
        var itemForm = $(this); // 获取 form item
        
        // 遍历 object(object为null、undefin、[]或者{}不遍历), 进行赋值
        layui.each(object, function(key, value){
          var itemElem = itemForm.find('[name="'+ key +'"]'); // 获取在当前 form 下属性为[name='xxx'] 的 dom, 其中key为用户传入的键
          var type;
          
          // 如果对应的表单不存在，则不执行
          if(!itemElem[0]) return;
          type = itemElem[0].type; // 获取当前 dom 类型
          
          // 如果为复选框
          if(type === 'checkbox'){
            itemElem[0].checked = value; // 赋值
          } else if(type === 'radio') { // 如果为单选框
            itemElem.each(function(){ // 遍历单选框
              if(this.value == value ){
                this.checked = true
              }     
            });
          } else { //其它类型的表单
            itemElem.val(value); // 使用 val() 赋值
          }
        });
      });
      
      form.render(null, filter); // 因为不是双向数据绑定，所以需要重新渲染全部
      
      // 返回值
      return that.getValue(filter);
    };
    
    // 取值
    Form.prototype.getValue = function(filter, itemForm){
      itemForm = itemForm || $(ELEM + '[lay-filter="' + filter +'"]').eq(0);
          
      var nameIndex = {}; // 数组 name 索引
      var field = {};
      var fieldElem = itemForm.find('input,select,textarea') // 获取所有表单域

      layui.each(fieldElem, function(_, item){ 
        var othis = $(this);
        var init_name; // 初始 name
        
        item.name = (item.name || '').replace(/^\s*|\s*&/, ''); // 去除空格
        if(!item.name) return;
        
        // 用于支持数组 name
        if(/^.*\[\]$/.test(item.name)){
          var key = item.name.match(/^(.*)\[\]$/g)[0];
          nameIndex[key] = nameIndex[key] | 0;
          init_name = item.name.replace(/^(.*)\[\]$/, '$1['+ (nameIndex[key]++) +']'); // 对 xxx[] 这里的 name 值进行编号
        }
        
        if(/^checkbox|radio$/.test(item.type) && !item.checked) return;  // 复选框和单选框未选中，不记录字段     
        field[init_name || item.name] = item.value;
      });
      
      return field;
    };
    
    /**
     * 表单控件渲染
     * 第一个参数：type，为表单的 type 类型，可选。默认对全部类型的表单进行一次更新。可局部刷新的 type 如下
     * 参数（type）值           描述
     * select                  刷新select选择框渲染
     * checkbox                刷新checkbox复选框（含开关）渲染
     * radio                   刷新radio单选框框渲染  
     * 第二个参数：filter，为 class="layui-form" 所在元素的 lay-filter="" 的值。你可以借助该参数，对表单完成局部更新。 
     */
    Form.prototype.render = function(type, filter){
      var that = this;
      var options = that.config; // 获取配置
      var elemForm = $(ELEM + function(){
        return filter ? ('[lay-filter="' + filter +'"]') : '';
      }()); // 获取表单 dom 

      var items = {
        // 输入框
        input: function(){
          var inputs = elemForm.find('input,textarea'); // 寻找form表单下 input 和 textarea dom
          
          // 初始化全局的 autocomplete
          options.autocomplete && inputs.attr('autocomplete', options.autocomplete);
        },
        
        // 下拉选择框
        select: function(){
          var TIPS = '请选择';
          var CLASS = 'layui-form-select'; // 需要 js 生成 select dom 类型
          var TITLE = 'layui-select-title'; // 选择框的 title 类
          var NONE = 'layui-select-none';
          var initValue = '';
          var thatInput;
          var selects = elemForm.find('select'); // 获取 select dom
          
          // 隐藏 select
          var hide = function(e, clear){
            if(!$(e.target).parent().hasClass(TITLE) || clear){
              $('.'+CLASS).removeClass(CLASS+'ed ' + CLASS+'up');
              thatInput && initValue && thatInput.val(initValue);
            }
            thatInput = null;
          }
          
          // 各种事件
          var events = function(reElem, disabled, isSearch){
            var select = $(this); // select 元素 dom
            var title = reElem.find('.' + TITLE); // reElem 是生成的替代select的dom元素。获取reElem dom 下的 layui-select-title 类 dom
            var input = title.find('input'); // 获取 title 下的 input dom
            var dl = reElem.find('dl'); // 获取 reElem 下的 dl dom
            var dds = dl.children('dd'); // 获取 dl 下的 dd dom 集合
            var index =  this.selectedIndex; // 当前选中的索引
            var nearElem; // select 组件当前选中的附近元素，用于辅助快捷键功能

            // 如果禁止, 后续不执行
            if(disabled) return;
            
            // 展开下拉
            var showDown = function(){
              
              // outerHeight() 方法返回第一个匹配元素的外部高度。该方法包含 padding 和 border。如需包含 margin，请使用 outerHeight(true)。
              // scrollTop() 方法设置或返回被选元素的垂直滚动条位置。
              var top = reElem.offset().top + reElem.outerHeight() + 5 - $win.scrollTop(); // 获取该元素到可视顶部的距离
              var dlHeight = dl.outerHeight(); // 获取除了 margin 高度

              index = select[0].selectedIndex; // 获取最新的 selectedIndex
              reElem.addClass(CLASS+'ed'); // 添加 layui-form-selected 类
              dds.removeClass(HIDE); // 取消隐藏
              nearElem = null;
  
              // 为 index 添加初始选中样式
              dds.eq(index).addClass(THIS).siblings().removeClass(THIS);
  
              // 上下定位识别
              if(top + dlHeight > $win.height() && top >= dlHeight){
                reElem.addClass(CLASS + 'up'); // 添加距上的定位
              }
              
              followScroll();
            }
            
            // 隐藏下拉
            var hideDown = function(choose){
              reElem.removeClass(CLASS+'ed ' + CLASS+'up'); // 移除 layui-form-selected layui-form-selectup 类
              input.blur(); // 失去焦点
              nearElem = null;
               
              // choose 隐式为 true, 后续不执行
              if(choose) return;
              
              notOption(input.val(), function(none){
                var selectedIndex = select[0].selectedIndex; // 获取索引值

                // 未查询到相关值
                if(none){
                  initValue = $(select[0].options[selectedIndex]).html(); // 重新获得初始选中值

                  // 如果是第一项，且文本值等于 placeholder，则清空初始值
                  if(selectedIndex === 0 && initValue === input.attr('placeholder')){
                    initValue = '';
                  };
  
                  // 如果有选中值，则将输入框纠正为该值。否则清空输入框
                  input.val(initValue || '');
                }
              });
            }
            
            // 定位下拉滚动条
            var followScroll = function(){
              var thisDd = dl.children('dd.'+ THIS); // 获取 dl 下面 layui-this的dl dom
              
              if(!thisDd[0]) return;
              
              var posTop = thisDd.position().top; // position() 方法返回第一个匹配元素的位置（相对于它的父元素）。
              var dlHeight = dl.height();
              var ddHeight = thisDd.height();

              // 若选中元素在滚动条不可见底部
              if(posTop > dlHeight){ // 如果当前选择的dd的高度大于dl高度时，滚动条滚动到当前位置
                dl.scrollTop(posTop + dl.scrollTop() - dlHeight + ddHeight - 5);
              }
              
              // 若选择玄素在滚动条不可见顶部
              if(posTop < 0){// 如果当前选择的dd的高度小于0，滚动条滚动到当前位置
                dl.scrollTop(posTop + dl.scrollTop() - 5);
              }
            };
            
            // 点击标题区域
            title.on('click', function(e){

              // 判断当前是否存在 layui-form-selected类，存在则调用隐藏下拉，否则展开下拉
              reElem.hasClass(CLASS+'ed') ? (
                hideDown()
              ) : (
                hide(e, true), 
                showDown()
              );
              dl.find('.'+NONE).remove(); // 移除 layui-select-none 类
            }); 
            
            // 点击箭头获取焦点
            title.find('.layui-edge').on('click', function(){
              input.focus();
            });
            
            // select 中 input 键盘事件
            input.on('keyup', function(e){ // 键盘松开
              var keyCode = e.keyCode;
              
              // Tab键展开
              if(keyCode === 9){ // tab 键
                showDown();
              }
            }).on('keydown', function(e){ // 键盘按下
              var keyCode = e.keyCode;
  
              // Tab键隐藏
              if(keyCode === 9){
                hideDown();
              }
              
              // 标注 dd 的选中状态
              var setThisDd = function(prevNext, thisElem1){
                var nearDd;
                var cacheNearElem;
                e.preventDefault();
  
                // 得到当前队列元素  
                var thisElem = function(){
                  var thisDd = dl.children('dd.'+ THIS);

                  // 如果是搜索状态，且按 Down 键，且当前可视 dd 元素在选中元素之前，
                  // 则将当前可视 dd 元素的上一个元素作为虚拟的当前选中元素，以保证递归不中断
                  if(dl.children('dd.'+  HIDE)[0] && prevNext === 'next'){
                    var showDd = dl.children('dd:not(.'+ HIDE +',.'+ DISABLED +')');
                    var firstIndex = showDd.eq(0).index();
                    if(firstIndex >=0 && firstIndex < thisDd.index() && !showDd.hasClass(THIS)){
                      return showDd.eq(0).prev()[0] ? showDd.eq(0).prev() : dl.children(':last');
                    }
                  }

                  if(thisElem1 && thisElem1[0]){
                    return thisElem1;
                  }

                  if(nearElem && nearElem[0]){
                    return nearElem;
                  }
         
                  return thisDd;
                  //return dds.eq(index);
                }();
                
                cacheNearElem = thisElem[prevNext](); //当前元素的附近元素
                nearDd =  thisElem[prevNext]('dd:not(.'+ HIDE +')'); //当前可视元素的 dd 元素
  
                // 如果附近的元素不存在，则停止执行，并清空 nearElem
                if(!cacheNearElem[0]) return nearElem = null;
                
                // 记录附近的元素，让其成为下一个当前元素
                nearElem = thisElem[prevNext]();
  
                // 如果附近不是 dd ，或者附近的 dd 元素是禁用状态，则进入递归查找
                if((!nearDd[0] || nearDd.hasClass(DISABLED)) && nearElem[0]){
                  return setThisDd(prevNext, nearElem);
                }
                
                nearDd.addClass(THIS).siblings().removeClass(THIS); //标注样式
                followScroll(); //定位滚动条
              };
              
              if(keyCode === 38) setThisDd('prev'); // Up 键
              if(keyCode === 40) setThisDd('next'); // Down 键
              
              // Enter 键
              if(keyCode === 13){ 
                e.preventDefault(); // 阻止默认行为
                dl.children('dd.'+THIS).trigger('click'); // 给当前选择的dl触发 click事件
              }
            });
            
            // 检测值是否不属于 select 项
            var notOption = function(value, callback, origin){
              var num = 0;

              // 循环 dds
              layui.each(dds, function(){
                var othis = $(this); // 获取当前 this
                var text = othis.text(); // 获取当前 this 的文本值
                var not = text.indexOf(value) === -1;
                if(value === '' || (origin === 'blur') ? value !== text : not) num++;
                origin === 'keyup' && othis[not ? 'addClass' : 'removeClass'](HIDE);
              });

              // 如果 num 等于 dd集合的 length时, 说明当前点击的select并select值为placeholder
              var none = num === dds.length;
              return callback(none), none;
            };
            
            // 搜索匹配
            var search = function(e){
              var value = this.value, keyCode = e.keyCode;
              
              // Tab:9,Enter:13,Left Arrow:37,Up Arrow:38,Right Arrow:39,Dw Arrow:40
              if(keyCode === 9 || keyCode === 13 
                || keyCode === 37 || keyCode === 38 
                || keyCode === 39 || keyCode === 40
              ){
                return false;
              }
              
              notOption(value, function(none){
                // 没有匹配项项时，显示无匹配否则显示匹配到的元素
                if(none){
                  dl.find('.'+NONE)[0] || dl.append('<p class="'+ NONE +'">无匹配项</p>');
                } else {
                  dl.find('.'+NONE).remove();
                }
              }, 'keyup');
              
              if(value === ''){
                dl.find('.'+NONE).remove();
              }
              
              followScroll(); //定位滚动条
            };
            
            if(isSearch){
              input.on('keyup', search).on('blur', function(e){
                var selectedIndex = select[0].selectedIndex;
                
                thatInput = input; // 当前的 select 中的 input 元素
                initValue = $(select[0].options[selectedIndex]).html(); // 重新获得初始选中值
                
                // 如果是第一项，且文本值等于 placeholder，则清空初始值
                if(selectedIndex === 0 && initValue === input.attr('placeholder')){
                  initValue = '';
                };
                
                setTimeout(function(){
                  notOption(input.val(), function(none){
                    initValue || input.val(''); //none && !initValue
                  }, 'blur');
                }, 200);
              });
            }
  
            // 选择
            dds.on('click', function(){
              var othis = $(this);
              var value = othis.attr('lay-value');
              var filter = select.attr('lay-filter'); //获取过滤器

              // 如果当前dd有layui-disabled类后续不执行
              if(othis.hasClass(DISABLED)) return false;
              
              // 如果当前dd有layui-select-tips类，input的值设为空，否则赋值该值并添加THIS类
              if(othis.hasClass('layui-select-tips')){
                input.val('');
              } else {
                input.val(othis.text());
                othis.addClass(THIS);
              }
  
              othis.siblings().removeClass(THIS); // 移除其他dom layui-this类
              select.val(value).removeClass('layui-form-danger');
              
              // 添加事件
              layui.event.call(this, MOD_NAME, 'select('+ filter +')', {
                elem: select[0],
                value: value,
                othis: reElem
              });
  
              hideDown(true); // 隐藏下拉
              return false;
            });
            
            reElem.find('dl>dt').on('click', function(e){
              return false;
            });
            
            $(document).off('click', hide).on('click', hide); // 点击其它元素关闭 select
          }
          
          // 对在form表单下的所有select遍历
          selects.each(function(index, select){
            var othis = $(this);
            var hasRender = othis.next('.'+CLASS); // 是否已经渲染手动构造的select
            var disabled = this.disabled; // 获取当前select是否disabled
            var value = select.value; // 获取select选中的值
            var selected = $(select.options[select.selectedIndex]); //获取当前选中项
            var optionsFirst = select.options[0]; // 获取第一个 option

            // 如果当前select忽略元素美化处理，后续不执行
            if(typeof othis.attr('lay-ignore') === 'string') return othis.show(); // 显示当前 select
            
            // 判断当前select是否支持搜素
            var isSearch = typeof othis.attr('lay-search') === 'string';

            // 第一个option不存在时,则使用TIPS,否则进行下面判断取值
            var placeholder = optionsFirst ? (

              // optionsFirst.value 存在值时，使用TIPS否则使用optionsFirst.innerHTML或者TIPS
              optionsFirst.value ? TIPS : (optionsFirst.innerHTML || TIPS)
            ) : TIPS;
  
            // 替代元素
            var reElem = $(['<div class="'+ (isSearch ? '' : 'layui-unselect ') + CLASS,
            (disabled ? ' layui-select-disabled' : '') +'">',
              '<div class="'+ TITLE +'">',
                ('<input type="text" placeholder="'+ $.trim(placeholder) +'" '
                  +('value="'+ $.trim(value ? selected.html() : '') +'"') //默认值
                  +((!disabled && isSearch) ? '' : ' readonly') //是否开启搜索
                  +' class="layui-input'
                  +(isSearch ? '' : ' layui-unselect') 
                + (disabled ? (' ' + DISABLED) : '') +'">'), //禁用状态
              '<i class="layui-edge"></i></div>',
              '<dl class="layui-anim layui-anim-upbit'+ (othis.find('optgroup')[0] ? ' layui-select-group' : '') +'">',
              function(options){
                var arr = [];
                layui.each(options, function(index, item){
                  if(index === 0 && !item.value){
                    arr.push('<dd lay-value="" class="layui-select-tips">'+ $.trim(item.innerHTML || TIPS) +'</dd>');
                  } else if(item.tagName.toLowerCase() === 'optgroup'){
                    arr.push('<dt>'+ item.label +'</dt>'); 
                  } else {
                    arr.push('<dd lay-value="'+ item.value +'" class="'+ (value === item.value ?  THIS : '') + (item.disabled ? (' '+DISABLED) : '') +'">'+ $.trim(item.innerHTML) +'</dd>');
                  }
                });
                arr.length === 0 && arr.push('<dd lay-value="" class="'+ DISABLED +'">没有选项</dd>');
                return arr.join('');
              }(othis.find('*')) +'</dl>',
            '</div>'].join(''));
            
            hasRender[0] && hasRender.remove(); // 如果已经渲染，则Rerender
            othis.after(reElem);          
            events.call(this, reElem, disabled, isSearch);
          });
        },
        
        // 复选框/开关
        checkbox: function(){
          var CLASS = {
            checkbox: ['layui-form-checkbox', 'layui-form-checked', 'checkbox'], // 复选框类
            _switch: ['layui-form-switch', 'layui-form-onswitch', 'switch'] // 开关类
          };
          var checks = elemForm.find('input[type=checkbox]'); // 获取复选框 dom 结合
          
          var events = function(reElem, RE_CLASS){
            var check = $(this);
            
            // 给替代的dom添加click事件用于勾选
            reElem.on('click', function(){
              var filter = check.attr('lay-filter'); // 获取过滤器
              var text = (check.attr('lay-text')||'').split('|');

              // 如果禁用后续不执行
              if(check[0].disabled) return;
              
              // 这里的功能类似trigger()
              check[0].checked ? (
                check[0].checked = false,
                reElem.removeClass(RE_CLASS[1]).find('em').text(text[1])
              ) : (
                check[0].checked = true,
                reElem.addClass(RE_CLASS[1]).find('em').text(text[0])
              );
              
              layui.event.call(check[0], MOD_NAME, RE_CLASS[2]+'('+ filter +')', {
                elem: check[0]
                ,value: check[0].value
                ,othis: reElem
              });
            });
          }
          
          // 对在form表单下的所有input[type=checkbox]遍历
          checks.each(function(index, check){
            var othis = $(this);
            var skin = othis.attr('lay-skin'); // 获取当前复选框皮肤
            var text = (othis.attr('lay-text') || '').split('|'); // 获取文案
            var disabled = this.disabled;
            if(skin === 'switch') skin = '_'+skin; // 判断当前选择的皮肤类型是否为开关类
            var RE_CLASS = CLASS[skin] || CLASS.checkbox; // 原始类型默认为checkbox
            
            // 如果当前input[type=checkbox]忽略元素美化处理，后续不执行
            if(typeof othis.attr('lay-ignore') === 'string') return othis.show();
            
            // 替代元素
            var hasRender = othis.next('.' + RE_CLASS[0]);
            var reElem = $(['<div class="layui-unselect '+ RE_CLASS[0],
              (check.checked ? (' '+ RE_CLASS[1]) : ''), // 选中状态
              (disabled ? ' layui-checkbox-disabled '+ DISABLED : ''), // 禁用状态
              '"',
              (skin ? ' lay-skin="'+ skin +'"' : ''), // 风格
            '>',
            function(){ // 不同风格的内容
              var title = check.title.replace(/\s/g, ''),
              type = {
                // 复选框
                checkbox: [
                  (title ? ('<span>'+ check.title +'</span>') : ''),
                  '<i class="layui-icon layui-icon-ok"></i>'
                ].join(''),
                
                // 开关
                _switch: '<em>'+ ((check.checked ? text[0] : text[1]) || '') +'</em><i></i>'
              };
              return type[skin] || type['checkbox'];
            }(),
            '</div>'].join(''));
  
            hasRender[0] && hasRender.remove(); //如果已经渲染，则Rerender
            othis.after(reElem);
            events.call(this, reElem, RE_CLASS);
          });
        },
        
        // 单选框
        radio: function(){
          var CLASS = 'layui-form-radio'; // 单选类
          var ICON = ['&#xe643;', '&#xe63f;']; // icon
          var radios = elemForm.find('input[type=radio]'); // 获取单选 dom 集合
          
          var events = function(reElem){
            var radio = $(this);
            var ANIM = 'layui-anim-scaleSpring';
            
            // 给替代的dom 添加点击事件
            reElem.on('click', function(){
              var name = radio[0].name; // 获取radio的name
              var forms = radio.parents(ELEM);
              var filter = radio.attr('lay-filter'); //获取过滤器
              var sameRadio = forms.find('input[name='+ name.replace(/(\.|#|\[|\])/g, '\\$1') +']'); // 找到相同name的兄弟
              
              // 如果禁用后续不执行
              if(radio[0].disabled) return;
              
              // 遍历相同name radio
              layui.each(sameRadio, function(){ // 这里主要的功能为所有相同name的raido移除选中类
                var next = $(this).next('.'+CLASS);
                this.checked = false;
                next.removeClass(CLASS+'ed');
                next.find('.layui-icon').removeClass(ANIM).html(ICON[1]);
              });
              
              // 这里主要的功能是为选中的元素添加checked和选中类
              radio[0].checked = true;
              reElem.addClass(CLASS+'ed');
              reElem.find('.layui-icon').addClass(ANIM).html(ICON[0]);
              
              // 执行模块事件
              layui.event.call(radio[0], MOD_NAME, 'radio('+ filter +')', {
                elem: radio[0],
                value: radio[0].value,
                othis: reElem
              });
            });
          };
          
          // 对在form表单下的所有input[type=radio]遍历
          radios.each(function(index, radio){
            var othis = $(this);
            var hasRender = othis.next('.' + CLASS); // 获取是否渲染
            var disabled = this.disabled; // 获取是否禁用
            
            // 如果当前input[type=radio]忽略元素美化处理，后续不执行
            if(typeof othis.attr('lay-ignore') === 'string') return othis.show();
            hasRender[0] && hasRender.remove(); //如果已经渲染，则Rerender
            
            // 替代元素
            var reElem = $(['<div class="layui-unselect '+ CLASS, 
              (radio.checked ? (' '+CLASS+'ed') : ''), //选中状态
            (disabled ? ' layui-radio-disabled '+DISABLED : '') +'">', //禁用状态
            '<i class="layui-anim layui-icon">'+ ICON[radio.checked ? 0 : 1] +'</i>',
            '<div>'+ function(){
              var title = radio.title || '';
              if(typeof othis.next().attr('lay-radio') === 'string'){
                title = othis.next().html();
                //othis.next().remove();
              }
              return title
            }() +'</div>',
            '</div>'].join(''));
  
            othis.after(reElem);
            events.call(this, reElem);
          });
        }
      };

      // 判断 type 是否存在, 如果存在只对 type 进行更新，否则对全部类型的表单进行一次更新
      type ? (
        items[type] ? items[type]() : hint.error('不支持的 "'+ type + '" 表单渲染')
      ) : layui.each(items, function(index, item){
        item();
      });

      return that;
    };
    
    //表单提交校验
    var submit = function(){
      var stop = null; // 验证不通过状态
      var verify = form.config.verify; // 验证规则
      var DANGER = 'layui-form-danger'; // 警示样式
      var field = {};  // 字段集合
      var button = $(this); // 当前触发的按钮
      var elem = button.parents(ELEM).eq(0); // 当前所在表单域
      var verifyElem = elem.find('*[lay-verify]'); // 获取需要校验的元素
      var formElem = button.parents('form')[0]; // 获取当前所在的 form 元素，如果存在的话
      var filter = button.attr('lay-filter'); // 获取过滤器

      // 开始校验
      layui.each(verifyElem, function(_, item){
        var othis = $(this);
        var vers = othis.attr('lay-verify').split('|');
        var verType = othis.attr('lay-verType'); // 提示方式
        var value = othis.val();

        console.log(_, item, vers);
        
        othis.removeClass(DANGER); // 移除警示样式
        
        // 遍历元素绑定的验证规则
        layui.each(vers, function(_, thisVer){
          var isTrue; // 是否命中校验
          var errorText = ''; // 错误提示文本
          var isFn = typeof verify[thisVer] === 'function'; // 验证规则有函数和数组两种类型所以需要区分
          
          // 匹配验证规则
          if(verify[thisVer]){
            var isTrue = isFn ? errorText = verify[thisVer](value, item) : !verify[thisVer][0].test(value);

            // 是否属于美化替换后的表单元素
            var isForm2Elem = item.tagName.toLowerCase() === 'select' || /^checkbox|radio$/.test(item.type);
            
            errorText = errorText || verify[thisVer][1];
            
            if(thisVer === 'required'){
              errorText = othis.attr('lay-reqText') || errorText;
            }
            
            // 如果是必填项或者非空命中校验，则阻止提交，弹出提示
            if(isTrue){
              // 提示层风格
              if(verType === 'tips'){
                layer.tips(errorText, function(){
                  if(typeof othis.attr('lay-ignore') !== 'string'){
                    if(isForm2Elem){
                      return othis.next();
                    }
                  }
                  return othis;
                }(), {tips: 1});
              } else if(verType === 'alert') {
                layer.alert(errorText, {title: '提示', shadeClose: true});
              } 
              // 如果返回的为字符或数字，则自动弹出默认提示框；否则由 verify 方法中处理提示
              else if(/\bstring|number\b/.test(typeof errorText)){ 
                layer.msg(errorText, {icon: 5, shift: 6});
              }
              
              // 非移动设备自动定位焦点
              if(!device.mobile){
                setTimeout(function(){
                  (isForm2Elem ? othis.next().find('input') : item).focus();
                }, 7);
              } else { // 移动设备定位
                $dom.scrollTop(function(){
                  try {
                    return (isForm2Elem ? othis.next() : othis).offset().top - 15
                  } catch(e){
                    return 0;
                  }
                }());
              }
              
              othis.addClass(DANGER);
              return stop = true;
            }
          }
        });
        if(stop) return stop; // 如果有错误后续遍历不执行
      });
      
      if(stop) return false;
      
      // 获取当前表单值
      field = form.getValue(null, elem);
   
      // 返回字段
      return layui.event.call(this, MOD_NAME, 'submit('+ filter +')', {
        elem: this,
        form: formElem,
        field: field
      });
    };
  
    // 自动完成渲染
    var form = new Form();
    var $dom = $(document); // 获取 document dom
    var $win = $(window); // 获取 window dom
    
    // 立即执行函数
    $(function(){
      form.render();
    });
    
    // 给 .layui-form 类添加 reset 事件
    $dom.on('reset', ELEM, function(){
      var filter = $(this).attr('lay-filter'); // 获取 lay-filter 属性值
      
      setTimeout(function(){
        form.render(null, filter); // 重新渲染
      }, 50);
    });
    
    // 给 .layui-form 类添加 submit 事件 和 click 事件
    $dom.on('submit', ELEM, submit)
    .on('click', '*[lay-submit]', submit);
    
    // 导出模块
    exports(MOD_NAME, form);
});
  