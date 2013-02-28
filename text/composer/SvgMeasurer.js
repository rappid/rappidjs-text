define(["text/composer/Measurer", "text/metric/Metric", "underscore", "flow"], function (Measurer, Metric, _, flow) {

    var SVG_NAMESPACE = "http://www.w3.org/2000/svg";

    return Measurer.inherit("text.composer.SvgMeasurer", {

        ctor: function(svg) {
            this.svg = svg;
            this.measureCache = {};

            svg.setViewBox(0, 0, 100, 100);
            svg.set({
                width: 100,
                height: 100
            });

            this.callBase();
        },

        loadAssets: function(textFlow, callback) {
            callback = callback || function() {};

            var fonts = this.getUsedFonts(textFlow);
            for (var i = 0; i < fonts.length; i++) {
                fonts[i] = this.getFontInformation(fonts[i]);
            }

            var svg = this.svg;

            flow()
                .parEach(fonts, function(font, cb) {
                    svg.fontManager.loadExternalFont(font.name, font.url, cb);
                })
                .exec(callback);

        },

        getFontInformation: function(font) {
            return {
                url: null,
                name: null
            };
        },

        getUsedFonts: function (textFlow) {
            var fonts = [];

            if (textFlow) {
                addFonts(textFlow);
            }

            return fonts;

            function addFonts(flowElement) {
                if (flowElement) {
                    var font = flowElement.get("style.font");

                    if (font && _.indexOf(fonts, font) === -1) {
                        fonts.push(font);
                    }

                    if (!flowElement.isLeaf) {
                        flowElement.$.children.each(function (child) {
                            addFonts(child);
                        });
                    }
                }
            }
        },


        $transformMap: {
            "fontFamily": "font-family",
            "fontWeight": "font-weight",
            "fontStyle": "font-style",
            "fontSize": "font-size"
        },

        measureText: function (span) {

            if (!this.svg) {
                throw new Error("cannot measure text until svg is set");
            }

            var document = this.svg.$stage.$document,
                style = span.composeStyle() || {},
                fontSize = style.fontSize || 0;

            style.fontSize = 100;

            var text = document.createElementNS(SVG_NAMESPACE, "text");
            text.textContent = span.$.text;

            var cacheId = span.$.text + "&";

            // apply the style
            for (var key in style) {
                if (style.hasOwnProperty(key) && this.$transformMap.hasOwnProperty(key)) {
                    var attribute = this.$transformMap[key];
                    var value = style[key];
                    text.setAttribute(attribute, value);

                    if (key !== "fontSize") {
                        cacheId += attribute + "=" + value + "&";
                    }
                }
            }

            var box;

            if (!this.measureCache[cacheId]) {
                text.setAttribute("text-rendering", "geometricprecision");
                text.setAttributeNS("http://www.w3.org/XML/1998/namespace", "space", "preserve");

                var container = this.svg.$el;
                container.appendChild(text);

                box = text.getBBox();

                container.removeChild(text);
                this.measureCache[cacheId] = box;
            } else {
                box = this.measureCache[cacheId];
            }

            return new Metric(box.width / 100 * fontSize, box.height / 100 * fontSize);

        }

    });

});