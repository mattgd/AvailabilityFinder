const expect = require('chai').expect;
const AvailabilitySlot = require('./AvailabilitySlot');

describe('toString()', function () {
  it('should return datetime range', function () {
    // 1. ARRANGE
    var expected = '';
    var slot = new AvailabilitySlot(start, end);

    // 2. ACT
    var actual = slot.toString();

    // 3. ASSERT
    expect(actual).to.be.equal(expected);
  });
});