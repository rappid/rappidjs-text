define(["js/core/Base","text/entity/Layout", "text/entity/FlowGroupElement", "text/entity/FlowLeafElement"], function (Base, Layout, FlowGroupElement, FlowLeafElement) {


    return Base.inherit('text.composer.Composer', {

        ctor: function(layout, measuring){
            this.$layout = layout || new Layout();
            this.$measuring = measuring;

            if(!this.$measuring){
                throw new Error("No Measuring defined for Composer");
            }

            this.callBase();
        },

        compose: function (textFlow) {
            var currentLine = 1;

            function composeLeaf(element){


            }

            function composeGroup(element){
                if(element instanceof FlowGroupElement){
                    element.$.children.each(composeGroup);
                } else if(element instanceof FlowLeafElement){
                    composeLeaf(element);
                }
            }

            composeGroup(textFlow);
        }


    });


});