import { pool } from './pool';

export async function seedRealisticPrivacyLedger() {
  const client = await pool.connect();
  try {
    console.log('Seeding clean 20-round Differential Privacy ledger in PostgreSQL...');
    await client.query('BEGIN');

    // Clean existing test records in privacy_budget_ledger
    await client.query('DELETE FROM privacy_budget_ledger');

    const countries = [
      { code: 'IN', baseGrowth: 0.22, name: 'India' },
      { code: 'BR', baseGrowth: 0.18, name: 'Brazil' },
      { code: 'RU', baseGrowth: 0.24, name: 'Russia' },
      { code: 'CN', baseGrowth: 0.16, name: 'China' },
      { code: 'ZA', baseGrowth: 0.25, name: 'South Africa' },
    ];

    const totalRounds = 20;
    const budgetLimit = 5.0;

    for (let round = 1; round <= totalRounds; round++) {
      for (const c of countries) {
        // Monotonic growth with small jitter
        const noise = (Math.sin(round * 1.5 + c.code.charCodeAt(0)) * 0.03);
        const epsilonThisRound = Math.max(0.10, Number((c.baseGrowth + noise).toFixed(3)));
        const cumulativeEpsilon = Number(Math.min(budgetLimit * 0.95, (epsilonThisRound * round * 0.92)).toFixed(3));
        const deltaThisRound = 0.00001;
        const withinBudget = cumulativeEpsilon <= budgetLimit;

        await client.query(
          `INSERT INTO privacy_budget_ledger (
             id, country_id, federation_round_id, round_number,
             epsilon_this_round, epsilon_consumed, delta_this_round,
             cumulative_epsilon, budget_limit, clip_norm, noise_multiplier,
             local_sample_count, submitted, within_budget, recorded_at
           ) VALUES (
             gen_random_uuid(), $1, gen_random_uuid(), $2, $3, $3, $4, $5, $6, 1.0, 1.12, $7, true, $8,
             now() - ($9 || ' hours')::interval
           )`,
          [
            c.code,
            round,
            epsilonThisRound,
            deltaThisRound,
            cumulativeEpsilon,
            budgetLimit,
            1200 + round * 150,
            withinBudget,
            `${(totalRounds - round) * 2}`,
          ]
        );
      }
    }

    await client.query('COMMIT');
    console.log(`Successfully seeded ${totalRounds} federated rounds across 5 BRICS nations (100 ledger rows).`);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error seeding privacy ledger:', err);
  } finally {
    client.release();
  }
}

if (require.main === module) {
  seedRealisticPrivacyLedger().then(() => pool.end());
}
