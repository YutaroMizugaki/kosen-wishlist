export class InvalidIsbnError extends Error {
  constructor(message = "ISBNの形式が正しくありません。") {
    super(message);
    this.name = "InvalidIsbnError";
  }
}

function isbn13CheckDigit(twelveDigits: string): string {
  let sum = 0;
  for (let index = 0; index < 12; index += 1) {
    sum += Number(twelveDigits[index]) * (index % 2 === 0 ? 1 : 3);
  }
  return String((10 - (sum % 10)) % 10);
}

function isValidIsbn10(value: string): boolean {
  let sum = 0;
  for (let index = 0; index < 9; index += 1) {
    sum += Number(value[index]) * (10 - index);
  }
  const last = value[9] === "X" ? 10 : Number(value[9]);
  if (!Number.isInteger(last)) return false;
  return (sum + last) % 11 === 0;
}

/** Empty input becomes null. ISBN-10 is converted; ISBN-13 is stored as 13 digits. */
export function toIsbn13(raw: string | null | undefined): string | null {
  const compact = String(raw ?? "").replace(/[-\s]/g, "").toUpperCase();
  if (!compact) return null;

  if (/^\d{13}$/.test(compact)) {
    if (!compact.startsWith("978") && !compact.startsWith("979")) {
      throw new InvalidIsbnError();
    }
    if (compact[12] !== isbn13CheckDigit(compact.slice(0, 12))) {
      throw new InvalidIsbnError();
    }
    return compact;
  }

  if (/^\d{9}[\dX]$/.test(compact)) {
    if (!isValidIsbn10(compact)) throw new InvalidIsbnError();
    const body = `978${compact.slice(0, 9)}`;
    return `${body}${isbn13CheckDigit(body)}`;
  }

  throw new InvalidIsbnError();
}
