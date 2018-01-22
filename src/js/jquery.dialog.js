// 对话框
$.dialog = function(options) {
    var settings = {
        width: 320,
        height: 'auto',
        maxHeight: null,
        modal: true,
        ok: message('erp.dialog.ok'),
        cancel: message('erp.dialog.cancel'),
        onShow: null,
        onClose: null,
        onOk: null,
        onCancel: null,
        eventHandle: null,
        eventTarget: null,
        onCheck: null,
        dom: 'body',
        zIndex: 1000,
    };
    $.extend(settings, options);

    if (settings.content == null) {
        return false;
    }

    var $dialog = $('<div class="xxDialog"></div>');
    var $dialogTitle;
    var $dialogClose = $('<div class="dialogClose"></div>').appendTo($dialog);
    var $dialogContent;
    var $dialogBottom;
    var $dialogOk;
    var $dialogCancel;
    var $dialogOverlay;
    if (settings.title != null) {
        $dialogTitle = $('<div class="dialogTitle"></div>').appendTo($dialog);
    }
    if (settings.type != null) {
        $dialogContent = $('<div class="dialogContent dialog' + settings.type + 'Icon"></div>').appendTo($dialog);
    } else {
        $dialogContent = $('<div class="dialogContent"></div>').appendTo($dialog);
    }
    if (settings.ok != null || settings.cancel != null) {
        $dialogBottom = $('<div class="dialogBottom"></div>').appendTo($dialog);
    }
    if (settings.ok != null) {
        $dialogOk = $('<input type="button" class="button" value="' + settings.ok + '" />').appendTo($dialogBottom);
    }
    if (settings.cancel != null) {
        $dialogCancel = $('<input type="button" class="button" value="' + settings.cancel + '" />').appendTo($dialogBottom);
    }
    if (!window.XMLHttpRequest) {
        $dialog.append('<iframe class="dialogIframe"></iframe>');
    }
    $dialog.appendTo(settings.dom);
    if (settings.modal) {
        $dialogOverlay = $('<div class="dialog-overlay"></div>').insertAfter($dialog);
        $dialogOverlay.css({
            'z-index': settings.zIndex++,
        });
    }

    var dialogX;
    var dialogY;
    if (settings.title != null) {
        $dialogTitle.text(settings.title);
    }
    $dialogContent.html(settings.content);
    $dialog.css({
        width: settings.width,
        height: settings.height,
        'margin-left': -parseInt(settings.width / 2),
        'z-index': settings.zIndex++,
        'overflow-y': 'auto',
    });
    if (settings.maxHeight) $dialog.css('max-height', settings.maxHeight);
    dialogShow();

    if ($dialogTitle != null) {
        $dialogTitle
            .mousedown(function(event) {
                $dialog.css({
                    'z-index': settings.zIndex++,
                });
                var offset = $(this).offset();
                if (!window.XMLHttpRequest) {
                    dialogX = event.clientX - offset.left;
                    dialogY = event.clientY - offset.top;
                } else {
                    dialogX = event.pageX - offset.left;
                    dialogY = event.pageY - offset.top;
                }
                $(settings.dom).bind('mousemove', function(event) {
                    $dialog.css({
                        top: event.clientY - dialogY,
                        left: event.clientX - dialogX,
                        margin: 0,
                    });
                });
                return false;
            })
            .mouseup(function() {
                $(settings.dom).unbind('mousemove');
                return false;
            });
    }

    if ($dialogClose != null) {
        $dialogClose.click(function() {
            dialogClose();
            return false;
        });
    }

    if ($dialogOk != null) {
        $dialogOk.click(function() {
            if (settings.onOk && typeof settings.onOk == 'function') {
                if (settings.onOk($dialog) != false) {
                    dialogClose();
                }
            } else {
                dialogClose();
            }
            return false;
        });
    }

    if ($dialogCancel != null) {
        $dialogCancel.click(function() {
            if (settings.onCancel && typeof settings.onCancel == 'function') {
                if (settings.onCancel($dialog) != false) {
                    dialogClose();
                }
            } else {
                dialogClose();
            }
            return false;
        });
    }

    if ($dialogContent != null && settings.eventTarget != null && settings.eventHandle != null) {
        if (typeof settings.eventHandle == 'function') {
            $dialogContent.on('click', '' + settings.eventTarget + '', settings.eventHandle);
        }
    }

    if ($dialogContent != null && settings.onCheck != null) {
        if (typeof settings.onCheck == 'function') {
            $dialogContent.on('click', 'input[type="radio"]', settings.onCheck);
        }
    }

    function dialogShow() {
        if (settings.onShow && typeof settings.onShow == 'function') {
            if (settings.onShow($dialog) != false) {
                $dialog.show();
                $dialogOverlay.show();
            }
        } else {
            $dialog.show();
            $dialogOverlay.show();
        }
    }

    function dialogClose() {
        if (settings.onClose && typeof settings.onClose == 'function') {
            if (settings.onClose($dialog) != false) {
                $dialogOverlay.remove();
                $dialog.remove();
            }
        } else {
            $dialogOverlay.remove();
            $dialog.remove();
        }
    }

    return $dialog;
};
