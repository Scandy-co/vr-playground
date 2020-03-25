#!/bin/sh

# Help script to ip address of computer or quest

: ${ADB=false}

ip=""

if $ADB; then
  ip=$(adb shell ifconfig | grep 'inet ' | grep 'Bcast' | awk '{print $2}' | awk -F ':' '{print $2}')
else
  ip=$(ifconfig | grep 'inet ' | grep 'broadcast' | awk '{print $2}')
fi

echo $ip
