require('dotenv').config();
const bcrypt = require('bcryptjs');
const db = require('../../config/database');

const LAGOS_BINS = [
  ['LK-001', 'Lekki Phase 1',     6.4474, 3.4553, '15 Admiralty Way, Lekki Phase 1'],
  ['LK-002', 'Lekki Phase 1',     6.4498, 3.4612, 'Fola Osibo Street, Lekki Phase 1'],
  ['LK-003', 'Lekki Phase 1',     6.4456, 3.4598, 'Providence Street, Lekki Phase 1'],
  ['VI-001', 'Victoria Island',   6.4281, 3.4219, 'Adeola Odeku Street, VI'],
  ['VI-002', 'Victoria Island',   6.4308, 3.4267, 'Akin Adesola Street, VI'],
  ['VI-003', 'Victoria Island',   6.4255, 3.4189, 'Ahmadu Bello Way, VI'],
  ['VI-004', 'Victoria Island',   6.4322, 3.4234, 'Ozumba Mbadiwe Avenue, VI'],
  ['IK-001', 'Ikoyi',             6.4493, 3.4391, 'Awolowo Road, Ikoyi'],
  ['IK-002', 'Ikoyi',             6.4521, 3.4356, 'Kingsway Road, Ikoyi'],
  ['IK-003', 'Ikoyi',             6.4467, 3.4423, 'Bourdillon Road, Ikoyi'],
  ['YB-001', 'Yaba',              6.5118, 3.3789, 'Herbert Macaulay Way, Yaba'],
  ['YB-002', 'Yaba',              6.5089, 3.3812, 'Commercial Avenue, Yaba'],
  ['SR-001', 'Surulere',          6.4923, 3.3589, 'Bode Thomas Street, Surulere'],
  ['SR-002', 'Surulere',          6.4956, 3.3612, 'Adeniran Ogunsanya, Surulere'],
  ['IKJ-001', 'Ikeja',            6.6018, 3.3515, 'Allen Avenue, Ikeja'],
  ['IKJ-002', 'Ikeja',            6.5984, 3.3489, 'Opebi Road, Ikeja'],
  ['IKJ-003', 'Ikeja',            6.6054, 3.3542, 'Toyin Street, Ikeja'],
  ['AJ-001', 'Ajah',              6.4673, 3.5701, 'Ado Road, Ajah'],
  ['AJ-002', 'Ajah',              6.4712, 3.5689, 'Lekki-Epe Expressway, Ajah'],
  ['GB-001', 'Gbagada',           6.5523, 3.3912, 'Diya Street, Gbagada'],
];

const REWARDS = [
  ['N500 Airtime Voucher',   'airtime',  500,   'Works with all Nigerian networks'],
  ['N1000 Airtime Voucher',  'airtime',  1000,  'Works with all Nigerian networks'],
  ['N2000 Shopping Voucher', 'shopping', 2000,  'Redeemable at major stores'],
  ['N5000 Shopping Voucher', 'shopping', 5000,  'Redeemable at major stores'],
  ['N1500 Utility Bill',     'utility',  1500,  'Pay PHCN/water bills'],
  ['Gold Member Badge',      'badge',    10000, 'Unlock exclusive perks'],
];

