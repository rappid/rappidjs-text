define(['text/operation/SplitElementOperation', 'text/entity/ParagraphElement'], function (SplitElementOperation, ParagraphElement) {
    return SplitElementOperation.inherit('text.operation.SplitParagraphOperation', {

        ctor: function (textRange, target) {
            this.callBase(textRange, target || textRange.$.textFlow);
        },

        doOperation: function () {
            var originalParagraph;
            var activeIndex = this.$textRange.$.activeIndex;
            if(!(this.$targetElement instanceof ParagraphElement)){
                var leaf = this.$targetElement.findLeaf(activeIndex);
                if(leaf && leaf.$parent){
                    originalParagraph = leaf.$parent;
                } else {
                    throw new Error("No Paragraph element found!");
                }
            }

            this.callBase();

            var paragraphParent = originalParagraph.$parent;
            if(paragraphParent){
                var firstNewLeaf = this.$newElement.getFirstLeaf();
                if(firstNewLeaf && firstNewLeaf.$parent){
                    var childIndex = paragraphParent.getChildIndex(originalParagraph);
                    var currentParagraph = firstNewLeaf.$parent,
                        nextParagraph;

                    while(currentParagraph){
                        nextParagraph = currentParagraph.getNextParagraph();
                        paragraphParent.addChild(currentParagraph,{index: childIndex+1});
                        childIndex++;
                        currentParagraph = nextParagraph;

                    }
                }


            }
        }


    });

});