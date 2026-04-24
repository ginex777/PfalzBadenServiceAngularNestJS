import { SetMetadata } from '@nestjs/common';

export const ALLOW_READONLY_WRITE_KEY = 'allowReadonlyWrite';

/**
 * Allows a `readonly` user to call a non-GET endpoint.
 *
 * Use sparingly for "read-like" POST endpoints such as PDF generation or exports.
 */
export const AllowReadonlyWrite = () =>
  SetMetadata(ALLOW_READONLY_WRITE_KEY, true);
