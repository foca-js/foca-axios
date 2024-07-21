#!/usr/bin/env sh

set -ex

git switch develop
git pull
git rebase origin/main
git push --force-with-lease

git switch -