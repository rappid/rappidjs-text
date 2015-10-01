define(['js/data/Entity', 'text/type/Style'], function (Entity, Style) {
    var undefined;
    return Entity.inherit('text.entity.FlowElement', {
        defaults: {
            text: "",
            style: null
        },

        schema: {
            text: {
                type: String,
                required: false
            },
            style: {
                type: Style,
                required: false
            },
            type: {
                type: String,
                generated: true
            }
        },

        idField: false,

        isLeaf: false,

        text: function (relativeStart, relativeEnd, paragraphSeparator) {
            if (relativeEnd < 0) {
                relativeEnd = undefined;
            }

            return this.$.text.substring(relativeStart, relativeEnd);
        },

        textLength: function () {
            return this.$.text.length;
        }.onChange("text"),

        hasSameStyle: function (flowElement) {
            if (this.$.style === flowElement.$.style) {
                return true;
            } else if (this.$.style) {
                return this.$.style.isDeepEqual(flowElement.$.style);
            }
            return false;
        },

        applyStyle: function (style) {
            if (!style) {
                return;
            }

            if (!this.$.style) {
                if (style instanceof Style) {
                    this.set("style", style.clone());
                } else {
                    this.set("style", new Style(style));
                }
            } else {
                if (style instanceof Style) {
                    this.$.style.set(style.$);
                } else {
                    this.$.style.set(style);
                }
            }
        },

        compose: function () {
            var ret = this.callBase();

            if (ret.style) {
                ret.style = ret.style.compose();
            } else {
                delete ret.style;
            }

            if (ret.text == null) {
                delete ret.text;
            }

            ret.type = this.factory.prototype.constructor.name;

            return ret;
        },

        parse: function(data){
            var ret = this.callBase();

            if(ret.style){
                ret.style = new Style(ret.style);
            }

            return ret;
        },

        composeStyle: function () {
            return this.$.style ? this.$.style.compose() : null;
        },

        shallowCopy: function (relativeStart, relativeEnd) {
            var style = this.$.style ? this.$.style.clone() : null;

            return new this.factory({style: style});
        },

        splitAtPosition: function (position) {
            return this.shallowCopy(position);
        },

        notifyOperationComplete: function (operation) {
            this.trigger('operationComplete', {operation: operation});
        }

    });

});