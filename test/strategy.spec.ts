/* global describe, it, expect, before */
/* jshint expr: true */

import chai, { expect } from 'chai';
import SnapchatStrategy from '../src/strategy';
import config from '../src/config';


describe('Strategy', function() {

  describe('constructed', function() {
    var strategy = new SnapchatStrategy({
        callbackURL: '',
        clientID: 'ABC123',
        clientSecret: 'secret',
        scope: ['user.display_name', 'user.bitmoji.avatar'],
      },
      function() {});

    it('should be named snapchat', function() {
      expect(strategy.name).to.equal('snapchat');
    });

    it('should have fully qualified scopes', function() {
      expect(strategy._scope[0]).to.equal(config.OAUTH_SCOPE_URL_PREFIX + 'user.display_name');
      expect(strategy._scope[1]).to.equal(config.OAUTH_SCOPE_URL_PREFIX + 'user.bitmoji.avatar');
    });
  })

  describe('constructed with undefined options', function() {
    it('should throw', function() {
      expect(function() {
        new SnapchatStrategy(undefined as any, function(){});
      }).to.throw(Error);
    });
  });

  describe('authorization request with documented parameters', function() {
    var strategy = new SnapchatStrategy({
      callbackURL: '',
      clientID: 'ABC123',
      clientSecret: 'secret',
      scope: ['user.display_name', 'user.bitmoji.avatar'],
    }, function() {});


    let url: string;

    before(function(done) {
      (chai as any).passport.use(strategy)
        .redirect(function(u: string) {
          url = u;
          done();
        })
        .req(function(req: any) {
          req.session = {};
        })
        .authenticate({ });
    });

    it('should be redirected', function() {
      expect(url).to.equal(
        `${config.SNAP_ACCOUNTS_AUTH_URL}?response_type=code` +
        '&scope=' + encodeURIComponent(config.OAUTH_SCOPE_URL_PREFIX + 'user.display_name ') +
        encodeURIComponent(config.OAUTH_SCOPE_URL_PREFIX + 'user.bitmoji.avatar') +
        `&client_id=ABC123`
      );
    });
  }); // authorization request with documented parameters
});
