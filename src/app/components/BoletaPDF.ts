/**
 * BoletaPDF — Professional PDF receipt generator for RapiPizza.
 *
 * Uses jsPDF client-side (no backend) to generate a purchase receipt
 * that downloads automatically as `boleta-rapipizza-XXXXXX.pdf`.
 *
 * IMPORTANT — jsPDF Helvetica font limitation:
 *   Helvetica only supports pure ASCII characters (codepoints 32–126).
 *   Spanish accented characters (á,é,í,ó,ú,ñ,ü,¡,¿) and emojis render as
 *   corrupted garbage (e.g. "Ø<ßU", "RA P I P I Z").
 *   All strings MUST be sanitised with safeStr() before calling doc.text().
 *
 * PDF layout (top to bottom):
 *   - Orange header band with brand name
 *   - Dark banner "BOLETA DE VENTA ELECTRONICA"
 *   - Order details block (left) + customer info block (right)
 *   - Product table with alternating row colours
 *   - Totals section with highlighted grand total
 *   - Thank-you message box
 *   - Orange footer pinned to the bottom of the page
 */

import jsPDF from 'jspdf';

// ─── Types ────────────────────────────────────────────────────────────────────

/** A single product line item in the receipt. */
export interface BoletaItem {
  name:     string;
  quantity: number;
  price:    number;
}

/** Full payload required to generate a receipt PDF. */
export interface BoletaData {
  /** UUID of the order (used to generate the short receipt number) */
  orderId:        string;
  /** ISO 8601 date string of when the order was placed */
  date:           string;
  customerName:   string;
  customerEmail:  string;
  customerPhone?: string;
  address?:       string;
  district?:      string;
  deliveryType:   'delivery' | 'pickup';
  paymentMethod:  'card' | 'cash';
  /** Tiempo estimado de entrega, ej. '25-35 min' o 'Recojo en tienda' */
  estimatedTime?: string;
  items:          BoletaItem[];
  /** Sum of item prices before discounts */
  subtotal:       number;
  /** Total discount amount */
  discount:       number;
  /** Applied coupon code, if any */
  couponCode?:    string | null;
  /** Delivery fee (0 for pickup or free delivery) */
  deliveryFee:    number;
  /** Final total to charge the customer */
  total:          number;
}

// ─── Brand colours ────────────────────────────────────────────────────────────

/** RapiPizza primary orange (#e25216) */
const BRAND_ORANGE = [226, 82, 22]   as [number, number, number];
/** Near-black for primary text */
const BRAND_DARK   = [45, 37, 32]    as [number, number, number];
/** Muted brown-grey for secondary text */
const GRAY_MID     = [107, 93, 82]   as [number, number, number];
/** Warm off-white for section backgrounds */
const GRAY_LIGHT   = [232, 222, 208] as [number, number, number];
/** Pure white */
const WHITE        = [255, 255, 255] as [number, number, number];

// ─── ASCII sanitiser ──────────────────────────────────────────────────────────

/**
 * Converts Spanish accented/special characters to their ASCII equivalents,
 * then strips any remaining non-ASCII characters (codepoints outside 32–126).
 *
 * This is MANDATORY for every string written with doc.text() because jsPDF's
 * built-in Helvetica font only renders pure ASCII — anything outside that range
 * produces corrupted output such as "Ø<ßU" or garbled box characters.
 *
 * Mapping applied:
 *   a/A vowels with accents  → a / A
 *   e/E vowels with accents  → e / E
 *   i/I vowels with accents  → i / I
 *   o/O vowels with accents  → o / O
 *   u/U vowels with accents  → u / U
 *   n/N with tilde           → n / N
 *   u/U with umlaut          → u / U
 *   inverted ! and ?         → ! and ?
 *   all other non-ASCII      → removed
 *
 * @param text - Raw input string that may contain non-ASCII characters
 * @returns    Sanitised ASCII-only string safe for jsPDF Helvetica rendering
 *
 * @example
 * safeStr('¡Gracias por tu compra!')  // => '!Gracias por tu compra!'
 * safeStr('Entrega a domicilio')      // => 'Entrega a domicilio'
 * safeStr('Pepperoni & Mozarela')     // => 'Pepperoni & Mozarela'
 */
