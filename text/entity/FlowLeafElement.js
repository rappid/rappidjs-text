define(['text/entity/FlowElement'], function(FlowElement){

    return FlowElement.inherit('text.entity.FlowElement', {
        $isLeaf: true,


        getText: function(){
            return this.$.text;
        },

        getNextLeaf: function(limitElement){
            var parent = this.$parent;

            function getChildOfParent(parent, child) {
                var index = parent.getChildIndex(child), element;
                if (index === parent.numChildren() - 1) {
                    if (parent.$parent && parent !== limitElement) {
                        element = getChildOfParent(parent.$parent, parent);
                        if (element) {
                            if(element.$isLeaf){
                                return element;
                            } else {
                                return element.getFirstLeaf();
                            }
                        }
                    }

                } else {
                    element = parent.getChildAt(index + 1);
                    if (element.$isLeaf) {
                        return element;
                    } else {
                        return element.getFirstLeaf();
                    }
                }
                return null;
            }

            return getChildOfParent(parent, this);
        },

        getPreviousLeaf: function(limitElement){
            var parent = this.$parent;

            function getChildOfParent(parent, child){
                var index = parent.getChildIndex(child), element;
                if(index === 0){
                    if(parent.$parent && parent !== limitElement){
                        element = getChildOfParent(parent.$parent, parent);
                        if(element){
                            if (element.$isLeaf) {
                                return element;
                            } else {
                                return element.getLastLeaf();
                            }
                        }
                    }

                } else {
                    element = parent.getChildAt(index - 1);
                    if (element.$isLeaf) {
                        return element;
                    } else {
                        return element.getLastLeaf();
                    }
                }

                return null;
            }

            return getChildOfParent(parent, this);
        }

    });







});