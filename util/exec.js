'use strict';

var cp   = require('child_process');
var fail = require('./fail');

function exec(command, args, options) {
    var ret;

    if (!Array.isArray(args)) {
        options = args;
        args = [];
    }

    ret = cp.spawnSync(command, args, options);

    if (ret.error) {
        ret.error.details = 'Command was: ' + command + (' ' + args.join(' ')).trim();
        fail(ret.error);
    }

    if (ret.status) {
        fail(new Error('Command exited with code ' + ret.status, 'EEXEC', {
            details: 'Command was: ' + command + (' ' + args.join(' ')).trim()
        }));
    }

    return ret;
}

module.exports = exec;