define(["text/operation/FlowOperation", "text/entity/FlowElement", "underscore", "text/entity/ParagraphElement", "text/entity/SpanElement"], function (FlowOperation, FlowElement, _, ParagraphElement, SpanElement) {

    return FlowOperation.inherit('text.operation.DeleteTextOperation', {
        ctor: function (textRange, flowElement) {
            if (!(flowElement instanceof FlowElement)) {
                throw new Error("Only elements of FlowElement allowed");
            }
            this.$targetElement = flowElement;
            this.$textRange = textRange;
            this.$text = "";
        },

        doOperation: function () {
            var element = this.$targetElement,
                absoluteStart = this.$textRange.$.absoluteStart,
                absoluteEnd = this.$textRange.$.absoluteEnd,
                lastElement;


            if (absoluteEnd > 0) {
                lastElement = element.splitAtPosition(absoluteEnd);
            }

            if (absoluteStart !== absoluteEnd) {
                element.splitAtPosition(absoluteStart);
            }

            var startLeaf = element.getLastLeaf();
            if (this.$text) {
                startLeaf.set('text', startLeaf.$.text + this.$text);
            }

            var parent = startLeaf.$parent;
            if (lastElement) {
                var endLeaf = lastElement.getFirstLeaf();
                if (endLeaf && endLeaf !== startLeaf) {
                    var endParent = endLeaf.$parent;

                    var currentLeaf = endLeaf,
                        nextLeaf;
                    while (currentLeaf) {
                        nextLeaf = currentLeaf.getNextLeaf(endParent);
                        if (currentLeaf.textLength() > 0) {
                            parent.addChild(currentLeaf);
                        }
                        currentLeaf = nextLeaf;
                    }

                }
            }
            parent.mergeElements();

        }



    });

});