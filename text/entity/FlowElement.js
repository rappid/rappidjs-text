define(['js/data/Entity'], function(Entity){

    return Entity.inherit('text.entity.FlowElement', {
        defaults: {
            text: "",
            fontSize: null,
            fontWeight: null,
            fontStyle: null
        },
        $isLeaf: false,


        text: function(relativeStart,relativeEnd,paragraphSeparator){
            return this.$.text;
        },

        textLength: function(){
            return this.$.text.length;
        }.onChange("text")

    });







});