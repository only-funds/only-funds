import type { Post, User, Reward, RewardRecord, Subscription, LedgerEntry, Notice } from './types';
const date = (days = 0) => new Date(Date.now() - days * 86400000).toISOString();
const plan = (id: string, name: string, monthlyUsd: number, description: string) => ({ id, name, monthlyUsd, description });
function member(id: string, name: string, academicType: NonNullable<User['academicType']>, year: number, field: string, bio: string, plans: User['plans'], exchange = false): User {
  return { id: `demo-${id}`, name, academicType, year, field, bio, plans, exchange, role: academicType === 'pi' ? 'boss' : 'creator', avatarUrl: `${import.meta.env.BASE_URL}avatars/${id === 'boss' ? 'chen' : id === 'qiao' ? 'qiao-whale' : id}.webp`, studentOffer: ['phd','masters','undergrad'].includes(academicType), postCount: 0, followerCount: 0, following: false, createdAt: date(180) };
}
export const DEMO_BOSS = member('boss','陈知远','pi',8,'PI · 经费薛定谔学','头像：青年才俊。实际：青年人才申请已超龄。口头禅是“这个很快”，时间单位通常是学期。',[plan('coffee','咖啡门诊',0,'带着问题来，带着三个新问题走。'),plan('reply','催稿 VIP',200,'邮件标题可加两个感叹号。回复速度随缘。')]);
export const DEMO_CREATORS: User[] = [
  member('lin','林予安','phd',3,'PhD · 光子计算','看头像以为在冲 Nature，点开电脑发现正在给小黄鸭讲代码。光路能对齐，作息不能。',[plan('fish','摸鱼专家',1000,'周报三句话，但每句都经过深度睡眠。'),plan('steady','中规中矩',3000,'每周有进展，偶尔有结果，按时交周报。'),plan('nuclear','核动力驴',5000,'白天跑实验，晚上跑代码，梦里跑消融。')]),
  member('su','苏晓','phd',4,'PhD · 机器学习','咖啡店氛围组，审稿人二号本号。笑得越甜，baseline 卡得越严。最近在研究“双人实验”的可复现性。',[plan('latte','拿铁旁听席',200,'每周一份论文吐槽，含拉花不含鸡汤。'),plan('baseline','Baseline 保姆',2800,'陪你排查数据泄漏，不陪你伪造 SOTA。'),plan('deadline','截稿夜战友',4500,'一起熬过 deadline，天亮再去吃早餐。')]),
  member('qiao','乔南','phd',2,'PhD · 可信 AI','头像是二次元，拒稿是三次元。平时社恐，rebuttal 时一口气打八百字。',[plan('silent','潜水观察员',800,'文字交流，不突然打语音。'),plan('rebuttal','反驳型人格',3200,'每个“显然”后面都给你补一个证明。')]),
  member('gu','顾星野','postdoc',2,'Postdoc · 量子器件','朋友圈在阿尔卑斯，服务器在 99% CPU。登顶照片拍了三年，博后合同一年一签。',[plan('remote','山顶远程连线',3500,'有信号就回消息，没信号就思考人生。'),plan('summit','登顶陪跑',6500,'带你爬山，也带你爬出审稿意见。')]),
  member('zhou','周可','masters',2,'MSc · 机器人','机器人摔倒我扶，自己破防锅来顶。头像的锅是祖传的，专接“上周不是还能跑吗”。',[plan('pot','基础背锅位',600,'提供故障复现与情绪价值。'),plan('robot','人形机器人',1600,'能搬仪器，会说“收到”，续航靠外卖。')]),
  member('tang','唐棠','masters',2,'MSc · 生物材料','看起来研究甜点，其实能徒手配十种缓冲液。蛋糕从不塌，实验不一定。',[plan('cake','曲奇观察组',300,'每周研究手记，偶尔掉落烘焙失败集锦。'),plan('buffer','缓冲液富婆',1800,'配方讲明白，蛋糕请自带叉子。')]),
  member('xu','许知遥','masters',1,'MSc · 人机交互','交换来学术交流，先学会了八种说“稍后再说”的语言。旅游照比参考文献多，访谈记录比旅游照长。',[plan('postcard','跨时区明信片',200,'远方田野观察，附赠咖啡馆插座测评。'),plan('field','田野全勤',1200,'走进真实场景，也走进当地面包店。')],true),
  member('he','何不卷','masters',1,'MSc · 分布式系统','系统要高并发，人要低功耗。导师以为我情绪稳定，其实是消息免打扰。',[plan('idle','节能待机',0,'更新频率等于灵感频率，不接受催更。'),plan('wake','唤醒服务',1000,'工作日下午随机上线，周末进入深度休眠。')]),
  member('lu','陆小满','undergrad',4,'BSc · 计算成像','组内器材摄影师。光学桌拍得像杂志封面，实验记录写得像相机说明书。',[plan('camera','拍照换指导',0,'帮组里拍照，换师姐十分钟答疑。'),plan('raw','RAW 全家桶',800,'原始数据与原始照片都给你整理好。')]),
  member('cheng','程一一','undergrad',3,'BSc · 软件工程','会一点 Python，会很多表情包。代码能跑就先别碰，不能跑就先吃饭。',[plan('sponsor','带资进组',-800,'订阅者获得 $800/月的虚构资助，主打反向发工资。'),plan('free','免费牛马',0,'暂无论文，尚有力气；搬箱子请轻拍。')]),
  member('bai','白桃','undergrad',2,'BSc · 神经科学','头像软萌，Excel 配色有 42 个版本。研究方向暂定：师姐养的猫为什么不理我。',[plan('cat','猫猫观察席',0,'科研还没起步，猫的行为日志已连载。'),plan('snack','冻干赞助席',100,'先赞助猫，再期待我。')]),
  member('jiang','江停云','undergrad',2,'BSc · 环境科学','带着海风来交换，带着未读论文回宿舍。擅长找到采样点附近最好吃的冰淇淋。',[plan('exchange','交换生友谊价',0,'共享海边采样路线，以及避坑清单。'),plan('sea','海风赞助商',400,'结果可能不蓝，但头像一定蓝。')],true),
  member('song','宋咕咕','undergrad',1,'BSc · 人工智能','大一，已熟练掌握“我今晚就看”。尚未拥有研究成果，已拥有论文文件夹最终版 final_v8。',[plan('pigeon','咕咕预售',0,'更新日期待定，保证每次延期都很诚恳。'),plan('fund','带资孵化',-200,'订阅者获得 $200/月虚构资助，帮小鸽子先入门。')]),
  member('wen','温开水','undergrad',1,'BSc · 应用物理','实验室最稳定的系统：不焦虑、不崩溃、不知道自己该干啥。正在练习优雅地打开终端。',[plan('water','温水慢炖',0,'论文还没读懂，但已经给大家烧好水。'),plan('bring','倒贴实习',-500,'订阅者获得 $500/月虚构资助，包容一次 rm 的误解。')]),
];
export const REWARDS: Reward[] = [
  { id:'coffee',emoji:'☕',name:'续命咖啡',description:'一杯星巴克，拯救下一轮实验',value:'1 杯' },
  { id:'tokens',emoji:'⚡',name:'Token 自由',description:'老板报销的 OpenAI API 额度',value:'$100' },
  { id:'meeting',emoji:'🏝️',name:'组会免战牌',description:'一次不用做 slides 的快乐',value:'1 次' },
  { id:'gpu',emoji:'🖥️',name:'GPU 包夜',description:'今晚，这张卡只属于你',value:'24 小时' },
  { id:'review',emoji:'📝',name:'极速改稿券',description:'老板承诺 48 小时内给反馈',value:'48 小时' },
  { id:'boba',emoji:'🧋',name:'全糖快乐',description:'奶茶里的糖不算实验误差',value:'1 杯' },
  { id:'sleep',emoji:'😴',name:'睡到自然醒',description:'一个没有早会的上午',value:'半天' },
  { id:'dinner',emoji:'🍜',name:'深夜食堂',description:'让实验有结果，让胃有着落',value:'1 顿' },
];
export type DemoState = { userId:string; members:User[]; posts:Post[]; rewards:RewardRecord[]; catalogs:Record<string,Reward[]>; subscriptions:({userId:string;creatorId:string;startedAt:string;seriesId:string}&Subscription)[]; claimedOffers:string[]; saves:Record<string,string[]>; likes:Record<string,string[]>; ledger:LedgerEntry[]; notifications:(Notice & {userId:string;read:boolean})[] };
export function freshDemo(): DemoState {
  const members = structuredClone([DEMO_BOSS,...DEMO_CREATORS]);
  const posts:Post[]=[];
  function post(id:string,who:string,title:string,body:string,tags:string[],days:number,kind:Post['kind']='note') {
    posts.push({id,author:members.find(m=>m.id===`demo-${who}`)!,title,body,tags,kind,sources:[],mediaUrl:kind==='video'?`${import.meta.env.BASE_URL}demo-research.mp4`:null,posterUrl:null,createdAt:date(days),likes:Math.max(0,Math.round(26-days*1.6)),liked:false,saved:false,rewardCount:0,comments:[]});
  }
  post('demo-1','lin','光会做矩阵乘法了，我还不会早睡。','本周进展：光路通了，我堵了。\n小黄鸭听完我的 bug 沉默了三分钟，但制造误差分析终于有方向了。\n\n做了 30 秒可视化，老板请查收：光负责算，我负责困。\n（概念演示，图中数值不是实际实验结果。）',['科研周报','光子计算','核动力驴'],.04,'video');
  post('demo-su-coffee','su','实验室的咖啡，怎么又多了一杯。','明明只点了冰拿铁，工位上却多了一杯热美式。\n杯套写着“给那个总忘记吃早饭的人”。\n隔壁做光子的某位同学：你的小黄鸭落在我这里了，明天自己来拿 ☕',['实验室日常','多买一杯'],.12);
  post('demo-zhou-1','zhou','机器人学会站起来了，我学会蹲着修。','今天第一次无辅助站立 4 秒。\n第 5 秒它选择拥抱大地。\n老板问鲁棒性怎么样，我说我的心理鲁棒性正在迭代。',['机器人','锅已戴好'],.2);
  post('demo-gu-1','gu','登顶成功，SSH 断了。','海拔 2800 米，信号两格，审稿意见三页。\n山可以一座座爬，Reviewer 2 的“一个小实验”暂时没找到登山口。',['博士后日常','远程科研'],.4);
  post('demo-tang-1','tang','今日唯一成功的凝胶：巴斯克蛋糕。','材料组的实验做塌了，烤箱里的对照组倒是长势喜人。\n周五带来组里，按人头分，不按 h-index 分。',['生物材料','可食用负结果'],.7);
  post('demo-qiao-1','qiao','社恐，但敢在 rebuttal 里说 However。','白天：“好的老师，谢谢老师。”\n晚上：“We respectfully disagree.”\n已经把这个 respectfully 删了加、加了删五遍。',['可信AI','rebuttal'],.9);
  post('demo-boss-1','boss','我就简单说两句。','第一句：最近大家辛苦了。\n第二句：我们有没有可能顺便把理论证明、临床验证、芯片流片也做一下？\n\n（系统提示：第二句预计需要三个博士学位。）',['组会实录','简单两句'],1.1);
  post('demo-su-late','su','双人实验 n=2，暂不接受扩样。','昨晚停电，服务器安静得像放假。\n和某个坚持“再等最后一组数据”的人分完最后一袋饼干，在走廊坐到应急灯熄灭。\n论文没读完，聊了很多题外话。\n明天的实验，还是老位置。',['深夜实验室','n等于2'],1.5);
  post('demo-lin-2','lin','我做了可复现性，命运没有。','种子固定了，环境锁定了，参数存好了。\n结果：昨天能跑，今天不能。\n唯一的变量是我昨天睡了六小时，今天睡了三小时。',['可复现','实验手记'],2);
  post('demo-he-1','he','系统进入低功耗，作者也是。','优化掉了一次无意义的轮询。\n顺便关掉微信红点，个人吞吐量提升 0%，幸福感提升显著。\n统计显著性：我说的。',['分布式系统','摸鱼也要有方法'],2.2);
  post('demo-xu-1','xu','交换第一周：文献没看，插座全记住了。','已完成六家咖啡馆的田野调查。\n指标包括：Wi-Fi、插座数量、老板会不会赶人。\n这是 HCI，我可以解释。',['交换生','田野调查'],2.4);
  post('demo-gu-2','gu','量子叠加态：在度假，也在改稿。','照片是上个月拍的，稿子是这个月改的。\n请不要再问我怎么天天旅游，我的朋友圈更新频率和论文接收频率一样感人。',['量子器件','时间管理'],3);
  post('demo-su-seat','su','这个工位，怎么开始有两个人的东西。','一根充电线、一本光子学笔记、半包我不爱吃但某人爱吃的薄荷糖。\n嘴上说“只是顺手放一下”，小黄鸭已经在这里住了一周。\n行吧，靠窗的位置继续给你留着。',['工位观察','顺手而已'],3.3);
  post('demo-cheng-1','cheng','Hello world，Hello 师兄救我。','今天的科研成果：成功创建了一个虚拟环境。\n明天的科研目标：成功知道自己在哪个虚拟环境。\n当前状态：带资进组，带的是表情包资源。',['本科生入门','Python'],3.6);
  post('demo-lu-1','lu','老板：这张图很好。 我：这是实验室合照。','给光学桌拍了 120 张照片，选了一张最像 Nature 封面的。\n目前贡献：让大家的工位看起来像有经费。',['计算成像','组内摄影师'],4);
  post('demo-bai-1','bai','猫今天看我了，是 positive result。','实验记录：\n08:30 呼唤猫，未响应。\n09:00 打开冻干，显著响应。\n结论：名字不是有效刺激。\n师姐说先别写论文。',['猫猫日志','本科生入门'],4.2);
  post('demo-qiao-2','qiao','模型会幻觉，我会幻听。','每次 GPU 风扇突然变安静，我都幻听到老板问“跑完了吗”。\n查了一圈，是我忘记提交任务。',['机器学习','社恐求生'],4.5);
  post('demo-zhou-2','zhou','锅的质量决定了组内地位。','我的机器人摔坏一个轮子。\n师兄的脚本清空一个目录。\n老板说“大家都成长了”。\n是的，备份盘容量成长了。',['机器人','负结果'],5);
  post('demo-gu-3','gu','别问，问就是在写基金。','标题写了 14 个版本。\n科学问题写了 2 个版本。\n真正想问的问题只有一个：什么时候发工资。',['基金申请','博士后日常'],5.5);
  post('demo-tang-2','tang','十倍浓度的不是爱情，是我配错的 buffer。','重新配了，认真标了，给瓶子贴了三张标签。\n师弟问是不是怕忘，我说是怕我自己太自信。',['生物材料','实验手记'],6);
  post('demo-xu-2','xu','访谈里最贵的一句话：“能再展开说说吗？”','对方展开了 47 分钟，我转录了 3 小时。\n原来开放式问题最先打开的是我的加班日历。',['人机交互','田野调查'],6.5);
  post('demo-su-4','su','Baseline 赢了。今晚先吃饭。','三个 fancy 方法都没超过基线。\n排查后发现，不是方法菜，是验证集混入了近邻样本。\n修好划分，承认负结果。科研可以输，人不能饿。',['负结果','数据泄漏'],7,'paper');
  post('demo-lin-3','lin','小黄鸭同行评审意见','Reviewer Duck: quack.\n翻译：图二字号太小，消融实验太少，作者精神状态还行。\n已接受全部意见，除了最后一条。',['光子计算','论文阅读'],7.5,'paper');
  post('demo-qiao-3','qiao','我的二次元头像被老板认成新来的同学。','老板：这个吃白饭的鲸鱼同学怎么不来组会？\n我：她只负责提供精神支持。\n老板：那也让她写个周报。',['组会实录','二次元'],8);
  post('demo-gu-4','gu','实验失败，但夕阳很成功。','仪器今天不配合。\n出门走了二十分钟，发现世界不只有 error bar。\n回去重标定，再来一次。',['量子器件','负结果'],8.5);
  post('demo-lin-4','lin','隔壁工位说我该睡觉了。','她把我的显示器亮度调低，还把咖啡换成温水。\n我说下一组就结束。\n她说上次也是这么说的。\n好吧，今天这组明天再跑。',['实验室日常','光路之外'],9);
  post('demo-boss-2','boss','本月特别奖励：一张不问进展券。','使用后 24 小时内不问“做到哪了”。\n不能叠加，不能转赠，不能在基金 deadline 前使用。\n有效解释权归学生所有，这次认真的。',['灵感奖励','老板良心发现'],10);
  post('demo-gu-5','gu','论文接受当天我干了什么','截图。发给合作者。\n下楼买一杯平时嫌贵的咖啡。\n然后打开下一篇稿子。\n循环是闭环的，头发不是。',['科研周报','博士后日常'],11);
  posts[0].comments=[{id:'demo-comment',author:DEMO_BOSS,body:'不错。下周我们“简单”加个制造容差分析？小黄鸭也参加。',createdAt:date(.03)}];
  const relationships:[string,string][]=[['boss','lin'],['boss','su'],['boss','gu'],['boss','qiao'],['su','lin'],['qiao','lin'],['zhou','lin'],['lin','su'],['qiao','su'],['tang','su'],['lu','su'],['zhou','gu'],['lin','gu'],['su','gu'],['xu','gu'],['he','qiao'],['bai','tang'],['cheng','zhou'],['lu','xu'],['tang','lu']];
  return { userId:DEMO_BOSS.id,members,posts:posts.sort((a,b)=>b.createdAt.localeCompare(a.createdAt)),rewards:[
    {id:'demo-gift-gpu',senderId:'demo-boss',senderName:'陈知远',recipientId:'demo-lin',recipientName:'林予安',postId:'demo-1',rewardId:'gpu',reward:REWARDS[3],message:'今晚整张卡归你，小黄鸭也不用排队。',status:'promised',createdAt:date(.5)},
    {id:'demo-gift-coffee',senderId:'demo-boss',senderName:'陈知远',recipientId:'demo-lin',recipientName:'林予安',postId:'demo-lin-2',rewardId:'coffee',reward:REWARDS[0],message:'辛苦了，下次早点回去睡。',status:'fulfilled',createdAt:date(3),usedAt:date(2.5),useNote:'今天下午喝。',fulfilledAt:date(2.4)},
    {id:'demo-gift-su',senderId:'demo-boss',senderName:'陈知远',recipientId:'demo-su',recipientName:'苏晓',postId:'demo-su-4',rewardId:'meeting',reward:REWARDS[2],message:'诚实的负结果值得放个假。',status:'promised',createdAt:date(1),usedAt:date(.2),useNote:'想在本周五组会使用免战牌。'}
  ],catalogs:{},claimedOffers:[],ledger:[],notifications:[{id:'demo-notice-su',userId:'demo-boss',rewardId:'demo-gift-su',createdAt:date(.2),recipientName:'苏晓',note:'想在本周五组会使用免战牌。',read:false}],likes:{},saves:{'demo-boss':['demo-su-4'],'demo-lin':['demo-su-coffee','demo-su-late','demo-su-seat']},subscriptions:relationships.map(([from,to])=>({userId:`demo-${from}`,creatorId:`demo-${to}`,startedAt:date(8),seriesId:`demo-series-${from}-${to}`,plan:members.find(m=>m.id===`demo-${to}`)!.plans![from==='boss'&&to==='lin'?1:0],studentOffer:false,expiresAt:null})) };
}
