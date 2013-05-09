define(['text/operation/FlowOperation', 'text/entity/ParagraphElement', 'text/entity/SpanElement', 'text/entity/FlowGroupElement'], function (FlowOperation, ParagraphElement, SpanElement, FlowGroupElement) {
    var undefined;

    return FlowOperation.inherit('text.operation.SplitElementOperation', {

        ctor: function (textRange, targetElement) {
            this.$textRange = textRange;
            if (!(targetElement instanceof FlowGroupElement)) {
                throw new Error("Can only split FlowGroupElement");
            }
            this.$splittedElement = null;
            this.callBase(targetElement);
        },

        doOperation: function () {
            var activePosition = this.$textRange.$.activeIndex;
            this.$newElement = null;

            if (activePosition !== undefined) {
                this.$newElement = this.$targetElement.splitAtPosition(activePosition);
            }
        }


    });

});