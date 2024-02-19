# screpto

Small utility to run a script across several repositories. `screpto` is a union of the words `scripts` and `repo`.

Lets say that you want to bump a version of a common dependency across several repositories of your organization. `screpto` will help you execute this kind of tasks.


## Installation

`$ git clone git@github.com:IndigoUnited/node-screpto.git`   
`$ cd node-screpto && npm install`

Why isn't this published in `npm`? Well because I didn't feel the need for it, yet..


## Configuring

Before using the tool, you need to setup the `config.json` file.
There are instructions there, simply follow them.


## Running

First create a script file with `execute` permission (`chmod +x`). It's recommend to put the script files in the `script` folder. Also, if your scripts uses `nodejs` and has a dependency, install it inside that folder so that the root `package.json` does not get polluted with the script's dependencies.   
There is an example of a script file that changes the license of a repository.

`$ ./screpto.js scripts/mit_license.js` "*"   
Will run the script for each repository.

`$ ./screpto.js scripts/mit_license.js` "node-*"   
Will run the script for each repository that starts with `node-`.

`$ ./screpto.js scripts/mit_license.js` "foo-*" "bar-*"
Will run the script for each repository that starts with `foo-` or `bar-`.

The second argument is the `script` to be run for each repository, with `REPO_DIR` environment variable pointing to the repository directory. If the script exits with a code different than `0`, `screpto` will abort.


The rest of the arugments are `patterns`, which are [minimatch](https://github.com/isaacs/minimatch) compatible. For each repository that matched the pattern, `screpto` will fetch and reset it to the last commit on the remote `master` branch.

Isn't that easy? For more information, check the usage help with `$ ./screpto.js -h`.
