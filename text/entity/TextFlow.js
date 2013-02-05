define(['text/entity/FlowGroupElement', 'text/entity/DivElement', 'text/entity/ParagraphElement'], function(FlowGroupElement, DivElement, ParagraphElement){

    return FlowGroupElement.inherit('text.entity.TextFlow', {

        addChild: function(child, options){
            if(!(child instanceof DivElement) && !(child instanceof ParagraphElement)){
                throw new Error("Can only add DivElement and ParagraphElement to TextFlow");
            }

            this.callBase(child, options);
        }



    });







});