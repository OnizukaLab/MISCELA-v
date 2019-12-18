#!/bin/bash

RETRIES=10

until mongo -h mongo -u miscela -c "\l" > /dev/null 2>&1 || [ $RETRIES -eq 0 ]; do
  echo "Waiting for postgres server, $((RETRIES--)) remaining attempts..."
  sleep 1
done

echo "Postgresql server is ready"
