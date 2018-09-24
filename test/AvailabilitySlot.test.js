const expect = require('chai').expect;
const AvailabilitySlot = require('../AvailabilitySlot');

describe('toString()', function () {
  it('should return datetime range', function () {
    // 1. ARRANGE
    const expected = 'Mon 09/24 11:30 am to Mon 09/24 1:15 pm';

    const start = new Date('09-24-2018 11:30 am');
    const end = new Date('09-24-2018 1:15 pm');
    var slot = new AvailabilitySlot(start, end);

    // 2. ACT
    var actual = slot.toString();

    // 3. ASSERT
    expect(actual).to.be.equal(expected);
  });
});
