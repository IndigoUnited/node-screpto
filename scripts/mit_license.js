#!/usr/bin/env node

'use strict';

var fs   = require('fs');
var exec = require('../util/exec');

var repoDir = process.env.REPO_DIR;
var file = repoDir + '/package.json';
var pkg;

if (!fs.existsSync(file)) {
    return;
}

// Read package json
pkg = require(file);

// Is it ok already?
if (pkg.license === 'MIT') {
    process.stdout.write('Nothing to be changed.\n');
    process.exit();
}

// Change to MIT and save file
pkg.license = 'MIT';
fs.writeFileSync(file + '/package.json', JSON.stringify(pkg, null, 2) + '\n');

// Commit & push
exec('git', ['commit', '-a', '-m', 'Change license to MIT (made with screpto)'], { cwd: repoDir });
exec('git', ['push'], { cwd: repoDir, stdio: 'inherit' });