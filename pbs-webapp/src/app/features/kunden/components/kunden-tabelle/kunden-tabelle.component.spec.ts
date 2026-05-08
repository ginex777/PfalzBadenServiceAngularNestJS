import { signal } from '@angular/core';
import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import type { Kunde } from '../../../../core/models';
import { AuthService } from '../../../../core/services/auth.service';
import type { AuthUser } from '../../../../core/services/auth.service';
import { KundenTabelleComponent } from './kunden-tabelle.component';

const customer: Kunde = {
  id: 1,
  name: 'Muster GmbH',
  email: 'info@muster.test',
  ort: 'Speyer',
  strasse: 'Hauptstr. 1',
  tel: '06232 123',
};

function findButton(
  fixture: ComponentFixture<KundenTabelleComponent>,
  text: string,
): HTMLButtonElement {
  const nativeElement: HTMLElement = fixture.nativeElement;
  const buttons = Array.from(nativeElement.querySelectorAll('button')).filter(
    (element): element is HTMLButtonElement => element instanceof HTMLButtonElement,
  );
  const button = buttons.find((element) => element.textContent?.trim() === text);

  if (!button) {
    throw new Error(`Button not found: ${text}`);
  }

  return button;
}

describe('KundenTabelleComponent', () => {
  let fixture: ComponentFixture<KundenTabelleComponent>;
  let component: KundenTabelleComponent;

  beforeEach(async () => {
    const currentUser = signal<AuthUser | null>({
      email: 'admin@example.test',
      rolle: 'admin',
    });

    await TestBed.configureTestingModule({
      imports: [KundenTabelleComponent],
      providers: [provideRouter([]), { provide: AuthService, useValue: { currentUser } }],
    }).compileComponents();

    fixture = TestBed.createComponent(KundenTabelleComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('customers', [customer]);
    fixture.componentRef.setInput('revenues', []);
    fixture.detectChanges();
  });

  it('emits explicit row action request events', () => {
    const createInvoiceSpy = vi.fn();
    const createQuoteSpy = vi.fn();
    const openItemsSpy = vi.fn();
    const editSpy = vi.fn();
    const deleteSpy = vi.fn();
    component.createInvoiceRequested.subscribe(createInvoiceSpy);
    component.createQuoteRequested.subscribe(createQuoteSpy);
    component.openItemsRequested.subscribe(openItemsSpy);
    component.editRequested.subscribe(editSpy);
    component.deleteRequested.subscribe(deleteSpy);

    findButton(fixture, 'Rechnung').click();
    findButton(fixture, 'Angebot').click();
    findButton(fixture, 'Offene Posten').click();
    findButton(fixture, 'Bearbeiten').click();
    findButton(fixture, 'Löschen').click();

    expect(createInvoiceSpy).toHaveBeenCalledWith(customer);
    expect(createQuoteSpy).toHaveBeenCalledWith(customer);
    expect(openItemsSpy).toHaveBeenCalledWith(customer.id);
    expect(editSpy).toHaveBeenCalledWith(customer);
    expect(deleteSpy).toHaveBeenCalledWith(customer.id);
  });

  it('prevents delete actions when linked documents exist', () => {
    const deleteSpy = vi.fn();
    component.deleteRequested.subscribe(deleteSpy);
    fixture.componentRef.setInput('revenues', [
      { kundeId: customer.id, umsatzBezahlt: 0, rechnungenAnzahl: 1, angeboteAnzahl: 0 },
    ]);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Nicht löschbar');
    expect(deleteSpy).not.toHaveBeenCalled();
  });
});
