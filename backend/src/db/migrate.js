require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const pool = require('./pool');

const migrate = async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(100) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        phone VARCHAR(20),
        referral_code VARCHAR(20) UNIQUE NOT NULL,
        referred_by UUID REFERENCES users(id),
        role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin')),
        balance NUMERIC(12,2) DEFAULT 0,
        total_earned NUMERIC(12,2) DEFAULT 0,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Banking details table
    await client.query(`
      CREATE TABLE IF NOT EXISTS banking_details (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
        bank_name VARCHAR(100) NOT NULL,
        account_holder VARCHAR(100) NOT NULL,
        account_number VARCHAR(50) NOT NULL,
        branch_code VARCHAR(20) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Investments table
    await client.query(`
      CREATE TABLE IF NOT EXISTS investments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        package_name VARCHAR(50) NOT NULL,
        amount NUMERIC(12,2) NOT NULL,
        daily_profit NUMERIC(12,2) NOT NULL,
        total_profit NUMERIC(12,2) NOT NULL,
        start_date TIMESTAMP,
        end_date TIMESTAMP,
        days_elapsed INTEGER DEFAULT 0,
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed', 'rejected')),
        pop_image_url VARCHAR(500),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Transactions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS transactions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        investment_id UUID REFERENCES investments(id),
        type VARCHAR(30) NOT NULL CHECK (type IN ('investment', 'daily_profit', 'referral_bonus', 'withdrawal')),
        amount NUMERIC(12,2) NOT NULL,
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
        description TEXT,
        pop_image_url VARCHAR(500),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Withdrawals table
    await client.query(`
      CREATE TABLE IF NOT EXISTS withdrawals (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        amount NUMERIC(12,2) NOT NULL,
        bank_name VARCHAR(100) NOT NULL,
        account_holder VARCHAR(100) NOT NULL,
        account_number VARCHAR(50) NOT NULL,
        branch_code VARCHAR(20) NOT NULL,
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
        admin_note TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Referral commissions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS referral_commissions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        beneficiary_id UUID REFERENCES users(id) ON DELETE CASCADE,
        source_user_id UUID REFERENCES users(id),
        investment_id UUID REFERENCES investments(id),
        level INTEGER NOT NULL CHECK (level IN (1, 2, 3)),
        rate NUMERIC(5,2) NOT NULL,
        amount NUMERIC(12,2) NOT NULL,
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'paid')),
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await client.query('COMMIT');
    console.log('✅ Database migration completed successfully');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
};

migrate().catch((err) => {
  console.error(err);
  process.exit(1);
});
