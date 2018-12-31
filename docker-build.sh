#!/bin/bash

cd adt-pulse-mqtt

# Default build is based on homeassistant/amd64-base:latest
#
# To specify a different platform, set BUILD_FROM to a different base image:
# homeassistant/armhf-base
# homeassistant/amd64-base
# homeassistant/aarch64-base
# homeassistant/i386-base

docker build --build-arg BUILD_FROM="homeassistant/amd64-base:latest" -t local/adt-pulse-mqtt .
