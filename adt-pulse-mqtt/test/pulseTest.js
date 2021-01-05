'use strict';

const chai  = require('chai');
const spies  = require('chai-spies');
const rewire = require('rewire');

// Set up testing framework chai uses spies
chai.use(spies);
let expect = chai.expect;

// Rewire adt-pulse module
let pulse = rewire('../adt-pulse.js');

describe('adt-pulse-mqtt Tests',() => {

  let testAlarm = new pulse("username","password");
  it("Should return an object instance", () => expect(testAlarm).be.an.instanceOf(pulse));
  it("Should have an authenticated property", () => expect(testAlarm).to.have.property("authenticated"));

  clearInterval(testAlarm.pulseInterval);

  });
