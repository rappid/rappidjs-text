var expect = require('chai').expect,
    _ = require('underscore'),
    testRunner = require('rAppid.js').TestRunner.setup();

var C = {};


describe('text.operation.ApplyFormatToElementOperation', function () {


    before(function (done) {
        testRunner.requireClasses({
            TextFlow: 'text/entity/TextFlow',
            Span: 'text/entity/SpanElement',
            Paragraph: 'text/entity/ParagraphElement',
            TextRange: 'text/entity/TextRange',
            ApplyFormatToElementOperation: 'text/operation/ApplyFormatToElementOperation'
        }, C, done);

    });

    describe('#doOperation()', function () {

        it('should apply style to one span and dont split up', function () {
            var textFlow = new C.TextFlow(),
                paragraph = new C.Paragraph(),
                span1 = new C.Span({text: "This is bold text."}),
                textRange;

            paragraph.addChild(span1);
            textFlow.addChild(paragraph);

            textRange = new C.TextRange({
                textFlow: textFlow,
                anchorIndex: 5,
                activeIndex: 12
            });

            var operation = new C.ApplyFormatToElementOperation(textRange, textFlow);
            operation.doOperation();

            expect(textFlow.getChildAt(0).numChildren()).to.be.equal(3);
        });

        it('should split up text and create new paragraph', function () {
            var textFlow = new C.TextFlow(),
                paragraph = new C.Paragraph(),
                span1 = new C.Span({text: "We just"}),
                span2 = new C.Span({text: "released"}),
                span3 = new C.Span({text: "Confomat"}),
                span4 = new C.Span({text: "7.5"}),
                textRange;

            paragraph.addChild(span1);
            paragraph.addChild(span2);
            paragraph.addChild(span3);
            paragraph.addChild(span4);

            textFlow.addChild(paragraph);

            textRange = new C.TextRange({
                textFlow: textFlow,
                anchorIndex: 3,
                activeIndex: 25
            });

            var operation = new C.ApplyFormatToElementOperation(textRange, textFlow, {fontWeight: "bold"});
            operation.doOperation();

            expect(textFlow.getChildAt(0).numChildren()).to.be.equal(3);

            textRange = new C.TextRange({
                textFlow: textFlow,
                anchorIndex: 0,
                activeIndex: 10
            });
            operation = new C.ApplyFormatToElementOperation(textRange, textFlow, {fontStyle: "underlined"});
            operation.doOperation();

            expect(textFlow.getChildAt(0).numChildren()).to.be.equal(4);
        });
    });

});