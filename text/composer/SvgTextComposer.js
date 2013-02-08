define(["text/composer/Composer", "text/entity/ParagraphElement", "js/svg/SvgElement"], function (Composer, ParagraphElement, SvgElement) {

    var styleAttributeMap = {
        "fontWeight": "font-weight",
        "fontSize": "font-size",
        "fontStyle": "font-style",
        "textAnchor": "text-anchor"
    };

    return Composer.inherit('text.composer.SvgTextComposer', {

        ctor: function (svgElement) {

            this.$svgElement = svgElement;
        },

        compose: function (textFlow) {
            this.$currentLine = 0;

            var style = textFlow.getCommonStyle();

            this.$textElement = this.$svgElement.createComponent(SvgElement, {tagName: "text"});

            // apply style to textElement
            this.$textElement.set(this._composeStyle(textFlow));

            var self = this;
            textFlow.$.children.each(function (child) {
                self._composeElement(child);
            });
        },

        _composeElement: function (element) {
            if (element instanceof ParagraphElement) {
                var self = this;
                element.$.children.each(function (child) {
                    self._composeElement(child);
                });
                this.$currentLine++;
            } else if (element.$isLeaf) {
                var tspan = this.$svgElement.createComponent(SvgElement, {tagName: "tspan", lineHeight: this._getLineHeightForElement(element)});
                tspan.set(this._composeStyle(element));
                // apply style
                this.$textElement.addChild(tspan);
            }
        },

        _getLineHeightForElement: function (element) {
            // TODO: get element line height
            return this.$currentLine * 15;
        },

        _composeStyle: function (element) {
            var ret = {},
                style = element.$.style;
            for (var key in style) {
                if (style.hasOwnProperty(key)) {
                    if (styleAttributeMap[key]) {
                        ret[styleAttributeMap[key]] = style[key];
                    } else {
                        ret[key] = style[key];
                    }
                }
            }

            return ret;

        }


    });


});