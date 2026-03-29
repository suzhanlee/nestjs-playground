#NAME="crewbe"
#VERSION=3
#echo "서비스: $NAME, 버전: $VERSION"
#
#
#score=39
#
#if [[ $score -gt 90 ]]; then
#  echo "우수"
#elif [[ $score -gt 70 ]]; then
#  echo "보통"
#else
#  echo "미흡"
#fi
#
#FILE="tsconfig.json"
#if [[ -f "$FILE" ]]; then
#  echo "파일 있음"
#else
#  echo "파일 없음"
#fi
#
#
#echo "안녕" > hello12.txt
#echo "반갑습니다" >> hello.txt
#
#CONTENT=$(cat hello.txt)
#echo "내용: $CONTENT"
#
##INPUT=$(cat)
##echo "입력 받은 것: $INPUT"
#
#
#TEXT="hello world"
#UPPER=$(echo "$TEXT" | tr 'a-z' 'A-Z')
#echo "$UPPER"


#
#NAME=$(jq -r '.name' data.json)
#echo "서비스명: $NAME"
#
#
#echo "$HOOK_INPUT" | jq -r '.cwd'
#
#
#NAME="jq -r '.name' data.json"
#echo $NAME
#
#JSON='{"name": "crewbe", "users": 20000}'
#echo "$JSON" | jq -r '.users'



#jq -r '.skill_name // "aa"' data.json
#
#jq -n \
#  --arg decision "block" \
#  --arg reason "다음 단계로" \
#  '{decision: $decision, reason: $reason}'
#
#STATUS="end"
#
#case "$STATUS" in
#  "start")
#    echo "시작!"
#    ;;
#  "end")
#    echo "종료!"
#    ;;
#  *)
#    echo "알 수 없음"
#    ;;
#esac
#
#greet() {
#  NAME=$1
#  echo "안녕하세요 $NAME"
#}
#
#greet "수찬"
#greet "Claude"
#greet

#set -eo pipefail

#ls aa.txt
#echo "종료 코드: $?"


#set -e
#
#ls 없는파일.txt
#echo "이게 출력될까요?"


LOG_FILE="hook.log"
echo "=== 실행시작 $(date) ===" >> "$LOG_FILE"
echo "작업완료" >> "$LOG_FILE"
cat "$LOG_FILE"

























