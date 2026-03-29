set -euo pipefail

STATE_FILE="state.json"

STATUS=$(jq -r '.state // empty' "$STATE_FILE")

if [[ -z "$STATUS" ]]; then
  echo "status 없음!"
fi

case $STATUS in
  "start")
    echo "시작 단계입니다."
    ;;
  "end")
    echo "종료 단계입니다"
    ;;
  *)
    echo "알 수 없는 상태"
esac

echo "$STATUS" >> result.log
cat result.log
