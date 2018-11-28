import { expect } from 'chai';
import { InternalOAuthError } from 'passport-oauth2';
import { SnapchatProfile } from '../src/profile';
import config from '../src/config';
import fs from 'fs';
import SnapchatAPIError from '../src/errors/SnapchatAPIError';
import SnapchatStrategy from '../src/strategy';
import SnapchatProfileParseError from '../src/errors/SnapchatProfileParseError';

type AnyFunction = (...args: any[]) => any;

describe('Strategy#userProfile', function() {

  describe('fetched from Snapchat API with profile fields mapped from Portable Contacts schema and Snapchat properties', function() {
    let strategy = new SnapchatStrategy({
        callbackURL: '',
        clientID: 'ABC123',
        clientSecret: 'secret',
        profileFields: ['id', 'displayName', 'bitmoji'],
      }, function() {} as any);

    (strategy as any)._oauth2.get = function(url: string, accessToken: string, callback: AnyFunction) {
      if (url !== `${config.SNAP_KIT_API_URL}/me?query=${encodeURIComponent(`{me{externalId displayName bitmoji{avatar id}}}`)}`) { return callback(new Error('incorrect url argument')); }
      if (accessToken !== 'token') { return callback(new Error('incorrect token argument')); }
      fs.readFile('test/fixtures/me.json', 'utf8', function(err, data) {
        if (err) { return callback(err); }
        callback(null, data, undefined);
      });
    };

    let profile: SnapchatProfile;

    before(function(done) {
      strategy.userProfile('token', function(err, p) {
        if (err) { return done(err); }
        profile = p!;
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

    it('should set raw property', function() {
      expect((profile as any)._raw).to.be.a('string');
    });

    it('should set json property', function() {
      expect((profile as any)._json).to.be.an('object');
    });
  });

  describe('fetched from Snapchat API with profile fields mapped from Portable Contacts and custom properties', function() {
    let strategy = new SnapchatStrategy({
        callbackURL: '',
        clientID: 'ABC123',
        clientSecret: 'secret',
        profileFields: ['id', 'displayName', 'bitmoji{avatar}'],
      }, function() {} as any);

    (strategy as any)._oauth2.get = function(url: string, accessToken: string, callback: AnyFunction) {
      if (url !== `${config.SNAP_KIT_API_URL}/me?query=${encodeURIComponent(`{me{externalId displayName bitmoji{avatar}}}`)}`) { return callback(new Error('incorrect url argument')); }
      if (accessToken !== 'token') { return callback(new Error('incorrect token argument')); }
      fs.readFile('test/fixtures/meWithOnlyBitmojiAvatarUrl.json', 'utf8', function(err, data) {
        if (err) { return callback(err); }
        callback(null, data, undefined);
      });
    };

    let profile: SnapchatProfile;

    before(function(done) {
      strategy.userProfile('token', function(err, p) {
        if (err) { return done(err); }
        profile = p!;
        done();
      });
    });

    it('should parse profile', function() {
      expect(profile.provider).to.equal('snapchat');
      expect(profile.id).to.equal('my-external-id');
      expect(profile.displayName).to.equal('Ghostface Chillah');
      expect(profile.bitmoji.avatarId).to.be.undefined;
      expect(profile.bitmoji.avatarUrl).to.equal('https://render.bitstrips.com/v2/cpanel/sticker-circle-bitmoji-id.png?transparent=1&palette=1');

      expect(profile.name).to.be.undefined;
      expect(profile.username).to.be.undefined;
      expect(profile.emails).to.be.undefined;
      expect(profile.photos).to.be.undefined;
    });

    it('should set raw property', function() {
      expect((profile as any)._raw).to.be.a('string');
    });

    it('should set json property', function() {
      expect((profile as any)._json).to.be.an('object');
    });
  });

  describe('error caused by invalid token when using Snapchat API', function() {
    let strategy = new SnapchatStrategy({
      callbackURL: '',
      clientID: 'ABC123',
      clientSecret: 'secret'
    }, function() {} as any);

    (strategy as any)._oauth2.get = function(url: string, _accessToken: string, callback: AnyFunction) {
      if (url !== `${config.SNAP_KIT_API_URL}/me?query=${encodeURIComponent('{me{}}')}`) { return callback(new Error('incorrect url argument')); }

      var body = 'Message';
      callback({ statusCode: 401, data: body });
    };

    let err: SnapchatAPIError;

    before(function(done) {
      strategy.userProfile('invalid-token', function(e: SnapchatAPIError) {
        err = e;
        done();
      });
    });

    it('should error', function() {
      expect(err).to.be.an.instanceOf(Error);
      expect(err.name).to.equal('SnapchatAPIError');
      expect(err.message).to.equal("Message");
    });
  }); // error caused by invalid token when using Snapchat API

  describe('error caused by malformed response', function() {
    let strategy = new SnapchatStrategy({
      callbackURL: '',
      clientID: 'ABC123',
      clientSecret: 'secret'
    }, function() {} as any);

    (strategy as any)._oauth2.get = function(_url: string, _accessToken: string, callback: AnyFunction) {
      var body = 'Hello, world.';
      callback(null, body, undefined);
    };

    let err: SnapchatProfileParseError;

    before(function(done) {
      strategy.userProfile('token', function(e: SnapchatProfileParseError) {
        err = e!;
        done();
      });
    });

    it('should error', function() {
      expect(err).to.be.an.instanceOf(Error);
      expect(err.message).to.contain('Failed to parse user profile');
    });
  }); // error caused by malformed response

  describe('internal error', function() {
    let strategy = new SnapchatStrategy({
      callbackURL: '',
      clientID: 'ABC123',
      clientSecret: 'secret'
    }, function verify() {} as any);

    (strategy as any)._oauth2.get = function(_url: string, _accessToken: string, callback: AnyFunction) {
      return callback(new Error('something went wrong'));
    }

    let err: InternalOAuthError;
    let profile: undefined;

    before(function(done) {
      strategy.userProfile('token', function(e: InternalOAuthError, p: undefined) {
        err = e;
        profile = p;
        done();
      });
    });

    it('should error', function() {
      expect(err).to.be.an.instanceOf(Error);
      expect(err.constructor.name).to.equal('InternalOAuthError');
      expect(err.message).to.equal('Failed to fetch user profile');
      expect(err.oauthError).to.be.an.instanceOf(Error);
      expect(err.oauthError.message).to.equal('something went wrong');
    });

    it('should not load profile', function() {
      expect(profile).to.be.undefined;
    });
  }); // internal error

});
