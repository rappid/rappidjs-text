define(['text/entity/FlowLeafElement'], function (FlowLeafElement) {

    return FlowLeafElement.inherit('text.entity.LineBreakElement', {

        text: function(){
            return "\n";
        },

        textLength: function(){
            return 1;
        }

    });
});