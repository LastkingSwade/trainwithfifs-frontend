#!/usr/bin/env bash
# FIFS: read-only, SCHEMA-ONLY review dump of the PRODUCTION Supabase database.
#
# Owner-run only. It is never run by tests or by Claude. It performs reads (pg_dump --schema-only via the pinned
# Supabase CLI); it writes nothing to the database and never dumps table data, auth users, or storage files.
#
# Credentials: the database password is typed at a hidden prompt and percent-encoded for you (so a "#" in it becomes
# %23 and cannot truncate the URL). It is never put on this script's command line, printed, logged, or written to
# disk. The connection-string TEMPLATE you paste is the one the dashboard shows, with [YOUR-PASSWORD] left in it.
#
# Outputs (owner-readable only, refused if they already exist):
#   ~/Desktop/fifs-production-schema-review.sql          default schema dump (public and other user schemas)
#   ~/Desktop/fifs-production-storage-schema-review.sql  OPTIONAL storage schema dump (storage.objects policies).
#                                                        Whether the pinned CLI accepts --schema storage is UNVERIFIED;
#                                                        if it fails the script says so and you use the SQL editor
#                                                        queries in docs/supabase/storage-and-privilege-evidence-queries.sql.
# See docs/supabase/schema-dump-runbook.md.

set -euo pipefail
set +x
umask 077

EXPECTED_REF="ufqnmcincwnlyiwsmzcq"
CLI="supabase@2.119.0"
OUT_DIR="${HOME}/Desktop"
OUT_MAIN="${OUT_DIR}/fifs-production-schema-review.sql"
OUT_STORAGE="${OUT_DIR}/fifs-production-storage-schema-review.sql"
PLACEHOLDER="[YOUR-PASSWORD]"

# Reads a raw password on stdin and writes it percent-encoded: everything except A-Z a-z 0-9 _ . ~ - becomes %XX.
fifs_encode_password() {
  python3 -c 'import sys, urllib.parse; sys.stdout.write(urllib.parse.quote(sys.stdin.read(), safe=""))'
}

