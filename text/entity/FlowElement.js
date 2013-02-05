define(['js/data/Entity'], function(Entity){
    var undefined;
    return Entity.inherit('text.entity.FlowElement', {
        defaults: {
            text: "",
            fontSize: null,
            fontWeight: null,
            fontStyle: null
        },
        $isLeaf: false,


        text: function(relativeStart,relativeEnd,paragraphSeparator){
            if(relativeEnd === -1){
                relativeEnd = undefined;
            }

            return this.$.text.substring(relativeStart,relativeEnd);
        },

        textLength: function(){
            return this.$.text.length;
        }.onChange("text")

    });







});