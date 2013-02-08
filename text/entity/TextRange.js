define(["js/core/Bindable"], function (Bindable) {


    var TextRange = Bindable.inherit('text.entity.TextRange', {
        _commitChangedAttributes: function ($) {
            this.callBase($);
            if (this._hasSome($, ["anchorIndex", "activeIndex"])) {
                if ((this.$.activeIndex === null || this.$.activeIndex === -1)) {
                    this.$.activeIndex = this.$.anchorIndex;
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
        }

    }, {
        createTextRange: function (textFlow, anchorIndex, activeIndex) {
            return new TextRange({textFlow: textFlow, anchorIndex: anchorIndex, activeIndex: activeIndex});
        }
    });

    return TextRange;


});
