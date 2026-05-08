import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { ToastService } from '../../../core/services/toast.service';
import { ToastComponent } from './toast.component';

describe('ToastComponent', () => {
  let fixture: ComponentFixture<ToastComponent>;
  let toast: ToastService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ToastComponent],
      providers: [ToastService],
    }).compileComponents();

    fixture = TestBed.createComponent(ToastComponent);
    toast = TestBed.inject(ToastService);
  });

  it('renders queued toasts and lets the user dismiss them', () => {
    toast.success('Gespeichert');
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Gespeichert');

    const close = fixture.nativeElement.querySelector('.toast__close') as HTMLButtonElement;
    close.click();
    fixture.detectChanges();

    expect(toast.toasts()).toEqual([]);
  });

  it('expires toasts automatically', () => {
    vi.useFakeTimers();
    toast.info('Kurzinfo');
    expect(toast.toasts()).toHaveLength(1);

    vi.advanceTimersByTime(3500);

    expect(toast.toasts()).toEqual([]);
    vi.useRealTimers();
  });
});
