
layui.define('layer' , function(exports){
    "use strict";
    
    var $ = layui.$; // 获取 jquery
    var layer = layui.layer; // 获取弹出层模块
    var hint = layui.hint(); // 获取提示函数
    var device = layui.device(); // 获取获取设备信息函数
  
    // 外部接口
    var upload = {
      config: {}, // 全局配置项
  
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
    var thisUpload = function(){
      var that = this;

      return {

        // 重新上传 (实例方法)
        upload: function(files){
          that.upload.call(that, files);
        },
        
        // 重载实例 (实例方法)
        reload: function(options){
          that.reload.call(that, options);
        },

        config: that.config
      }
    }
    
    // 字符常量
    var MOD_NAME = 'upload'; // 模块名
    var ELEM = 'layui-upload'; 
    var THIS = 'layui-this';
    var SHOW = 'layui-show'; 
    var HIDE = 'layui-hide'; 
    var DISABLED = 'layui-disabled';
    
    var ELEM_FILE = 'layui-upload-file';
    var ELEM_FORM = 'layui-upload-form'; 
    var ELEM_IFRAME = 'layui-upload-iframe'; 
    var ELEM_CHOOSE = 'layui-upload-choose'; 
    var ELEM_DRAG = 'layui-upload-drag';
    
    /**
     * 构造器
     * options 对象包含一下属性值
     * 参数选项          类型                默认值                   说明    
     * elem             string/object       -                       指向容器选择器，如：elem: '#id'。也可以是DOM对象 
     * url              string              -                       服务端上传接口，返回的数据规范请详见下文
     * data             object              -                       请求上传接口的额外参数。如：data: {id: 'xxx'}，从 layui 2.2.6 开始，支持动态值。
     * headers                                                      接口的请求头。如：headers: {token: 'sasasas'}。注：该参数为 layui 2.2.6 开始新增
     * accept           string              images                  指定允许上传时校验的文件类型，可选值有：images（图片）、file（所有文件）、video（视频）、audio（音频）
     * acceptMime       string              images                  规定打开文件选择框时，筛选出的文件类型，值为用逗号隔开的 MIME 类型列表。如：acceptMime: 'image/*'（只显示图片文件）acceptMime: 'image/jpg,image/png'（只显示 jpg 和 png 文件）。注：该参数为 layui 2.2.6 开始新增
     * exts             string              jpg|png|gif|bmp|jpeg    允许上传的文件后缀。一般结合 accept 参数类设定。假设 accept 为 file 类型时，那么你设置 exts: 'zip|rar|7z' 即代表只允许上传压缩格式的文件。如果 accept 未设定，那么限制的就是图片的文件格式
     * auto             boolean             true                    是否选完文件后自动上传。如果设定 false，那么需要设置 bindAction 参数来指向一个其它按钮提交上传
     * bindAction       string/object       -                       指向一个按钮触发上传，一般配合 auto: false 来使用。值为选择器或DOM对象，如：bindAction: '#btn'
     * field            string              file                    设定文件域的字段名
     * size             number              0（即不限制）            设置文件最大可允许上传的大小，单位 KB。不支持ie8/9
     * multiple         boolean             false                   是否允许多文件上传。设置 true即可开启。不支持ie8/9
     * number           number              0（即不限制）            设置同时可上传的文件数量，一般配合 multiple 参数出现。注意：该参数为 layui 2.2.3 开始新增  
     * drag             boolean             true                    是否接受拖拽的文件上传，设置 false 可禁用。不支持ie8/9
     * 
     * =================================== 回调 ==================================================
     * 
     * choose          function             -                       选择文件后的回调函数。返回一个object参数，详见下文
     * before          function             -                       文件提交上传前的回调。返回一个object参数（同上），详见下文
     * done            function             -                       执行上传请求后的回调。返回三个参数，分别为：res（服务端响应信息）、index（当前文件的索引）、upload（重新上传的方法，一般在文件上传失败后使用）。详见下文
     * error           function             -                       执行上传请求出现异常的回调（一般为网络异常、URL 404等）。返回两个参数，分别为：index（当前文件的索引）、upload（重新上传的方法）。详见下文               
     */
    var Class = function(options){
      var that = this;
      that.config = $.extend({}, that.config, upload.config, options);
      that.render(); // 渲染
    };
    
    // 默认配置
    Class.prototype.config = {
      accept: 'images', // 允许上传的文件类型：images/file/video/audio
      exts: '', // 允许上传的文件后缀名
      auto: true, // 是否选完文件后自动上传
      bindAction: '', // 手动上传触发的元素
      url: '', // 上传地址
      field: 'file', // 文件字段名
      acceptMime: '', // 筛选出的文件类型，默认为所有文件
      method: 'post', // 请求上传的 http 类型
      data: {}, // 请求上传的额外参数
      drag: true, // 是否允许拖拽上传
      size: 0, // 文件限制大小，默认不限制
      number: 0, // 允许同时上传的文件数，默认不限制
      multiple: false // 是否允许多文件上传，不支持ie8-9
    };
    
    // 初始渲染
    Class.prototype.render = function(options){
      var that = this;
      var options = that.config; // 获取配置
  
      options.elem = $(options.elem); // 获取 dom
      options.bindAction = $(options.bindAction); // 获取手动上传触发的 dom
  
      that.file(); // 追加文件域
      that.events(); // 事件处理
    };
    
    // 追加文件域
    Class.prototype.file = function(){
      var that = this;
      var options = that.config;
      
      // 上传文件 dom
      var elemFile = that.elemFile = $([ // ELEM_FILE：layui-upload-file 上传文件类
        '<input class="'+ ELEM_FILE +'" type="file" accept="'+ options.acceptMime +'" name="'+ options.field +'"',
        (options.multiple ? ' multiple' : ''),
        '>'
      ].join(''));

      var next = options.elem.next(); // 返回 options.elem 后面的同级元素
      
      // 判断后面的同级元素是否存在 layui-upload-file 类或者 layui-upload-form 类, 存在就移除 dom
      if(next.hasClass(ELEM_FILE) || next.hasClass(ELEM_FORM)){
        next.remove();
      }
      
      // 包裹ie8/9容器
      if(device.ie && device.ie < 10){
        
        // 在 options.elem dom 外层包裹<div class="layui-upload-wrap"></div>
        options.elem.wrap('<div class="layui-upload-wrap"></div>');
      }
      
      // 如果当前 elem 是input且为file
      that.isFile() ? (
        that.elemFile = options.elem, // 把要挂载的 dom， 赋给elemFile
        options.field = options.elem[0].name // 把原有的 field(name) 赋给 options.field
      ) : options.elem.after(elemFile);// 在 options.elem 后挂载 dom
      
      // 初始化ie8/9的Form域
      if(device.ie && device.ie < 10){
        that.initIE();
      }
    };
    
    // ie8-9初始化
    Class.prototype.initIE = function(){
      var that = this;
      var options = that.config;
      var iframe = $('<iframe id="'+ ELEM_IFRAME +'" class="'+ ELEM_IFRAME +'" name="'+ ELEM_IFRAME +'" frameborder="0"></iframe>'); // iframe 框架
      var elemForm = $(['<form target="'+ ELEM_IFRAME +'" class="'+ ELEM_FORM +'" method="post" key="set-mine" enctype="multipart/form-data" action="'+ options.url +'">',
          '</form>'].join(''));
      
      // 如果当前存在id为layui-upload-iframe的dom，不插入, 否则插入iframe    
      $('#'+ ELEM_IFRAME)[0] || $('body').append(iframe);
  
      // 如果 options.elem 下个一个同级元素不存在layui-upload-form
      if(!options.elem.next().hasClass(ELEM_FORM)){
        that.elemFile.wrap(elemForm); // 包裹文件域      
        
        // 追加额外的参数
        options.elem.next('.'+ ELEM_FORM).append(function(){
          var arr = [];
          layui.each(options.data, function(key, value){
            value = typeof value === 'function' ? value() : value;
            arr.push('<input type="hidden" name="'+ key +'" value="'+ value +'">')
          });
          return arr.join('');
        }());
      }
    };
    
    //异常提示
    Class.prototype.msg = function(content){
      return layer.msg(content, {
        icon: 2,
        shift: 6
      });
    };
    
    // 判断绑定元素是否为文件域本身
    Class.prototype.isFile = function(){
      var elem = this.config.elem[0]; // 获取 dom
      if(!elem) return;

      // 判断当前要绑定的元素，是否为input 且 type 为 file
      return elem.tagName.toLocaleLowerCase() === 'input' && elem.type === 'file'
    }
    
    // 预读图片信息
    Class.prototype.preview = function(callback){
      var that = this;

      // 判读是否存在 FileReader 更多内容请查看 https://developer.mozilla.org/zh-CN/docs/Web/API/FileReader
      if(window.FileReader){
        layui.each(that.chooseFiles, function(index, file){
          var reader = new FileReader();
          reader.readAsDataURL(file); // 开始读取指定的Blob中的内容。一旦完成，result属性中将包含一个data: URL格式的Base64字符串以表示所读取文件的内容  
          reader.onload = function(){

            // 执行用户回调函数
            callback && callback(index, file, this.result);
          }
        });
      }
    };
    
    // 执行上传
    Class.prototype.upload = function(files, type){
      var that = this;
      var options = that.config; // 获取配置
      var elemFile = that.elemFile[0]; // 获取 input 上传文件 dom
      
      // 高级浏览器处理方式，支持跨域
      var ajaxSend = function(){
        var successful = 0;
        var aborted = 0;
        var items = files || that.files || that.chooseFiles || elemFile.files; // 获取要上传的文件集合

        var allDone = function(){ // 多文件全部上传完毕的回调

          // 当前处于多文件上传并且successful + aborted 等于文件长度
          if(options.multiple && successful + aborted === that.fileLength){
            
            // 当 options.allDone 为函数时, 执行回调
            typeof options.allDone === 'function' && options.allDone({
              total: that.fileLength, // 得到总文件数
              successful: successful, // 请求成功的文件数
              aborted: aborted // 请求失败的文件数
            });
          }
        };
        
        // 循环要上传的文件
        layui.each(items, function(index, file){
          var formData = new FormData(); // 创建 formData 对象
          
          formData.append(options.field, file); // 添加 file

          // 追加额外的参数
          layui.each(options.data, function(key, value){
            
            // 判断 value 是否为函数, 如果是则执行函数, 否则直接赋值
            value = typeof value === 'function' ? value() : value;
            formData.append(key, value); // 添加新的键值
          });
          
          // 提交文件
          var opts = {
            url: options.url,
            type: 'post', //统一采用 post 上传
            data: formData,
            contentType: false, 
            processData: false,
            dataType: 'json',
            headers: options.headers || {},
            // 成功回调
            success: function(res) {
              successful++; // 如果成功, 则递增
              done(index, res);
              allDone();
            },
            // 异常回调
            error: function(){
              aborted++;
              that.msg('请求上传接口出现异常');
              error(index);
              allDone();
            }
          };

          // 判断是否存在进度条函数
          if(typeof options.progress === 'function'){
            opts.xhr = function(){
              var xhr = $.ajaxSettings.xhr(); // 返回一个 XMLHttpRequest 对象

              // 上传进度, 并给xhr.upload添加onprogress事件
              xhr.upload.addEventListener("progress", function (obj) {
                
                if(obj.lengthComputable){
                  var percent = Math.floor((obj.loaded/obj.total)* 100); // 百分比
                  options.progress(percent, (options.item ? options.item[0] : options.elem[0]) , obj, index); // 调用回调
                }
              });
              return xhr;
            }
          }

          // 调用 jquery
          $.ajax(opts);
        });
      }
      
      // 低版本IE处理方式，不支持跨域
      var iframeSend = function(){
        var iframe = $('#'+ ELEM_IFRAME); // 获取(layui-upload-iframe)，iframe
      
        that.elemFile.parent().submit(); 
  
        // 获取响应信息
        clearInterval(Class.timer);

        // 添加定时时间
        Class.timer = setInterval(function() {
          var res; 
          var iframeBody = iframe.contents().find('body');
          try {
            res = iframeBody.text();
          } catch(e) {
            that.msg('获取上传后的响应信息出现异常');
            clearInterval(Class.timer);
            error();
          }
          if(res){
            clearInterval(Class.timer);
            iframeBody.html('');
            done(0, res);
          }
        }, 30); 
      }
      
      // 统一回调
      var done = function(index, res){
        
        // 移除 elemFile dom 同级下面的 layui-upload-choose类 dom
        that.elemFile.next('.'+ ELEM_CHOOSE).remove();
        elemFile.value = ''; // 赋为空
        if(typeof res !== 'object'){
          try {
            res = JSON.parse(res);
          } catch(e){
            res = {};
            return that.msg('请对上传接口返回有效JSON');
          }
        }

        // 执行回调
        typeof options.done === 'function' && options.done(res, index || 0, function(files){
          that.upload(files);
        });
      }
      
      // 统一网络异常回调
      var error = function(index){

        // 判断是否选完文件后自动上传
        if(options.auto){
          elemFile.value = '';
        }

        // 执行回调
        typeof options.error === 'function' && options.error(index || 0, function(files){
          that.upload(files);
        });
      }
      
      var exts = options.exts; // 获取文件格式
      var check;
      var value = function(){ // 深拷贝 files 或 that.chooseFiles
        var arr = [];
        layui.each(files || that.chooseFiles, function(i, item){
          arr.push(item.name);
        });
        return arr;
      }()
      
      // 回调返回的参数
      var args = {
        // 预览
        preview: function(callback){
          that.preview(callback);
        },
        // 上传
        upload: function(index, file){
          var thisFile = {};
          thisFile[index] = file;
          that.upload(thisFile);
        },
        // 追加文件到队列
        pushFile: function(){
          that.files = that.files || {};
          layui.each(that.chooseFiles, function(index, item){
            that.files[index] = item;
          });
          return that.files;
        },
        // 重置文件
        resetFile: function(index, file, filename){
          var newFile = new File([file], filename);
          that.files = that.files || {};
          that.files[index] = newFile;
        }
      }
      
      // 提交上传
      var send = function(){   
        // 选择文件的回调      
        if(type === 'choose' || options.auto){
          
          // 判断是否存在回调
          options.choose && options.choose(args);
          if(type === 'choose'){
            return;
          }
        }
        
        // 上传前的回调 - 如果回调函数明确返回false，则停止上传(#pulls55)
        if(options.before && (options.before(args) === false)) return;
  
        // IE兼容处理
        if(device.ie){
          return device.ie > 9 ? ajaxSend() : iframeSend();
        }
        
        ajaxSend(); // 发送请求
      }
  
      // 校验文件格式
      value = value.length === 0 
        ? ((elemFile.value.match(/[^\/\\]+\..+/g)||[]) || '')
      : value;
      
      // 文件长度为0，后续不执行
      if(value.length === 0) return;
      
      // 根据文件类型校验文件
      switch(options.accept){
        case 'file': // 一般文件
          if(exts && !RegExp('\\w\\.('+ exts +')$', 'i').test(escape(value))){
            that.msg('选择的文件中包含不支持的格式');
            return elemFile.value = ''; // 不符合文件类型，并置空
          }
        break;
        case 'video': // 视频文件
          if(!RegExp('\\w\\.('+ (exts || 'avi|mp4|wma|rmvb|rm|flash|3gp|flv') +')$', 'i').test(escape(value))){
            that.msg('选择的视频中包含不支持的格式');
            return elemFile.value = '';
          }
        break;
        case 'audio': // 音频文件
          if(!RegExp('\\w\\.('+ (exts || 'mp3|wav|mid') +')$', 'i').test(escape(value))){
            that.msg('选择的音频中包含不支持的格式');
            return elemFile.value = '';
          }
        break;
        default: // 图片文件
          layui.each(value, function(i, item){
            if(!RegExp('\\w\\.('+ (exts || 'jpg|png|gif|bmp|jpeg$') +')', 'i').test(escape(item))){
              check = true;
            }
          });
          if(check){
            that.msg('选择的图片中包含不支持的格式');
            return elemFile.value = '';
          }
        break;
      }
      
      // 检验文件数量
      that.fileLength = function(){
        var length = 0
        ,items = files || that.files || that.chooseFiles || elemFile.files;
        layui.each(items, function(){
          length++;
        });
        return length;
      }();

      // 根据用户设置的上传数量的限制判断当前上传是否超过限制
      if(options.number && that.fileLength > options.number){
        return that.msg('同时最多只能上传的数量为：'+ options.number);
      }
      
      // 根据用户设置的文件上传大小检验文件
      if(options.size > 0 && !(device.ie && device.ie < 10)){
        var limitSize;
        
        layui.each(that.chooseFiles, function(index, file){
          if(file.size > 1024*options.size){
            var size = options.size/1024;
            size = size >= 1 ? (size.toFixed(2) + 'MB') : options.size + 'KB'
            elemFile.value = '';
            limitSize = size;
          }
        });
        if(limitSize) return that.msg('文件不能超过'+ limitSize);
      }

      send(); // 发送文件
    };
    
    // 重置方法
    Class.prototype.reload = function(options){
      options = options || {};
      delete options.elem;
      delete options.bindAction;
      
      var that = this;
      var options = that.config = $.extend({}, that.config, upload.config, options); // 获取配置
      var next = options.elem.next();
      
      // 重置更新文件域相关属性
      next.attr({
        name: options.name,
        accept: options.acceptMime,
        multiple: options.multiple
      });
    };
    
    // 事件处理
    Class.prototype.events = function(){
      var that = this;
      var options = that.config;
      
      // 设置当前选择的文件队列函数
      var setChooseFile = function(files){
        that.chooseFiles = {}; // 用于存储当前选择上传的文件
        
        // 遍历 files
        layui.each(files, function(i, item){
          var time = new Date().getTime(); // 返回 1970 年 1 月 1 日至今的毫秒数
          that.chooseFiles[time + '-' + i] = item;
        });
      };
      
      // 设置选择的文本函数
      var setChooseText = function(files, filename){
        var elemFile = that.elemFile; // 获取上传 dom
        var item = options.item ? options.item : options.elem; // 当前 item 变量没有用到
        
        // 如果 files 个数不大于1
        var value = files.length > 1 
            ? files.length + '个文件' 
            : ((files[0] || {}).name || (elemFile[0].value.match(/[^\/\\]+\..+/g)||[]) || '');
        
        // elemFile dom 下一个同级元素，如果存在 layui-upload-choose，则移除
        if(elemFile.next().hasClass(ELEM_CHOOSE)){
          elemFile.next().remove();
        }

        that.upload(null, 'choose'); // 虽调用上传，但不执行上传，需要后续手动点击才能完成上传
        if(that.isFile() || options.choose) return;
        elemFile.after('<span class="layui-inline '+ ELEM_CHOOSE +'">'+ value +'</span>'); // 挂载文件信息
      };
  
      // 点击上传容器。先移除之前添加的事件，然后在添加upload.start事件。其中upload.start为事件命名空间的写法
      // jquery的事件命名空间，就是为了区分同一个jquery元素绑定的多个同名事件，使用方法就是: $.bind(“事件名.区分后缀”, function)
      options.elem.off('upload.start').on('upload.start', function(){
        var othis = $(this);
        var data = othis.attr('lay-data'); // 获取用户设置的基础参数
        
        if(data){
          try{
            data = new Function('return '+ data)();
            that.config = $.extend({}, options, data); // 更新当前配置
          } catch(e){
            
            // 提示
            hint.error('Upload element property lay-data configuration item has a syntax error: ' + data);
          }
        }
        
        that.config.item = othis; // 存储 item
        that.elemFile[0].click();
      });
      
      // 拖拽上传
      if(!(device.ie && device.ie < 10)){
        
        // 给拖拽元素添加 upload 事件
        options.elem.off('upload.over').on('upload.over', function(){
          var othis = $(this);
          othis.attr('lay-over', ''); // 添加 lay-over 属性和值
        })
        .off('upload.leave').on('upload.leave', function(){
          var othis = $(this);
          othis.removeAttr('lay-over'); // 移除 lay-over 属性和值
        })
        .off('upload.drop').on('upload.drop', function(e, param){
          var othis = $(this);

          // param 为传入的参数
          var files = param.originalEvent.dataTransfer.files || [];

          othis.removeAttr('lay-over'); // 移除 lay-over 属性和值
          setChooseFile(files); // 执行函数
          
          // 是否设置选完文件后自动上传
          if(options.auto){
            that.upload(files); // 自动上传
          } else {
            setChooseText(files);
          }
        });
      }
      
      // 给动态添加的input dom 添加文件选择 upload 事件
      that.elemFile.off('upload.change').on('upload.change', function(){
        var files = this.files || []; // 获取想要上传的文件
        setChooseFile(files); // 执行函数
        options.auto ? that.upload() : setChooseText(files); //是否自动触发上传
      });
      
      // 手动触发上传
      options.bindAction.off('upload.action').on('upload.action', function(){
        that.upload();
      });
      
      // 判断是否存在haveEvents值，防止事件重复绑定
      if(options.elem.data('haveEvents')) return;
      
      // 给动态添加的input dom 添加 change 事件
      that.elemFile.on('change', function(){
        $(this).trigger('upload.change');
      });
      
      // 给绑定的元素添加 click 事件
      options.elem.on('click', function(){
        if(that.isFile()) return; // 如果已经是input 类型是 file，后续不执行
        $(this).trigger('upload.start');
      });
      
      // 当允许拖拽时
      if(options.drag){
        
        // 为 dom 添加拖拽事件
        options.elem.on('dragover', function(e){
          e.preventDefault(); // 取消默认动作
          $(this).trigger('upload.over'); // 触发 upload.over事件
        }).on('dragleave', function(e){
          $(this).trigger('upload.leave');
        }).on('drop', function(e){
          e.preventDefault(); // 取消默认动作
          $(this).trigger('upload.drop', e);
        });
      }
      
      // 给需要手动上传添加 click 事件
      options.bindAction.on('click', function(){
        $(this).trigger('upload.action');
      });
      
      // 添加 haveEvents 防止重复事件
      options.elem.data('haveEvents', true);
    };
    
    //核心入口  
    upload.render = function(options){
      var inst = new Class(options);
      return thisUpload.call(inst);
    };
    
    // 导出模块
    exports(MOD_NAME, upload);
  });
  