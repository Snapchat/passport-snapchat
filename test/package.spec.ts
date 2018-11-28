import { expect } from 'chai';
import SnapchatStrategy, { Strategy } from '../src/index';

describe('passport-snapchat', function() {

  it('should export Strategy constructor', function() {
    expect(SnapchatStrategy.Strategy).to.be.a('function');
  });

  it('should export Strategy constructor as module', function() {
    expect(SnapchatStrategy).to.be.a('function');
    expect(SnapchatStrategy).to.equal(Strategy);
  });

});
