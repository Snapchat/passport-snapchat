# passport-snapchat

[Passport](http://passportjs.org/) strategy for authenticating with [Snapchat](http://www.snapchat.com/)
using the OAuth 2.0 API.

This module lets you authenticate using Snapchat in your Node.js applications.
By plugging into Passport, Snapchat authorization can easily and unobtrusively be integrated
into any application or framework that supports
[Connect](http://www.senchalabs.org/connect/)-style middleware, including
[Express](http://expressjs.com/).

## Install

    $ npm install passport-snapchat

## [API Reference](https://snapchat.github.io/passport-snapchat/)

## Usage

#### Create an Application

Before using `passport-snapchat`, you must register an application with
Snapchat.  If you have not already done so, a new application can be created within the
[Snap Kit Developer Portal](https://kit.snapchat.com/portal).  Your application will
be issued an app ID and app secret, which need to be provided to the strategy.
You will also need to configure a redirect URI which matches the route in your
application.

#### Configure Strategy

The Snapchat authorization strategy authenticates users using a Snapchat
account and OAuth 2.0 tokens.  The app ID and secret obtained when creating an
application are supplied as options when creating the strategy.  The strategy
also requires a `verify` callback, which receives the access token and optional
refresh token, as well as `profile` which contains the authenticated user's
Snapchat profile.  The `verify` callback must call `cb` providing a user to
complete authorization.

```js
passport.use(new SnapchatStrategy({
    clientID: snapchat_APP_ID,
    clientSecret: snapchat_APP_SECRET,
    callbackURL: "http://localhost:3000/auth/snapchat/callback"
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({ snapchatId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));
```

#### Authenticate Requests

Use `passport.authenticate()`, specifying the `'snapchat'` strategy, to
authenticate requests.

For example, as route middleware in an [Express](http://expressjs.com/)
application:

```js
app.get('/auth/snapchat',
  passport.authenticate('snapchat'));

app.get('/auth/snapchat/callback',
  passport.authenticate('snapchat', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authorization, redirect home.
    res.redirect('/');
  });
```

## Examples

Developers using the popular [Express](http://expressjs.com/) web framework can
refer to an [example](https://github.com/Snapchat/express-4.x-passport-snapchat-example)
as a starting point for their own web applications.

## FAQ

##### How do I ask a user for additional permissions?

If you need additional permissions from the user, the permissions can be
requested via the `scope` option to `passport.authenticate()`.

```js
app.get('/auth/snapchat',
  passport.authenticate('snapchat', { scope: ['user.display_name', 'user.bitmoji.avatar'] }));
```

Refer to [permissions with Snapchat Login](https://docs.snapchat.com/docs/login-kit/)
for further details.

##### How do I obtain a user profile with specific fields?

The Snapchat profile contains information about a user.  By default,
NO fields in a profile are returned.  The fields needed by an application
can be indicated by setting the `profileFields` option.

```js
new SnapchatStrategy({
  clientID: snapchat_APP_ID,
  clientSecret: snapchat_APP_SECRET,
  callbackURL: "http://localhost:3000/auth/snapchat/callback",
  profileFields: ['id', 'displayName', 'bitmoji']
}), ...)
```

Refer to the [Login Kit](https://docs.snapchat.com/docs/login-kit)
section of the docs for the complete set of available fields.

## Contributing

#### Tests

The test suite is located in the `test/` directory.  All new features are
expected to have corresponding test cases.  Ensure that the complete test suite
passes by executing:

```bash
$ npm test
```

## License

[The MIT License](http://opensource.org/licenses/MIT)

Copyright (c) 2018 Snap Inc.
