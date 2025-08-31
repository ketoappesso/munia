# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e2]:
    - button "Open settings" [ref=e4] [cursor=pointer]:
      - img [ref=e5] [cursor=pointer]
    - generic [ref=e6]:
      - button "Feed" [ref=e7] [cursor=pointer]:
        - img [ref=e10] [cursor=pointer]
      - button "Messages" [ref=e12] [cursor=pointer]:
        - img [ref=e14] [cursor=pointer]
      - button "My Profile" [ref=e16] [cursor=pointer]:
        - img [ref=e18] [cursor=pointer]
      - button "Logout" [ref=e20] [cursor=pointer]:
        - img [ref=e22] [cursor=pointer]
    - generic [ref=e25]:
      - generic [ref=e26]:
        - generic [ref=e28]:
          - button "关注" [ref=e29] [cursor=pointer]
          - button "发现" [ref=e30] [cursor=pointer]
          - button "任务" [ref=e31] [cursor=pointer]
        - link [ref=e33] [cursor=pointer]:
          - /url: /discover
          - img [ref=e34] [cursor=pointer]
      - generic [ref=e37]:
        - img [ref=e39]
        - paragraph [ref=e41]: Loading posts
    - button "Create new post" [ref=e43] [cursor=pointer]:
      - img [ref=e44] [cursor=pointer]
  - alert [ref=e45]
```