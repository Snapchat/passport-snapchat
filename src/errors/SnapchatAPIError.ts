export default class SnapchatAPIError extends Error {
  constructor(public message: string, public code: string | number) {
    super();
    SnapchatAPIError.captureStackTrace(this);
    this.name = 'SnapchatAPIError';
  }
}
