// Вычисление расстояния между двумя точками по формуле Haversine
export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; // Радиус Земли в км
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return Math.round(distance * 100) / 100; // Округляем до 2 знаков
};

const toRad = (degrees: number): number => {
  return degrees * (Math.PI / 180);
};

// Примерное вычисление времени поездки (в минутах)
export const estimateDuration = (distance: number): number => {
  // Средняя скорость в городе 40 км/ч
  const averageSpeed = 40;
  return Math.round((distance / averageSpeed) * 60);
};

// Вычисление примерной стоимости
export const calculatePrice = (distance: number): number => {
  // Базовая стоимость 500 тенге + 100 тенге за км
  const basePrice = 500;
  const pricePerKm = 100;
  return Math.round(basePrice + distance * pricePerKm);
};