async function run() {
  console.log('🌱 Seeding TidalWave...\n');

  // === USERS ===
  const password_hash = await bcrypt.hash('Password123!', 10);

  const users = [
    ['admin@lawma.gov.ng',         'admin',      'Adunni',  'Okafor',  'Lagos State Waste Management Authority (LAWMA)'],
    ['contractor@tidalwave.ng',    'contractor', 'Tunde',   'Bakare',  'GreenWave Disposal Co.'],
    ['ibrahim.adeyemi@lawma.gov.ng','driver',    'Ibrahim', 'Adeyemi', 'LAWMA'],
    ['driver2@lawma.gov.ng',       'driver',     'Chidi',   'Okonkwo', 'LAWMA'],
    ['adebayo.okonkwo@email.com',  'citizen',    'Adebayo', 'Okonkwo', null],
    ['citizen2@email.com',         'citizen',    'Funmi',   'Adeleke', null],
  ];

  const userIds = {};
  let driverCount = 0;

  for (const [email, role, fn, ln, agency] of users) {
    if (role === 'driver') driverCount++;
    const { rows } = await db.query(
      `INSERT INTO users (email, password_hash, role, first_name, last_name, agency, email_verified, assigned_area, vehicle_number)
       VALUES ($1,$2,$3,$4,$5,$6,true, $7, $8)
       ON CONFLICT (email) DO UPDATE SET first_name=EXCLUDED.first_name
       RETURNING id, email, role`,
      [
        email, password_hash, role, fn, ln, agency,
        role === 'driver' ? 'Victoria Island' : null,
        role === 'driver' ? `TW-00${driverCount}` : null,
      ]
    );
    userIds[role] = userIds[role] || [];
    userIds[role].push(rows[0].id);
    console.log(`✓ User: ${email} (${role})`);
  }

  const contractorId = userIds.contractor[0];
  const citizenId = userIds.citizen[0];

  // === BINS ===
  for (const [code, zone, lat, lng, address] of LAGOS_BINS) {
    const fill = Math.floor(Math.random() * 100);
    const status =
      fill >= 100 ? 'overflow' :
      fill >= 86  ? 'critical' :
      fill >= 61  ? 'warning'  : 'normal';

    await db.query(
      `INSERT INTO bins (code, zone, location, address, fill_level, status, assigned_contractor_id)
       VALUES ($1,$2, ST_SetSRID(ST_MakePoint($3,$4),4326)::geography, $5,$6,$7,$8)
       ON CONFLICT (code) DO NOTHING`,
      [code, zone, lng, lat, address, fill, status, contractorId]
    );
  }
  console.log(`✓ Seeded ${LAGOS_BINS.length} bins across Lagos`);

  // === REWARDS ===
  for (const [name, category, points, description] of REWARDS) {
    await db.query(
      `INSERT INTO rewards_catalog (name, category, points_required, description, is_active)
       SELECT $1, $2, $3, $4, true
       WHERE NOT EXISTS (SELECT 1 FROM rewards_catalog WHERE name=$1)`,
      [name, category, points, description]
    );
  }
  console.log(`✓ Seeded ${REWARDS.length} rewards`);

  // === SAMPLE CREDITS FOR CITIZEN ===
  const { rows: existingCredits } = await db.query(
    `SELECT COUNT(*) AS c FROM citizen_credits WHERE user_id=$1`, [citizenId]
  );
  if (parseInt(existingCredits[0].c, 10) === 0) {
    await db.query(
      `INSERT INTO citizen_credits (user_id, points, reason) VALUES
        ($1, 250, 'disposal'),
        ($1, 500, 'disposal'),
        ($1, 100, 'disposal'),
        ($1, 200, 'illegal_dumping_report'),
        ($1, 200, 'disposal')`,
      [citizenId]
    );
    console.log(`✓ Seeded credits for citizen → balance: 1,250`);
  } else {
    console.log(`✓ Citizen credits already exist (skipped)`);
  }

  // === SAMPLE ALERTS ===
  const { rows: criticalBins } = await db.query(
    `SELECT id, code FROM bins WHERE status='critical' LIMIT 2`
  );
  for (const b of criticalBins) {
    await db.query(
      `INSERT INTO alerts (bin_id, type, severity, message)
       SELECT $1, 'fill_threshold', 'critical', $2
       WHERE NOT EXISTS (
         SELECT 1 FROM alerts WHERE bin_id=$1 AND resolved=false
       )`,
      [b.id, `Bin ${b.code} requires immediate attention`]
    );
  }
  console.log(`✓ Seeded ${criticalBins.length} alerts`);

  console.log('\n✅ Seed complete!\n');
  console.log('Login credentials (password: Password123!):');
  console.log('  Admin:      admin@lawma.gov.ng');
  console.log('  Contractor: contractor@tidalwave.ng');
  console.log('  Driver:     ibrahim.adeyemi@lawma.gov.ng');
  console.log('  Citizen:    adebayo.okonkwo@email.com\n');

  process.exit(0);
}

run().catch((e) => {
  console.error('❌ Seed failed:', e);
  process.exit(1);
});