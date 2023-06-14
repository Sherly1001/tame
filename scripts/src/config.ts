export type BLockMode = "blacklist" | "whitelist";

export class Config {
  fakeMessageNotification: boolean = false;
  blockMode: BLockMode = "blacklist";
  blacklist: string[] = [];
  whitelist: string[] = [];
  blockSeen: boolean = true;
  blockTyping: boolean = true;

  static keys() {
    const cfg = new Config();
    return Object.getOwnPropertyNames(cfg);
  }
}

export interface Message {
  cfg?: Config;
  toggleFakeMessage?: boolean;
  toggleBlockMode?: BLockMode;
  toggleBlockSeen?: boolean;
  toggleBlockTyping?: boolean;
  addToBlacklist?: string;
  addToWhitelist?: string;
  removeFromBlacklist?: string;
  removeFromWhitelist?: string;
}
