define(['text/entity/FlowGroupElement', 'text/entity/ParagraphElement'], function (FlowGroupElement, ParagraphElement) {

    var DivElement = FlowGroupElement.inherit('text.entity.DivElement', {
        addChild: function (child, options) {
            if (!(child instanceof ParagraphElement) && !(child instanceof DivElement)) {
                throw new Error("Can only add ParagraphElement and DivElement to DivElement");
            }
            this.callBase(child, options);
        }

    });

    return DivElement;
});