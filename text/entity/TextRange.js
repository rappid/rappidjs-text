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
