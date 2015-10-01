define(["js/core/Bindable"], function (Bindable) {


    var TextRange = Bindable.inherit('text.entity.TextRange', {
        _commitActiveIndex: function(index){
            if (index < 0) {
                return false;
            }

            if (this.$.textFlow) {
                if (index >= this.$.textFlow.textLength()) {
                    return false;
                }
            }

            return true;
        },

        _commitAnchorIndex: function(index){
            if (index < 0) {
                return false;
            }

            if (this.$.textFlow) {
                if (index >= this.$.textFlow.textLength()) {
                    return false;
                }
            }

            return true;
        },


        _commitChangedAttributes: function ($) {
            if (this._hasSome($, ["anchorIndex", "activeIndex"])) {
                if ((this.$.anchorIndex === null || this.$.anchorIndex === -1)) {
                    this.$.anchorIndex = this.$.activeIndex;
                }
                if (this.$.anchorIndex < this.$.activeIndex) {
                    this.set({
                        absoluteEnd: this.$.activeIndex,
                        absoluteStart: this.$.anchorIndex
                    },{silent: true});
                } else {
                    this.set({
                        absoluteStart: this.$.activeIndex,
                        absoluteEnd: this.$.anchorIndex
                    }, {silent: true});
                }
            }
            this.callBase($);
        },
        getCommonLeafStyle: function (flowElement) {

            var firstLeaf = flowElement.findLeaf(this.$.absoluteStart),
                nextLeaf = flowElement.findLeaf(this.$.absoluteStart + 1),
                lastLeaf = flowElement.findLeaf(this.$.absoluteEnd),
                currentLeaf = nextLeaf !== firstLeaf && lastLeaf !== firstLeaf ? nextLeaf : firstLeaf;

            var style = currentLeaf.$.style ? currentLeaf.$.style.clone() : null,
                currentStyle;

            if (currentLeaf !== lastLeaf) {
                do {
                    currentLeaf = currentLeaf.getNextLeaf(flowElement);
                    currentStyle = currentLeaf.$.style;
                    if (!style && currentStyle) {
                        style = currentStyle.clone();
                    }
                    style.merge(currentStyle);

                } while (currentLeaf !== lastLeaf)
            }

            return style;
        },
        getCommonParagraphStyle: function (flowElement) {
            var firstLeaf = flowElement.findLeaf(this.$.absoluteStart),
                lastLeaf = flowElement.findLeaf(this.$.absoluteEnd),
                currentParagraph = firstLeaf.$flowParent,
                lastParagraph = lastLeaf.$flowParent;

            var style = currentParagraph.$.style ? currentParagraph.$.style.clone() : null,
                currentStyle;

            if (currentParagraph !== lastParagraph) {
                do {
                    currentParagraph = currentParagraph.getNextParagraph();
                    currentStyle = currentParagraph.$.style;
                    if (!style && currentStyle) {
                        style = currentStyle.clone();
                    }
                    style.merge(currentStyle);
                } while (currentParagraph !== lastParagraph)

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
