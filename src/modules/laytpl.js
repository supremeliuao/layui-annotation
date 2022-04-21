// 定义模块
layui.define(function(exports){
    "use strict"; // 严格模式
    
    // 默认 分隔符
    var config = {
        open: '{{',
        close: '}}'
    };

    // 定义工具集
    var tool = {
        exp: function(str){
            return new RegExp(str, 'g'); // 返回 执行全局匹配（查找所有匹配而非在找到第一个匹配后停止）
        },
        // 匹配满足规则内容
        query: function(type, _, __){
            var types = [
                '#([\\s\\S])+?', // js 语句  \s 查找空白符, \S 查找非空白符
                '([^{#}])*?' // 普通字段 排除'{#}'
            ][type || 0];

            return exp((_||'') + config.open + types + config.close + (__||''));
        },
        escape: function(html){
            // 实际字符      转义字符
            //    &           &amp;
            //    <           &lt;
            //    >           &gt;
            //    '           &#39;
            //    "           &quot;
            // ?!n 匹配任何其后没有紧接指定字符串 n 的字符串
            return String(html || '').replace(/&(?!#?[a-zA-Z0-9]+;)/g, '&amp;')
            .replace(/</g, '&lt;').replace(/>/g,'&gt;').replace(/'/g, '&#39;').replace(/"/g,'&quot;');
        },
        error: function(e, tplog){ // 封装 error
            var error = 'Laytpl Error: ';
            typeof console === 'object' && console.error(error + e + '\n' + (tplog || ''));
            return error + e;
        }
    };

    var exp = tool.exp;
    var Tpl = function(tpl){
        this.tpl = tpl;
    };

    Tpl.pt = Tpl.prototype; // prototype 赋给实例属性

    window.errors = 0;

    // 编译模板
    Tpl.pt.parse = function(tpl, data){
        var that = this;
        var tplog = tpl;
        var jss = exp('^'+config.open+'#', ''); // 生成正则表达式  '/^{{#/g'
        var jsse = exp(config.close+'$', ''); // 生成正则表达式 '/}}$/g'
  
        tpl = tpl.replace(/\s+|\r|\t|\n/g ,' ') // 第一步 '/\s+|\r|\t|\n/g': 全局查找空白字符、回车符、制表符、换行符把它们替换为 ' '
        .replace(exp(config.open+'#'), config.open+'# ') // 第二步 用 '{{#' 全局替换 '{{# '
        .replace(exp(config.close+'}'), '} '+config.close) // 第三步 把不符合规范的 '}}}' 改为 '} }}'
        .replace(/\\/g, '\\\\') // 第四步 把 '\' 替换为 '\\'
        .replace(exp(config.open + '!(.+?)!' + config.close), function(str){ 
            /**
             * 第五步 对一段形如 '{{! template !}}' 格式的模板区域进行过滤，即不解析该区域的模板
             * 更多 replace 函数第二个参数查看 https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/String/replace 
             */ 
            str = str.replace(exp('^'+ config.open + '!', ''), '') // 把 '{{!' 去掉
            .replace(exp('!'+ config.close), '') // 把 '!}}' 去掉
            .replace(exp(config.open + '|' + config.close), function(tag){
                return tag.replace(/(.)/g, '\\$1'); // 把注释中存在的 '{{' 或 '}}' 替换为 '\{\{' 或 '\}\}' 
            });
            return str;
        })
        .replace(/(?="|')/g, '\\') // 第六步 对 ="、"、' 这样的字符, 在'"' 或 '''前添加转义符号成为=\"、\"、\'
        .replace(tool.query(), function(str){
            /**
             * 第七步 匹配 '{{# JavaScript表达式 }}'
             * 并去除自定义符号, 最后返回 '\";JavaScript表达式;view+=\"' 这种格式字符串
             */
            str = str.replace(jss, '').replace(jsse, ''); // 去除 '{{#' 和 '}}'

            // 为什么要在头部和尾部都要加 '"'? 这是为了在生成函数时标签刚好被 '"' 符号包裹
            return '";' + str.replace(/\\(.)/g ,'$1') + ';view+="'; // 添加字符串, 以及对转义的内容去除转义符号
        })
        .replace(tool.query(1), function(str){
            /**
             * 第八步 匹配普通字段 
             * 普通字段包括一下这两种类型 
             * ① '{{ d.field }}' ② '{{= d.field }}'
             */
            var start = '"+(';
            
            // 去除 str 中的空白, 如果去除后的空白字符串等于'{{}}', 则返回''
            if(str.replace(/\s/g, '') === config.open+config.close){
                return '';
            }

            // 去除'{{' 或者 '}}', 暴露出表达式
            str = str.replace(exp(config.open+'|'+config.close), '');
            
            // 如果是 '= d.field' 这种情况
            if(/^=/.test(str)){
                str = str.replace(/^=/, ''); // 去除 '='
                start = '"+_escape_('; // 对 start 重新赋值
            }
            
            // replace(/\\(.)/g, '$1') 提取转义后的内容
            return start + str.replace(/\\(.)/g, '$1') + ')+"'; // 返回 '"+( d.field )+"' 这种格式字符串
        });

        tpl = '"use strict";var view = "' + tpl + '";return view;'; // 对处理过的 tpl 头尾添加规则

        try {
            
            /**
             * 参数 d 为用户传入的数据
             * 参数 _escape_ 为传入的 tool.escape
             */
            that.cache = tpl = new Function('d, _escape_', tpl); // 缓存 tpl
            return tpl(data, tool.escape);
        } catch (e) {
            delete that.cache; // 删除函数
            return tool.error(e, tplog); // 报错
        }
    };

    Tpl.pt.render = function(data, callback){
        var that = this; // 这里的 this 指向当前实例对象
        var tpl; 

        // 无数据时, 报错
        if(!data) return tool.error('no data');

        // that.tpl 用户传入的原始字符串
        tpl = that.cache ? that.cache(data, tool.escape) : that.parse(that.tpl, data);
        
        // 没有 callback 时, 返回解析过的字符串
        if(!callback) return tpl;
        callback(tpl);
    }

    // tpl 对应用户使用 laytpl 时, 第一个函数
    var laytpl = function(tpl){

        // tpl 不是字符串, 则报错 
        if(typeof tpl !== 'string') return tool.error('Template not found');
        return new Tpl(tpl);
    }

    exports('laytpl', laytpl); // 导出模块
})