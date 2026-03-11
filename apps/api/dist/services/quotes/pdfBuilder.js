const esc = (value) => value.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
export const buildBusinessQuotePdf = (quote, customer, lines) => {
    const text = [];
    text.push('BT /F1 14 Tf 50 800 Td (COSTLYGHOST PACKAGING) Tj ET');
    text.push('BT /F1 10 Tf 50 785 Td (Commercial Quote) Tj ET');
    text.push(`BT /F1 10 Tf 50 765 Td (Quote: ${esc(quote.quoteNumber)}) Tj ET`);
    text.push(`BT /F1 10 Tf 50 750 Td (Date: ${esc(quote.createdAt.slice(0, 10))}) Tj ET`);
    text.push(`BT /F1 10 Tf 50 735 Td (Customer: ${esc(customer?.name ?? '-')}) Tj ET`);
    text.push(`BT /F1 10 Tf 50 720 Td (VAT: ${esc(customer?.vatNumber ?? '-')}) Tj ET`);
    text.push('BT /F1 10 Tf 50 700 Td (SKU | Description | Qty | Unit Price | Discount | Net) Tj ET');
    let y = 682;
    lines.forEach((line) => {
        text.push(`BT /F1 9 Tf 50 ${y} Td (${esc(line.sku)} | ${esc(line.description)} | ${line.quantity} | ${line.selectedUnitPrice.toFixed(4)} | ${line.discountAmount.toFixed(2)} | ${line.netLineTotal.toFixed(2)}) Tj ET`);
        y -= 14;
    });
    text.push(`BT /F1 11 Tf 50 ${Math.max(y - 16, 110)} Td (Subtotal: ${quote.subtotal.toFixed(2)} ${quote.currency}) Tj ET`);
    text.push(`BT /F1 11 Tf 50 ${Math.max(y - 32, 94)} Td (Discount: ${quote.discountTotal.toFixed(2)} ${quote.currency}) Tj ET`);
    text.push(`BT /F1 12 Tf 50 ${Math.max(y - 50, 76)} Td (NET TOTAL: ${quote.netTotal.toFixed(2)} ${quote.currency}) Tj ET`);
    if (quote.paymentTerms)
        text.push(`BT /F1 9 Tf 50 58 Td (Payment Terms: ${esc(quote.paymentTerms)}) Tj ET`);
    if (quote.validityDate)
        text.push(`BT /F1 9 Tf 50 44 Td (Validity: ${esc(quote.validityDate)}) Tj ET`);
    if (quote.notes)
        text.push(`BT /F1 9 Tf 50 30 Td (Notes: ${esc(quote.notes)}) Tj ET`);
    const content = text.join('\n');
    const objects = [
        '1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj',
        '2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj',
        '3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >> endobj',
        '4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj',
        `5 0 obj << /Length ${Buffer.byteLength(content, 'utf8')} >> stream\n${content}\nendstream endobj`
    ];
    let pdf = '%PDF-1.4\n';
    const offsets = [0];
    objects.forEach((obj) => {
        offsets.push(Buffer.byteLength(pdf, 'utf8'));
        pdf += `${obj}\n`;
    });
    const xrefPos = Buffer.byteLength(pdf, 'utf8');
    pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
    for (let i = 1; i <= objects.length; i += 1)
        pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
    pdf += `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefPos}\n%%EOF`;
    return Buffer.from(pdf, 'utf8');
};
