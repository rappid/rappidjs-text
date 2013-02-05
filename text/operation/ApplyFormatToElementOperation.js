define(["text/operation/FlowOperation", "text/entity/FlowElement"], function (FlowOperation, FlowElement) {

    return FlowOperation.inherit('text.operation.FlowOperation', {
        ctor: function (textRange, flowElement, format) {
            if (!(flowElement instanceof FlowElement)) {
                throw new Error("Only elements of FlowElement allowed");
            }
            this.$targetElement = flowElement;
            this.$textRange = textRange;
            this.$format = format || {};
        },

        doOperation: function () {
            var element = this.$targetElement,
                absoluteStart = this.$textRange.$.absoluteStart,
                absoluteEnd = this.$textRange.$.absoluteEnd,
                styleElements = [];

            if (!element.$isLeaf) {
                element = element.findLeaf(absoluteStart);
            }

            var endElement = this.$targetElement;
            if (!endElement.$isLeaf) {
                endElement = endElement.findLeaf(absoluteEnd);
            }

            // split element
            var paragraph = element.$parent,
                textLength = 0;

            if(this.$targetElement !== paragraph && !this.$targetElement.$isLeaf){
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

                element.set('text', postText);


                if(preText){
                    var childIndex = paragraph.getChildIndex(element);
                    paragraph.addChild(new element.factory({text: preText}), {index: childIndex});
                }
            }

            var currentElement = element;
            textLength = 0;
            while(currentElement !== endElement){

                styleElements.push(currentElement);

                textLength += currentElement.textLength();

                currentElement = currentElement.getNextLeaf(this.$targetElement);
            }

            var relativeEnd = absoluteEnd - absoluteStart - textLength;
            if(relativeEnd !== endElement.textLength()){
                // split up end element
                var preEndText = endElement.text(0, relativeEnd),
                    postEndText = endElement.text(relativeEnd);

                endElement.set('text', preEndText);

                styleElements.push(endElement);

                // apply style for end element
                if(postEndText){
                    var endElementIndex = paragraph.getChildIndex(endElement);
                    paragraph.addChild(new endElement.factory({text: postEndText}),{index: endElementIndex + 1});
                }
            }

            for(var i = 0; i < styleElements.length; i++){
                styleElements[i].set(this.$format);
            }

        }
    });

});