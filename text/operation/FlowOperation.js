define(["js/core/Base"], function (Base) {

    return Base.inherit('text.operation.FlowOperation', {
        ctor: function (textFlow) {
            this.$textFlow = textFlow;
        },

        doOperation: function () {
            // abstract method
        },

        undo: function () {

        },

        redo: function () {

        }

    });

});