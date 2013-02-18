define(['text/entity/FlowLeafElement'], function (FlowLeafElement) {

    return FlowLeafElement.inherit('text.entity.SpanElement', {

        shallowCopy: function (relativeStart, relativeEnd) {
            var copy = this.callBase(relativeStart, relativeEnd),
                text = this.text(relativeStart, relativeEnd);

            copy.set('text', text);

            return copy;
        },

        splitAtPosition: function (position) {
            var splittedElement = this.shallowCopy(position);

            this.set('text', this.text(0, position));

            return splittedElement;
        }
    });
});