# 工作方式

1. 在前端的 DOMContentLoad 中进行翻译，并保留英文原文的段落 id。
2. 当用户悬停在段落上时，在段落下方显示翻译助手图标，包括显示原文、纠错、评论、历史等按钮。
3. 当用户点击段落时，展开英文原文。

# 细节处理

## 翻译结果如何对照回原文

1. 在翻译之前的时候为每个块元素附加一个其 innerHTML 通过 md5 计算出的 id，将这个块元素添加到一个映射表里
2. 翻译时把这个 id 和内容传给后端
3. 结果返回之后，从映射表中根据 id 找到这个块元素，并根据翻译结果附带的 node-index 找到相应的原始节点，并将结果分别应用回原始节点

## 保留原文中的行为（保留原始DOM节点的引用）

1. 为每个文本节点添加唯一的 ngwt-node-id。
1. 发送给翻译器之前，把 Node 重新包装一下，确保任何文本都被包含在 `font[ngwt-text-node]` 元素中（不存在孤立文本），并且给所有元素都加上 ngwt-node-id
1. 翻译器翻译时会保留这些 ngwt-next-id
1. 解析对照文本，并且根据 ngwt-next-id 的值，逐个写回文本节点中

## 如何尽可能利用 CDN /缓存

1. （可缓存）前端先计算出指纹，然后以指纹作为参数，向后端查询结果，当有多个条目时要先对这些指纹进行排序
1. （无法缓存）如果指纹不存在，则把要翻译的内容打包发给后端，后端保存并翻译后发回这组内容的指纹和结果

## 如何根据英文进行模糊查阅

1. 用 NLP API 把句子拆成各个成分
1. 为成分中的各个要素设置不同的权重（将来可用 ML 模型进行改进）
1. 根据成分*权重的值，得出一个大数字
1. 在数据库中使用这个大数字进行范围查阅，快速得出结果
