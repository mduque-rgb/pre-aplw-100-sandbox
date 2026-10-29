const contact = (name, email) => Object.freeze({ name, email });

export const CONTACTS = Object.freeze({
  sofia: contact('Sofia López', 'sofia.lopez@example.com'),
  boss: contact('Laura Martínez', 'laura.martinez@nice.com'),
  client: contact('Carlos Rivera', 'carlos.rivera@cliente.com'),
});
