// Distância em linha reta entre dois pontos (fórmula de Haversine), em km.
export const distanciaKm = (lat1, lng1, lat2, lng2) => {
  const raio = 6371;
  const rad = (graus) => (graus * Math.PI) / 180;
  const dLat = rad(lat2 - lat1);
  const dLng = rad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * raio * Math.asin(Math.sqrt(a));
};

// 0,85 km -> "850 m"; 2,34 km -> "2,3 km"
export const formatarDistancia = (km) => {
  if (km < 1) return `${Math.max(10, Math.round((km * 1000) / 10) * 10)} m`;
  return `${km.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} km`;
};

// Pede a localização ao celular. Funciona só em HTTPS (ou localhost).
export const pedirLocalizacao = () => new Promise((resolve, reject) => {
  if (!('geolocation' in navigator)) {
    reject(new Error('indisponivel'));
    return;
  }
  navigator.geolocation.getCurrentPosition(
    (posicao) => resolve({ lat: posicao.coords.latitude, lng: posicao.coords.longitude }),
    (erro) => reject(new Error(erro.code === 1 ? 'negada' : 'falhou')),
    { enableHighAccuracy: false, timeout: 15000, maximumAge: 5 * 60 * 1000 }
  );
});
