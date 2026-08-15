export function normalizeIsbn(value: unknown) {
  return String(value || "").replace(/[^0-9Xx]/g, "").toUpperCase();
}

export function isValidIsbn(value: unknown) {
  const isbn = normalizeIsbn(value);

  if (isbn.length === 10) {
    const sum = [...isbn].reduce((total, character, index) => {
      const digit = character === "X" && index === 9 ? 10 : Number(character);
      return Number.isInteger(digit) ? total + digit * (10 - index) : Number.NaN;
    }, 0);
    return Number.isFinite(sum) && sum % 11 === 0;
  }

  if (isbn.length === 13 && /^\d{13}$/.test(isbn)) {
    const sum = [...isbn].reduce(
      (total, character, index) => total + Number(character) * (index % 2 === 0 ? 1 : 3),
      0,
    );
    return sum % 10 === 0;
  }

  return false;
}

export function toIsbn13(value: unknown) {
  const isbn = normalizeIsbn(value);
  if (!isValidIsbn(isbn)) return null;
  if (isbn.length === 13) return isbn;

  const firstTwelveDigits = `978${isbn.slice(0, 9)}`;
  const sum = [...firstTwelveDigits].reduce(
    (total, character, index) => total + Number(character) * (index % 2 === 0 ? 1 : 3),
    0,
  );
  return `${firstTwelveDigits}${(10 - (sum % 10)) % 10}`;
}
