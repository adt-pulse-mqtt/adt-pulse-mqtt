#!/bin/bash

cd adt-pulse-mqtt
docker build --build-arg BUILD_FROM="homeassistant/amd64-base:latest" -t local/adt-pulse-mqtt .
