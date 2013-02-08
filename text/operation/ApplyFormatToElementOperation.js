define(["text/operation/FlowOperation", "text/entity/FlowElement", "underscore"], function (FlowOperation, FlowElement, _) {

    return FlowOperation.inherit('text.operation.ApplyFormatToElementOperation', {
        ctor: function (textRange, flowElement, style) {
            if (!(flowElement instanceof FlowElement)) {
                throw new Error("Only elements of FlowElement allowed");
            }

            this.$targetElement = flowElement;
            this.$textRange = textRange;
            this.$style = style || {};
        },

        doOperation: function () {
            var element = this.$targetElement,
                absoluteStart = this.$textRange.$.absoluteStart,
                absoluteEnd = this.$textRange.$.absoluteEnd,
                originalStyle,
                changedLeaves = [],
                child;

            if (!element.isLeaf) {
                element = element.findLeaf(absoluteStart);
            }

            var endElement = this.$targetElement;
            if (!endElement.isLeaf) {
                if (absoluteEnd > -1) {
                    endElement = endElement.findLeaf(absoluteEnd);
                    if (!endElement) {
                        endElement = endElement.getLastLeaf();
                    }
                } else {
                    endElement = endElement.getLastLeaf();
                }
            }

            // split element
            var paragraph = element.$parent,
                textLength = 0;

            if (this.$targetElement !== paragraph && !this.$targetElement.isLeaf) {
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
                    postText = element.text(leafPosition);

                originalStyle = element.$.style ? element.$.style.clone() : null;

                element.set('text', postText);
                element.applyStyle(this.$style);
                changedLeaves.push(element);

                if (preText) {
                    var childIndex = paragraph.getChildIndex(element);
                    child = new element.factory({
                        text: preText,
                        style: originalStyle
                    });

                    changedLeaves.push(child);
                    paragraph.addChild(child, {index: childIndex});
                }
            }

            var currentElement = element,
                lastLeaf;
            textLength = 0;
            while (currentElement !== endElement) {

                currentElement.applyStyle(this.$style);
                textLength += currentElement.textLength();

                if (lastLeaf && lastLeaf.$parent === currentElement.$parent && lastLeaf.hasSameStyle(currentElement)) {

                    // merge elements together if they are under the same parent
                    lastLeaf.set('text', lastLeaf.$.text + currentElement.$.text);
                    lastLeaf.$parent.removeChild(currentElement);
                    currentElement = lastLeaf;
                } else {
                    changedLeaves.push(currentElement);
                }


                lastLeaf = currentElement;
                currentElement = currentElement.getNextLeaf(this.$targetElement);
            }

            var relativeEnd = absoluteEnd - absoluteStart - textLength;
            if (relativeEnd !== endElement.textLength()) {
                // split up end element
                var preEndText = endElement.text(0, relativeEnd),
                    postEndText = endElement.text(relativeEnd);

                originalStyle = element.$.style.clone();

                endElement.set('text', preEndText);
                endElement.applyStyle(this.$style);

                if (lastLeaf && lastLeaf.$parent === endElement.$parent && lastLeaf.hasSameStyle(endElement)) {
                    lastLeaf.set('text', lastLeaf.$.text + preEndText);
                    lastLeaf.$parent.removeChild(endElement);
                    endElement = lastLeaf;
                } else {
                    changedLeaves.push(endElement);
                }

                // apply style for end element
                if (postEndText) {
                    var endElementIndex = paragraph.getChildIndex(endElement);
                    child = new endElement.factory({text: postEndText, style: originalStyle});
                    changedLeaves.push(child);
                    paragraph.addChild(child, {index: endElementIndex + 1});
                }
            }

            for (var i = 0; i < changedLeaves.length; i++) {
                child = changedLeaves[i];
                if (child.$parent.numChildren() === 1) {
                    child.$parent.applyStyle(child.$.style);
                    child.$.style.clear();
                }
            }
        }
    });

});