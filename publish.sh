#!/bin/bash -e

FILES="index.html *.js *.css"

init() {
	cd $(dirname $0)
	trap 'echo -e "\npublish failed for $CURL_FTP_URL" >&2' ERR
}

STEP() { printf "\r%-30s" "$1"; }

init

STEP "reading config"
source ./config

STEP "checking server"
if ! curl -s $CURL_FTP_URL/data/ &> /dev/null; then
	STEP "creating directories"
	echo -n | curl -s -T - --ftp-create-dirs \
			$CURL_FTP_URL/data/state.json
fi

STEP "installing webapp"
for f in $FILES; do
	STEP "installing $f"
	curl -s -T $f $CURL_FTP_URL/
done

STEP "installing manifest"
( cat << EOF 
MANIFEST
# $(date +'%F %T')
$(for f in $FILES; do echo $f; done)
NETWORK:
data/
*
EOF
) | curl -s -T - $CURL_FTP_URL/manifest.mf

STEP "installing .htaccess"
( cat << EOF 
ErrorDocument 404 "<html><script>location.replace('./')</script></html>"
AddDefaultCharset UTF-8
AddType text/cache-manifest .mf
EOF
) | curl -s -T - $CURL_FTP_URL/.htaccess

STEP "publishing done"
echo
