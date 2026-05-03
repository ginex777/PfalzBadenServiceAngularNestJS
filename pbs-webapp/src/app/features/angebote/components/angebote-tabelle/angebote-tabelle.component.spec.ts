import type { ComponentFixture} from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { AngeboteTabelleComponent } from './angebote-tabelle.component';

describe('AngeboteTabelleComponent', () => {
  let component: AngeboteTabelleComponent;
  let fixture: ComponentFixture<AngeboteTabelleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AngeboteTabelleComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AngeboteTabelleComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('angebote', []);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
