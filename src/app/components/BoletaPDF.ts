import jsPDF from 'jspdf';

// Tipos 

/** Un solo artículo en el recibo. */
export interface BoletaItem {
  name:     string;
  quantity: number;
  price:    number;
}

/** Se requiere la carga útil completa para generar un recibo en formato PDF. */
export interface BoletaData {
  /** UUID del pedido (utilizado para generar el número de recibo corto) */
  orderId:        string;
  /** Número de cola virtual (e.g. 1001) */
  orderNumber?:   number | null;
  /** Cadena de fecha ISO 8601 que indica cuándo se realizó el pedido */
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
  /** Suma de los precios de los artículos antes de los descuentos */
  subtotal:       number;
  /** Importe total del descuento */
  discount:       number;
  /** Código de cupón aplicado, si corresponde */
  couponCode?:    string | null;
  /** Gastos de envío (0 para recogida o envío gratuito) */
  deliveryFee:    number;
  /** Total final a cobrar al cliente */
  total:          number;
}

// Colores de la marca

/** RapiPizza naranja primario (#e25216) */
const BRAND_ORANGE = [226, 82, 22]   as [number, number, number];
/** Casi negro para el texto principal */
const BRAND_DARK   = [45, 37, 32]    as [number, number, number];
/** Marrón grisáceo apagado para el texto secundario */
const GRAY_MID     = [107, 93, 82]   as [number, number, number];
/** Blanco roto cálido para fondos de sección */
const GRAY_LIGHT   = [232, 222, 208] as [number, number, number];
/** Blanco puro */
const WHITE        = [255, 255, 255] as [number, number, number];

// Sanitizador ASCII

/**
 * Converts Spanish accented/special characters to their ASCII equivalents,
 * then strips any remaining non-ASCII characters (codepoints outside 32–126).
 *
 * Esto es OBLIGATORIO para cada cadena escrita con doc.text() porque jsPDF
 * La fuente Helvetica integrada solo muestra ASCII puro; cualquier cosa fuera de ese rango.
 * produce una salida corrupta como "Ø<ßU" o caracteres de cuadro distorsionados.
 *
 * Mapeo aplicado:
 *   a/A vocales con acentos  → a / A
 *   e/E vocales con acentos  → e / E
 *   i/I vocales con acentos  → i / I
 *   o/O vocales con acentos  → o / O
 *   u/U vocales con acentos  → u / U
 *   n/N con tilde           → n / N
 *   u/U con diéresis          → u / U
 *   invertido ! y ?         → ! y ?
 *   todos los demás no ASCII      → quitado
 *
 * @param text - Cadena de entrada sin formato que puede contener caracteres no ASCII.
 * @returns    Cadena saneada solo en formato ASCII, segura para la representación de jsPDF Helvetica.
 *
 * @example
 * safeStr('¡Gracias por tu compra!')  // => '!Gracias por tu compra!'
 * safeStr('Entrega a domicilio')      // => 'Entrega a domicilio'
 * safeStr('Pepperoni & Mozarela')     // => 'Pepperoni & Mozarela'
 */
function safeStr(text: string): string {
  return text
    // Vocales acentuadas en minúscula
    .replace(/[áàâã]/g, 'a')
    .replace(/[éèêë]/g, 'e')
    .replace(/[íìîï]/g, 'i')
    .replace(/[óòôõ]/g, 'o')
    .replace(/[úùûü]/g, 'u')
    // Vocales acentuadas en mayúscula
    .replace(/[ÁÀÂÃ]/g, 'A')
    .replace(/[ÉÈÊË]/g, 'E')
    .replace(/[ÍÌÎÏ]/g, 'I')
    .replace(/[ÓÒÔÕ]/g, 'O')
    .replace(/[ÚÙÛÜ]/g, 'U')
    // n/N con tilde
    .replace(/ñ/g, 'n')
    .replace(/Ñ/g, 'N')
    // Signos de puntuación invertidos (español)
    .replace(/¡/g, '!')
    .replace(/¿/g, '?')
    // Elimine TODOS los caracteres no ASCII restantes (incluidos emojis, comillas rizadas, etc.).
    .replace(/[^\x20-\x7E]/g, '');
}

// Utilidades auxiliares

/**
 * Formatea una cadena de fecha ISO en una cadena de fecha/hora localizada.
 * Los caracteres se someten a un proceso de saneamiento con safeStr() antes de su uso en jsPDF.
 *
 * @param isoDate - Cadena de fecha ISO 8601
 * @returns       Cadena de fecha legible para humanos (compatible con ASCII)
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
 * Formatea una cantidad numérica como una cadena de caracteres de la moneda PEN (sol peruano).
 *
 * @param amount - Cantidad monetaria numérica
 * @returns       Cadena formateada como "S/ 25.90"
 */
function formatCurrency(amount: number): string {
  return `S/ ${amount.toFixed(2)}`;
}

/**
 * Deriva una referencia de pedido corta de 10 caracteres en mayúsculas a partir de un UUID.
 * Elimina los guiones y toma los primeros 10 caracteres.
 *
 * @param id - Cadena UUID completa
 * @returns   Referencia breve (p. ej., "A1B2C3D4E5")
 */
function shortId(id: string): string {
  return id.replace(/-/g, '').slice(0, 10).toUpperCase();
}

// ─── Main generator ───────────────────────────────────────────────────────────

