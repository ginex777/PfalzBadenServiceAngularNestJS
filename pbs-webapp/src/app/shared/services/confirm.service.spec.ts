import { ConfirmService } from './confirm.service';

describe('ConfirmService', () => {
  it('opens confirmation state with defaults and resolves when confirmed', async () => {
    const service = new ConfirmService();
    const result = service.confirm({ message: 'Delete invoice?' });

    expect(service.state()).toMatchObject({
      message: 'Delete invoice?',
      isDangerous: true,
    });

    service.confirmed();

    await expect(result).resolves.toBe(true);
    expect(service.state()).toBeNull();
  });

  it('keeps custom labels and resolves false when canceled', async () => {
    const service = new ConfirmService();
    const result = service.confirm({
      title: 'Archive',
      message: 'Archive item?',
      confirmLabel: 'Archive',
      cancelLabel: 'Keep',
      isDangerous: false,
    });

    expect(service.state()).toMatchObject({
      title: 'Archive',
      confirmLabel: 'Archive',
      cancelLabel: 'Keep',
      isDangerous: false,
    });

    service.canceled();

    await expect(result).resolves.toBe(false);
    expect(service.state()).toBeNull();
  });
});
