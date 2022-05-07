layui.define(function(){
    var mods = [];
    var builtin = layui.cache.builtin; // 获取内建模块
    layui.each(builtin, function(modName){

        // 模块名为 all 或者 lay.all 不推入数组
        (modName === 'all' || modName === 'layui.all') || mods.push(modName);
    });
    layui.cache.startTime = new Date().getTime();
    
    return mods; // 返回模块数组
}(), function(exports){
    "use strict";

    var MOD_NAME = 'all'; // 模块名

    // 外部接口
    var all = {
        config: {},
        time: function(){
            var time = new Date().getTime() - layui-cache.startTime;
            delete layui.cache.startTime;
            return time;
        }()
    };

    exports(MOD_NAME, all);
});