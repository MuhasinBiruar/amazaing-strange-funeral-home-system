import type { OfficialReceipt } from 'shared';

export async function downloadOfficialReceiptPdf(
  receipt: OfficialReceipt,
  deceasedName: string,
  representativeName?: string | null,
) {
  const { pdf, Document, Page, Text, View, StyleSheet } =
    await import('@react-pdf/renderer');

  const styles = StyleSheet.create({
    page: {
      padding: 48,
      fontFamily: 'Helvetica',
      color: '#111827',
    },
    title: {
      fontSize: 20,
      fontFamily: 'Helvetica-Bold',
      textAlign: 'center',
      marginBottom: 28,
    },
    section: { gap: 10, fontSize: 11 },
    row: { flexDirection: 'row', justifyContent: 'space-between', gap: 24 },
    total: {
      borderTopWidth: 1,
      borderTopColor: '#111827',
      paddingTop: 10,
      marginTop: 10,
      fontFamily: 'Helvetica-Bold',
    },
    footer: { marginTop: 42, fontSize: 9, textAlign: 'center' },
  });

  const amount = (value: string | null | undefined) =>
    `PHP ${Number(value ?? 0).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const pdfDocument = (
    <Document title={`Official Receipt ${receipt.ornumber}`}>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>OFFICIAL RECEIPT</Text>
        <View style={styles.section}>
          <View style={styles.row}>
            <Text>OR Number</Text>
            <Text>{receipt.ornumber}</Text>
          </View>
          <View style={styles.row}>
            <Text>Issue Date</Text>
            <Text>{new Date(receipt.issuedate).toLocaleDateString()}</Text>
          </View>
          <View style={styles.row}>
            <Text>Client / Deceased</Text>
            <Text>{deceasedName}</Text>
          </View>
          <View style={styles.row}>
            <Text>Representative / Payer</Text>
            <Text>{receipt.payer_name || representativeName || '—'}</Text>
          </View>
          <View style={[styles.row, styles.total]}>
            <Text>Amount paid</Text>
            <Text>{amount(receipt.amount)}</Text>
          </View>
          <View style={styles.row}>
            <Text>Total due</Text>
            <Text>{amount(receipt.total_due)}</Text>
          </View>
          {Number(receipt.pwd_discount ?? 0) > 0 && (
            <View style={styles.row}>
              <Text>SC/PWD discount</Text>
              <Text>{amount(receipt.pwd_discount)}</Text>
            </View>
          )}
          {Number(receipt.withholding_tax ?? 0) > 0 && (
            <View style={styles.row}>
              <Text>Withholding tax</Text>
              <Text>{amount(receipt.withholding_tax)}</Text>
            </View>
          )}
        </View>
        <Text style={styles.footer}>
          This document serves as an official receipt.
        </Text>
      </Page>
    </Document>
  );

  const blob = await pdf(pdfDocument).toBlob();
  const url = URL.createObjectURL(blob);
  const link = window.document.createElement('a');
  link.href = url;
  link.download = `official-receipt-${receipt.ornumber}.pdf`;
  link.click();
  URL.revokeObjectURL(url);
}
