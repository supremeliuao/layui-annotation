layui.define('jquery', function(exports){
    "use strict";

    var $ = layui.$; // 获取 jquery

    /**
     * 代码高亮
     * options 对象包含一下属性值
     * 参数             类型            描述
     * elem             string         指定元素的选择器
     * title            string         设定标题
     * height           string         设置最大高度
     * encode           boolean        是否转义html标签，默认false
     * skin             string         风格选择（值见下文）
     * about            boolean        是否剔除右上关于 
     */
    exports('code', function(options){
        var elems = []; // 用于存储多个内部有将要高亮内容的容器节点
        options = options || {}; // 默认 空对象
        options.elem = $(options.elem||'.layui-code'); // 默认带 'layui-code' 类的 dom 集合
        options.lang = 'lang' in options ? options.lang : 'code'; // 默认 code

        options.elem.each(function(){
            elems.push(this); // this 表示当前循环每个节点
        });

        // 倒序遍历 dom 数组
        layui.each(elems.reverse(), function(index, item){
            var othis = $(item); 
            
            /**
             * html() 方法设置或返回被选元素的内容（innerHTML）
             * 当该方法用于返回内容时，则返回第一个匹配元素的内容。
             * 当该方法用于设置内容时，则重写所有匹配元素的内容。
             */
            var html = othis.html(); // 获取带有 html 标签的值, 这些值就是容器节点内有即将高亮的内容
            
            // 转义 html 标签
            if(othis.attr('lay-encode') || options.encode){
                html = html.replace(/&(?!#?[a-zA-Z0-9]+;)/g, '&amp;') // 把 '&' 转义为 '&amp;' (html 中转义字符除外)
                .replace(/</g, '&lt;') // '<' 转义为 '&lt;'
                .replace(/>/g, '&gt;') // '>' 转义为 '&gt;'
                .replace(/'/g, '&#39;') // ''' 转义为 '&#39;'
                .replace(/"/g, '&quot;') // '"' 转义为 '&quot;'
            }

            // 对高亮的部分最外层添加'<ol class="layui-code-ol"></ol>', 对高亮的每一行添加 '<li></li>'
            othis.html('<ol class="layui-code-ol"><li>' + html.replace(/[\r\t\n]+/g, '</li><li>') + '</li></ol>');
            
            // 如果直接子级没有 'layui-code-h3' 类, 则添加该类
            if(!othis.find('>.layui-code-h3')[0]){
                
                // prepend() 方法在被选元素的开头(内部开头)插入指定内容。
                // (othis.attr('lay-title')||options.title||'&lt;/&gt;') + '<a href="javascript:;">'+ (othis.attr('lay-lang')||options.lang||'') + '</a>' + '</h3>' 左上角设置标题, 默认为 '</>'
                // (othis.attr('lay-lang')||options.lang||'') 右上角设置语言 默认为 'code'
                othis.prepend('<h3 class="layui-code-h3">'+ (othis.attr('lay-title')||options.title||'&lt;/&gt;') + '<a href="javascript:;">'+ (othis.attr('lay-lang')||options.lang||'') + '</a>' + '</h3>');
            }

            var ol = othis.find('>.layui-code-ol');
            othis.addClass('layui-box layui-code-view'); // 为容器添加有关高亮的类
            
            // 识别皮肤
            if(othis.attr('lay-skin') || options.skin){
                othis.addClass('layui-code-' +(othis.attr('lay-skin') || options.skin)); // 添加皮肤类
            }

            // 按行数适配左边距 (当要高亮的代码多时, 比如1w行, 这时左边距为100px。)
            if((ol.find('li').length/100|0) > 0){

                // li 小于 100 时 margin-left 为 0px
                ol.css('margin-left', (ol.find('li').length/100|0) + 'px');
            }

            // 设置最大高度
            if(othis.attr('lay-height') || options.height){
                ol.css('max-height', othis.attr('lay-height') || options.height);
            }

            console.log('---', othis, html);
        })
    })
}).addcss('modules/code.css?v=2', 'skincodecss');