function safeStr(text: string): string {
  return text
    // Lowercase accented vowels
    .replace(/[áàâã]/g, 'a')
    .replace(/[éèêë]/g, 'e')
    .replace(/[íìîï]/g, 'i')
    .replace(/[óòôõ]/g, 'o')
    .replace(/[úùûü]/g, 'u')
    // Uppercase accented vowels
    .replace(/[ÁÀÂÃ]/g, 'A')
    .replace(/[ÉÈÊË]/g, 'E')
    .replace(/[ÍÌÎÏ]/g, 'I')
    .replace(/[ÓÒÔÕ]/g, 'O')
    .replace(/[ÚÙÛÜ]/g, 'U')
    // n/N with tilde
    .replace(/ñ/g, 'n')
    .replace(/Ñ/g, 'N')
    // Inverted punctuation (Spanish)
    .replace(/¡/g, '!')
    .replace(/¿/g, '?')
    // Remove ALL remaining non-ASCII characters (includes emojis, curly quotes, etc.)
    .replace(/[^\x20-\x7E]/g, '');
}

// ─── Helper utilities ─────────────────────────────────────────────────────────

/**
 * Formats an ISO date string into a localised date/time string.
 * Characters are sanitised with safeStr() before use in jsPDF.
 *
 * @param isoDate - ISO 8601 date string
 * @returns       Human-readable date string (ASCII-safe)
 */
function formatDate(isoDate: string): string {
  return safeStr(
    new Date(isoDate).toLocaleDateString('es-PE', {
      day: '2-digit', month: 'long', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    }),
  );
}

/**
 * Formats a numeric amount as a PEN (Peruvian Sol) currency string.
 *
 * @param amount - Numeric monetary amount
 * @returns       Formatted string like "S/ 25.90"
 */
function formatCurrency(amount: number): string {
  return `S/ ${amount.toFixed(2)}`;
}

/**
 * Derives a short 10-character uppercase order reference from a UUID.
 * Removes hyphens and takes the first 10 characters.
 *
 * @param id - Full UUID string
 * @returns   Short reference (e.g. "A1B2C3D4E5")
 */
function shortId(id: string): string {
  return id.replace(/-/g, '').slice(0, 10).toUpperCase();
}

// ─── Main generator ───────────────────────────────────────────────────────────

/**
 * Generates a professional receipt PDF and triggers an immediate download.
 *
 * All text is sanitised through `safeStr()` before rendering to prevent
 * character corruption with jsPDF's Helvetica font.
 * The footer is pinned to a fixed position at the bottom of the A4 page
 * regardless of content length.
 *
 * @param data - Full order data to include in the receipt
 *
 * @example
 * generateBoletaPDF({
 *   orderId: 'uuid-here',
 *   date: new Date().toISOString(),
 *   customerName: 'Ana Torres',
 *   ...
 * });
 */
