# Page snapshot

```yaml
- generic [ref=e2]:
  - button "Open settings" [ref=e4] [cursor=pointer]:
    - img [ref=e5] [cursor=pointer]
  - generic [ref=e6]:
    - link "Munia" [ref=e7] [cursor=pointer]:
      - /url: /
      - img [ref=e8] [cursor=pointer]
      - heading "Munia" [level=1] [ref=e10] [cursor=pointer]
    - button "Feed" [ref=e11] [cursor=pointer]:
      - img [ref=e14] [cursor=pointer]
      - paragraph [ref=e16] [cursor=pointer]: Feed
    - button "Notifications" [ref=e17] [cursor=pointer]:
      - img [ref=e19] [cursor=pointer]
      - paragraph [ref=e21] [cursor=pointer]: Notifications
    - button "My Profile" [ref=e22] [cursor=pointer]:
      - img [ref=e24] [cursor=pointer]
      - paragraph [ref=e26] [cursor=pointer]: My Profile
    - button "Logout" [ref=e27] [cursor=pointer]:
      - img [ref=e29] [cursor=pointer]
      - paragraph [ref=e31] [cursor=pointer]: Logout
  - generic [ref=e33]:
    - generic [ref=e35]:
      - button "关注" [ref=e36] [cursor=pointer]
      - button "发现" [ref=e37] [cursor=pointer]
      - button "任务" [ref=e38] [cursor=pointer]
    - link [ref=e40] [cursor=pointer]:
      - /url: /discover
      - img [ref=e41] [cursor=pointer]
    - generic [ref=e44]:
      - img [ref=e46]
      - paragraph [ref=e48]: Loading posts
  - generic [ref=e49]:
    - button "Offline - posts will be sent when online" [ref=e50] [cursor=pointer]:
      - img [ref=e51] [cursor=pointer]
      - img [ref=e53] [cursor=pointer]
    - generic [ref=e60]: Offline - 0 posts queued
```