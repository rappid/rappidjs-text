define(['text/operation/SplitElementOperation', 'text/entity/ParagraphElement'], function (SplitElementOperation, ParagraphElement) {
    return SplitElementOperation.inherit('text.operation.SplitParagraphOperation', {

        ctor: function (textRange, target) {
            this.callBase(textRange, target || textRange.$.textFlow);
        },

        doOperation: function () {
            this.callBase();
            var newParagraph = new ParagraphElement(),
                paragraph,
                style,
                child;

            if (this.$newElement) {
                var
                    leaf = this.$newElement,
                    currentLeaf = this.$newElement;

                paragraph = leaf.$parent;
                /// / no need to split up leaf
                while (leaf) {
                    currentLeaf = leaf;
                    leaf = currentLeaf.getNextLeaf(paragraph);
                    paragraph.removeChild(currentLeaf);
                    newParagraph.addChild(currentLeaf);
                }
            } else {
                var element = this.$splittedElement;

                paragraph = element.$parent;

                child = new element.factory();

                newParagraph.addChild(child);
                this.$newElement = child;
            }

            style = this.$splittedElement.$.style;
            if (style) {
                this.$newElement.applyStyle(style.clone());
            }

            this.$previousParagraph = paragraph;

            style = paragraph.$.style;

            newParagraph.applyStyle(style ? style.clone() : null);

            var paragraphParent = this.$previousParagraph.$parent;
            if (paragraphParent) {
                var paragraphIndex = paragraphParent.getChildIndex(this.$previousParagraph);
                paragraphParent.addChild(newParagraph, {index: paragraphIndex + 1});
                newParagraph.mergeElements();
            }
        }


    });

});