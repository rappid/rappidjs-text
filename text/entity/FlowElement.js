define(['js/data/Entity','underscore'], function(Entity, _){
    var undefined;
    return Entity.inherit('text.entity.FlowElement', {
        defaults: {
            text: "",
            style: Object
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
        }.onChange("text"),

        hasSameStyle: function(flowElement){
            return _.isEqual(flowElement.$.style,this.$.style);
        },

        applyStyle: function(style){
            _.extend(this.$.style,style);
        }

    });







});