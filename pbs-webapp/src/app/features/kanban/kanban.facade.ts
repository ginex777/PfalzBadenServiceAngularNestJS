import { Injectable, inject, signal, computed } from '@angular/core';
import { KanbanService } from './kanban.service';
import { ToastService } from '../../core/services/toast.service';
import { Task } from '../../core/models';
import {
  KanbanFilter,
  KanbanSpalte,
  TaskFormularDaten,
  LEERES_TASK_FORMULAR,
} from './kanban.models';

@Injectable({ providedIn: 'root' })
export class KanbanFacade {
  private readonly service = inject(KanbanService);
  private readonly toast = inject(ToastService);

  readonly laedt = signal(false);
  readonly tasks = signal<Task[]>([]);
  readonly filter = signal<KanbanFilter>({
    suchbegriff: '',
    kategorie: '',
    bearbeiter: '',
    prioritaet: '',
  });
  readonly formularSichtbar = signal(false);
  readonly bearbeiteterTask = signal<Task | null>(null);
  readonly loeschKandidat = signal<number | null>(null);
  readonly formularDaten = signal<TaskFormularDaten>({ ...LEERES_TASK_FORMULAR });
  readonly dragTaskId = signal<number | null>(null);

  readonly gefilterteTasksProSpalte = computed(() => {
    const f = this.filter();
    const q = f.suchbegriff.toLowerCase();
    const gefiltert = this.tasks().filter((t) => {
      if (
        q &&
        ![t.titel, t.beschreibung, t.bearbeiter, t.kategorie].join(' ').toLowerCase().includes(q)
      )
        return false;
      if (f.kategorie && t.kategorie !== f.kategorie) return false;
      if (f.bearbeiter && t.bearbeiter !== f.bearbeiter) return false;
      if (f.prioritaet && t.prioritaet !== f.prioritaet) return false;
      return true;
    });
    return {
      todo: gefiltert.filter((t) => t.status === 'todo').sort((a, b) => a.position - b.position),
      inprogress: gefiltert
        .filter((t) => t.status === 'inprogress')
        .sort((a, b) => a.position - b.position),
      done: gefiltert.filter((t) => t.status === 'done').sort((a, b) => a.position - b.position),
      blocked: gefiltert
        .filter((t) => t.status === 'blocked')
        .sort((a, b) => a.position - b.position),
    };
  });

  readonly eindeutigeBearbeiter = computed(() =>
    [
      ...new Set(
        this.tasks()
          .map((t) => t.bearbeiter)
          .filter((b): b is string => !!b),
      ),
    ].sort(),
  );

  ladeDaten(): void {
    this.laedt.set(true);
    this.service.alleLaden().subscribe({
      next: (tasks) => {
        this.tasks.set(tasks);
        this.laedt.set(false);
      },
      error: () => {
        this.toast.error('Tasks konnten nicht geladen werden.');
        this.laedt.set(false);
      },
    });
  }

  formularOeffnen(task?: Task, standardStatus: KanbanSpalte = 'todo'): void {
    this.bearbeiteterTask.set(task ?? null);
    this.formularDaten.set(
      task
        ? {
            titel: task.titel,
            beschreibung: task.beschreibung ?? '',
            datum: task.datum ?? '',
            bearbeiter: task.bearbeiter ?? '',
            kategorie: task.kategorie,
            prioritaet: task.prioritaet,
            status: task.status,
          }
        : { ...LEERES_TASK_FORMULAR, status: standardStatus },
    );
    this.formularSichtbar.set(true);
  }

  formularSchliessen(): void {
    this.formularSichtbar.set(false);
    this.bearbeiteterTask.set(null);
  }

  speichern(): void {
    const daten = this.formularDaten();
    if (!daten.titel) {
      this.toast.error('Bitte Titel eingeben.');
      return;
    }
    const editId = this.bearbeiteterTask()?.id;
    const anfrage = editId
      ? this.service.aktualisieren(editId, { ...this.bearbeiteterTask()!, ...daten })
      : this.service.erstellen(daten);
    anfrage.subscribe({
      next: (gespeichert) => {
        if (editId)
          this.tasks.update((list) => list.map((t) => (t.id === editId ? gespeichert : t)));
        else this.tasks.update((list) => [...list, gespeichert]);
        this.formularSchliessen();
      },
      error: () => this.toast.error('Task konnte nicht gespeichert werden.'),
    });
  }

  schnellHinzufuegen(titel: string, status: KanbanSpalte): void {
    if (!titel.trim()) return;
    this.service
      .erstellen({ titel, status, prioritaet: 'mittel', kategorie: 'Sonstiges' })
      .subscribe({
        next: (t) => this.tasks.update((list) => [...list, t]),
        error: () => this.toast.error('Task konnte nicht erstellt werden.'),
      });
  }

  loeschenBestaetigen(id: number): void {
    this.loeschKandidat.set(id);
  }
  loeschenAbbrechen(): void {
    this.loeschKandidat.set(null);
  }

  loeschenAusfuehren(): void {
    const id = this.loeschKandidat();
    if (id === null) return;
    this.service.loeschen(id).subscribe({
      next: () => {
        this.tasks.update((list) => list.filter((t) => t.id !== id));
        this.loeschKandidat.set(null);
      },
      error: () => {
        this.toast.error('Task konnte nicht gelöscht werden.');
        this.loeschKandidat.set(null);
      },
    });
  }

  dragStart(id: number): void {
    this.dragTaskId.set(id);
  }
  dragEnd(): void {
    this.dragTaskId.set(null);
  }

  drop(neuerStatus: KanbanSpalte): void {
    const id = this.dragTaskId();
    if (!id) return;
    const task = this.tasks().find((t) => t.id === id);
    if (!task || task.status === neuerStatus) {
      this.dragTaskId.set(null);
      return;
    }
    const neuePosition = this.tasks().filter((t) => t.status === neuerStatus && t.id !== id).length;
    this.tasks.update((list) =>
      list.map((t) => (t.id === id ? { ...t, status: neuerStatus, position: neuePosition } : t)),
    );
    this.service
      .aktualisieren(id, { ...task, status: neuerStatus, position: neuePosition })
      .subscribe({
        error: () => this.toast.error('Status konnte nicht gespeichert werden.'),
      });
    this.dragTaskId.set(null);
  }

  filterAktualisieren(feld: keyof KanbanFilter, wert: string): void {
    this.filter.update((f) => ({ ...f, [feld]: wert }));
  }

  filterLeeren(): void {
    this.filter.set({ suchbegriff: '', kategorie: '', bearbeiter: '', prioritaet: '' });
  }

  formularFeldAktualisieren<K extends keyof TaskFormularDaten>(
    feld: K,
    wert: TaskFormularDaten[K],
  ): void {
    this.formularDaten.update((d) => ({ ...d, [feld]: wert }));
  }
}
