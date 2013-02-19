#!/bin/bash -e

init() {
	cd $(dirname $0)
	trap 'echo -e "\ninit failed" >&2' ERR
}

check_create_config() {
	[ -f config ] && return 0
	cp config.sample config
	echo "created config from sample.  please edit."
	return 1
}

STEP() { printf "\r%-30s" "$1"; }

init
check_create_config || exit 0

STEP "reading config"
source ./config
echo
cat config

STEP "installing webapp"
./publish.sh

STEP "checking boobill"
boobill -I ls | grep -q -- "$PHONE_NUMBER -" || {
	echo "no setup for phone number: $PHONE_NUMBER"
	exit 1
}

STEP "initializing"
./cron.sh

STEP "updating crontab"
{ crontab -l; echo "0 * * * * $PWD/cron.sh"; } | crontab -

STEP "current crontab:"
echo
crontab -l | grep $PWD/cron.sh
