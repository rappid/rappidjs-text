define(["js/core/Bindable"], function (Bindable) {


    var TextRange = Bindable.inherit('text.entity.TextRange', {
        _commitChangedAttributes: function ($) {
            this.callBase($);
            if (this._hasSome($, ["anchorIndex", "activeIndex"])) {
                if ((this.$.anchorIndex === null || this.$.anchorIndex === -1)) {
                    this.$.anchorIndex = this.$.activeIndex;
                }
                if (this.$.anchorIndex < this.$.activeIndex) {
                    this.set({
                        absoluteEnd: this.$.activeIndex,
                        absoluteStart: this.$.anchorIndex
                    });
                } else {
                    this.set({
                        absoluteStart: this.$.activeIndex,
                        absoluteEnd: this.$.anchorIndex
                    });
                }
            }
        },
        getCommonLeafStyle: function(flowElement){

            var firstLeaf = flowElement.findLeaf(this.$.absoluteStart),
                lastLeaf = flowElement.findLeaf(this.$.absoluteEnd),
                currentLeaf = firstLeaf;

            var style = currentLeaf.$.style ? currentLeaf.$.style.clone() : null,
                currentStyle;

            while(currentLeaf !== lastLeaf){
                currentStyle = currentLeaf.$.style;
                if(!style && currentStyle){
                    style = currentStyle.clone();
                }
                if(currentStyle){
                    style.merge(currentStyle);
                }

                currentLeaf = currentLeaf.getNextLeaf(flowElement);
            }

            return style;
        },
        getCommonParagraphStyle: function(flowElement){
            var firstLeaf = flowElement.findLeaf(this.$.absoluteStart),
                lastLeaf = flowElement.findLeaf(this.$.absoluteEnd),
                currentParagraph = firstLeaf.$parent,
                lastParagraph = lastLeaf.$parent;

            var style = currentParagraph.$.style ? currentParagraph.$.style.clone() : null,
                currentStyle;

            while (currentParagraph !== lastParagraph) {
                currentStyle = currentParagraph.$.style;
                if (!style && currentStyle) {
                    style = currentStyle.clone();
                }
                if (currentStyle) {
                    style.merge(currentStyle);
                }

                currentParagraph = currentParagraph.getNextParagraph();
            }

            return style;
        }

    }, {
        createTextRange: function (anchorIndex, activeIndex) {
            return new TextRange({
                anchorIndex: anchorIndex,
                activeIndex: activeIndex
            });
        }
    });

    return TextRange;


});
