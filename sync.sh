#!/bin/sh

# 任一步骤执行失败都会终止整个部署过程
set -e

printf "\033[0;32mCommitting updates to Git...\033[0m\n"

# 另存本地修改
git stash

# 拉取最新代码
git pull

# 取出本地修改
git stash pop

# 添加更改到 git
git add --all

# 提交更改
git commit -m "$1"

# 推送到远程仓库
git push --force origin main
