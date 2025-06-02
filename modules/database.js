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
        // Create table if it doesn't exist
        db.run(`CREATE TABLE IF NOT EXISTS opted_out_users (
            user_id TEXT PRIMARY KEY
        )`, (err) => {
            if (err) {
                console.error('Error creating table:', err.message);
            } else {
                console.log('Opted-out users table ready.');
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

module.exports = {
    db,
    isUserOptedOut,
    addUserToOptOut,
    removeUserFromOptOut
};
