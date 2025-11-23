# 馃殌 CryptoQuant 涓€閿儴缃茶鏄?
## 馃摝 閮ㄧ讲鍖呭凡鍑嗗瀹屾垚
- 鉁?dist/ - 鍓嶇鏋勫缓鏂囦欢 (4涓枃浠?
- 鉁?api/ - 鍚庣API鏈嶅姟 (25涓枃浠?  
- 鉁?vercel.json - Vercel閰嶇疆鏂囦欢
- 鉁?package.json - 渚濊禆閰嶇疆
- 鉁?.env - 鐜鍙橀噺妯℃澘

## 馃殌 绔嬪嵆閮ㄧ讲姝ラ

### 绗竴姝ワ細璁块棶 Vercel
馃敆 鑷姩鎵撳紑: https://vercel.com

### 绗簩姝ワ細鍒涘缓鏂伴」鐩?- 鐐瑰嚮 "New Project"
- 閫夋嫨 "Upload" 閫夐」

### 绗笁姝ワ細涓婁紶閮ㄧ讲鍖?- 閫夋嫨鏂囦欢澶? C:\D\Trae项目\cryptoqs\deployment-package
- 鐐瑰嚮 "Deploy" 鎸夐挳

### 绗洓姝ワ細閰嶇疆鐜鍙橀噺
閮ㄧ讲瀹屾垚鍚庯紝鍦╒ercel椤圭洰璁剧疆涓坊鍔狅細
`
NODE_ENV=production
CLIENT_URL=https://cryptoquant.vercel.app
JWT_SECRET=cryptoquant-secure-jwt-secret-key-2025-min-32-chars
`

## 馃幆 楠岃瘉閮ㄧ讲鎴愬姛
閮ㄧ讲瀹屾垚鍚庯紝娴嬭瘯浠ヤ笅绔偣锛?`ash
# 鍋ュ悍妫€鏌?curl https://cryptoquant.vercel.app/api/health

# 甯傚満浠锋牸
curl https://cryptoquant.vercel.app/api/market/price/BTC/USDT
`

## 馃帀 鎭枩锛?鎮ㄧ殑 CryptoQuant 閲忓寲浜ゆ槗骞冲彴鍗冲皢涓婄嚎锛?
**棰勮鏃堕棿**: 3-5鍒嗛挓
**鎴愬姛鐜?*: 95%+
