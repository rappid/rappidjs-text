var expect = require('chai').expect,
    _ = require('underscore'),
    testRunner = require('rAppid.js').TestRunner.setup();

var C = {};


describe('text.type.Style', function () {


    before(function (done) {
        testRunner.requireClasses({
            Style: 'text/type/Style'
        }, C, done);

    });

    describe('#merge()', function () {

        it('should merge two styles to the common attributes', function () {

            var styleObject = {'fontWeight': 'bold', 'fontStyle': 'normal'},
                styleObject2 = {'fontWeight': 'bold', 'fontStyle': 'italic'},
                commonStyle = {'fontWeight': 'bold'},
                style1 = new C.Style(styleObject),
                style2 = new C.Style(styleObject2);


            style1.merge(style2);

            expect(style1.compose()).to.be.eql(commonStyle);

        })

    });

});