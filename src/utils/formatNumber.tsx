export function formatNumber(value: number) {
    // Formato simples de número
    return new Intl.NumberFormat().format(value);
  }