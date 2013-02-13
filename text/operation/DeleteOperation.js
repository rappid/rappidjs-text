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
                endElement = element,
                previousLeaf;

            // get start leaf
            if (!element.isLeaf) {
                element = element.findLeaf(absoluteStart);
                if (!element && this.$targetElement instanceof ParagraphElement) {
                    element = new SpanElement();
                    this.$targetElement.addChild(element);
                }
            }

            // get end leaf
            if (absoluteStart === absoluteEnd) {
                endElement = element;
            } else {
                if (absoluteEnd !== absoluteStart) {
                    endElement = this.$targetElement;
                    if (!endElement.isLeaf) {
                        endElement = endElement.findLeaf(absoluteEnd);
                    } else {
                        endElement = endElement.getLastLeaf();
                    }
                }
            }

            // find relative position
            var startParagraph = element.$parent,
                endParagraph = endElement.$parent,
                textLength = 0,
                tmpLength = 0;

            if (this.$targetElement !== endParagraph && !this.$targetElement.isLeaf) {
                var previousParagraph = endParagraph.getPreviousParagraph();
                while (previousParagraph) {
                    textLength += previousParagraph.textLength();
                    if (previousParagraph === startParagraph) {
                        tmpLength = textLength;
                    }
                    previousParagraph = previousParagraph.getPreviousParagraph();
                }
            }

            var relativePosition = absoluteStart - (textLength - tmpLength),
                relativeEnd = absoluteEnd - textLength;


            // get position in leaf
            previousLeaf = startParagraph.findLeaf(relativePosition - 1);
            if (previousLeaf === element) {
                textLength = 0;
                // split the leaf up!
                previousLeaf = element.getPreviousLeaf(startParagraph);

                while (previousLeaf) {
                    textLength += previousLeaf.textLength();
                    previousLeaf = previousLeaf.getPreviousLeaf(startParagraph);
                }

                relativePosition = relativePosition - textLength;
                relativeEnd = relativeEnd - textLength;
            }

            var preText = element.text(0,relativePosition) + this.$text;

            if(endElement){
                var postText;
                if(element !== endElement){
                    // remove all elements in between
                    var currentLeaf = element,
                        nextLeaf;
                    while(currentLeaf !== endElement){
                        if(currentLeaf.$parent === endElement.$parent){
                            relativeEnd -= currentLeaf.textLength();
                        }
                        nextLeaf = currentLeaf.getNextLeaf(this.$targetElement);
                        if(currentLeaf !== element){
                            currentLeaf.$parent.removeChild(currentLeaf);
                        }
                        currentLeaf = nextLeaf;
                    }
                    postText = endElement.text(relativeEnd);
                    element.set('text', preText);
                    endElement.set('text',postText);
                    // move end element to parent of element
                    if(endElement.$parent !== element.$parent){
                        endElement.$parent.removeChild(endElement);
                        element.$parent.addChild(endElement);
                        if(endParagraph.$.children.isEmpty()){
                            endParagraph.$parent.removeChild(endParagraph);
                        }
                    }
                } else {
                    // endElement == element
                    postText = endElement.text(relativeEnd);
                    endElement.set('text', preText + postText);
                }
            } else {
                element.set('text', preText);
            }

            this.$startElement = element;
            this.$relativePosition = relativePosition;
        }



});

});