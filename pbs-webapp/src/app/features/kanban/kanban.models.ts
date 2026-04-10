import { Task } from '../../core/models';

export type KanbanSpalte = 'todo' | 'inprogress' | 'done' | 'blocked';

export interface KanbanFilter {
  suchbegriff: string;
  kategorie: string;
  bearbeiter: string;
  prioritaet: string;
}

export interface TaskFormularDaten {
  titel: string;
  beschreibung: string;
  datum: string;
  bearbeiter: string;
  kategorie: string;
  prioritaet: Task['prioritaet'];
  status: Task['status'];
}

export const LEERES_TASK_FORMULAR: TaskFormularDaten = {
  titel: '', beschreibung: '', datum: '', bearbeiter: '',
  kategorie: 'Sonstiges', prioritaet: 'mittel', status: 'todo',
};

export const SPALTEN_KONFIGURATION: { id: KanbanSpalte; label: string; klasse: string }[] = [
  { id: 'todo', label: 'To Do', klasse: 'col-todo' },
  { id: 'inprogress', label: 'In Bearbeitung', klasse: 'col-inprogress' },
  { id: 'done', label: 'Done', klasse: 'col-done' },
  { id: 'blocked', label: 'Blocked', klasse: 'col-blocked' },
];

export const PRIORITAET_FARBEN: Record<Task['prioritaet'], string> = {
  hoch: '#ef4444', mittel: '#f59e0b', niedrig: '#10b981',
};

export const KATEGORIE_FARBEN: Record<string, { background: string; color: string }> = {
  'Operativ': { background: '#eef2ff', color: '#6366f1' },
  'Marketing': { background: '#fef3c7', color: '#f59e0b' },
  'Buchhaltung': { background: '#d1fae5', color: '#10b981' },
  'Sonstiges': { background: '#f1f5f9', color: '#64748b' },
};
