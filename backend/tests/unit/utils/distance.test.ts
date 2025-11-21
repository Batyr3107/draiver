import { calculateDistance } from '../../../src/utils/distance';

describe('Distance Utils', () => {
  describe('calculateDistance', () => {
    it('should calculate distance between two points in Almaty', () => {
      // Абай проспект до площади Республики (примерно 3 км)
      const point1 = { lat: 43.2367, lon: 76.9286 }; // Абай
      const point2 = { lat: 43.2566, lon: 76.9286 }; // Республика

      const distance = calculateDistance(
        point1.lat,
        point1.lon,
        point2.lat,
        point2.lon
      );

      expect(distance).toBeGreaterThan(0);
      expect(distance).toBeLessThan(5); // Должно быть меньше 5 км
      expect(distance).toBeCloseTo(2.2, 0); // Примерно 2.2 км
    });

    it('should return 0 for same coordinates', () => {
      const lat = 43.2220;
      const lon = 76.8512;

      const distance = calculateDistance(lat, lon, lat, lon);

      expect(distance).toBe(0);
    });

    it('should calculate distance between Almaty and Astana', () => {
      // Алматы
      const almaty = { lat: 43.2220, lon: 76.8512 };
      // Астана
      const astana = { lat: 51.1694, lon: 71.4491 };

      const distance = calculateDistance(
        almaty.lat,
        almaty.lon,
        astana.lat,
        astana.lon
      );

      expect(distance).toBeGreaterThan(900); // Больше 900 км
      expect(distance).toBeLessThan(1100); // Меньше 1100 км
      expect(distance).toBeCloseTo(1000, -2); // Примерно 1000 км
    });

    it('should handle negative coordinates', () => {
      const point1 = { lat: -33.8688, lon: 151.2093 }; // Sydney
      const point2 = { lat: -37.8136, lon: 144.9631 }; // Melbourne

      const distance = calculateDistance(
        point1.lat,
        point1.lon,
        point2.lat,
        point2.lon
      );

      expect(distance).toBeGreaterThan(0);
      expect(distance).toBeCloseTo(713, -1); // Примерно 713 км
    });

    it('should handle coordinates across the International Date Line', () => {
      const point1 = { lat: 52.5200, lon: -179.0 }; // Западная долгота
      const point2 = { lat: 52.5200, lon: 179.0 }; // Восточная долгота

      const distance = calculateDistance(
        point1.lat,
        point1.lon,
        point2.lat,
        point2.lon
      );

      expect(distance).toBeGreaterThan(0);
      expect(distance).toBeLessThan(300); // Должно быть небольшое расстояние
    });

    it('should return positive distance regardless of point order', () => {
      const point1 = { lat: 43.2220, lon: 76.8512 };
      const point2 = { lat: 43.2566, lon: 76.9286 };

      const distance1 = calculateDistance(
        point1.lat,
        point1.lon,
        point2.lat,
        point2.lon
      );

      const distance2 = calculateDistance(
        point2.lat,
        point2.lon,
        point1.lat,
        point1.lon
      );

      expect(distance1).toBe(distance2);
      expect(distance1).toBeGreaterThan(0);
    });

    it('should handle equator coordinates', () => {
      const point1 = { lat: 0, lon: 0 };
      const point2 = { lat: 0, lon: 1 };

      const distance = calculateDistance(
        point1.lat,
        point1.lon,
        point2.lat,
        point2.lon
      );

      expect(distance).toBeGreaterThan(0);
      expect(distance).toBeCloseTo(111, -1); // Примерно 111 км (1 градус на экваторе)
    });

    it('should handle poles coordinates', () => {
      const northPole = { lat: 90, lon: 0 };
      const southPole = { lat: -90, lon: 0 };

      const distance = calculateDistance(
        northPole.lat,
        northPole.lon,
        southPole.lat,
        southPole.lon
      );

      expect(distance).toBeGreaterThan(0);
      expect(distance).toBeCloseTo(20000, -3); // Примерно 20000 км (половина окружности Земли)
    });
  });
});
