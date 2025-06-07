const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

// Load configuration
const config = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'config.json'), 'utf8'));

// Initialize SQLite database
const db = new sqlite3.Database(config.database.path, (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Connected to the opt_out database.');
        // Create opted_out_users table if it doesn't exist
        db.run(`CREATE TABLE IF NOT EXISTS opted_out_users (
            user_id TEXT PRIMARY KEY
        )`, (err) => {
            if (err) {
                console.error('Error creating opted_out_users table:', err.message);
            } else {
                console.log('Opted-out users table ready.');
            }
        });
        // Create link_fixes table if it doesn't exist
        db.run(`CREATE TABLE IF NOT EXISTS link_fixes (
            platform TEXT PRIMARY KEY,
            count INTEGER DEFAULT 0
        )`, (err) => {
            if (err) {
                console.error('Error creating link_fixes table:', err.message);
            } else {
                console.log('Link fixes table ready.');
                // Initialize rows for twitter and instagram if not present
                db.run(`INSERT OR IGNORE INTO link_fixes (platform, count) VALUES ('twitter', 0), ('instagram', 0)`);
            }
        });
    }
});

// Helper functions for database operations
function isUserOptedOut(userId) {
    return new Promise((resolve, reject) => {
        db.get('SELECT user_id FROM opted_out_users WHERE user_id = ?', [userId], (err, row) => {
            if (err) {
                reject(err);
            } else {
                resolve(!!row); // Convert to boolean
            }
        });
    });
}

function addUserToOptOut(userId) {
    return new Promise((resolve, reject) => {
        db.run('INSERT OR IGNORE INTO opted_out_users (user_id) VALUES (?)', [userId], function(err) {
            if (err) {
                reject(err);
            } else {
                resolve(this.changes > 0); // True if a row was inserted
            }
        });
    });
}

function removeUserFromOptOut(userId) {
    return new Promise((resolve, reject) => {
        db.run('DELETE FROM opted_out_users WHERE user_id = ?', [userId], function(err) {
            if (err) {
                reject(err);
            } else {
                resolve(this.changes > 0); // True if a row was deleted
            }
        });
    });
}

// Handle application shutdown
process.on('SIGINT', () => {
    db.close((err) => {
        if (err) {
            console.error('Error closing database:', err.message);
        } else {
            console.log('Database connection closed.');
        }
        process.exit(0);
    });
});

function incrementLinkFixCount(platform) {
    return new Promise((resolve, reject) => {
        db.run('UPDATE link_fixes SET count = count + 1 WHERE platform = ?', [platform], function(err) {
            if (err) {
                reject(err);
            } else {
                resolve(this.changes > 0);
            }
        });
    });
}

function getLinkFixCount(platform) {
    return new Promise((resolve, reject) => {
        db.get('SELECT count FROM link_fixes WHERE platform = ?', [platform], (err, row) => {
            if (err) {
                reject(err);
            } else {
                resolve(row ? row.count : 0);
            }
        });
    });
}

module.exports = {
    db,
    isUserOptedOut,
    addUserToOptOut,
    removeUserFromOptOut,
    incrementLinkFixCount,
    getLinkFixCount
};
