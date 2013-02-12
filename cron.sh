#!/bin/bash

cd $(dirname $0)
source config

ID=$((($(date +%s) / 3600 / NB_HOURS ) % NB_FILES))
ID=$(((ID + ID_OFFSET + NB_FILES) % NB_FILES))

./get-conso.sh $PHONE_NUMBER $TAG_PRICE \
| curl -s -T - $CURL_FTP_URL/data/$ID.json

FILES=$(curl -s $CURL_FTP_URL/data/ | grep .json \
	| sed 's:^.* \([0-9]\+\)\.json$:\1,:' | sort -n)
echo "{
	currId: $ID,
	nbHours: $NB_HOURS,
	timeStamp: $(date +%s),
	files: [ "$FILES" ],
}" | curl -s -T - $CURL_FTP_URL/state.json
