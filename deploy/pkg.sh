#/usr/bin/env bash

set -x -e

# tar --create --bzip2 [--file ARCHIVE] [OPTIONS] [FILE...]
# tar {--diff|--compare} [--file ARCHIVE] [OPTIONS] [FILE...]
# tar --delete [--file ARCHIVE] [OPTIONS] [MEMBER...]
# tar --append [-f ARCHIVE] [OPTIONS] [FILE...]

## Env

_NAME="truthsayer"
_VERSION="$(date +'%Y.%m.%d-%H.%M.%S')"

_TARGET_DIR="./deploy/pkgs"

mkdir --parents $_TARGET_DIR

_REPO_PATH="./"

## Local var

_PKG_FILE="${_NAME}-${_VERSION}.tag.gz"
_PKG_PATH="${_TARGET_DIR}/${_PKG_FILE}"

## Build

yarn build

## Pack

tar \
  --create \
  --gzip \
  --file "${_PKG_PATH}" \
  ${_REPO_PATH}/build \

## Ready

echo "Package is ready!"
echo "Copy it to the server by : scp -P 5326 ${_PKG_PATH} \[2a03:b0c0:1:e0::443:5001\]:"
echo "Unpack on the service by : tar --extract --gzip --file=./${_PKG_FILE}"
