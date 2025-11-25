import { cardinal } from './mineFn';

describe('Mine Functions', () => {
  describe('cardinal', () => {
    const createCardinalMineFn = cardinal([2, 2, 2]);
    it('should return 1 for cardinal neighbors', () => {
      expect(createCardinalMineFn([2, 1, 2])).toBe(1);
      expect(createCardinalMineFn([2, 3, 2])).toBe(1);
      expect(createCardinalMineFn([1, 2, 2])).toBe(1);
      expect(createCardinalMineFn([3, 2, 2])).toBe(1);
      expect(createCardinalMineFn([2, 2, 1])).toBe(1);
      expect(createCardinalMineFn([2, 2, 3])).toBe(1);
    });
    it('should return 0 for non-cardinal neighbors', () => {
      expect(createCardinalMineFn([1, 1, 2])).toBe(0);
      expect(createCardinalMineFn([3, 3, 2])).toBe(0);
      expect(createCardinalMineFn([1, 2, 1])).toBe(0);
      expect(createCardinalMineFn([3, 2, 3])).toBe(0);
      expect(createCardinalMineFn([2, 1, 1])).toBe(0);
      expect(createCardinalMineFn([2, 3, 3])).toBe(0);
      expect(createCardinalMineFn([1, 1, 1])).toBe(0);
      expect(createCardinalMineFn([3, 3, 3])).toBe(0);
    });
  });
});
