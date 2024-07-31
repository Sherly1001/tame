declare function cloneInto<T>(
  variable: T,
  window: Window,
  options?: { cloneFunctions: boolean },
): T;

declare function exportFunction(
  func: T,
  window: Window,
  options?: {
    defineAs: string;
  },
);
