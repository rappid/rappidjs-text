define(['js/data/Entity', 'text/type/Style'], function (Entity, Style) {
    var undefined;
    return Entity.inherit('text.entity.FlowElement', {
        defaults: {
            text: "",
            style: Style
        },

        $isLeaf: false,

        text: function (relativeStart, relativeEnd, paragraphSeparator) {
            if (relativeEnd === -1) {
                relativeEnd = undefined;
            }

            return this.$.text.substring(relativeStart, relativeEnd);
        },

        textLength: function () {
            return this.$.text.length;
        }.onChange("text"),

        hasSameStyle: function (flowElement) {
            return this.$.style.isEqual(flowElement.$.style);
        },

        applyStyle: function (style) {
            this.$.style.set(style);
        }

    });

});