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

        it('should not delete on first element', function () {
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

        it('should delete one element if activeIndex == anchorIndex', function(){
            var textFlow = new C.TextFlow(),
                paragraph = new C.Paragraph(),
                span1 = new C.Span({text: "ABC"}),
                textRange;

            paragraph.addChild(span1);
            textFlow.addChild(paragraph);

            textRange = new C.TextRange({
                anchorIndex: 1,
                activeIndex: 1
            });

            var operation = new C.DeleteOperation(textRange, textFlow);
            operation.doOperation();

            expect(textFlow.text()).to.be.equal("BC ");
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

    });

});