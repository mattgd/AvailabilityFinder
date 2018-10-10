const { AvailabilitySlot, getAvailabilitySlots } = require('../AvailabilitySlot'),
      expect = require('chai').expect,   
      fs = require('fs');

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

describe('getDuration()', function () {
  it('should return slot duration', function () {
    // 1. ARRANGE
    const expected = 5;

    const start = new Date('09-24-2018 11:30 am');
    const end = new Date('09-24-2018 11:35 am');
    var slot = new AvailabilitySlot(start, end);

    // 2. ACT
    var actual = slot.getDuration();

    // 3. ASSERT
    expect(actual).to.be.equal(expected);
  });
});

describe('getAvailabilitySlots()', function () {
  it('should return an Array of AvailabilitySlot objects', function () {
    // 1. ARRANGE
    const events = JSON.parse(fs.readFileSync('test/test_events.json', 'utf8'));

    const expected = [
      new AvailabilitySlot(new Date('2018-10-10T00:00:00.000Z'), new Date('2018-10-10T10:15:00.000Z')),
      new AvailabilitySlot(new Date('2018-10-10T11:30:00.000Z'), new Date('2018-10-10T15:00:00.000Z')),
      new AvailabilitySlot(new Date('2018-10-10T16:15:00.000Z'), new Date('2018-10-11T08:30:00.000Z')),
      new AvailabilitySlot(new Date('2018-10-11T09:45:00.000Z'), new Date('2018-10-12T00:00:00.000Z')),
    ];

    const startDate = new Date('2018-10-10');
    const endDate = new Date('2018-10-12');

    // 2. ACT
    var actual = getAvailabilitySlots(startDate, endDate, 0, 0, events);

    // 3. ASSERT
    expect(actual).to.deep.equal(expected);
  });

  it('should return an Array of AvailabilitySlot objects with durations greater than or equal to to 4 hours', function () {
    // 1. ARRANGE
    const events = JSON.parse(fs.readFileSync('test/test_events.json', 'utf8'));

    const expected = [
      new AvailabilitySlot(new Date('2018-10-10T00:00:00.000Z'), new Date('2018-10-10T10:15:00.000Z')),
      new AvailabilitySlot(new Date('2018-10-10T16:15:00.000Z'), new Date('2018-10-11T08:30:00.000Z')),
      new AvailabilitySlot(new Date('2018-10-11T09:45:00.000Z'), new Date('2018-10-12T00:00:00.000Z')),
    ];

    const startDate = new Date('2018-10-10');
    const endDate = new Date('2018-10-12');

    // 2. ACT
    var actual = getAvailabilitySlots(startDate, endDate, 0, 4 * 60, events);

    // 3. ASSERT
    expect(actual).to.deep.equal(expected);
  });

  it('should return an Array of AvailabilitySlot objects with 30 minute buffer time', function () {
    // 1. ARRANGE
    const events = JSON.parse(fs.readFileSync('test/test_events.json', 'utf8'));

    const expected = [
      new AvailabilitySlot(new Date('2018-10-10T00:00:00.000Z'), new Date('2018-10-10T09:45:00.000Z')),
      new AvailabilitySlot(new Date('2018-10-10T12:00:00.000Z'), new Date('2018-10-10T14:30:00.000Z')),
      new AvailabilitySlot(new Date('2018-10-10T16:45:00.000Z'), new Date('2018-10-11T08:00:00.000Z')),
      new AvailabilitySlot(new Date('2018-10-11T10:15:00.000Z'), new Date('2018-10-12T00:00:00.000Z')),
    ];

    const startDate = new Date('2018-10-10');
    const endDate = new Date('2018-10-12');

    // 2. ACT
    var actual = getAvailabilitySlots(startDate, endDate, 30, 0, events);

    // 3. ASSERT
    expect(actual).to.deep.equal(expected);
  });

});