export default class SnapchatProfileParseError extends Error {
  constructor(public message: string, public parseError: string) {
    super();
    SnapchatProfileParseError.captureStackTrace(this);
    this.name = 'SnapchatProfileParseError';
  }
}
