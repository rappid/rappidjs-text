define(['text/entity/FlowGroupElement', 'text/entity/DivElement', 'text/entity/ParagraphElement'], function (FlowGroupElement, DivElement, ParagraphElement) {

    var TextFlow = FlowGroupElement.inherit('text.entity.TextFlow', {

        addChild: function (child, options) {
            if (!(child instanceof DivElement) && !(child instanceof ParagraphElement)) {
                throw new Error("Can only add DivElement and ParagraphElement to TextFlow");
            }

            this.callBase(child, options);
        }
    }, {

        initializeFromText: function (text) {
            text = text || "";

            var textFlow = new TextFlow();
            var paragraphs = text.split("\n");

            for (var i = 0; i < paragraphs.length; i++) {
                var line = paragraphs[i];
                textFlow.addChild(ParagraphElement.initializeFromText(line))
            }

            return textFlow;
        }

    });

    return TextFlow;
});