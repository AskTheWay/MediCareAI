#!/bin/bash
# 清理并重置 MediCareAI 重排序模型配置

echo "=== 清理 MediCareAI 重排序配置 ==="

cd /home/houge/Test/MediCareAI

# 1. 停止服务
echo "停止 Docker 服务..."
docker-compose down

# 2. 删除数据库中的 rerank 配置（如果有持久化问题）
echo "注意：需要手动删除数据库中的 rerank 配置记录"
echo "请在 PostgreSQL 中执行："
echo "  DELETE FROM ai_model_configurations WHERE model_type = 'rerank';"

# 3. 确保代码正确
echo ""
echo "检查代码配置..."
grep -n "default_url.*dashscope" backend/app/services/reranking_provider_adapter.py
grep -n "get_rerank_url" backend/app/services/reranking_provider_adapter.py | head -5

# 4. 重建并启动
echo ""
echo "重建 Docker..."
docker-compose build --no-cache backend
docker-compose up -d

# 5. 查看日志
echo ""
echo "查看后端日志..."
sleep 3
docker logs medicare_backend --tail 20

echo ""
echo "=== 完成 ==="
echo "请清除浏览器缓存后重新配置重排序模型"
echo "正确配置应该是："
echo "  API地址: https://dashscope.aliyuncs.com/compatible-api/v1"
echo "  模型ID: qwen3-rerank"
