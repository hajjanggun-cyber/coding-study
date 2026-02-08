---
description: 코드 변경 시 자동으로 깃허브에 업로드
---

이 워크플로우는 코드가 수정될 때마다 자동으로 깃허브 저장소에 커밋하고 푸시합니다.

## 단계

// turbo-all

1. 변경된 파일들을 스테이징 영역에 추가
```bash
git add .
```

2. 변경사항을 커밋 (타임스탬프 포함)
```bash
git commit -m "자동 업데이트: $(date '+%Y-%m-%d %H:%M:%S')"
```

3. 원격 저장소(깃허브)에 푸시
```bash
git push origin main
```

## 참고사항
- 저장소 URL: https://github.com/hajjanggun-cyber/coding-study.git
- 브랜치: main
- 모든 명령은 자동 실행됩니다 (turbo-all 모드)
