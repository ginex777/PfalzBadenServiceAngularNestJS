import { ComponentFixture, TestBed } from '@angular/core/testing';
import { KanbanSpalteComponent } from './kanban-spalte.component';

describe('KanbanSpalteComponent', () => {
  let component: KanbanSpalteComponent;
  let fixture: ComponentFixture<KanbanSpalteComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [KanbanSpalteComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(KanbanSpalteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
