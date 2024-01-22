#!/bin/sh

IMAGE_NAME=registry.digitalocean.com/code-rendezvous/code-rendezvous
docker build -t code-rendezvous -t $IMAGE_NAME .
docker push $IMAGE_NAME
