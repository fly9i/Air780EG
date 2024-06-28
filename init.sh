#!/bin/sh

# copy database.dat to /app/data if not exist
if [ ! -f /app/data/database.dat ]; then
    cp /app/database.dat /app/data/database.dat
fi

node /app/air780eg/index.js