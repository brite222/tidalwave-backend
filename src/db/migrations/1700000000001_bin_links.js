exports.up = (pgm) => {
  // A citizen links a physical smart bin to their account after registering.
  pgm.createType('bin_link_status', ['active', 'inactive']);
  pgm.createTable('bin_links', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    bin_id: { type: 'uuid', notNull: true, references: 'bins(id)', onDelete: 'cascade' },
    user_id: { type: 'uuid', notNull: true, references: 'users(id)', onDelete: 'cascade' },
    status: { type: 'bin_link_status', notNull: true, default: 'active' },
    linked_at: { type: 'timestamptz', default: pgm.func('now()') },
    created_at: { type: 'timestamptz', default: pgm.func('now()') },
  });
  // A bin can be shared by a household, but the same user links it only once.
  pgm.createConstraint('bin_links', 'bin_links_bin_user_uniq', { unique: ['bin_id', 'user_id'] });
  pgm.createIndex('bin_links', 'user_id');

  // Powers the "Next Pickup" line on the Bin Linked success card.
  pgm.addColumns('bins', {
    next_pickup_at: { type: 'timestamptz' },
  });
};

exports.down = (pgm) => {
  pgm.dropColumns('bins', ['next_pickup_at']);
  pgm.dropTable('bin_links');
  pgm.dropType('bin_link_status');
};
