/// <reference path="../jquery-3.1.0.min.js" />
/*
*author:wyh19  2016/9/12
*name:ActionSheet,用于移动端web的底部弹出菜单效果
*数据支持本地(json对象)和远程模式(url)；形式支持文字列表(list)和带图标的九宫格形式(grid)
*/
; (function ($) {
    $.fn.ActionSheet = function (options) {
        var version = '1.0.2';
        //备份this，便于各种上下文均可用
        var $this = this;
        var cache = null;
        if ($this.length != 1) {
            settings.debug && console.error('选择器错误，插件无法正常工作');
            return null;
        }
        //全局变量
        var $this_width;
        var $this_height;
        //设置参数
        var settings = $.extend({
            debug: false,
            mode: 'list',//分为list和grid两种模式
            url: '',
            data: null,
            imgBaseUrl: '',
            imgField: '',
            labelField: '',
            idField: '',
            clickType: 'click',
            backgroundColor: '#333',
            color: '#fff',
            callback: null,
            trggerFirst: false
        }, options);
        //做参数的校验
        if (!settings.data && settings.url == '') {
            settings.debug && console.error('请配置url或data的值');
            return null;
        }
        if (settings.mode != '' && settings.mode != 'grid' && settings.mode != 'list') {
            settings.debug && console.error('请配置正确的mode值');
            return null;
        }
        //开始绘制ui
        $this.css('background-color', settings.backgroundColor).css('color', settings.color);
        var $loading = $('<div class="as-loading"><i>加载中</i></div>');
        $this.addClass('actionSheet');
        $this.append($loading);
        var $bg = $('<div class="as-bg"></div>');
        $this.parent().append($bg);
        //判断数据模式
        if (settings.data) {
            //有本地数据则用本地数据
            cache = settings.data;
            analysisData(settings.mode, settings.data);
        } else {
            //没有本地数据用url
            getUrlData(settings.mode, settings.url);
        }
        /*************内部方法*******************/
        function getUrlData(mode, url) {
            $.ajax({
                url: url,
                beforeSend: function () {
                    showLoading();
                },
                success: function (data) {
                    //允许后端返回json字符串或json对象
                    var dtJson;
                    if (typeof data == 'string') {
                        dtJson = $.parseJSON(data);
                    } else {
                        dtJson = data;
                    }
                    cache = dtJson;
                    analysisData(mode, dtJson);
                    hideLoading();
                }
            });
        }
        //解析数据
        function analysisData(mode, data) {
            if (mode == 'grid') {
                gridRender(mode, data);
                gridLayout();
            } else {
                listRender(mode, data);
                listLayout();
            }
        }
        //grid的数据绘制
        function gridRender(mode, data) {
            $.each(data, function (i) {
                $this.append('<div class="as-grid-cell" data-id="' + data[i][settings.idField] + '" data-label="' + data[i][settings.labelField] + '">' +
                                '<img class="as-grid-cell-logo" src="' + settings.imgBaseUrl + data[i][settings.imgField] + '" />' +
                                '<div class="as-grid-cell-label">' + data[i][settings.labelField] + '</div>' +
                            '</div>');
            });
            bindHandler(mode);
            gridLayout();
            if (settings.trggerFirst) {
                $('.as-grid-cell').first().trigger(settings.clickType);
            }
        }
        //grid模式下的布局计算
        function gridLayout() {
            $this_width = $this.width();
            //计算单个li的合适宽度
            var n = parseInt($this_width / 50);
            var re_width = parseInt($this_width / n);
            $('.as-grid-cell').width(re_width);
            $('.as-grid-cell-logo').width(re_width).height(re_width);
            //这时候再计算高度
            $this_height = $this.height();
            $this.css('bottom', -$this_height + 'px');
            $bg.hide();
        }
        //list模式下数据绘制
        function listRender(mode, data) {
            $.each(data, function (i) {
                $this.append('<div class="as-list-cell" data-id="' + data[i][settings.idField] + '" data-label="' + data[i][settings.labelField] + '">' +
                                '<div class="as-list-cell-label">' + data[i][settings.labelField] + '</div>' +
                            '</div>');
            });
            bindHandler(mode);
            listLayout();
        }
        //list模式下的布局计算
        function listLayout() {
            $this_width = $this.width();
            $this_height = $this.height();
            $this.css('bottom', -$this_height + 'px');
        }
        //显示加载中
        function showLoading() {
            $loading.show();
        }
        //隐藏加载中
        function hideLoading() {
            $loading.hide();
        }
        //隐藏actionsheet
        function hideActionSheet() {
            $this.animate({ bottom: -$this_height + 'px' }, 300,function(){
                $this.hide();
                $this.parent().css('overflow', 'auto');
            });
            $bg.hide();
        }
        //绑定事件
        function bindHandler(mode) {
            //grid模式需要自适应
            if (mode == 'grid') {
                $(window).resize(gridLayout);
            }
            //点击背景时关闭弹出层
            $bg.on(settings.clickType, function () {
                hideActionSheet();
            });
            var className = 'as-' + mode + '-cell';
            //点击as中的按钮
            $this.on(settings.clickType, function (e) {
                var $tar;
                if (e.target.className == className) {
                    $tar = $(e.target);
                } else if (e.target.parentNode.className == className) {
                    $tar = $(e.target.parentNode);
                } else {
                    return;
                }
                $tar.addClass('as-' + mode + '-cell-active').siblings().removeClass('as-' + mode + '-cell-active');
                //执行业务
                settings.callback.call(null, $tar.data('id'),$tar.data('label'));
                //执行完隐藏
                hideActionSheet();
            });
        }
        /***************外部方法*****************/
        var methods = {
            show: function () {
                $this.parent().css('overflow', 'hidden');
                $this.show().animate({ bottom: 0 }, 300);
                $bg.show();
            },
            hide: hideActionSheet,
            reRender: function () {
                $this.empty();
                analysisData(settings.mode, cache);
            },
            getVersion: function () {
                console.info('版本号为'+version);
                return version;
            }
        }
        return methods;
    }
})(jQuery);