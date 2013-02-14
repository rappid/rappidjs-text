define(["text/operation/FlowOperation", "text/entity/FlowElement", "underscore"], function (FlowOperation, FlowElement, _) {

    return FlowOperation.inherit('text.operation.ApplyFormatToElementOperation', {
        ctor: function (textRange, flowElement, style) {
            if (!(flowElement instanceof FlowElement)) {
                throw new Error("Only elements of FlowElement allowed");
            }

            this.$targetElement = flowElement;
            this.$textRange = textRange;
            this.$style = style || null;
        },

        doOperation: function () {
            var element = this.$targetElement,
                absoluteStart = this.$textRange.$.absoluteStart,
                absoluteEnd = this.$textRange.$.absoluteEnd,
                originalStyle,
                preText,text,postText,
                changedLeaves = [],
                child;

            if(absoluteEnd === absoluteStart){
                return;
            }

            if (!element.isLeaf) {
                element = element.findLeaf(absoluteStart);
            }

            var endElement = this.$targetElement;
            if (!endElement.isLeaf) {
                if (absoluteEnd > -1) {
                    endElement = endElement.findLeaf(absoluteEnd);
                    if (!endElement.isLeaf) {
                        endElement = endElement.getLastLeaf();
                    }
                } else {
                    endElement = endElement.getLastLeaf();
                }
            }

            // split element
            var paragraph = element.$parent,
                endParagraph = endElement.$parent,
                textLength = 0,
                tmpLength = 0,
                paragraphsBetween = [];

            if (this.$targetElement !== endParagraph && !this.$targetElement.isLeaf) {
                var previousParagraph = endParagraph.getPreviousParagraph();
                while (previousParagraph) {
                    textLength += previousParagraph.textLength();

                    if(!tmpLength){
                        paragraphsBetween.push(previousParagraph);
                    }

                    if (previousParagraph === paragraph) {
                        tmpLength = textLength;
                    }
                    previousParagraph = previousParagraph.getPreviousParagraph();
                }
            }

            var relativePosition = absoluteStart - (textLength - tmpLength),
                relativeEnd = absoluteEnd - textLength;

            textLength = 0;
            // split the leaf up!
            var previousLeaf = element.getPreviousLeaf(paragraph);

            while (previousLeaf) {
                textLength += previousLeaf.textLength();
                previousLeaf = previousLeaf.getPreviousLeaf(paragraph);
            }

            var leafPosition = relativePosition - textLength;

            if (endElement === element) {
                // if operation is on same element
                relativeEnd -= textLength;
                preText = element.text(0,leafPosition);
                text = element.text(leafPosition,relativeEnd);
                postText = element.text(relativeEnd);

                childIndex = element.$parent.getChildIndex(element);

                originalStyle = element.$.style ? element.$.style.clone() : null;

                if(!preText){
                    element.set('text', text);
                    element.applyStyle(this.$style);
                    changedLeaves.push(element);
                } else {
                    element.set('text',preText);
                    if (text) {
                        childIndex++;
                        child = new element.factory({text: text, style: originalStyle});
                        child.applyStyle(this.$style);
                        changedLeaves.push(child);
                        element.$parent.addChild(child, {index: childIndex});
                    }
                }

                if(postText){
                    childIndex++;
                    child = new element.factory({text: postText, style: originalStyle});
                    element.$parent.addChild(child, {index: childIndex});
                }

                paragraph.mergeElements();

            } else {
                originalStyle = element.$.style ? element.$.style.clone() : null;

                preText = element.text(0, leafPosition);
                postText = element.text(leafPosition);

                element.set('text', preText);

                if (postText) {
                    var childIndex = paragraph.getChildIndex(element);
                    child = new element.factory({
                        text: postText,
                        style: originalStyle
                    });
                    child.applyStyle(this.$style);

                    changedLeaves.push(child);
                    paragraph.addChild(child, {index: childIndex + 1});

                    element = child;
                } else {
                    element = element.getNextLeaf(this.$targetElement);
                }

                var currentElement = element,
                    lastLeaf = null;
                textLength = 0;
                while (currentElement && currentElement !== endElement) {

                    textLength += currentElement.textLength();
                    currentElement.applyStyle(this.$style);

                    if (lastLeaf && lastLeaf.$parent === currentElement.$parent && lastLeaf.hasSameStyle(currentElement)) {

                        // merge elements together if they are under the same parent
                        lastLeaf.set('text', lastLeaf.$.text + currentElement.$.text);

                        lastLeaf.$parent.removeChild(currentElement);
                        currentElement = lastLeaf;
                    }


                    lastLeaf = currentElement;
                    currentElement = currentElement.getNextLeaf(this.$targetElement);
                }

                previousLeaf = endElement.getPreviousLeaf(endElement.$parent);
                while (previousLeaf) {
                    relativeEnd -= previousLeaf.textLength();
                    previousLeaf = previousLeaf.getPreviousLeaf(endElement.$parent);
                }

                // split up end element
                var preEndText = endElement.text(0, relativeEnd),
                    postEndText = endElement.text(relativeEnd);

                originalStyle = endElement.$.style ? endElement.$.style.clone() : null;


                endElement.set('text', preEndText);
                endElement.applyStyle(this.$style);
                changedLeaves.push(endElement);

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
                    paragraph.addChild(child, {index: endElementIndex + 1});
                }

                paragraph.mergeElements();
                if(paragraph !== endParagraph){
                    endParagraph.mergeElements();
                }

                for (var i = 0; i < paragraphsBetween.length; i++) {
                    paragraphsBetween[i].mergeElements();
                }

            }

            for (i = 0; i < changedLeaves.length; i++) {
                child = changedLeaves[i];
                child.applyStyle(this.$style);
                if (child.$parent.numChildren() === 1) {
                    child.$parent.applyStyle(child.$.style);
                    child.set('style', null);
                }
            }

    }
});

})
;