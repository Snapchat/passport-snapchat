import OAuth2Strategy, { InternalOAuthError } from 'passport-oauth2';
import { parse as parseProfile, SnapchatProfile } from './profile';
import uri from 'url';
import config from './config';
import SnapchatAPIError from './errors/SnapchatAPIError';
import SnapchatProfileParseError from './errors/SnapchatProfileParseError';

interface SnapchatStrategyOptions {
  /**
   * @optional
   *
   * URL used to obtain an authorization grant from Snapchat
   *
   * @default 'https://accounts.snapchat.com/accounts/oauth2/auth'
   */
  authorizationURL?: string;
  /**
   * @required
   * URL to which Snapchat will redirect the user after granting authorization
   */
  callbackURL: string;
  /**
   * @required
   * Your application's client ID. Your client ID can be found
   * within the Snap Kit Developer Portal (https://kit.snapchat.com/portal)
   */
  clientID: string;
  /**
   * @required
   * Your application's client secret. You can generate a confidential client and secret
   * within the Snap Kit Developer Portal (https://kit.snapchat.com/portal)
   */
  clientSecret: string;
  /**
   * @optional
   * Determines whether `req` is passed as the first argument to the verify callback
   * triggered when Snapchat redirects to the `callbackURL`.
   *
   * @default false
   */
  passReqToCallback?: boolean;
  /**
   * @optional
   *
   * An array of profile fields indicating which fields to query within a Snapchat user profile
   * when requesting information from the user profile endpoint (`profileURL`).
   * Valid fields are:
   *  - `'id'`
   *  - `'displayName'`
   *  - `'bitmoji'`
   *
   * @default []
   */
  profileFields?: string[];
  /**
   * @optional
   *
   * Endpoint URL for retrieving Snapchat user profile information.
   *
   * @default 'https://kit.snapchat.com/v1/me'
   */
  profileURL?: string;
  /**
   * @optional
   *
   * An array of Snapchat OAuth2 scopes. May also be a string of scopes separated by `scopeSeparator`.
   * Valid scopes include:
   *  - `'user.display_name'`
   *  - `'user.bitmoji.avatar'`
   *
   * @default []
   */
  scope?: string | string[];
  /**
   * @optional
   *
   * String delimiter for scopes in `scopes`.
   *
   * @default ' '
   */
  scopeSeparator?: string;
  /**
   * @optional
   *
   * URL used to obtain an access token from Snapchat
   *
   * @default 'https://accounts.snapchat.com/accounts/oauth2/token'
   */
  tokenURL?: string;
}

/**
 * `Strategy` constructor.
 *
 * The Snapchat authentication strategy authenticates requests by delegating to
 * Snapchat using the OAuth 2.0 protocol.
 *
 * Applications must supply a `verify` callback which accepts an `accessToken`,
 * `refreshToken` and service-specific `profile`, and then calls the `cb`
 * callback supplying a `user`, which should be set to `false` if the
 * credentials are not valid.  If an exception occured, `err` should be set.
 *
 * Options:
 *   - `clientID`      your Snapchat application's App ID
 *   - `clientSecret`  your Snapchat application's App Secret
 *   - `callbackURL`   URL to which Snapchat will redirect the user after granting authorization
 *   - `profileFields` array of fields to add to query. Valid fields are 'id', 'displayName', 'bitmoji'.
 *   - `scope`         array of scopes. Valid scopes are 'user.display_name' & 'user.bitmoji.avatar'.
 *
 * Examples:
 *
 * ```javascript
 *   passport.use(new SnapchatStrategy({
 *       clientID: '123-456-789', // process.env.clientID
 *       clientSecret: 'shhh-its-a-secret', // process.env.clientSecret
 *       callbackURL: 'https://www.example.net/auth/Snapchat/callback',
 *       profileFields: ['id', 'displayName', 'bitmoji'],
 *       scope: ['user.display_name', 'user.bitmoji.avatar'],
 *     },
 *     function(accessToken, refreshToken, profile, cb) {
 *       User.findOrCreate(..., function (err, user) {
 *         cb(err, user);
 *       });
 *     }
 *   ));
 * ```
 */
export default class Strategy extends OAuth2Strategy {
  /**
   * @hidden
   */
  public name: string = 'snapchat';

  // The following fields need to be marked as public to avoid TS build errors.
  /**
   * @hidden
   */
  public _clientSecret: string | undefined;
  /**
   * @hidden
   */
  public _scope: string[];

