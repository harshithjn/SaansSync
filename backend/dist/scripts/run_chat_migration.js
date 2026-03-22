"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const pg_1 = require("pg");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const runMigration = async () => {
    const client = new pg_1.Client({
        connectionString: "postgresql://postgres:root@localhost:5432/saanssync",
    });
    try {
        await client.connect();
        console.log('Connected to database');
        const sqlPath = path_1.default.join(__dirname, '../../../../.gemini/antigravity/brain/b2f0a4f0-1ce2-4a9b-85aa-1bebc463bb91/chat_migration.sql');
        console.log(`Reading migration file from: ${sqlPath}`);
        if (!fs_1.default.existsSync(sqlPath)) {
            console.error('Migration file not found!');
            process.exit(1);
        }
        const sql = fs_1.default.readFileSync(sqlPath, 'utf8');
        console.log('Executing migration...');
        await client.query(sql);
        console.log('Migration executed successfully');
    }
    catch (err) {
        console.error('Migration failed:', err);
    }
    finally {
        await client.end();
    }
};
runMigration();
//# sourceMappingURL=run_chat_migration.js.map