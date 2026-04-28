// ============================================================
// PBS — API Service barrel export
// Prefer feature/domain clients from `./clients` in application code.
// `ApiService` remains as a temporary legacy export (migration safety).
// ============================================================
export * from './api.contract';
export * from './clients';
export { ApiService } from './api.service';
