import fs from 'fs';
import { parse, SnapchatProfile } from '../src/profile';
import { expect } from 'chai';

describe('parse', function() {

  describe('profile with user.display_name scope only', function() {
    let profile: SnapchatProfile;

    before(function(done) {
      fs.readFile('test/fixtures/meOnlyDisplayNameScope.json', 'utf8', function(err, data) {
        if (err) { return done(err); }
        const { data: { me } } = JSON.parse(data);
        profile = parse(me);
        done();
      });
    });

    it('should parse profile', function() {
      expect(profile.provider).to.equal('snapchat');
      expect(profile.id).to.equal('my-external-id');
      expect(profile.displayName).to.equal('Ghostface Chillah');
      expect(profile.bitmoji.avatarId).to.be.undefined;
      expect(profile.bitmoji.avatarUrl).to.be.undefined;

      expect(profile.name).to.be.undefined;
      expect(profile.username).to.be.undefined;
      expect(profile.emails).to.be.undefined;
      expect(profile.photos).to.be.undefined;
    });
  });

  describe('profile with user.display_name and user.bitmoji.avatar scope', function() {
    let profile: SnapchatProfile;

    before(function(done) {
      fs.readFile('test/fixtures/me.json', 'utf8', function(err, data) {
        if (err) { return done(err); }
        const { data: { me } } = JSON.parse(data);
        profile = parse(me);
        done();
      });
    });

    it('should parse profile', function() {
      expect(profile.provider).to.equal('snapchat');
      expect(profile.id).to.equal('my-external-id');
      expect(profile.displayName).to.equal('Ghostface Chillah');
      expect(profile.bitmoji.avatarId).to.equal('my-bitmoji-id');
      expect(profile.bitmoji.avatarUrl).to.equal('https://render.bitstrips.com/v2/cpanel/sticker-circle-bitmoji-id.png?transparent=1&palette=1');

      expect(profile.name).to.be.undefined;
      expect(profile.username).to.be.undefined;
      expect(profile.emails).to.be.undefined;
      expect(profile.photos).to.be.undefined;
    });
  });

  describe('profile with no scope', function() {
    let profile: SnapchatProfile;

    before(function(done) {
      fs.readFile('test/fixtures/meNoScopes.json', 'utf8', function(err, data) {
        if (err) { return done(err); }
        const { data: { me } } = JSON.parse(data);
        profile = parse(me);
        done();
      });
    });

    it('should parse profile', function() {
      expect(profile.provider).to.equal('snapchat');
      expect(profile.id).to.be.undefined;
      expect(profile.displayName).to.be.undefined;
      expect(profile.bitmoji.avatarId).to.be.undefined;
      expect(profile.bitmoji.avatarUrl).to.be.undefined;

      expect(profile.name).to.be.undefined;
      expect(profile.username).to.be.undefined;
      expect(profile.emails).to.be.undefined;
      expect(profile.photos).to.be.undefined;
    });
  });
});