# fifs_build_db_url TEMPLATE RAW_PASSWORD TARGET_VARIABLE_NAME
# Validates the dashboard template and stores the finished URL in the named variable. It never prints the password
# or the URL; refusals say why without echoing what was pasted.
fifs_build_db_url() {
  local template="$1" password="$2" target="$3" without encoded url
  case "$template" in
    postgres://*|postgresql://*) ;;
    *) echo "Refusing: the connection string must start with postgresql://" >&2; return 1 ;;
  esac
  case "$template" in
    *"#"*) echo "Refusing: the pasted string contains '#'. Paste the dashboard template (with ${PLACEHOLDER} where the password goes); the password is entered separately and encoded for you (# becomes %23)." >&2; return 1 ;;
  esac
  case "$template" in
    *[[:space:]]*) echo "Refusing: the pasted string contains whitespace." >&2; return 1 ;;
  esac
  case "$template" in
    *"$EXPECTED_REF"*) ;;
    *) echo "Refusing: the connection string does not target project ${EXPECTED_REF}." >&2; return 1 ;;
  esac
  without="${template//\[YOUR-PASSWORD\]/}"
  if [ "$without" = "$template" ]; then
    echo "Refusing: the template does not contain ${PLACEHOLDER}. Do not paste a real password into this prompt." >&2
    return 1
  fi
  # ${PLACEHOLDER} is 15 characters; exactly one occurrence must have been removed.
  if [ "${#template}" -ne $(( ${#without} + 15 )) ]; then
    echo "Refusing: the template contains ${PLACEHOLDER} more than once." >&2
    return 1
  fi
  if [ -z "$password" ]; then
    echo "Refusing: the password is empty." >&2
    return 1
  fi
  encoded="$(printf '%s' "$password" | fifs_encode_password)"
  if [ -z "$encoded" ]; then
    echo "Refusing: the password could not be encoded (is python3 installed?)." >&2
    return 1
  fi
  url="${template/\[YOUR-PASSWORD\]/$encoded}"
  case "$url" in
    *"#"*|*[[:space:]]*) echo "Refusing: the finished connection string is not a valid URL." >&2; return 1 ;;
  esac
  printf -v "$target" '%s' "$url"
}

# Removes a file this script created, then fails.
fifs_discard_and_fail() {
  local file="$1" message="$2"
  [ -n "$file" ] && [ -e "$file" ] && rm -f -- "$file"
  echo "$message" >&2
  return 1
}

# fifs_check_dump FILE : the dump must be schema-only and must not contain the database password.
fifs_check_dump() {
  local file="$1" data_lines
  [ -s "$file" ] || { echo "The dump file is empty." >&2; return 1; }
  data_lines="$(grep -cE '^(INSERT INTO|COPY .+ FROM stdin)' "$file" || true)"
  if [ "${data_lines:-0}" -ne 0 ]; then
    echo "The dump contains ${data_lines} data statements; it is not schema-only." >&2
    return 1
  fi
  # The password is read by grep from a file descriptor, never from the command line.
  if grep -qF -f <(printf '%s\n' "$FIFS_DB_PASSWORD") "$file"; then
    echo "The dump file contains the database password." >&2
    return 1
  fi
}

fifs_main() {
  # Cheap local refusals first: nothing is prompted, installed, or contacted if an output already exists.
  local existing
  for existing in "$OUT_MAIN" "$OUT_STORAGE"; do
    if [ -e "$existing" ]; then
      echo "Refusing: $existing already exists. Move or delete it yourself, then run again. Nothing was run." >&2
      exit 1
    fi
  done
  command -v python3 >/dev/null 2>&1 || { echo "Refusing: python3 is required to encode the password." >&2; exit 1; }
  command -v npx >/dev/null 2>&1 || { echo "Refusing: npx (Node.js) is required to run the pinned Supabase CLI." >&2; exit 1; }
  if ! docker info >/dev/null 2>&1; then
    echo "Refusing: Docker is not running. Start Docker Desktop and try again." >&2
    exit 1
  fi

  local template FIFS_DB_PASSWORD FIFS_DB_URL status storage_status tmp_main tmp_storage
  printf 'Paste the Production connection string TEMPLATE from the dashboard, with %s still in it: ' "$PLACEHOLDER"
  IFS= read -r template
  printf 'Database password (input hidden): '
  IFS= read -rs FIFS_DB_PASSWORD
  echo
  trap 'unset FIFS_DB_PASSWORD FIFS_DB_URL template' EXIT

  fifs_build_db_url "$template" "$FIFS_DB_PASSWORD" FIFS_DB_URL || exit 1
  unset template

  tmp_main="${OUT_MAIN}.partial"
  tmp_storage="${OUT_STORAGE}.partial"
  echo "Target project ref check passed (${EXPECTED_REF}). Running the schema-only dump (this pulls the pinned CLI via npx)..."

  status=0
  npx --yes "$CLI" db dump --db-url "$FIFS_DB_URL" --file "$tmp_main" || status=$?
  if [ "$status" -ne 0 ]; then
    fifs_discard_and_fail "$tmp_main" "Dump did not complete (exit ${status})." || exit 1
  fi
  fifs_check_dump "$tmp_main" || { fifs_discard_and_fail "$tmp_main" "Discarded the main dump."; exit 1; }
  mv -- "$tmp_main" "$OUT_MAIN"
  chmod 600 "$OUT_MAIN"
  echo "Done: $OUT_MAIN ($(wc -c < "$OUT_MAIN" | tr -d ' ') bytes, $(grep -c '^CREATE POLICY' "$OUT_MAIN" || true) CREATE POLICY lines). Contents not displayed."

  # Optional storage schema dump (storage.objects policies live there). Failure here is not fatal.
  storage_status=0
  npx --yes "$CLI" db dump --db-url "$FIFS_DB_URL" --schema storage --file "$tmp_storage" || storage_status=$?
  if [ "$storage_status" -eq 0 ] && fifs_check_dump "$tmp_storage"; then
    mv -- "$tmp_storage" "$OUT_STORAGE"
    chmod 600 "$OUT_STORAGE"
    echo "Done: $OUT_STORAGE ($(wc -c < "$OUT_STORAGE" | tr -d ' ') bytes, $(grep -c '^CREATE POLICY' "$OUT_STORAGE" || true) CREATE POLICY lines). Contents not displayed."
  else
    [ -e "$tmp_storage" ] && rm -f -- "$tmp_storage"
    echo "The optional storage schema dump did not complete. Use the SQL editor queries in docs/supabase/storage-and-privilege-evidence-queries.sql for storage.objects policies." >&2
  fi
}

# Run only when executed directly, so tests can source the functions without running anything.
if [ "${BASH_SOURCE[0]}" = "${0}" ]; then
  fifs_main "$@"
fi
