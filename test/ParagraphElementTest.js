var expect = require('chai').expect,
    _ = require('underscore'),
    testRunner = require('rAppid').TestRunner.setup();

var C = {};


describe('text.entity.ParagraphElement', function () {


    before(function (done) {
        testRunner.requireClasses({
            Span: 'text/entity/SpanElement',
            Paragraph: 'text/entity/ParagraphElement'
        }, C, done);

    });

    describe('#findChildIndexAtPosition', function(){

        it('should return 0 for textPosition 0', function(){
            var paragraph = new C.Paragraph(),
                mySpan = new C.Span();

            paragraph.addChild(mySpan);

            expect(paragraph.findChildIndexAtPosition(0)).to.be.equal(0);
        });

        it('should return last index for textPosition outside of elements', function () {
            var paragraph = new C.Paragraph(),
                mySpan = new C.Span();

            paragraph.addChild(mySpan);

            expect(paragraph.findChildIndexAtPosition(1)).to.be.equal(0);
        });

        it('should return the element with the lower index', function(){
            var paragraph = new C.Paragraph(),
                mySpan = new C.Span({text: "abc"}),
                mySpan2 = new C.Span({text: "def"});

            paragraph.addChild(mySpan);
            paragraph.addChild(mySpan2);

            var index = paragraph.findChildIndexAtPosition(3);

            expect(index).to.be.equal(0);
        });
    });

});