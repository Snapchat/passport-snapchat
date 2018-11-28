import { Profile } from 'passport';

export interface BitmojiData {
  /**
   * The user's unique bitmoji avatar id.
   */
  avatarId?: string;
  /**
   * The URL for rendering the user's bitmoji avatar.
   */
  avatarUrl?: string;
}

export interface SnapchatProfile extends Profile {
  bitmoji: BitmojiData;
  provider: 'snapchat';
}

/**
 * Parses and normalizes a json string or JS object into
 * a `SnapchatProfile`.
 */
export function parse(jsonOrString: string | object): SnapchatProfile {
  let jsonProfile: any = jsonOrString;
  if (typeof jsonOrString === 'string') {
    jsonProfile = JSON.parse(jsonOrString);
  }

  const { bitmoji = {}, displayName, externalId } = jsonProfile;

  return {
    provider: 'snapchat',

    displayName,
    id: externalId,

    bitmoji: {
      avatarId: bitmoji.id,
      avatarUrl: bitmoji.avatar,
    },
  };
}
