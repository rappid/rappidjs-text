define(['text/entity/FlowGroupElement', 'js/core/List', 'text/entity/SpanElement'], function (FlowGroupElement, List, SpanElement) {

    var Paragraph = FlowGroupElement.inherit('text.entity.ParagraphElement', {
        getNextParagraph: function () {
            var parent = this.$parent;
            while (parent.$parent) {
                parent = parent.$parent;
            }

            var list = this._getParagraphsOfElement(parent);
            var index = list.indexOf(this);
            if (index < list.size() - 1) {
                return list.at(index + 1);
            }

            return null;
        },

        getPreviousParagraph: function () {
            var parent = this.$parent;
            while (parent.$parent) {
                parent = parent.$parent;
            }

            var list = this._getParagraphsOfElement(parent);
            var index = list.indexOf(this);
            if (index > 0) {
                return list.at(index - 1);
            }

            return null;
        },

        _getParagraphsOfElement: function (element) {
            var ret = [],
                self = this;
            element.$.children.each(function (child) {
                if (child instanceof Paragraph) {
                    ret.push(child);
                } else {
                    ret = ret.concat(self._getParagraphsOfElement(element));
                }
            });

            return new List(ret);

        },

        addChild: function (child, options) {
            if (!child.$isLeaf) {
                // TODO: allow LinkElements etc..
                throw new Error("Only FlowLeafElements can be added to paragraph");
            }

            this.callBase(child, options);
        }


    }, {

        initializeFromText: function (text) {
            text = text || "";
            var paragraph = new Paragraph();

            paragraph.addChild(new SpanElement({
                text: text
            }));

            return paragraph;
        }

    });

    return Paragraph;


});