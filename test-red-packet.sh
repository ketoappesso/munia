#!/bin/bash

echo "测试红包功能..."

# 1. 检查当前余额
echo -e "\n1. 检查14474744444的当前余额："
curl -s http://localhost:3002/api/users/sync-balance | python3 -m json.tool | grep -E '"username"|"storedBalance"'

# 2. 获取19974749999的用户ID
echo -e "\n2. 查找接收者19974749999的信息..."
# 这里我们需要通过API或数据库查询获取19974749999的用户ID

# 3. 发送测试红包
echo -e "\n3. 发送测试红包（1 APE）给19974749999..."
# 注意：我们需要先获取conversationId和recipientId

echo -e "\n完成测试！"
echo "请在浏览器中检查："
echo "- 红包是否显示在发送者（你）这边"
echo "- 红包是否使用了正确的UI样式"
echo "- 余额是否正确扣除"
