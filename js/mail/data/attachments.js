const invoice = Object.freeze({
  name: 'Factura_1045_Rivera.pdf',
  size: '84 KB',
});

export const FILES = Object.freeze([
  invoice,
  Object.freeze({ name: 'Factura_1044_Gomez.pdf', size: '79 KB' }),
  Object.freeze({ name: 'Foto_vacaciones.jpg', size: '2.1 MB' }),
  Object.freeze({ name: 'Receta_sopa.docx', size: '31 KB' }),
  Object.freeze({ name: 'Lista_compras.txt', size: '2 KB' }),
]);

export const INVOICE = invoice.name;

export const fileOf = (name) => FILES.find((file) => file.name === name) || { name, size: '' };

export const extOf = (name) => (name.split('.').pop() || '').toLowerCase();
