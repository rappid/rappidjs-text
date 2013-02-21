define(["text/operation/FlowOperation", "text/entity/FlowElement", "underscore", "text/entity/ParagraphElement", "text/entity/SpanElement"], function (FlowOperation, FlowElement, _, ParagraphElement, SpanElement) {

    return FlowOperation.inherit('text.operation.InsertTextOperation', {
        ctor: function (textRange, flowElement, text) {
            if (!(flowElement instanceof FlowElement)) {
                throw new Error("Only elements of FlowElement allowed");
            }
            this.$textRange = textRange;
            this.$text = text || "";
            this.callBase(flowElement);
        },

        doOperation: function () {
            var element = this.$targetElement,
                absoluteStart = this.$textRange.$.absoluteStart,
                absoluteEnd = this.$textRange.$.absoluteEnd,
                lastElement;

            if (absoluteEnd > -1) {
                lastElement = element.splitAtPosition(absoluteEnd);
            }

            if (absoluteStart !== absoluteEnd) {
                element.splitAtPosition(absoluteStart);
            }

            var startLeaf = element.getLastLeaf();

            var newLeaf = lastElement.getFirstLeaf();
            if (newLeaf && this.$text) {
                newLeaf.set('text', this.$text + newLeaf.$.text);
            }

            lastElement.$.children.each(function (child) {
                element.addChild(child);
            });

            var parent = startLeaf.$parent;
            if (lastElement) {
                if (newLeaf && newLeaf !== startLeaf) {
                    var endParent = newLeaf.$parent;

                    var currentLeaf = newLeaf,
                        nextLeaf;
                    while (currentLeaf) {
                        nextLeaf = currentLeaf.getNextLeaf(endParent);
                        currentLeaf.$parent.removeChild(currentLeaf);
                        if (currentLeaf.textLength() > 0) {
                            parent.addChild(currentLeaf);
                        }
                        currentLeaf = nextLeaf;
                    }

                    endParent.$parent && endParent.$parent.removeChild(endParent);

                }
                parent.mergeElements();
            }

            this.callBase();
        }
    });

});