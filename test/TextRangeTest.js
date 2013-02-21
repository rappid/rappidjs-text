var expect = require('chai').expect,
    _ = require('underscore'),
    testRunner = require('rAppid.js').TestRunner.setup();

var C = {};


describe('text.entity.TextRangeTest', function () {


    before(function (done) {
        testRunner.requireClasses({
            TextFlow: 'text/entity/TextFlow',
            Span: 'text/entity/SpanElement',
            Paragraph: 'text/entity/ParagraphElement',
            TextRange: 'text/entity/TextRange',
            Style: 'text/type/Style'
        }, C, done);

    });

    describe('#getCommonLeafStyle()', function () {

        it('should return null if no style is set at all', function () {
            var textFlow = new C.TextFlow(),
                paragraph = new C.Paragraph(),
                span1 = new C.Span({text: "This is text."}),
                textRange;

            paragraph.addChild(span1);
            textFlow.addChild(paragraph);

            textRange = new C.TextRange({
                anchorIndex: 0,
                activeIndex: 2
            });

            var commonStyle = textRange.getCommonLeafStyle(textFlow);

            expect(commonStyle).to.be.equal(null);
        });

        it('should return the style of the leaf element', function () {
            var textFlow = new C.TextFlow(),
                paragraph = new C.Paragraph(),
                styleObject = {'fontWeight': 'bold'},
                span1 = new C.Span({text: "This is text.", style: new C.Style(styleObject)}),
                textRange;

            paragraph.addChild(span1);
            textFlow.addChild(paragraph);

            textRange = new C.TextRange({
                anchorIndex: 0,
                activeIndex: 2
            });

            var commonStyle = textRange.getCommonLeafStyle(textFlow);

            expect(commonStyle.compose()).to.be.eql(styleObject);
        });

        it('should return common style of three elements', function () {
            var textFlow = new C.TextFlow(),
                paragraph = new C.Paragraph(),
                styleObject = {'fontWeight': 'bold'},
                styleObject2 = {'fontWeight': 'bold', 'fontStyle': 'italic'},
                styleObject3 = {'fontWeight': 'bold', 'fontStyle': 'normal'},
                span1 = new C.Span({text: "ABC", style: new C.Style(styleObject)}),
                span2 = new C.Span({text: "DEF", style: new C.Style(styleObject2)}),
                span3 = new C.Span({text: "GHI", style: new C.Style(styleObject3)}),
                textRange;

            paragraph.addChild(span1);
            paragraph.addChild(span2);
            paragraph.addChild(span3);
            textFlow.addChild(paragraph);

            textRange = new C.TextRange({
                anchorIndex: 0,
                activeIndex: 7
            });

            var commonStyle = textRange.getCommonLeafStyle(textFlow);

            expect(commonStyle.compose()).to.be.eql(styleObject);


        });

        it('should return empty common style', function () {
            var textFlow = new C.TextFlow(),
                paragraph = new C.Paragraph(),
                styleObject = {'fontWeight': 'extra-bold'},
                styleObject2 = {'fontWeight': 'bold', 'fontStyle': 'italic'},
                styleObject3 = {'fontWeight': 'bold', 'fontStyle': 'normal'},
                span1 = new C.Span({text: "ABC", style: new C.Style(styleObject)}),
                span2 = new C.Span({text: "DEF", style: new C.Style(styleObject2)}),
                span3 = new C.Span({text: "GHI", style: new C.Style(styleObject3)}),
                textRange;

            paragraph.addChild(span1);
            paragraph.addChild(span2);
            paragraph.addChild(span3);
            textFlow.addChild(paragraph);

            textRange = new C.TextRange({
                anchorIndex: 0,
                activeIndex: 7
            });

            var commonStyle = textRange.getCommonLeafStyle(textFlow);

            expect(commonStyle.compose()).to.be.eql({});
        });


    });

    describe('#getCommonParagraphStyle', function () {
        it('should return null if no style is set at all', function () {
            var textFlow = new C.TextFlow(),
                paragraph = new C.Paragraph(),
                span1 = new C.Span({text: "This is text."}),
                textRange;

            paragraph.addChild(span1);
            textFlow.addChild(paragraph);

            textRange = new C.TextRange({
                anchorIndex: 0,
                activeIndex: 2
            });

            var commonStyle = textRange.getCommonParagraphStyle(textFlow);

            expect(commonStyle).to.be.equal(null);
        });

        it('should return the style of the paragraph element', function () {
            var textFlow = new C.TextFlow(),
                styleObject = {'textAlign': 'left'},
                paragraph = new C.Paragraph({style: new C.Style(styleObject)}),
                span1 = new C.Span({text: "This is text."}),
                textRange;

            paragraph.addChild(span1);
            textFlow.addChild(paragraph);

            textRange = new C.TextRange({
                anchorIndex: 0,
                activeIndex: 2
            });

            var commonStyle = textRange.getCommonParagraphStyle(textFlow);

            expect(commonStyle.compose()).to.be.eql(styleObject);
        });

        it('should return common style of three paragraphs', function () {
            var textFlow = new C.TextFlow(),
                styleObject = {'textAlign': 'left'},
                styleObject2 = {'textAlign': 'left', 'spaceBefore': 0},
                styleObject3 = {'textAlign': 'left', 'spaceBefore': 2},
                paragraph = new C.Paragraph({style: new C.Style(styleObject)}),
                paragraph2 = new C.Paragraph({style: new C.Style(styleObject2)}),
                paragraph3 = new C.Paragraph({style: new C.Style(styleObject3)}),
                span1 = new C.Span({text: "ABC"}),
                span2 = new C.Span({text: "DEF"}),
                span3 = new C.Span({text: "GHI"}),
                textRange;

            paragraph.addChild(span1);
            paragraph2.addChild(span2);
            paragraph3.addChild(span3);
            textFlow.addChild(paragraph);
            textFlow.addChild(paragraph2);
            textFlow.addChild(paragraph3);

            textRange = new C.TextRange({
                anchorIndex: 0,
                activeIndex: 10
            });

            var commonStyle = textRange.getCommonParagraphStyle(textFlow);

            expect(commonStyle.compose()).to.be.eql(styleObject);
        });

        it('should return empty common style', function () {
            var textFlow = new C.TextFlow(),
                paragraph = new C.Paragraph(),
                styleObject = {'textAlign': 'left'},
                styleObject2 = {'textAlign': 'right', 'spaceBefore': 0},
                styleObject3 = {'textAlign': 'left', 'spaceBefore': 2},
                span1 = new C.Span({text: "ABC", style: new C.Style(styleObject)}),
                span2 = new C.Span({text: "DEF", style: new C.Style(styleObject2)}),
                span3 = new C.Span({text: "GHI", style: new C.Style(styleObject3)}),
                textRange;

            paragraph.addChild(span1);
            paragraph.addChild(span2);
            paragraph.addChild(span3);
            textFlow.addChild(paragraph);

            textRange = new C.TextRange({
                anchorIndex: 0,
                activeIndex: 7
            });

            var commonStyle = textRange.getCommonLeafStyle(textFlow);

            expect(commonStyle.compose()).to.be.eql({});
        });
    });

})
;