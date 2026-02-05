import { Client } from 'pg';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const runMigration = async () => {
    const client = new Client({
        connectionString: "postgresql://postgres:root@localhost:5432/saanssync",
    });

    try {
        await client.connect();
        console.log('Connected to database');

        const sqlPath = path.join(__dirname, '../../../../.gemini/antigravity/brain/b2f0a4f0-1ce2-4a9b-85aa-1bebc463bb91/chat_migration.sql');
        console.log(`Reading migration file from: ${sqlPath}`);

        if (!fs.existsSync(sqlPath)) {
            console.error('Migration file not found!');
            process.exit(1);
        }

        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log('Executing migration...');
        await client.query(sql);
        console.log('Migration executed successfully');

    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        await client.end();
    }
};

runMigration();
