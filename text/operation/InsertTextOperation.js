define(["text/operation/DeleteOperation", "text/entity/FlowElement", "underscore", "text/entity/ParagraphElement", "text/entity/SpanElement"], function (DeleteOperation, FlowElement, _, ParagraphElement, SpanElement) {

    return DeleteOperation.inherit('text.operation.InsertTextOperation', {
        ctor: function (textRange, flowElement, text) {
            if (!(flowElement instanceof FlowElement)) {
                throw new Error("Only elements of FlowElement allowed");
            }
            this.$textRange = textRange;
            this.$text = text || "";
            this.callBase(flowElement);
        }
    });

});