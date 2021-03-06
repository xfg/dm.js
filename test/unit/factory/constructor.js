var _                  = require('lodash'),
    sinon              = require('sinon'),
    chai               = require('chai'),
    ConstructorFactory = require("../../../lib/factory/constructor"),
    assert, expect;

assert = chai.assert;
expect = chai.expect;


describe("ConstructorFactory", function() {
    var factory, Ctor;

    beforeEach(function() {
        Ctor = function() {
            //
        };

        Ctor.prototype = {
            constructor: Ctor
        };

        factory = new ConstructorFactory();
    });

    describe("#factory", function() {

        it("should create instanceof", function() {
            expect(factory.factory({ operand: Ctor })).to.be.instanceof(Ctor);
        });

        it("should call Object.create if exists", function() {
            var createSpy;

            createSpy = sinon.spy(Object, "create");

            factory.factory({
                operand: Ctor
            });

            createSpy.restore();

            expect(createSpy.callCount).equal(1);
            expect(createSpy.firstCall.calledOn(Object)).to.be.true();
            expect(createSpy.firstCall.calledWithExactly(Ctor.prototype)).to.be.true();
        });

        it("should pass arguments", function() {
            var createStub, Ctor, that, args;

            createStub = sinon.stub(Object, "create", function(proto) {
                function S(){}
                S.prototype = proto;
                return that = new S();
            });

            Ctor = sinon.spy();
            args = [1,2,3];

            factory.factory({
                operand: Ctor,
                arguments: args
            });

            createStub.restore();

            expect(Ctor.callCount).equal(1);
            expect(Ctor.getCall(0).calledOn(that)).to.be.true();
            expect(Ctor.firstCall.calledWithExactly.apply(Ctor.firstCall, args)).to.be.true();
        });

        it("should throw error when method does not exists", function() {
            var that, methodSpy, createStub, fac;

            fac = function() {
                factory.factory({
                    operand: Ctor,
                    calls: [ ["method"] ]
                });
            };

            expect(fac).to.throw(Error, "Trying to call method that does not exists: 'method'");
        });

        it("should make calls", function() {
            var that, methodSpy, createStub, args;

            createStub = sinon.stub(Object, "create", function(proto) {
                function S(){}
                S.prototype = proto;
                return that = new S();
            });

            methodSpy = Ctor.prototype.method = sinon.spy();
            args = [1,2,3];

            factory.factory({
                operand: Ctor,
                calls: [ ["method", args] ]
            });

            createStub.restore();

            expect(methodSpy.callCount).equal(1);
            expect(methodSpy.getCall(0).calledOn(that)).to.be.true();
            expect(methodSpy.firstCall.calledWithExactly.apply(methodSpy.firstCall, args)).to.be.true();
        });

        it("should set properties", function() {
            var service, props;

            props = {
                a: 1,
                b: 2,
                c: 3
            };

            service = factory.factory({
                operand: Ctor,
                properties: props
            });

            expect(service).to.have.property("a", 1);
            expect(service).to.have.property("b", 2);
            expect(service).to.have.property("c", 3);
        });

    })

});