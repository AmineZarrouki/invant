import fs from 'fs';
import path from 'path';

// Let's run a test by importing or writing the json files
const DATA_DIR = path.join(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

console.log('Seed initialization script ready.');
