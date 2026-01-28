/**
 * Migration Script: Encrypt Existing OpenAI Keys
 * 
 * This script encrypts any plaintext OpenAI keys in the organizations table
 * Run once after deploying the encryption feature
 * 
 * Usage: node scripts/encryptExistingKeys.js
 */

require('dotenv').config();
const encryptionService = require('../src/services/encryptionService');
const { supabaseAdmin } = require('../src/config/supabase');

async function encryptExistingKeys() {
    console.log('🔐 Starting OpenAI key encryption migration...\n');

    try {
        // 1. Fetch all organizations with OpenAI keys
        const { data: organizations, error } = await supabaseAdmin
            .from('organizations')
            .select('id, name, openai_api_key')
            .not('openai_api_key', 'is', null);

        if (error) {
            throw new Error(`Failed to fetch organizations: ${error.message}`);
        }

        if (!organizations || organizations.length === 0) {
            console.log('✅ No organizations with OpenAI keys found.');
            return;
        }

        console.log(`Found ${organizations.length} organization(s) with OpenAI keys.\n`);

        let encryptedCount = 0;
        let alreadyEncryptedCount = 0;

        // 2. Process each organization
        for (const org of organizations) {
            console.log(`Processing: ${org.name} (${org.id})`);

            // Check if already encrypted
            if (encryptionService.isEncrypted(org.openai_api_key)) {
                console.log(`  ✅ Already encrypted (skipping)\n`);
                alreadyEncryptedCount++;
                continue;
            }

            try {
                // Encrypt the plaintext key
                const encryptedKey = encryptionService.encrypt(org.openai_api_key);

                // Update database
                const { error: updateError } = await supabaseAdmin
                    .from('organizations')
                    .update({ openai_api_key: encryptedKey })
                    .eq('id', org.id);

                if (updateError) {
                    throw new Error(`Failed to update: ${updateError.message}`);
                }

                console.log(`  ✅ Encrypted successfully\n`);
                encryptedCount++;

            } catch (err) {
                console.error(`  ❌ Error: ${err.message}\n`);
            }
        }

        // 3. Summary
        console.log('='.repeat(50));
        console.log('🎊 Migration complete!\n');
        console.log(`Total organizations: ${organizations.length}`);
        console.log(`Newly encrypted: ${encryptedCount}`);
        console.log(`Already encrypted: ${alreadyEncryptedCount}`);
        console.log('='.repeat(50));

    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        process.exit(1);
    }
}

// Run migration
encryptExistingKeys()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
