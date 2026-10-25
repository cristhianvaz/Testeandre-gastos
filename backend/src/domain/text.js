/** Remove acentos, normaliza espaços e converte para caixa alta. */
export function normalizeText(value) {
  return String(value)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toUpperCase();
}