/**
 * Genera un recibo profesional en formato PDF y activa la descarga inmediata.
 *
 * Todo el texto se sanitiza mediante `safeStr()` antes de su renderizado para evitar
 * Corrupción de caracteres con la fuente Helvetica de jsPDF.
 * El pie de página está fijado en una posición fija en la parte inferior de la página A4.
 * independientemente de la extensión del contenido.
 *
 * @param data - Incluir en el recibo todos los datos del pedido.
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

  // Header Naranja
  doc.setFillColor(...BRAND_ORANGE);
  doc.rect(0, 0, pageW, 45, 'F');

  // Nombre de la marca
  doc.setTextColor(...WHITE);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(28);
  doc.text('RAPIPIZZA', pageW / 2, 18, { align: 'center' });

  // Eslogan e información de contacto
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Autentica Pizza Artesanal  |  Delivery y Recojo', pageW / 2, 26, { align: 'center' });
  doc.text('Av. Sucre 112 San Gabriel, Villa Maria del Triunfo  |  +51 903 582 008', pageW / 2, 32, { align: 'center' });

  // Banner de título de recibo oscuro
  doc.setFillColor(...BRAND_DARK);
  doc.rect(0, 45, pageW, 12, 'F');

  doc.setTextColor(...WHITE);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('BOLETA DE VENTA ELECTRONICA', pageW / 2, 53, { align: 'center' });

  y = 65;

  // Bloque de detalles del pedido
  doc.setFillColor(...GRAY_LIGHT);
  doc.rect(marginL, y - 5, contentW, 38, 'F');

  doc.setTextColor(...BRAND_DARK);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);

  // Columna izquierda: etiquetas de metadatos de pedido
  doc.text('N. PEDIDO:',       marginL + 3, y + 2);
  if (data.orderNumber) doc.text('N. COLA VIRTUAL:', marginL + 3, y + 9);
  doc.text('FECHA:',           marginL + 3, data.orderNumber ? y + 16 : y + 9);
  doc.text('METODO DE PAGO:',  marginL + 3, data.orderNumber ? y + 23 : y + 16);
  doc.text('TIPO DE ENTREGA:', marginL + 3, data.orderNumber ? y + 30 : y + 23);

  // Columna izquierda: valores de metadatos del pedido
  doc.setFont('helvetica', 'normal');
  doc.text(`#${shortId(data.orderId)}`, marginL + 40, y + 2);
  if (data.orderNumber) {
    doc.text(`#${data.orderNumber}`, marginL + 40, y + 9);
  }
  const dateOffset = data.orderNumber ? 16 : 9;
  doc.text(formatDate(data.date),       marginL + 40, y + dateOffset);
  doc.text(
    data.paymentMethod === 'card' ? 'Tarjeta de credito/debito' : 'Efectivo contra entrega',
    marginL + 40, y + dateOffset + 7,
  );
  doc.text(
    data.deliveryType === 'delivery' ? 'Delivery a domicilio' : 'Recojo en tienda',
    marginL + 40, y + dateOffset + 14,
  );

  // Columna derecha: información del cliente
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

  // Encabezado de la tabla de productos
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

  // Filas de productos
  doc.setTextColor(...BRAND_DARK);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);

  data.items.forEach((item, i) => {
    const rowH = 9;
    // Fondo de fila alterno para mayor legibilidad
    const bg = i % 2 === 0 ? WHITE : ([248, 244, 240] as [number, number, number]);
    doc.setFillColor(...bg);
    doc.rect(marginL, y, contentW, rowH, 'F');

    // Recortar nombres de productos largos y sanitizarlos para ASCII.
    const maxChars  = 38;
    const rawName   = safeStr(item.name);
    const itemName  = rawName.length > maxChars ? rawName.slice(0, maxChars) + '...' : rawName;

    doc.text(itemName,                                        marginL + 3,              y + 6);
    doc.text(String(item.quantity),                           marginL + contentW * 0.65, y + 6, { align: 'center' });
    doc.text(formatCurrency(item.price),                      marginL + contentW * 0.78, y + 6, { align: 'right' });
    doc.text(formatCurrency(item.price * item.quantity),      pageW - marginR - 3,       y + 6, { align: 'right' });

    y += rowH;
  });

  // Borde inferior de la tabla
  doc.setDrawColor(...GRAY_MID);
  doc.setLineWidth(0.3);
  doc.line(marginL, y, marginL + contentW, y);

  y += 6;

  // Sección de totales

  const totalsX = pageW - marginR - 80;
  const valX    = pageW - marginR - 3;

  /**
   * Muestra una única fila de totales (etiqueta + valor alineado a la derecha).
   *
   * @param label - Texto de etiqueta de fila
   * @param value - Cadena de valor monetario
   * @param bold  - Si se debe mostrar la etiqueta en negrita
   * @param color - Color RGB opcional para el texto de la fila
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

  // Línea divisoria antes del total general
  doc.setDrawColor(...BRAND_ORANGE);
  doc.setLineWidth(0.6);
  doc.line(totalsX - 3, y - 2, pageW - marginR, y - 2);
  y += 2;

  // Fila del total general resaltada (píldora naranja)
  doc.setFillColor(...BRAND_ORANGE);
  doc.roundedRect(totalsX - 5, y - 4, pageW - marginR - totalsX + 8, 12, 2, 2, 'F');
  doc.setTextColor(...WHITE);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('TOTAL:', totalsX, y + 5);
  doc.text(formatCurrency(data.total), valX, y + 5, { align: 'right' });

  y += 18;

  // Cuadro de mensaje de agradecimiento
  doc.setFillColor(...GRAY_LIGHT);
  doc.rect(marginL, y, contentW, 22, 'F');

  doc.setTextColor(...BRAND_DARK);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
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

  // Footer
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

  // Descarga
  const filename = `boleta-rapipizza-${shortId(data.orderId)}.pdf`;
  doc.save(filename);
}
