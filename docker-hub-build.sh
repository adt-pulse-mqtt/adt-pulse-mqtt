#!/bin/bash

cd adt-pulse-mqtt

# amd64 build is automated on Docker Hub from Github Repo
# docker build -f "Dockerfile-amd64" -t digitalcraig/adt-pulse-mqtt:amd64-latest .

# armhf is failing cross-build on Docker Hub, so build locally and push
docker build -f "Dockerfile-armhf" -t digitalcraig/adt-pulse-mqtt:armhf-latest .
docker push digitalcraig/adt-pulse-mqtt:armhf-latest