export function generateBoletaPDF(data: BoletaData): void {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const pageW  = doc.internal.pageSize.getWidth();
  const pageH  = doc.internal.pageSize.getHeight();
  const marginL   = 20;
  const marginR   = 20;
  const contentW  = pageW - marginL - marginR;

  let y = 0;

  // ── Orange header band ──────────────────────────────────────────────────────
  doc.setFillColor(...BRAND_ORANGE);
  doc.rect(0, 0, pageW, 45, 'F');

  // Brand name — ASCII only, no emoji
  doc.setTextColor(...WHITE);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(28);
  doc.text('RAPIPIZZA', pageW / 2, 18, { align: 'center' });

  // Tagline and contact info
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Autentica Pizza Artesanal  |  Delivery y Recojo', pageW / 2, 26, { align: 'center' });
  doc.text('Av. Sucre 112 San Gabriel, Villa Maria del Triunfo  |  +51 903 582 008', pageW / 2, 32, { align: 'center' });

  // ── Dark receipt title banner ───────────────────────────────────────────────
  doc.setFillColor(...BRAND_DARK);
  doc.rect(0, 45, pageW, 12, 'F');

  doc.setTextColor(...WHITE);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('BOLETA DE VENTA ELECTRONICA', pageW / 2, 53, { align: 'center' });

  y = 65;

  // ── Order details block ─────────────────────────────────────────────────────
  doc.setFillColor(...GRAY_LIGHT);
  doc.rect(marginL, y - 5, contentW, 38, 'F');

  doc.setTextColor(...BRAND_DARK);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);

  // Left column: order metadata labels
  doc.text('N. PEDIDO:',       marginL + 3, y + 2);
  doc.text('FECHA:',           marginL + 3, y + 9);
  doc.text('METODO DE PAGO:',  marginL + 3, y + 16);
  doc.text('TIPO DE ENTREGA:', marginL + 3, y + 23);
  if (data.estimatedTime) doc.text('TIEMPO EST.:', marginL + 3, y + 30);

  // Left column: order metadata values
  doc.setFont('helvetica', 'normal');
  doc.text(`#${shortId(data.orderId)}`, marginL + 37, y + 2);
  doc.text(formatDate(data.date),       marginL + 37, y + 9);
  doc.text(
    data.paymentMethod === 'card' ? 'Tarjeta de credito/debito' : 'Efectivo contra entrega',
    marginL + 37, y + 16,
  );
  doc.text(
    data.deliveryType === 'delivery' ? 'Delivery a domicilio' : 'Recojo en tienda',
    marginL + 37, y + 23,
  );
  if (data.estimatedTime) {
    doc.text(safeStr(data.estimatedTime), marginL + 37, y + 30);
  }

  // Right column: customer info
  const colR = pageW / 2 + 5;
  doc.setFont('helvetica', 'bold');
  doc.text('CLIENTE:',   colR, y + 2);
  doc.text('EMAIL:',     colR, y + 9);
  if (data.customerPhone) doc.text('TELEFONO:', colR, y + 16);
  if (data.address)       doc.text('DIRECCION:', colR, y + 23);
  if (data.district)      doc.text('DISTRITO:',  colR, y + 30);

  doc.setFont('helvetica', 'normal');
  doc.text(safeStr(data.customerName  || 'Cliente'), colR + 22, y + 2);
  doc.text(safeStr(data.customerEmail || '-'),        colR + 22, y + 9);
  if (data.customerPhone) doc.text(safeStr(data.customerPhone),           colR + 22, y + 16);
  if (data.address)       doc.text(safeStr(data.address.slice(0, 30)),    colR + 22, y + 23);
  if (data.district)      doc.text(safeStr(data.district),                colR + 22, y + 30);

  y += 45;

  // ── Products table header ───────────────────────────────────────────────────
  doc.setFillColor(...BRAND_DARK);
  doc.rect(marginL, y, contentW, 8, 'F');

  doc.setTextColor(...WHITE);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('PRODUCTO',                       marginL + 3,              y + 5.5);
  doc.text('CANT.',                          marginL + contentW * 0.62, y + 5.5);
  doc.text('PRECIO UNIT.',                   marginL + contentW * 0.72, y + 5.5);
  doc.text('SUBTOTAL',                       marginL + contentW * 0.87, y + 5.5);

  y += 8;

  // ── Product rows ────────────────────────────────────────────────────────────
  doc.setTextColor(...BRAND_DARK);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);

  data.items.forEach((item, i) => {
    const rowH = 9;
    // Alternate row background for readability
    const bg = i % 2 === 0 ? WHITE : ([248, 244, 240] as [number, number, number]);
    doc.setFillColor(...bg);
    doc.rect(marginL, y, contentW, rowH, 'F');

    // Truncate long product names and sanitise for ASCII
    const maxChars  = 38;
    const rawName   = safeStr(item.name);
    const itemName  = rawName.length > maxChars ? rawName.slice(0, maxChars) + '...' : rawName;

    doc.text(itemName,                                        marginL + 3,              y + 6);
    doc.text(String(item.quantity),                           marginL + contentW * 0.65, y + 6, { align: 'center' });
    doc.text(formatCurrency(item.price),                      marginL + contentW * 0.78, y + 6, { align: 'right' });
    doc.text(formatCurrency(item.price * item.quantity),      pageW - marginR - 3,       y + 6, { align: 'right' });

    y += rowH;
  });

  // Bottom border of the table
  doc.setDrawColor(...GRAY_MID);
  doc.setLineWidth(0.3);
  doc.line(marginL, y, marginL + contentW, y);

  y += 6;

  // ── Totals section ──────────────────────────────────────────────────────────

  const totalsX = pageW - marginR - 80;
  const valX    = pageW - marginR - 3;

  /**
   * Renders a single totals row (label + right-aligned value).
   *
   * @param label - Row label text (will be rendered as-is, already ASCII-safe)
   * @param value - Monetary value string
   * @param bold  - Whether to render the label in bold
   * @param color - Optional RGB colour for the row text
   */
  const addTotalRow = (
    label: string,
    value: string,
    bold  = false,
    color?: [number, number, number],
  ) => {
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.setTextColor(...(color ?? BRAND_DARK));
    doc.setFontSize(9.5);
    doc.text(label, totalsX, y);
    doc.text(value, valX, y, { align: 'right' });
    y += 7;
  };

  addTotalRow('Subtotal:', formatCurrency(data.subtotal));

  if (data.discount > 0) {
    const label = data.couponCode
      ? `Descuento (${safeStr(data.couponCode)}):`
      : 'Descuento:';
    addTotalRow(label, `-${formatCurrency(data.discount)}`, false, [34, 150, 67]);
  }

  if (data.deliveryFee > 0) {
    addTotalRow('Costo de delivery:', formatCurrency(data.deliveryFee));
  } else {
    addTotalRow('Costo de delivery:', 'GRATIS', false, [34, 150, 67]);
  }

  // Divider line before grand total
  doc.setDrawColor(...BRAND_ORANGE);
  doc.setLineWidth(0.6);
  doc.line(totalsX - 3, y - 2, pageW - marginR, y - 2);
  y += 2;

  // Highlighted grand total row (orange pill)
  doc.setFillColor(...BRAND_ORANGE);
  doc.roundedRect(totalsX - 5, y - 4, pageW - marginR - totalsX + 8, 12, 2, 2, 'F');
  doc.setTextColor(...WHITE);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('TOTAL:', totalsX, y + 5);
  doc.text(formatCurrency(data.total), valX, y + 5, { align: 'right' });

  y += 18;

  // ── Thank-you message box ───────────────────────────────────────────────────
  doc.setFillColor(...GRAY_LIGHT);
  doc.rect(marginL, y, contentW, 22, 'F');

  doc.setTextColor(...BRAND_DARK);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  // No emoji — safeStr would strip them; write plain ASCII message
  doc.text('!Gracias por tu compra!', pageW / 2, y + 8, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...GRAY_MID);
  doc.text(
    'Este documento es valido como comprobante de su pedido en RapiPizza.',
    pageW / 2, y + 14, { align: 'center' },
  );
  doc.text(
    'info@rapipizza.com  |  +51 903 582 008  |  Av. Sucre 112, VMT',
    pageW / 2, y + 19, { align: 'center' },
  );

  // ── Footer — pinned to the bottom of the page ───────────────────────────────
  // Always at a fixed Y position regardless of how many items are in the order.
  const footerY = pageH - 12;

  doc.setFillColor(...BRAND_ORANGE);
  doc.rect(0, footerY, pageW, 12, 'F');
  doc.setTextColor(...WHITE);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text(
    safeStr(`RapiPizza (c) ${new Date().getFullYear()}  |  Generado el ${new Date().toLocaleString('es-PE')}`),
    pageW / 2,
    footerY + 7,
    { align: 'center' },
  );

  // ── Save / download ─────────────────────────────────────────────────────────
  const filename = `boleta-rapipizza-${shortId(data.orderId)}.pdf`;
  doc.save(filename);
}
