#!/bin/bash

cd $(dirname $0)
source config

echo "setting up site:"
cat config

STEP() { printf "\r%-30s" "$@"; }

STEP "checking boobill"
boobill -I ls | grep -q -- "$PHONE_NUMBER -" || {
	echo "no setup for phone number: $PHONE_NUMBER"
	exit 1
}

for f in index.html *.js *.css; do
	STEP "installing $f..."
	curl -s -T $f --ftp-create-dirs $CURL_FTP_URL/ || exit 1
done

STEP "creating data/ dir"
echo -n \
| curl -s -T - --ftp-create-dirs $CURL_FTP_URL/data/state.json || exit 1

STEP "installing .htaccess"
( cat << EOF 
ErrorDocument 404 "<html><script>location.replace('./')</script></html>"
AddDefaultCharset UTF-8
EOF
) | curl -s -T - $CURL_FTP_URL/.htaccess || exit 1

STEP "initializing"
./cron.sh

STEP "updating crontab"
{ crontab -l; echo "0 * * * * $PWD/cron.sh"; } | crontab -

STEP "current crontab:"
echo
crontab -l | grep $PWD/cron.sh
