import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { BelegeQueryDto } from './belege-query.dto';

async function validateQuery(input: Record<string, unknown>) {
  return validate(plainToInstance(BelegeQueryDto, input));
}

describe('BelegeQueryDto', () => {
  it('accepts a valid year filter', async () => {
    await expect(validateQuery({ jahr: '2026' })).resolves.toHaveLength(0);
  });

  it('rejects non-numeric year filters', async () => {
    await expect(validateQuery({ jahr: 'abc' })).resolves.not.toHaveLength(0);
  });

  it('rejects negative year filters', async () => {
    await expect(validateQuery({ jahr: '-1' })).resolves.not.toHaveLength(0);
  });

  it('rejects huge year filters', async () => {
    await expect(validateQuery({ jahr: '10000' })).resolves.not.toHaveLength(0);
  });
});
