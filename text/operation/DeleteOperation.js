define(["text/operation/FlowOperation", "text/entity/FlowElement", "underscore", "text/entity/ParagraphElement", "text/entity/SpanElement"], function (FlowOperation, FlowElement, _, ParagraphElement, SpanElement) {

    return FlowOperation.inherit('text.operation.DeleteTextOperation', {
        ctor: function (textRange, flowElement) {
            if (!(flowElement instanceof FlowElement)) {
                throw new Error("Only elements of FlowElement allowed");
            }
            this.$targetElement = flowElement;
            this.$textRange = textRange;
        },

        doOperation: function () {
            var element = this.$targetElement,
                absoluteStart = this.$textRange.$.absoluteStart,
                absoluteEnd = this.$textRange.$.absoluteEnd,
                previousLeaf;

            if (!element.isLeaf) {
                element = element.findLeaf(absoluteStart);
                if (!element && this.$targetElement instanceof ParagraphElement) {
                    element = new SpanElement();
                    this.$targetElement.addChild(element);
                }
            }

            if (absoluteStart === absoluteEnd) {
                // split element
                var paragraph = element.$parent,
                    textLength = 0;

                if (this.$targetElement !== paragraph && !this.$targetElement.isLeaf) {
                    var previousParagraph = paragraph.getPreviousParagraph();
                    while (previousParagraph) {
                        textLength += previousParagraph.textLength();
                        previousParagraph = previousParagraph.getPreviousParagraph();
                    }
                }

                var relativePosition = absoluteStart - textLength;


                if (relativePosition === 0) {
                    previousLeaf = element.getPreviousLeaf(this.$targetElement);
                    if (previousLeaf) {
                        var parent = element.$parent;
                        if (previousLeaf.$parent !== parent) {
                            while (parent.$.children.size()) {
                                previousLeaf.$parent.addChild(parent.$.children.shift());
                            }
                            parent.$parent.removeChild(parent);
                            previousLeaf.$parent.mergeElements();
                            return;
                        } else {
                            element = previousLeaf;
                            relativePosition = element.textLength();
                        }
                    }
                } else {
                    previousLeaf = element.getPreviousLeaf(element.$parent);
                }

                if (previousLeaf !== element) {
                    while (previousLeaf) {
                        relativePosition -= previousLeaf.textLength();
                        previousLeaf = previousLeaf.getPreviousLeaf(this.$targetElement);
                    }
                }
            }

            if (element && relativePosition > 0) {
                var preText = element.text(0, relativePosition - 1),
                    postText = element.text(relativePosition);

                element.set('text', preText + postText);
                if(!element.$.text && element.$parent.$.children.size() > 1){
                    element.$parent.removeChild(element);
                }
                paragraph = element.$parent;
                if (paragraph) {
                    paragraph.mergeElements();
                }
            }

        }



});

});