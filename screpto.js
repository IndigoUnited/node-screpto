#!/usr/bin/env node

'use strict';

var program   = require('commander');
var fs        = require('fs');
var promptly  = require('promptly');
var path      = require('path');
var request   = require('request');
var errcode   = require('err-code');
var chalk     = require('chalk');
var async     = require('async');
var minimatch = require('minimatch');
var find      = require('mout/array/find');
var pick      = require('mout/object/pick');
var mixIn     = require('mout/object/mixin');
var rpad      = require('mout/string/rpad');
var fail      = require('./util/fail');
var exec      = require('./util/exec');
var pkg       = require('./package.json');
var config    = require('./config.json');

var executed;

program
  .version(pkg.version);

program
  .arguments('<pattern> <script>')
  .description('Runs script for each repository that matched a pattern.')
  .option('-c, --config <name>', 'the config to be used (e.g.: myself, myorg)')
  .action(entrypoint);

// Ugly hack, * has a special meaning in commander
process.argv.forEach(function (arg, index) {
    if (arg === '*') {
        process.argv[index] = '?';
    }
});

program.parse(process.argv);

if (!executed) {
    program.help();
}

// ------------------------------------

function entrypoint(pattern, script, options) {
    executed = true;

    pattern = pattern.replace(/\?/g, '*');
    setupConfig(options.config);

    // List repos
    listRepos(pattern, function (err, repos) {
        if (err) {
            return fail(err);
        }

        if (!repos.length) {
            process.stdout.write('No repositories matched the pattern ' + pattern + '.\n');
            process.exit();
        }

        // Proceed?
        confirmWithUser(repos, function () {
            // For each repo, fetch and script it
            repos.forEach(function (repo) {
                fetchRepo(repo);
                scriptRepo(repo, script);
            });
        });
    });
}

// ------------------------------------

function setupConfig(name) {
    if (!name) {
        name = Object.keys(config)[0];

        if (!name) {
            fail(new Error('Please fill the config.json file'));
        }
    }

    config = config[name];

    if (!config) {
        fail(new Error('Unknown config name ' + name));
    }

    process.stdout.write(chalk.bold(chalk.cyan('>') + ' Using ' + name + ' configuration\n'));
}

function listRepos(pattern, callback) {
    var url = 'https://api.github.com/' + config.type + 's/' + config.name + '/repos?access_token=' + config.access_token;
    var allRepos = [];

    process.stdout.write(chalk.bold(chalk.cyan('>') + ' Fetching repositories from GitHub\n'));

    async.doWhilst(function (callback) {
        process.stdout.write(url + '\n');

        request(url, {
            headers: {
                'User-Agent': 'request',
                'Accept': 'application/vnd.github.v3+json'
            }
        }, function (err, response, body) {
            var repos;
            var pages;
            var nextPage;

            if (err) {
                return callback(err);
            }

            if (response.statusCode !== 200) {
                return callback(errcode('GitHub response code: ' + response.statusCode, 'EREQFAIL', {
                    details: JSON.stringify(JSON.parse(body), null, 2)
                } ));
            }

            body = JSON.parse(body);

            // Process repos
            repos = body.map(function (repo) {
                return pick(repo, ['name', 'html_url', 'ssh_url']);
            });

            if (pattern) {
                repos = repos.filter(function (repo) {
                    return minimatch(repo.name, pattern);
                });
            }

            allRepos.push.apply(allRepos, repos);

            // Check if we got a next page
            if (!response.headers.link) {
                url = null;
            } else {
                pages = response.headers.link.split(',').map(function (link) {
                    var match = link.trim().match(/^<([^>]+?)>; rel="([^"]+?)"$/);

                    if (!match) {
                        return callback(new Error('Unable to parse Link header', 'EPARSELINK', {
                            details: response.headers.link
                        }));
                    }

                    return {
                        url: match[1],
                        type: match[2]
                    };
                });

                nextPage = find(pages, function (link) {
                    return link.type == 'next';
                });

                url = nextPage ? nextPage.url : null;
            }
            callback();
        });
    }, function () {
        return !!url;
    }, function (err) {
        if (err) {
            return callback(err);
        }

        allRepos.forEach(function (repo) {
            repo.dir = path.join(config.dir || 'repos/' + config.name, repo.name);
        });

        return callback(null, allRepos);
    });
}

function confirmWithUser(repos, callback) {
    process.stdout.write(chalk.bold(chalk.cyan('>') + ' The script will run on these repositories:\n'));

    repos.forEach(function (repo) {
        process.stdout.write(rpad(repo.name, 25) + ' ' + repo.html_url + '\n');
    });

    process.stdout.write('\n');

    promptly.confirm('Shall I proceed? [y/n]', function (err, res) {
        if (!res) {
            process.exit(1);
        }

        callback();
    });
}

function fetchRepo(repo) {
    process.stdout.write(chalk.bold(chalk.cyan('>') + ' Fetching ' + repo.name + '\n'));

    if (!fs.existsSync(repo.dir)) {
        exec('git', ['clone', repo.ssh_url, repo.dir], { stdio: 'inherit' });
    } else {
        exec('git', ['fetch', '--prune'], { cwd: repo.dir, stdio: 'inherit' });
    }

    exec('git', ['fetch', '--tags'], { cwd: repo.dir, stdio: 'inherit' });
    exec('git', ['reset', '--hard', 'refs/remotes/origin/master'], { cwd: repo.dir, stdio: 'inherit' });
}

function scriptRepo(repo, script) {
    process.stdout.write(chalk.bold(chalk.cyan('>') + ' Running script on ' + repo.name + '\n'));

    exec(path.resolve(script), {
        env: mixIn({ REPO_DIR: path.resolve(repo.dir) }, process.env),
        stdio: 'inherit'
    });
}
