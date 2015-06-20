'use strict';

var chalk = require('chalk');

function fail(err) {
    process.stderr.write(chalk.red('Error: ') + err.message + '\n');

    if (err.details) {
        process.stderr.write(err.details + '\n');
    }

    process.exit(1);
}

module.exports = fail;