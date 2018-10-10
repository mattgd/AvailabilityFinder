const expect = require('chai').expect,
      { convertToDate, addTimeString } = require('../DateUtil'),
      moment = require('moment');

describe('convertToDate()', function () {
  it('should return valid JavaScript Date object', function () {
    // 1. ARRANGE
    const expected = new Date(2018, 9, 4);

    const dateStr = '10-04-2018';

    // 2. ACT
    var actual = convertToDate(dateStr);

    // 3. ASSERT
    expect(actual.valueOf()).to.be.equal(expected.valueOf());
  });

  it('should throw an error', function () {
    // 1. ARRANGE
    const dateStr = '10-Inv4lid';

    // 2 & 3. ACT & ASSERT
    expect(() => convertToDate(dateStr)).to.throw();
  });
});

describe('addTimeString()', function () {
  it('should return the current date plus one week', function () {
    // 1. ARRANGE
    const now = new Date();
    const expected = moment(now).add(1, 'w').toDate();

    const timeStr = '1w';

    // 2. ACT
    var actual = addTimeString(now, timeStr);

    // 3. ASSERT
    expect(actual.valueOf()).to.be.equal(expected.valueOf());
  });
});
