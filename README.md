# screpto

Small utility to run a script across several repositories. `screpto` is a union of the words `scripts` and `repo`.

Lets say that you want to bump a version of a common dependency across several repositories of your organization. `screpto` will help you execute this kind of tasks.


## Installation

`$ git clone git@github.com:IndigoUnited/screpto.git`   
`$ cd screpto && rm -rf .git`

Why isn't this published in `npm`? Well because I didn't feel the need for it, yet..


## Configuring

Before using the tool, you need to setup the `config.json` file.
There are instructions there, simply follow them.


## Running

First create a script file with `execute` permission (`chmod +x`). It's recommend to put the script files in the `script` folder. Also, if your scripts uses `nodejs` and has a dependency, install it inside that folder so that the root `package.json` does not get polluted with the script's dependencies.   
There is an example of a script file that changes the license of a repository.

`$ screpto "*" scripts/mit_license.js`   
Will run the script for each repository.

`$ screpto "node-*" scripts/mit_license.js`   
Will run the script for each repository that starts with `node-`.

The first argument is the `pattern` which is a [minimatch](https://github.com/isaacs/minimatch) compatible pattern. For each repository that matched the pattern, `screpto` will fetch and reset it to the last commit on the remote `master` branch.

The second argument is the `script` to be run for each repository. The script will be run with `REPO_DIR` environment variable pointing to the repository directory. If the script exits with a code different than `0`, `screpto` will abort.

Isn't that easy? For more information, check the usage help with `$ screpto -h`.
