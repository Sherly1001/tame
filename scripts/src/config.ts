export type BLockMode = "blacklist" | "whitelist";

export class Config {
  fakeMessageNotification: boolean = false;
  blockMode: BLockMode = "blacklist";
  blacklist: string[] = [];
  whitelist: string[] = [];
  blockSeen: boolean = true;
  blockTyping: boolean = true;
  blockSeenStory: boolean = true;

  static keys() {
    const cfg = new Config();
    return Object.getOwnPropertyNames(cfg);
  }
}

/**
 * format for message to sends between listeners
 * `cfg` property: background -> tabs
 * other properties: popup -> background
 */
export interface Message {
  cfg?: Config;
  toggleBlockMode?: BLockMode;
  toggleBlockSeen?: boolean;
  toggleBlockTyping?: boolean;
  toggleBlockSeenStory?: boolean;
  addToBlacklist?: string;
  addToWhitelist?: string;
  removeFromBlacklist?: string;
  removeFromWhitelist?: string;
}
