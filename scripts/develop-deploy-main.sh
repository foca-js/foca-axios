#!/usr/bin/env sh

set -ex

git switch develop
git pull
git rebase origin/main

git switch main
git pull
git rebase origin/develop
git push

git switch -