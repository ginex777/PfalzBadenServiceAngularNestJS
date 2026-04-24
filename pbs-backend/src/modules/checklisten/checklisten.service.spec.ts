import { validateAndNormalizeAnswers } from './checklisten.service';

describe('ChecklistenService helpers', () => {
  describe('validateAndNormalizeAnswers()', () => {
    it('normalizes answers and enforces required', () => {
      const result = validateAndNormalizeAnswers({
        fields: [
          {
            fieldId: 'cleared',
            label: 'Geräumt',
            type: 'boolean',
            required: true,
          },
          { fieldId: 'note', label: 'Notiz', type: 'text', required: false },
        ],
        answers: [{ fieldId: 'cleared', value: true }],
      });

      expect(result.normalized).toEqual([
        { fieldId: 'cleared', value: true },
        { fieldId: 'note', value: null },
      ]);
    });

    it('rejects unknown fields', () => {
      expect(() =>
        validateAndNormalizeAnswers({
          fields: [{ fieldId: 'a', label: 'A', type: 'text', required: false }],
          answers: [{ fieldId: 'b', value: 'x' }],
        }),
      ).toThrow();
    });
  });
});

