#!/bin/bash

# Find and kill any Node.js processes using port 5000
echo "Looking for processes using port 5000..."
pid=$(lsof -t -i:5000)

if [ -z "$pid" ]; then
  echo "No process found using port 5000"
else
  echo "Killing process $pid using port 5000"
  kill -9 $pid
  echo "Process killed"
fi