define(["js/core/Base"], function (Base) {

    return Base.inherit('text.operation.FlowOperation', {
        ctor: function (flowElement) {
            this.$targetElement = flowElement;
        },

        doOperation: function () {
            this.$targetElement.notifyOperationComplete();
        },

        undo: function () {

        },

        redo: function () {

        }

    });

});