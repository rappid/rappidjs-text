var expect = require('chai').expect,
    _ = require('underscore'),
    testRunner = require('rAppid').TestRunner.setup();

var C = {};


describe('text.operation.InsertTextOperation', function () {


    before(function (done) {
        testRunner.requireClasses({
            TextFlow: 'text/entity/TextFlow',
            Span: 'text/entity/SpanElement',
            Paragraph: 'text/entity/ParagraphElement',
            TextRange: 'text/entity/TextRange',
            DeleteOperation: 'text/operation/DeleteOperation'
        }, C, done);

    });

    describe('#doOperation()', function () {

        it('should not delete if range is not set', function () {
            var textFlow = new C.TextFlow(),
                paragraph = new C.Paragraph(),
                span1 = new C.Span({text: "This is text."}),
                textRange;

            paragraph.addChild(span1);
            textFlow.addChild(paragraph);

            textRange = new C.TextRange({
                anchorIndex: 0,
                activeIndex: 0
            });

            var operation = new C.DeleteOperation(textRange, textFlow);
            operation.doOperation();

            expect(textFlow.text()).to.be.equal("This is text. ");
        });

        it('should delete range', function () {
            var textFlow = new C.TextFlow(),
                paragraph = new C.Paragraph(),
                span1 = new C.Span({text: "ABC"}),
                textRange;

            paragraph.addChild(span1);
            textFlow.addChild(paragraph);

            textRange = new C.TextRange({
                anchorIndex: 1,
                activeIndex: 2
            });

            var operation = new C.DeleteOperation(textRange, textFlow);
            operation.doOperation();

            expect(textFlow.text()).to.be.equal("AC ");
        });

        it('should delete range where anchor is higher than active index', function () {
            var textFlow = new C.TextFlow(),
                paragraph = new C.Paragraph(),
                span1 = new C.Span({text: "ABC"}),
                textRange;

            paragraph.addChild(span1);
            textFlow.addChild(paragraph);

            textRange = new C.TextRange({
                anchorIndex: 2,
                activeIndex: 1
            });

            var operation = new C.DeleteOperation(textRange, textFlow);
            operation.doOperation();

            expect(textFlow.text()).to.be.equal("AC ");
        });

        it('should delete elements between start and end element', function(){
            var textFlow = new C.TextFlow(),
                paragraph = new C.Paragraph(),
                span1 = new C.Span({text: "ABC"}),
                span2 = new C.Span({text: "DEF"}),
                span3 = new C.Span({text: "GHI"}),
                textRange;

            paragraph.addChild(span1);
            paragraph.addChild(span2);
            paragraph.addChild(span3);
            textFlow.addChild(paragraph);

            textRange = new C.TextRange({
                anchorIndex: 1,
                activeIndex: 8
            });

            var operation = new C.DeleteOperation(textRange, textFlow);
            operation.doOperation();

            expect(textFlow.text()).to.be.equal("AI ");
        });

        it('should merge paragraphs', function(){
            var textFlow = new C.TextFlow(),
                paragraph = new C.Paragraph(),
                paragraph2 = new C.Paragraph(),
                span1 = new C.Span({text: "ABC"}),
                span2 = new C.Span({text: "DEF"}),
                textRange;

            paragraph.addChild(span1);
            paragraph2.addChild(span2);

            textFlow.addChild(paragraph);
            textFlow.addChild(paragraph2);

            textRange = new C.TextRange({
                anchorIndex: 2,
                activeIndex: 5
            });

            var operation = new C.DeleteOperation(textRange, textFlow);
            operation.doOperation();

            expect(textFlow.text()).to.be.equal("ABEF ");


        });

    });

});