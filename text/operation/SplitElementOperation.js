define(['text/operation/FlowOperation','text/entity/ParagraphElement', 'text/entity/SpanElement', 'text/entity/FlowGroupElement'], function(FlowOperation, ParagraphElement, SpanElement, FlowGroupElement){
    var undefined;

    return FlowOperation.inherit('text.operation.SplitParagraphOperation', {

        ctor: function(textRange, targetElement){
            this.$textRange = textRange;
            if(!(targetElement instanceof FlowGroupElement)){
                throw new Error("Can only split FlowGroupElement");
            }
            this.$targetElement = targetElement;

            this.callBase();
        },

        doOperation: function(){
            var activePosition = this.$textRange.$.activeIndex;
            this.$newElement = null;

            if(activePosition !== undefined){

                // find leaf for active position
                var childIndex,
                    newParagraph = new ParagraphElement(),
                    leaf = this.$targetElement.findLeaf(activePosition);

                if(leaf){
                    var paragraph = leaf.$parent,
                        previousParagraph = paragraph.getPreviousParagraph();

                    var textLength = 0;
                    while (previousParagraph) {
                        textLength += previousParagraph.textLength();

                        previousParagraph = previousParagraph.getPreviousParagraph();
                    }

                    var relativePosition = activePosition - textLength; // position inside the paragraph

                    var previousLeaf = paragraph.findLeaf(relativePosition - 1);
                    if (previousLeaf === leaf) {
                        textLength = 0;
                        // split the leaf up!
                        previousLeaf = leaf.getPreviousLeaf(paragraph);
                        while (previousLeaf) {
                            textLength += previousLeaf.textLength();
                            previousLeaf = previousLeaf.getPreviousLeaf(paragraph);
                        }

                        var leafPosition = relativePosition - textLength;

                        var preText = leaf.text(0, leafPosition),
                            postText = leaf.text(leafPosition);

                        childIndex = paragraph.getChildIndex(leaf);

                        // create new leafs
                        var preSpan = new SpanElement({text: preText}),
                            postSpan = new SpanElement({text: postText});

                        // remove old
                        paragraph.removeChild(leaf);

                        // place in paragraph
                        paragraph.addChild(preSpan, {index: childIndex});
                        paragraph.addChild(postSpan, {index: childIndex + 1});

                        leaf = postSpan;
                    }

                    var currentLeaf = leaf;
                    // no need to split up leaf
                    while (leaf) {
                        currentLeaf = leaf;
                        leaf = currentLeaf.getNextLeaf(paragraph);
                        paragraph.removeChild(currentLeaf);
                        newParagraph.addChild(currentLeaf);
                    }
                    this.$previousParagraph = paragraph;
                    this.$newElement = newParagraph;
                }
            }
        }


    });

});