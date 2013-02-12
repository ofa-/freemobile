#!/bin/bash

NUMBER=$1
TAG_PRICE=$2

export LANG=C

num() { tr -dc '[0-9.]'; }
hms() { tr -d ' '; }
add() { echo $@ | tr ' ' '\n' | awk '{x+=$1} END {print x}'; }

add_hms() {
	secs=$(echo $@ | tr ' ' '\n' | tr '[a-z]' ' ' | \
	awk '{ h += $1; m += $2; s += $3 } END { print s + m*60 + h*3600 }')
	date -ud @$secs +'%Hh %Mm %Ss'
}

pretty_time() {
	sed 's:\b0::g; s:0h ::; s:0m ::' | sed 's:h: h:; s:m: min:;'
}

get_field() {
	echo "$DATA" | grep -- "$NUMBER-$1@" | cut -d';' -f${2:-3}
}

get_costs() {
	echo "$DATA" | grep -- "$NUMBER-" | cut -d';' -f5
}

DATA=$(boobill -I 'formatter csv; details' 2>/dev/null)

voice_nat=$(get_field voice | sed 's/^National : \([^|]*\).*/\1/' | hms)
voice_int=$(get_field voice | sed 's/.*International : \(.*\)$/\1/' | hms)
voice_spe=$(get_field numéros | hms)
sms_nat=$(get_field sms | num)
mms_nat=$(get_field mms | num)
data_nat=$(get_field data | num)
sms_int=$(get_field sms-inter | num)
mms_int=$(get_field mms-inter | num)
data_int=$(get_field data-inter | num)
voice_int_details=$(get_field voice-inter) # not used

voice=$(add_hms $voice_nat $voice_int $voice_spe | pretty_time)
sms=$(add $sms_nat $sms_int)
mms=$(add $mms_nat $mms_int)
data=$(printf "%.2f" $(add 0$data_nat 0$data_int))
cost=$(printf "%.2f" $(add $(get_costs) $TAG_PRICE))

cat << EOF
{
	date:	"$(date +%d.%m)",
	time:	"$(date +%kh)",
	voice:	"$voice",
	sms:	$sms,
	mms:	$mms,
	data:	$data,
	cost:	$cost,
}
EOF
