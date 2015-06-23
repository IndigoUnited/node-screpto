'use strict';

var cp      = require('child_process');
var errcode = require('err-code');
var fail    = require('./fail');

function exec(command, args, options) {
    var ret;

    if (!Array.isArray(args)) {
        options = args;
        args = [];
    }

    options = options || {};
    ret = cp.spawnSync(command, args, options);

    if (ret.error) {
        ret.error.details = 'Command was: ' + command + ' ' + args.join(' ');
        fail(ret.error);
    }

    if (ret.status && (!options.status || options.status.indexOf(ret.status) === -1)) {
        fail(errcode(new Error('Command exited with code ' + ret.status), 'EEXEC', {
            details: 'Command was: ' + command + ' ' + args.join(' ')
        }));
    }

    return ret;
}

module.exports = exec;