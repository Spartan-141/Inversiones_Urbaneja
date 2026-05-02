/**
 * Result pattern for consistent error handling.
 */
class ResultFactory {
  static ok(value) {
    return {
      isSuccess: true,
      getValue: () => value,
      getError: () => undefined,
    };
  }

  static fail(error) {
    const err = typeof error === 'string' ? new Error(error) : error;
    return {
      isSuccess: false,
      getValue: () => undefined,
      getError: () => err,
    };
  }
}

module.exports = { ResultFactory };
