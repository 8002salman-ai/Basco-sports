const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres:Supabase123Supabase@db.ljzpwkzdudnyowzkzgtc.supabase.co:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    await client.connect();
    console.log('Connected to Supabase DB!');

    // Create admin_users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS admin_users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        name TEXT NOT NULL,
        role TEXT NOT NULL CHECK (role IN ('owner', 'admin')),
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);
    console.log('✅ admin_users table created');

    // Create index
    await client.query('CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users (email)');
    console.log('✅ Index created');

    // Enable RLS
    await client.query('ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY');
    console.log('✅ RLS enabled');

    // Create RLS policy
    const policyCheck = await client.query("SELECT 1 FROM pg_policies WHERE policyname = 'admin_users_service_only'");
    if (policyCheck.rows.length === 0) {
      await client.query("CREATE POLICY admin_users_service_only ON admin_users FOR ALL TO service_role USING (true) WITH CHECK (true)");
      console.log('✅ RLS policy created');
    } else {
      console.log('✅ RLS policy already exists');
    }

    // Seed Salman
    await client.query(`
      INSERT INTO admin_users (email, password_hash, name, role, is_active) VALUES
        ('8002salman@gmail.com', 'pbkdf2$600000$x44zMNg1nyH1PQeBhLZbNg==$G/+Rzl9HjzZ/jaxaIsvprcrnU09gFpYkjSURxC1hevs=', 'Salman Bashir', 'owner', true),
        ('k@basco-sports.com', 'pbkdf2$600000$jxU2P0aNTrimG6RckGmBTA==$78Mf1OpHwgLvQGKJ/2lII8MSTmlcHubDInm3pn6TIq4=', 'Khurram', 'admin', true)
      ON CONFLICT (email) DO NOTHING;
    `);
    console.log('✅ Salman & Khurram seeded');

    // Verify
    const result = await client.query('SELECT id, email, name, role, is_active FROM admin_users ORDER BY created_at');
    console.log('📊 Admin users:');
    result.rows.forEach(r => console.log(`  - ${r.name} (${r.email}) — ${r.role} — active: ${r.is_active}`));

    await client.end();
    console.log('\nDone!');
  } catch (e) {
    console.error('Error:', e.message);
    await client.end();
    process.exit(1);
  }
}

run();
