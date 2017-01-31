define(['js/svg/SvgElement', 'text/operation/InsertTextOperation', 'text/operation/SplitParagraphOperation', 'text/operation/ApplyStyleToElementOperation', 'text/entity/TextFlow', 'text/entity/ParagraphElement', 'text/entity/SpanElement', 'text/entity/TextRange', 'text/operation/DeleteOperation', 'underscore', "js/core/DomElement"], function (SvgElement, InsertTextOperation, SplitParagraphOperation, ApplyStyleToElementOperation, TextFlow, ParagraphElement, SpanElement, TextRange, DeleteOperation, _, DomElement) {

    var NONE_BREAKABLE_SPACE = " ";

    return SvgElement.inherit('text.ui.SvgTextAreaClass', {

        defaults: {
            tagName: 'g',
            $internalText: "",
            composedTextFlow: null,
            textFlow: "{composedTextFlow.textFlow}",
            width: 100,
            height: 100,
            scale: 1,
            focused: false
        },

        $tSpanTransformMap: {
            "fontFamily": "font-family",
            "fontWeight": "font-weight",
            "fontStyle": "font-style",
            "fontSize": "font-size",
            "color": "fill"
        },

        $textTransformMap: {
            "fontFamily": "font-family",
            "fontWeight": "font-weight",
            "fontStyle": "font-style",
            "fontSize": "font-size",
            "color": "fill",
            "textAnchor": "text-anchor"
        },

        $classAttributes: ['scale', 'focused', 'showSelection', 'selectable','text', 'selection', 'selectionGroup', 'textFlow', 'width', 'height'],


        _initializationComplete: function () {
            this.callBase();

            var browser = this.$stage.$browser;

            if (browser && !((browser.os.indexOf("linux") !== -1 || browser.os.indexOf("unix") !== -1) && browser.name === "chrome" || browser.name == "firefox")) {
                this.$.text.set("text-rendering", "geometricPrecision");
            }
        },


        _renderComposedTextFlow: function (composedTextFlow) {

            var text = this.$.text;
            if (!text) {
                return;
            }
            while (text.$el.childNodes.length) {
                text.$el.removeChild(text.$el.childNodes[0]);
            }


            if (composedTextFlow && composedTextFlow.$el) {

                var node;
                for (var h = 0; h < composedTextFlow.$el.childNodes.length; h++) {
                    node = composedTextFlow.$el.childNodes[h];
                    text.$el.appendChild(node.cloneNode(true));

                }

                if (this.$.selectionGroup && composedTextFlow.$selectionGroup) {
                    var selectionGroup = this.$.selectionGroup.$el;

                    for (h = 0; h < composedTextFlow.$selectionGroup.childNodes.length; h++) {
                        node = composedTextFlow.$selectionGroup.childNodes[h];
                        selectionGroup.appendChild(node.cloneNode(true));
                    }
                }


            } else {


                if (!composedTextFlow) {
                    return;
                }

                // transform the tree into a list of paragraphs and lines

                var y = 0,
                    tspan,
                    firstTSpans = [];

                for (var i = 0; i < composedTextFlow.composed.children.length; i++) {
                    var paragraph = composedTextFlow.composed.children[i],
                        paragraphStyle = paragraph.item.composeStyle();

                    for (var j = 0; j < paragraph.children.length; j++) {
                        var softLine = paragraph.children[j];

                        for (var k = 0; k < softLine.children.length; k++) {

                            var line = softLine.children[k],
                                lineHeight = line.getHeight(),
                                textHeight = line.getTextHeight(),
                                maxFontSize = 0,
                                firstTspan = null;


                            y += textHeight;

                            for (var l = 0; l < line.children.length; l++) {
                                var lineElement = line.children[l].item;

                                tspan = this.$stage.$document.createElementNS(SvgElement.SVG_NAMESPACE, "tspan");

                                if (l == 0) {
                                    firstTspan = tspan;
                                }

                                var style = this._transformStyle(lineElement.composeStyle(), this.$tSpanTransformMap);

                                maxFontSize = Math.max(style["font-size"], maxFontSize);

                                if (l === 0) {
                                    // apply paragraph style
                                    _.extend(style, this._transformStyle(paragraphStyle, this.$textTransformMap));

                                    var x = 0;

                                    switch (style["text-anchor"]) {
                                        case "middle":
                                            x = this.$.width / 2;
                                            break;
                                        case "end":
                                            x = this.$.width;
                                    }

                                    style.x = x;
                                    style.y = y;
                                }
                                style["data-height"] = line.children[l].measure.lineHeight;
                                if (lineElement.$.broken) {
                                    style["data-broken"] = lineElement.$.broken;
                                }

                                for (var key in style) {
                                    if (style.hasOwnProperty(key)) {
                                        tspan.setAttribute(key, style[key]);
                                    }
                                }
                                tspan.setAttributeNS("http://www.w3.org/XML/1998/namespace", "xml:space", "preserve");

                                if (this.$stage.$browser.isIE && lineElement.$.text === " ") {
                                    tspan.textContent = NONE_BREAKABLE_SPACE; // NONE BREAKING SPACE +2002! BECAUSE OF IE BUG
                                } else {
                                    tspan.textContent = lineElement.$.text;
                                }
                                text.$el.appendChild(tspan);
                            }

                            y += lineHeight - textHeight;

                            if (softLine.children.length && firstTspan) {
                                firstTSpans.push({
                                    x: firstTspan.textContent != "" ? this._convertPositionForIE(firstTspan.getStartPositionOfChar(0)).x : (line.measure.width / 2),
                                    maxWidth: line.measure.width,
                                    y: y,
                                    lineHeight: lineHeight
                                });
                            }
                        }
                    }
                }

                this._renderComposedTextFlowHook(firstTSpans, selectionGroup, composedTextFlow);

                composedTextFlow.$el = text.$el.cloneNode(true);
            }

            if (this.$stage.$browser.isSafari) {
                // needed for iOS to do a proper refresh
                text.$el.style.display = "none";
                text.$el.style.display = "inherit";
            }

        },

        _renderComposedTextFlowHook: function(firstTSpans, selectionGroup) {

        },

        _transformStyle: function (style, map) {

            var ret = {};

            for (var key in style) {
                if (style.hasOwnProperty(key) && map.hasOwnProperty(key)) {
                    ret[map[key]] = style[key];
                }
            }

            return ret;
        }

    });

});