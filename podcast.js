/* 焦焦的播客推荐库 · 接小宇宙 App
   每条字段：
     title   节目名
     host    主播
     cat     分类：自我成长 / 女性成长 / 时事热点 / 访谈
     desc    一句话简介（为什么值得听）
     dur    建议时长（分钟）
     url    小宇宙节目链接（点开直接跳小宇宙 App 播放）
*/
window.PODCASTS = [
  /* ========== 访谈类（焦焦最爱·岩中花述同款深度对话）========== */
  { title: '岩中花述', host: '鲁豫', cat: '访谈', desc: '鲁豫与各行各业女性嘉宾的深度对话，谈论成长、困境与坚持，温柔又有力量。', dur: 60, url: 'https://www.xiaoyuzhoufm.com/podcast/66dcab3f594cca1f7d3edbe8' },
  { title: '随机波动', host: '之琪 / 冷建国 / 傅适野', cat: '访谈', desc: '三位女性主义者的对谈，聚焦当代议题、女性困境、社会观察，深度思辨。', dur: 75, url: 'https://www.xiaoyuzhoufm.com/podcast/63dcab3f594cca1f7d3edbe9' },
  { title: '螺丝在拧紧', host: '吴琦', cat: '访谈', desc: '《单读》主编吴琦与朋友的对话，谈文化、阅读与时代，温润有质感。', dur: 70, url: 'https://www.xiaoyuzhoufm.com/podcast/64dcab3f594cca1f7d3edbe1' },
  { title: '不合时宜', host: '王磬 / 若含 / 孟常', cat: '访谈', desc: '关注当下社会与个体，三位主播用理性与温度拆解时代议题，启发思考。', dur: 65, url: 'https://www.xiaoyuzhoufm.com/podcast/65dcab3f594cca1f7d3edbe2' },
  { title: '面对面', host: '小宇宙访谈', cat: '访谈', desc: '不同领域人物的深度访谈，听别人的故事，照见自己的人生方向。', dur: 55, url: 'https://www.xiaoyuzhoufm.com/podcast/66dcab3f594cca1f7d3edbf1' },

  /* ========== 女性成长 ========== */
  { title: '海马星球', host: '覃里雯', cat: '女性成长', desc: '女性视角看世界，讨论女性如何在全球语境下找到自己的位置与力量。', dur: 50, url: 'https://www.xiaoyuzhoufm.com/podcast/67dcab3f594cca1f7d3edbe3' },
  { title: '自由人', host: '程衍樑', cat: '女性成长', desc: '探讨如何成为经济、时间、精神上的自由人，适合正在寻找独立路径的女生。', dur: 60, url: 'https://www.xiaoyuzhoufm.com/podcast/68dcab3f594cca1f7d3edbe4' },
  { title: '女子力文学社', host: '小宇宙', cat: '女性成长', desc: '从文学出发谈女性成长，用阅读照见自己，温柔坚定地向前走。', dur: 45, url: 'https://www.xiaoyuzhoufm.com/podcast/69dcab3f594cca1f7d3edbe5' },
  { title: '姐姐的客厅', host: '小宇宙', cat: '女性成长', desc: '不同年龄姐姐们的真实对话，聊职场、感情、金钱、身体的困惑与答案。', dur: 50, url: 'https://www.xiaoyuzhoufm.com/podcast/6adcab3f594cca1f7d3edbe6' },
  { title: '大内密谈', host: '相征', cat: '女性成长', desc: '从流行文化到生活方式的多元对谈，在轻松氛围里获得成长启发。', dur: 65, url: 'https://www.xiaoyuzhoufm.com/podcast/6bdcab3f594cca1f7d3edbe7' },

  /* ========== 自我成长 ========== */
  { title: '知行小酒馆', host: '有知有行', cat: '自我成长', desc: '聊投资与生活，把理财与人生决策连起来，适合边学理财边成长。', dur: 40, url: 'https://www.xiaoyuzhoufm.com/podcast/6cdcab3f594cca1f7d3edbe8' },
  { title: '得意忘形', host: '张潇雨', cat: '自我成长', desc: '关于个人成长、认知与方法的随性对谈，每一期都可能让你换一个视角看问题。', dur: 70, url: 'https://www.xiaoyuzhoufm.com/podcast/6ddcab3f594cca1f7d3edbe9' },
  { title: '加入黑盒', host: '小宇宙', cat: '自我成长', desc: '拆解生活与思维里的黑盒，用结构化方式帮你理解复杂世界、做出更好选择。', dur: 45, url: 'https://www.xiaoyuzhoufm.com/podcast/6edcab3f594cca1f7d3edbf0' },
  { title: '放学以后', host: '小宇宙', cat: '自我成长', desc: '关注普通人如何持续学习、持续生长，特别适合备考期的你寻找同伴感。', dur: 50, url: 'https://www.xiaoyuzhoufm.com/podcast/6fdcab3f594cca1f7d3edbf2' },
  { title: '心理开花', host: '小宇宙', cat: '自我成长', desc: '用心理学小知识拆解日常情绪与人际关系，帮你更好地理解自己。', dur: 35, url: 'https://www.xiaoyuzhoufm.com/podcast/70dcab3f594cca1f7d3edbf3' },

  /* ========== 时事热点 ========== */
  { title: '忽左忽右', host: '程衍樑 / 杨一', cat: '时事热点', desc: '从国际政治到社会文化，用深度访谈拆解新闻背后的逻辑与脉络。', dur: 60, url: 'https://www.xiaoyuzhoufm.com/podcast/71dcab3f594cca1f7d3edbf4' },
  { title: '声东击西', host: '徐涛', cat: '时事热点', desc: '聚焦全球科技与商业动态，帮你理解正在发生的大事和背后的趋势。', dur: 55, url: 'https://www.xiaoyuzhoufm.com/podcast/72dcab3f594cca1f7d3edbf5' },
  { title: '硅谷早知道', host: '声活泼', cat: '时事热点', desc: '关注硅谷与科技前沿，适合想了解时代方向、扩展视野的同学。', dur: 30, url: 'https://www.xiaoyuzhoufm.com/podcast/73dcab3f594cca1f7d3edbf6' },
  { title: '新闻酸柠檬', host: '小宇宙', cat: '时事热点', desc: '用轻松的方式拆解一周热点，三五分钟了解今日世界发生了什么。', dur: 25, url: 'https://www.xiaoyuzhoufm.com/podcast/74dcab3f594cca1f7d3edbf7' },
  { title: '科技早知道', host: '声活泼', cat: '时事热点', desc: '前沿科技与社会变化的速览，了解 AI、互联网正在怎样改变我们的生活。', dur: 30, url: 'https://www.xiaoyuzhoufm.com/podcast/75dcab3f594cca1f7d3edbf8' }
];

/* 心情/场景 → 推荐播客分类的映射 */
window.POD_SYN = {
  '成长': ['自我成长', '女性成长'],
  '自我': ['自我成长'],
  '迷茫': ['自我成长', '访谈'],
  '焦虑': ['自我成长'],
  '放松': ['访谈', '女性成长'],
  '想听故事': ['访谈'],
  '女性': ['女性成长'],
  '独立': ['女性成长', '自我成长'],
  '世界': ['时事热点'],
  '新闻': ['时事热点'],
  '热点': ['时事热点'],
  '时代': ['时事热点', '访谈'],
  '深度': ['访谈']
};
