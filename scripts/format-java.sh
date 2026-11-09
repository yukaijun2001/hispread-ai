#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../backend"
: "${GOOGLE_JAVA_FORMAT_JAR:?Set absolute path to google-java-format all-deps JAR}"
find src -name '*.java' -print0 | xargs -0 java -jar "$GOOGLE_JAVA_FORMAT_JAR" --replace
