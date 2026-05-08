import { ToastService } from './toast.service';

describe('ToastService', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('adds typed toasts and removes them manually', () => {
    const service = new ToastService();

    service.success('Saved');
    service.error('Failed');
    service.warning('Check input');
    service.info('Started');

    expect(service.toasts()).toEqual([
      expect.objectContaining({ nachricht: 'Saved', typ: 'success' }),
      expect.objectContaining({ nachricht: 'Failed', typ: 'error' }),
      expect.objectContaining({ nachricht: 'Check input', typ: 'warning' }),
      expect.objectContaining({ nachricht: 'Started', typ: 'info' }),
    ]);

    const removedId = service.toasts()[1].id;
    service.entfernen(removedId);

    expect(service.toasts()).toHaveLength(3);
    expect(service.toasts().some((toast) => toast.id === removedId)).toBe(false);
  });

  it('removes toasts after their configured duration', () => {
    const service = new ToastService();

    service.warning('Later');
    const toastId = service.toasts()[0].id;

    vi.advanceTimersByTime(4999);
    expect(service.toasts().some((toast) => toast.id === toastId)).toBe(true);

    vi.advanceTimersByTime(1);
    expect(service.toasts().some((toast) => toast.id === toastId)).toBe(false);
  });
});