  private profileFields: string[];
  private profileURL: string;

  constructor(
    options: SnapchatStrategyOptions,
    verify: OAuth2Strategy.VerifyFunction,
  ) {
    super(normalizeOptions(options) as any, verify);

    const { clientSecret, profileURL, profileFields, scope } = normalizeOptions(
      options,
    );
    this._clientSecret = clientSecret;
    this._scope = scope as string[];
    this.profileURL = profileURL;
    this.profileFields = profileFields;
    // The types for _oauth2 are incorrect. As a result, need to cast it to any
    // in order to avoid type errors when setting this field.
    (this._oauth2 as any)._useAuthorizationHeaderForGET = true;
  }

  /**
   * Retrieve user profile from Snapchat.
   *
   * This function constructs a normalized profile, with the following properties:
   *
   *   - `provider`          always set to `snapchat`
   *   - `id`                the user's Snapchat ID
   *   - `displayName`       the user's display name
   *   - `bitmoji.avatarId`  the bitmojiAvatarId for the user on Snapchat
   *   - `bitmoji.avatarUrl` the url for rendering the bitmoji avatar for the user on Snapchat
   */
  public userProfile(
    accessToken: string,
    done: (err: Error | null, snapchatProfile?: SnapchatProfile) => void,
  ) {
    const parsedUri = uri.parse(this.profileURL);
    // Choose the query based on the scopes passed in
    const query = `query=${encodeURIComponent(
      `{me{${this.profileFields.join(' ')}}}`,
    )}`;
    // Add the query to the existing search params if the uri already includes some
    parsedUri.search = parsedUri.search
      ? `${parsedUri.search}&${query}`
      : query;
    // Format the uri to be a string
    const url = uri.format(parsedUri) as string;

    // The types for _oauth2 are incorrect. As a result, need to cast it to any
    // in order to avoid type errors when making the GET request.
    (this._oauth2 as any).get(url, accessToken, function(
      err: any,
      body: any,
      _res: any,
    ): void {
      let json;
      if (err) {
        if (err.data) {
          try {
            json = JSON.parse(err.data);
          } catch (_) {}
        }

        if (json && json.error && json.error_description) {
          return done(new SnapchatAPIError(json.error_description, json.error));
        } else if (err.data && err.statusCode) {
          return done(new SnapchatAPIError(err.data, err.statusCode));
        }
        return done(
          new InternalOAuthError('Failed to fetch user profile', err),
        );
      }

      try {
        json = JSON.parse(body);
      } catch (e) {
        return done(
          new SnapchatProfileParseError(
            `Failed to parse user profile with error: ${e.message}`,
            e,
          ),
        );
      }

      const { data: { me: profileJson = {} } = {} } = json;
      const profile: SnapchatProfile & any = parseProfile(profileJson);
      profile._raw = body;
      profile._json = json;

      done(null, profile);
    });
  }
}

/**
 * @hidden
 */
const fieldsToGraphField = {
  bitmoji: 'bitmoji{avatar id}',
  displayName: 'displayName',
  id: 'externalId',
};

/**
 * @hidden
 */
function getGraphFieldForNormalizedFieldName(field: string): string {
  return fieldsToGraphField[field] || field;
}

/**
 * @hidden
 */
function normalizeScope(scope: string): string {
  return scope.startsWith('https:')
    ? scope
    : config.OAUTH_SCOPE_URL_PREFIX + scope;
}

/**
 * @hidden
 */
function normalizeOptions(
  options: any = {},
): Required<SnapchatStrategyOptions> {
  const scopeSeparator = options.scopeSeparator || ' ';
  const scopesStringOrArray = options.scope || [];
  const scopes =
    typeof scopesStringOrArray === 'string'
      ? scopesStringOrArray.split(scopeSeparator)
      : scopesStringOrArray;
  const profileFields = options.profileFields || [];
  return {
    ...options,
    authorizationURL: options.authorizationURL || config.SNAP_ACCOUNTS_AUTH_URL,
    profileFields: profileFields
      .map(getGraphFieldForNormalizedFieldName)
      .filter(Boolean),
    profileURL: options.profileURL || `${config.SNAP_KIT_API_URL}/me`,
    scope: scopes.map(normalizeScope).filter(Boolean),
    scopeSeparator,
    tokenURL: options.tokenURL || config.SNAP_ACCOUNTS_TOKEN_URL,
  };
}
