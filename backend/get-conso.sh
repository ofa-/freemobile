#!/bin/bash

NUMBER=$1
TAG_PRICE=$2

num() { tr -dc '[0-9.]' ; }
sec() { tr -c '[0-9]' " " | awk '{h=$1; m=$2; s=$3; print s + m*60 + h*3600}'; }
get_field() { echo "$DATA" | grep -- "$NUMBER-$1@" | cut -d';' -f3 ; }
get_costs() { echo "$DATA" | grep -- "$NUMBER-" | cut -d';' -f5 ; }

DATA=$(boobill -I 'formatter csv; details' 2>/dev/null)

voice_nat=$(get_field voice | sed 's/^National : \([^|]*\).*/\1/' | sec)
voice_int=$(get_field voice | sed 's/.*International : \(.*\)$/\1/' | sec)
voice_spe=$(get_field numéros | sec)
sms_nat=$(get_field sms | num)
mms_nat=$(get_field mms | num)
data_nat=$(get_field data | num)
sms_int=$(get_field sms-inter | num)
mms_int=$(get_field mms-inter | num)
data_int=$(get_field data-inter | num)
voice_int_details=$(get_field voice-inter) # not used

get_field data		| grep -q Mo || data_nat=$(printf "0.%03d" "$data_nat")
get_field data-inter	| grep -q Mo || data_int=$(printf "0.%03d" "$data_int")

export LANG=C
add() { awk '{ x += $1 } END { print x }'; }
cost=$(printf "%.2f" $({ get_costs; echo $TAG_PRICE; } | add))

cat << EOF
{
	timestamp:	$(date +%s),
	voice_nat:	$voice_nat,	// s
	voice_int:	$voice_int,	// s
	voice_spe:	$voice_spe,	// s
	sms_nat:	$sms_nat,
	sms_int:	$sms_int,
	mms_nat:	$mms_nat,
	mms_int:	$mms_int,
	data_nat:	$data_nat,	// Mo
	data_int:	$data_int,	// Mo
	cost:		$cost,
}
EOF
