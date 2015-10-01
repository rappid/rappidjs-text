define(['text/operation/SplitElementOperation', 'text/entity/ParagraphElement'], function (SplitElementOperation, ParagraphElement) {
    return SplitElementOperation.inherit('text.operation.SplitParagraphOperation', {

        ctor: function (textRange, target) {
            this.callBase(textRange, target || textRange.$.textFlow);
        },

        doOperation: function () {
            var originalParagraph;
            var activeIndex = this.$textRange.$.activeIndex;

            if(!(this.$targetElement instanceof ParagraphElement)){
                var leaf = this.$targetElement.findLeaf(activeIndex) || this.$targetElement.getLastLeaf();
                if(leaf && leaf.$flowParent){
                    originalParagraph = leaf.$flowParent;
                } else {
                    throw new Error("No Paragraph element found!");
                }
            }

            this.callBase();

            var paragraphParent = originalParagraph.$flowParent;
            if(paragraphParent){
                var firstNewLeaf = this.$newElement.getFirstLeaf();
                if(firstNewLeaf && firstNewLeaf.$flowParent){
                    var childIndex = paragraphParent.getChildIndex(originalParagraph);
                    var currentParagraph = firstNewLeaf.$flowParent,
                        nextParagraph;

                    while(currentParagraph){
                        nextParagraph = currentParagraph.getNextParagraph();
                        paragraphParent.addChild(currentParagraph,{index: childIndex+1});
                        childIndex++;
                        currentParagraph = nextParagraph;

                    }
                }
            }

            this.$targetElement.notifyOperationComplete();
        }


    });

});