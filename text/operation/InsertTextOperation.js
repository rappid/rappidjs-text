define(["text/operation/FlowOperation", "text/entity/FlowElement", "underscore", "text/entity/ParagraphElement", "text/entity/SpanElement"], function (FlowOperation, FlowElement, _, ParagraphElement, SpanElement) {

    return FlowOperation.inherit('text.operation.InsertTextOperation', {
        ctor: function (textRange, flowElement, text) {
            if (!(flowElement instanceof FlowElement)) {
                throw new Error("Only elements of FlowElement allowed");
            }
            this.$targetElement = flowElement;
            this.$textRange = textRange;
            this.$text = text || {};
        },

        doOperation: function () {
            var element = this.$targetElement,
                absoluteStart = this.$textRange.$.absoluteStart,
                absoluteEnd = this.$textRange.$.absoluteEnd,
                newElementText,
                changedLeaves = [];

            if (!element.$isLeaf) {
                element = element.findLeaf(absoluteStart);
                if (!element && this.$targetElement instanceof ParagraphElement) {
                    element = new SpanElement();
                    this.$targetElement.addChild(element);
                }
            }


            var endElement;
            if (absoluteEnd !== absoluteStart) {
                endElement = this.$targetElement;
                if (!endElement.$isLeaf) {
                    endElement = endElement.findLeaf(absoluteEnd);
                } else {
                    endElement = endElement.getLastLeaf();
                }
            }

            // split element
            var paragraph = element.$parent,
                textLength = 0;

            if (this.$targetElement !== paragraph && !this.$targetElement.$isLeaf) {
                var previousParagraph = paragraph.getPreviousParagraph();
                while (previousParagraph) {
                    textLength += previousParagraph.textLength();
                }
            }

            var relativePosition = absoluteStart - textLength;


            var previousLeaf = paragraph.findLeaf(relativePosition - 1);
            if (previousLeaf === element) {
                textLength = 0;
                // split the leaf up!
                previousLeaf = element.getPreviousLeaf(paragraph);

                while (previousLeaf) {
                    textLength += previousLeaf.textLength();
                    previousLeaf = previousLeaf.getPreviousLeaf(paragraph);
                }

                var leafPosition = relativePosition - textLength;

                var preText = element.text(0, leafPosition),
                    postText = endElement ? "" : element.text(leafPosition);

                newElementText = preText + this.$text + postText;
                changedLeaves.push(element);
            }

            if (absoluteEnd !== absoluteStart) {
                var currentElement = element,
                    lastLeaf;
                textLength = 0;
                while (currentElement !== endElement) {
                    textLength += currentElement.textLength();
                    lastLeaf = currentElement;
                    currentElement = currentElement.getNextLeaf(this.$targetElement);
                    if (lastLeaf !== element) {
                        lastLeaf.$parent && lastLeaf.$parent.removeChild(lastLeaf);
                    }
                }

                var relativeEnd = absoluteEnd - textLength;
                if (endElement && relativeEnd !== endElement.textLength()) {
                    // split up end element
                    var postEndText = endElement.text(relativeEnd);

                    if (postEndText) {
                        endElement.set('text', postEndText);
                    } else {
                        endElement.$parent && endElement.$parent.removeChild(endElement);
                    }
                }
            }
            element.set('text', newElementText);

        }
    });

});